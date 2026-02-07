from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import tempfile

# -------------------- ENV --------------------
load_dotenv()

# -------------------- APP --------------------
app = FastAPI(
    title="KrishiNexa Backend",
    version="1.0.0",
    description="Backend APIs for KrishiNexa smart agriculture platform",
)

# -------------------- CORS --------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:9002",
        "http://127.0.0.1:9002",
        "http://10.248.85.254:9002",
        "http://10.188.76.254:9002",
        "*",  # Dev only
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------- ROUTERS --------------------
from app.weather_api import router as weather_router
from app.crop_recommendation_api import router as crop_router
from app.satellite import router as satellite_router
from app.soil_health import router as soil_router
""" from app.instant_soil_health_api import router as instant_soil_health_router """

app.include_router(weather_router)
app.include_router(crop_router)
app.include_router(satellite_router)
app.include_router(soil_router)
# app.include_router(instant_soil_health_router)

# -------------------- HEALTH CHECK --------------------
@app.get("/", tags=["Health"])
def root():
    return {
        "status": "KrishiNexa backend running",
        "services": [
            "weather",
            "crop-recommendation",
            "satellite",
            "soil-health",
            # "instant-soil-health",
            "disease-diagnosis",
            "vajra-sos",
        ],
    }

# =====================================================
# ✅ PLANT DISEASE DETECTION
# =====================================================
from app.disease_detection import predict_disease

@app.post("/api/disease/predict", tags=["Disease Detection"])
async def disease_diagnosis(image: UploadFile = File(...)):
    try:
        content_type = (image.content_type or "").lower()
        if not content_type.startswith("image/"):
            return {
                "success": False,
                "error": "Invalid image type",
                "confidence": 0.0,
            }

        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
            content = await image.read()
            max_bytes = int(os.getenv("DISEASE_MAX_UPLOAD_BYTES", 6 * 1024 * 1024))
            if len(content) > max_bytes:
                return {
                    "success": False,
                    "error": "Image too large",
                    "confidence": 0.0,
                }
            tmp.write(content)
            temp_path = tmp.name

        result = predict_disease(temp_path)
        os.remove(temp_path)

        return result

    except Exception as e:
        if "temp_path" in locals() and os.path.exists(temp_path):
            os.remove(temp_path)
        return {"success": False, "error": str(e)}

@app.get("/api/disease/classes", tags=["Disease Detection"])
def get_disease_classes():
    # Load labels from disease_labels.txt
    labels_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "disease_labels.txt")
    if os.path.exists(labels_path):
        with open(labels_path, "r") as f:
            labels = [line.strip() for line in f if line.strip()]
        return {"classes": labels, "total": len(labels)}
    else:
        return {"classes": [], "total": 0}

@app.get("/api/disease/info", tags=["Disease Detection"])
def disease_info():
    return {
        "model_name": "Plant Disease Detection (MobileNetV2)",
        "framework": "TensorFlow/Keras",
        "input_size": "224x224",
        "endpoint": "/api/disease/predict",
    }

# # =====================================================
# # ✅ VAJRA SOS - WEATHER ALERTS
# # =====================================================
# from app.vajra_sos import (
#     monitor_weather_and_send_alerts,
#     check_weather_alerts,
#     get_weather_data,
#     get_district_coordinates,
#     get_inapp_alerts_for_district,
# )

# @app.post("/api/vajra-sos/trigger", tags=["VajraSOS Alerts"])
# async def trigger_vajra_sos():
#     try:
#         result = monitor_weather_and_send_alerts()
#         return {"success": True, **result}
#     except Exception as e:
#         return {"success": False, "error": str(e)}

# @app.get("/api/vajra-sos/inapp-alerts", tags=["VajraSOS Alerts"])
# def vajra_sos_inapp_alerts(district: str):
#     return get_inapp_alerts_for_district(district)

# @app.get("/api/vajra-sos/check/{district}", tags=["VajraSOS Alerts"])
# async def check_district_alerts(district: str):
#     try:
#         coords = get_district_coordinates(district)
#         if not coords:
#             return {"success": False, "error": "District not found"}

#         weather_data = get_weather_data(coords[0], coords[1])
#         alerts = check_weather_alerts(weather_data)

#         return {
#             "success": True,
#             "district": district,
#             "weather": weather_data,
#             "alerts": alerts,
#         }
#     except Exception as e:
#         return {"success": False, "error": str(e)}

# @app.get("/api/vajra-sos/info", tags=["VajraSOS Alerts"])
# def vajra_sos_info():
#     return {
#         "name": "VajraSOS",
#         "version": "1.0.0",
#         "features": [
#             "Automated weather monitoring",
#             "SMS alerts",
#             "In-app alerts",
#         ],
#     }
