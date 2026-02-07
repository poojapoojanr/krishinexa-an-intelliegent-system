from fastapi import APIRouter, HTTPException
import ee
from app.district_centroids import DISTRICT_COORDS

router = APIRouter(
    prefix="/api/satellite",
    tags=["Satellite"]
)

# ---------- Earth Engine Init ----------
try:
    ee.Initialize(project="tidy-federation-479517-v3")
except Exception:
    raise RuntimeError(
        "Earth Engine not authenticated. Run `earthengine authenticate`."
    )


@router.get("/{district}")
def get_satellite_tiles(district: str):
    key = district.lower().strip()
    print("Satellite district key:", key)
    print("Available:", list(DISTRICT_COORDS.keys()))

    if key not in DISTRICT_COORDS:
        raise HTTPException(status_code=404, detail="Location not found")

    lat, lon = DISTRICT_COORDS[key]
    # Use a 5km buffer around the district centroid for better sampling
    point = ee.Geometry.Point(lon, lat)
    region = point.buffer(5000)  # 5km radius

    # Sentinel-2 median composite for RGB
    image = (
        ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
        .filterBounds(region)
        .filterDate("2024-07-01", "2026-01-31")
        .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 30))
        .median()
    )

    # RGB tile URL
    rgb_tile = image.visualize(
        bands=["B4", "B3", "B2"],
        min=0,
        max=3000
    ).getMapId()["tile_fetcher"].url_format

    # NDVI tile URL
    ndvi_image = image.normalizedDifference(["B8", "B4"])
    ndvi_tile = ndvi_image.visualize(
        min=0,
        max=1,
        palette=["#d7191c", "#fdae61", "#ffffbf", "#a6d96a", "#1a9641"]
    ).getMapId()["tile_fetcher"].url_format

    # Boundary tile (GeoJSON or similar, here just a placeholder)
    boundary_tile = None

    return {
        "district": district,  # Return original (possibly capitalized) district
        "rgb_tile": rgb_tile,
        "ndvi_tile": ndvi_tile,
        "boundary_tile": boundary_tile
    }
