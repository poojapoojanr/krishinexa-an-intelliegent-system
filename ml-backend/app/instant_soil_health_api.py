
from fastapi import APIRouter, HTTPException
from app.district_centroids import DISTRICT_COORDS
import ee
from app.weather_api import get_soil_weather_data

router = APIRouter()

# Initialize Earth Engine if not already
try:
    ee.Initialize(project="tidy-federation-479517-v3")
except Exception:
    pass



@router.get("/api/soil-health/{district}")
def get_soil_health(district: str):
    key = district.lower().strip()
    if key not in DISTRICT_COORDS:
        raise HTTPException(status_code=404, detail="Location not found")
    lat, lon = DISTRICT_COORDS[key]
    # Use a 5km buffer around the district centroid for better sampling
    point = ee.Geometry.Point(lon, lat)
    region = point.buffer(5000)

    # Get NDVI from Sentinel-2
    image = (
        ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
        .filterBounds(region)
        .filterDate("2024-07-01", "2026-01-31")
        .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 30))
        .median()
    )
    ndvi = (
        image.normalizedDifference(["B8", "B4"])
        .reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=region,
            scale=30,
            maxPixels=1e9
        )
        .get("nd")
        .getInfo()
    )
    if ndvi is None:
        raise HTTPException(status_code=500, detail="NDVI computation failed")
    ndvi = round(ndvi, 3)
    if ndvi < 0.3:
        status = "Poor"
        advisory = "Low vegetation vigor. Improve soil nutrients and irrigation."
    elif ndvi < 0.6:
        status = "Moderate"
        advisory = "Average soil health. Monitor moisture and fertilization."
    else:
        status = "Good"
        advisory = "Healthy soil condition. Maintain current practices."

    # Get real-time soil moisture and temperature from weather_api
    weather = get_soil_weather_data(lat, lon)

    response = {
        "district": district,
        "ndvi": ndvi,
        "soil_health_status": status,
        "advisory": advisory,
        "source": "Sentinel-2 NDVI (Google Earth Engine)",
        "soil_temperature": weather.get("soil_temperature"),
        "soil_moisture": weather.get("soil_moisture")
    }
    return response
