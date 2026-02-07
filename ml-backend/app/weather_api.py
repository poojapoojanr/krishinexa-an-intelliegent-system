from fastapi import APIRouter, HTTPException
import requests
import os
from app.district_centroids import DISTRICT_COORDS

router = APIRouter(prefix="/api/weather", tags=["Weather"])

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")
LOCATIONIQ_API_KEY = os.getenv("LOCATIONIQ_API_KEY")

if not OPENWEATHER_API_KEY:
    raise RuntimeError("OPENWEATHER_API_KEY not set")


def geocode_place(district: str):
    key = district.lower().strip()

    # Guaranteed fallback using known district centroids
    if key in DISTRICT_COORDS:
        return DISTRICT_COORDS[key]

    if not LOCATIONIQ_API_KEY:
        return None

    queries = [
        f"{district}, Karnataka, India",
        f"{district} District, Karnataka, India",
        f"{district}, India",
    ]

    for q in queries:
        try:
            r = requests.get(
                "https://us1.locationiq.com/v1/search.php",
                params={
                    "key": LOCATIONIQ_API_KEY,
                    "q": q,
                    "format": "json",
                    "limit": 1,
                },
                timeout=5,
            )
            if r.status_code == 200 and r.json():
                loc = r.json()[0]
                return float(loc["lat"]), float(loc["lon"])
        except Exception:
            continue

    return None


@router.get("/{district}")
def get_weather_forecast(district: str):
    coords = geocode_place(district)
    if not coords:
        raise HTTPException(status_code=404, detail="Location not found")
    lat, lon = coords

    # --- Import and call soil_health for this district ---
    try:
        from app.soil_health import soil_health as get_soil_health
        soil_health_data = get_soil_health(district)
    except Exception as e:
        soil_health_data = None

    # -------- CURRENT WEATHER --------
    current_res = requests.get(
        "https://api.openweathermap.org/data/2.5/weather",
        params={
            "lat": lat,
            "lon": lon,
            "units": "metric",
            "appid": OPENWEATHER_API_KEY,
        },
        timeout=8,
    )

    if current_res.status_code != 200:
        raise HTTPException(status_code=503, detail="Weather service unavailable")

    current = current_res.json()

    # -------- FORECAST --------
    forecast_res = requests.get(
        "https://api.openweathermap.org/data/2.5/forecast",
        params={
            "lat": lat,
            "lon": lon,
            "units": "metric",
            "appid": OPENWEATHER_API_KEY,
        },
        timeout=8,
    )

    if forecast_res.status_code != 200:
        raise HTTPException(status_code=503, detail="Forecast service unavailable")

    forecast = forecast_res.json()

    if "list" not in forecast:
        raise HTTPException(status_code=500, detail="Invalid forecast response")

    forecast_24h = [
        {
            "time": item["dt_txt"],
            "temperature": item["main"]["temp"],
            "humidity": item["main"]["humidity"],
            "weather": item["weather"][0]["description"].title(),
            "rainfall": item.get("rain", {}).get("3h", 0),
        }
        for item in forecast["list"][:8]
    ]

    # Compose response with soil data if available
    response = {
        "district": district,
        "latitude": lat,
        "longitude": lon,
        "current_weather": {
            "temperature": current["main"]["temp"],
            "humidity": current["main"]["humidity"],
            "weather": current["weather"][0]["description"].title(),
            "wind_speed": current["wind"]["speed"],
        },
        "forecast_24h": forecast_24h,
    }
    if soil_health_data:
        response["soil_health_status"] = soil_health_data.get("soil_health_status")
        response["soil_ndvi"] = soil_health_data.get("ndvi")
        response["soil_advisory"] = soil_health_data.get("advisory")
        response["soil_health_source"] = soil_health_data.get("source")
    # --- Get real soil temperature from MODIS (Google Earth Engine) ---
    try:
        import ee
        ee.Initialize(project="tidy-federation-479517-v3")
        point = ee.Geometry.Point(lon, lat)
        # MODIS Land Surface Temperature (LST) - use most recent image
        modis = ee.ImageCollection("MODIS/061/MOD11A2") \
            .filterBounds(point) \
            .sort('system:time_start', False) \
            .first()
        # MODIS LST is in Kelvin*0.02, convert to Celsius
        lst = modis.select('LST_Day_1km').multiply(0.02).subtract(273.15)
        temp = lst.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=point,
            scale=1000,
            maxPixels=1e9
        ).get('LST_Day_1km').getInfo()
        temp = round(temp, 1) if temp is not None else None
        temp_status = "Optimal" if temp is not None and 15 <= temp <= 25 else ("Low" if temp is not None and temp < 15 else ("High" if temp is not None and temp > 25 else None))
        temp_advisory = (
            "Ideal soil temperature for most crops." if temp_status == "Optimal" else
            "Soil temperature is below optimal. Consider warming measures." if temp_status == "Low" else
            "Soil temperature is above optimal. Consider cooling/irrigation." if temp_status == "High" else
            "Temperature data unavailable"
        )
        response["soil_temperature"] = {
            "value": temp,
            "unit": "°C",
            "status": temp_status,
            "advisory": temp_advisory,
            "source": "MODIS (Google Earth Engine)"
        }
    except Exception as e:
        response["soil_temperature"] = {"value": None, "unit": "°C", "status": None, "advisory": "Temperature data unavailable", "source": "MODIS (Google Earth Engine)"}

    # --- Get real soil moisture from NASA SMAP (Google Earth Engine) ---
    try:
        smap = ee.ImageCollection("NASA/SMAP/SPL4SMGP/008") \
            .filterBounds(point) \
            .sort('system:time_start', False) \
            .first()
        # The new dataset's surface soil moisture band is 'sm_surface' (see GEE docs)
        sm = smap.select('sm_surface')
        moisture = sm.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=point,
            scale=10000,
            maxPixels=1e9
        ).get('sm_surface').getInfo()
        moisture = round(moisture * 100, 1) if moisture is not None else None
        # Use correct optimal range: 20-35%
        if moisture is not None:
            if 20 <= moisture <= 35:
                moisture_status = "Optimal"
                moisture_advisory = "Soil moisture is within the optimal range for crops."
            elif moisture < 20:
                moisture_status = "Below optimal"
                moisture_advisory = "Soil moisture is below optimal. Consider irrigation."
            elif moisture > 35:
                moisture_status = "Above optimal"
                moisture_advisory = "Soil moisture is above optimal. Consider drainage."
            else:
                moisture_status = None
                moisture_advisory = "Moisture data unavailable"
        else:
            moisture_status = None
            moisture_advisory = "Moisture data unavailable"
        response["soil_moisture"] = {
            "value": moisture,
            "unit": "%",
            "status": moisture_status,
            "advisory": moisture_advisory,
            "source": "NASA SMAP (Google Earth Engine)"
        }
    except Exception as e:
        response["soil_moisture"] = {"value": None, "unit": "%", "status": None, "advisory": "Moisture data unavailable", "source": "NASA SMAP (Google Earth Engine)"}

    return response
