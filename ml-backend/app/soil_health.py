from fastapi import APIRouter, HTTPException
import ee
from app.district_centroids import DISTRICT_COORDS

router = APIRouter(
    prefix="/api/soil-health",
    tags=["Soil Health"]
)

# ---------- Earth Engine Init ----------
try:
    ee.Initialize(project="tidy-federation-479517-v3")
except Exception:
    raise RuntimeError(
        "Earth Engine not authenticated. Run `earthengine authenticate`."
    )


@router.get("/{district}")
def soil_health(district: str):
    key = district.lower().strip()

    if key not in DISTRICT_COORDS:
        raise HTTPException(status_code=404, detail="Location not found")

    lat, lon = DISTRICT_COORDS[key]
    
    # Use a 5km buffer around the district centroid for better sampling
    point = ee.Geometry.Point(lon, lat)
    region = point.buffer(5000)  # 5km radius

    # ---------- Sentinel-2 (Harmonized) - Last 6 months ----------
    image = (
        ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
        .filterBounds(region)
        .filterDate("2024-07-01", "2026-01-31")  # Extended date range
        .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 30))
        .median()
    )

    # ---------- NDVI ----------
    ndvi = (
        image.normalizedDifference(["B8", "B4"])
        .reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=region,  # Use region instead of point
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

    return {
        "district": district,
        "ndvi": ndvi,
        "soil_health_status": status,
        "advisory": advisory,
        "source": "Sentinel-2 NDVI (Google Earth Engine)"
    }
