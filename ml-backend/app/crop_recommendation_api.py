from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ValidationError
import joblib
import os
import pandas as pd
from datetime import datetime

router = APIRouter(prefix="/crop-recommendation", tags=["Crop Recommendation"])

# Model and features
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "Data", "crop_recommendation_random_forest.joblib")
FEATURES = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
DRIFT_LOG_PATH = os.path.join(BASE_DIR, "Data", "feature_drift_log.csv")

# Load model
model = joblib.load(MODEL_PATH)

class CropInput(BaseModel):
    N: float
    P: float
    K: float
    temperature: float
    humidity: float
    ph: float
    rainfall: float

# Precompute crop feature averages for realistic reasons
CROP_STATS_PATH = os.path.join(BASE_DIR, "Data", "crop_recommendation.csv")
crop_df = pd.read_csv(CROP_STATS_PATH)
crop_feature_means = crop_df.groupby('label')[FEATURES].mean().to_dict(orient='index')

def get_reason_for_crop(crop, user_input):
    if crop not in crop_feature_means:
        return "Recommended by ML model based on your soil and climate parameters"
    means = crop_feature_means[crop]
    close_features = []
    for feat in FEATURES:
        user_val = user_input[feat]
        mean_val = means[feat]
        # Consider a feature a 'good match' if within 10% of the mean (or 1 for pH)
        if feat == 'ph':
            if abs(user_val - mean_val) <= 1:
                close_features.append(f"pH ≈ {mean_val:.1f}")
        else:
            if mean_val == 0:
                continue
            if abs(user_val - mean_val) / mean_val <= 0.1:
                close_features.append(f"{feat} ≈ {mean_val:.1f}")
    if close_features:
        return f"Good match for {', '.join(close_features)} needed by {crop}."
    return "Recommended by ML model based on your soil and climate parameters"

@router.post("/predict")
def recommend_crop(data: CropInput):
    try:
        # Validate feature mapping
        input_dict = data.dict()
        input_keys = list(input_dict.keys())
        if input_keys != FEATURES:
            raise HTTPException(status_code=400, detail=f"Input features must be {FEATURES} in order.")
        features = [[input_dict[feat] for feat in FEATURES]]
        # Get top 3 crops with probabilities
        if hasattr(model, "predict_proba"):
            proba = model.predict_proba(features)[0]
            classes = model.classes_
            top_n = 3
            top_indices = proba.argsort()[::-1][:top_n]
            recommendations = []
            for idx in top_indices:
                crop = classes[idx]
                confidence = round(proba[idx] * 100)
                reason = get_reason_for_crop(crop, input_dict)
                recommendations.append({
                    "crop": crop,
                    "confidence": confidence,
                    "why": reason
                })
        else:
            # Fallback: only single prediction
            crop = model.predict(features)[0]
            reason = get_reason_for_crop(crop, input_dict)
            recommendations = [{
                "crop": crop,
                "confidence": None,
                "why": reason
            }]
        # Log features for drift monitoring
        log_entry = {**input_dict, "timestamp": datetime.utcnow().isoformat()}
        log_df = pd.DataFrame([log_entry])
        if not os.path.exists(DRIFT_LOG_PATH):
            log_df.to_csv(DRIFT_LOG_PATH, index=False)
        else:
            log_df.to_csv(DRIFT_LOG_PATH, mode='a', header=False, index=False)
        return {"recommendations": recommendations}
    except ValidationError as ve:
        raise HTTPException(status_code=422, detail=ve.errors())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
