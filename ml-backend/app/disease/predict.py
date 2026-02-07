import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import os

MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'plant_disease_cnn_model.h5')

# Load model once at import time
model = load_model(MODEL_PATH)

# Import labels
try:
    from app.disease.labels import LABELS
except ImportError:
    LABELS = [f"Class {i}" for i in range(model.output_shape[-1])]

def predict_disease(img_path):
    # Match training image size
    img = image.load_img(img_path, target_size=(128, 128))
    x = image.img_to_array(img)
    x = np.expand_dims(x, axis=0)
    x = x / 255.0
    preds = model.predict(x)[0]
    top_indices = preds.argsort()[-3:][::-1]
    top_predictions = [
        {"class": LABELS[i] if i < len(LABELS) else str(i), "score": float(preds[i])}
        for i in top_indices
    ]
    best_idx = int(np.argmax(preds))
    predicted_label = LABELS[best_idx] if best_idx < len(LABELS) else str(best_idx)
    confidence = float(preds[best_idx])
    CONF_THRESHOLD = 0.5
    is_confident = confidence >= CONF_THRESHOLD
    is_healthy = "healthy" in predicted_label.lower()

    # Supported crops
    supported_crops = ["tomato", "pepper", "potato"]
    def get_crop(label):
        for crop in supported_crops:
            if crop in label.lower():
                return crop
        return None

    # Check if top predictions are for different crops
    top_crops = set(get_crop(LABELS[i]) for i in top_indices if i < len(LABELS))
    top_crops.discard(None)

    # If no supported crop in top predictions, or mixed crops, reject
    if not top_crops or len(top_crops) > 1:
        return {
            "status": "Uncertain",
            "message": "Unable to reliably identify crop type. Please upload a clear leaf image of Tomato, Pepper, or Potato.",
            "disease": None,
            "confidence": confidence,
            "is_confident": False,
            "severity": None,
            "treatment": None,
            "top_predictions": top_predictions
        }

    # If not confident, or not a supported crop, reject
    if not is_confident:
        return {
            "status": "Uncertain",
            "message": "Image unclear or does not strongly match known disease patterns.",
            "disease": None,
            "confidence": confidence,
            "is_confident": False,
            "severity": None,
            "treatment": None,
            "top_predictions": top_predictions
        }

    # If not a supported crop, reject
    crop = get_crop(predicted_label)
    if crop is None:
        return {
            "status": "Unsupported Image",
            "message": "Please upload a clear leaf image of Tomato, Pepper, or Potato.",
            "disease": None,
            "confidence": confidence,
            "is_confident": False,
            "severity": None,
            "treatment": None,
            "top_predictions": top_predictions
        }

    # Healthy logic
    if is_healthy:
        return {
            "status": "Healthy Plant",
            "message": "No disease detected. Maintain proper irrigation and nutrition.",
            "disease": "Healthy Plant",
            "confidence": confidence,
            "is_confident": True,
            "severity": None,
            "treatment": "No treatment required. Maintain proper irrigation and nutrition.",
            "top_predictions": top_predictions
        }

    # Diseased logic
    return {
        "status": "Diseased",
        "message": f"Detected disease: {predicted_label}",
        "disease": predicted_label,
        "confidence": confidence,
        "is_confident": True,
        "severity": "High" if confidence > 0.7 else "Medium" if confidence > 0.4 else "Low",
        "treatment": "Apply crop-specific recommended fungicide and remove infected leaves.",
        "top_predictions": top_predictions
    }
