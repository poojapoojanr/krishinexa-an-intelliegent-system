"""
Single-stage Plant Disease Detection using MobileNetV2
Inspired by https://github.com/kashish-ag/Detection-of-Plant-Disease
"""
import os
import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image

# Path to single disease detection model and label file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'plant_disease_mobilenetv2.h5')  # Update with your model filename
LABELS_PATH = os.path.join(BASE_DIR, 'disease_labels.txt')  # One label per line
IMG_SIZE = (128, 128)  # Update if your model expects a different size

# Load model
model = load_model(MODEL_PATH)

# Load labels
with open(LABELS_PATH, 'r') as f:
    LABELS = [line.strip() for line in f if line.strip()]

def predict_disease(img_path):
    img = image.load_img(img_path, target_size=IMG_SIZE)
    x = image.img_to_array(img)
    x = np.expand_dims(x, axis=0) / 255.0
    preds = model.predict(x)[0]
    top_idx = int(np.argmax(preds))
    top_conf = float(preds[top_idx])
    top_label = LABELS[top_idx] if top_idx < len(LABELS) else 'Unknown'
    # Optionally return top-N predictions
    top_n = 3
    top_preds = [
        {'disease': LABELS[i], 'confidence': float(preds[i])}
        for i in np.argsort(preds)[::-1][:top_n]
    ]

    # Realistic severity mapping
    if 'healthy' in top_label.lower():
        severity = 'Healthy Plant'
    else:
        severity = 'High' if top_conf > 0.7 else 'Medium' if top_conf > 0.4 else 'Low'

    # Realistic treatment mapping
    TREATMENT_MAP = {
    # 🍅 Tomato
    "Tomato_Bacterial_spot":
        "Use certified disease-free seeds, apply copper-based bactericides.",
    "Tomato_Early_blight":
        "Apply fungicides like mancozeb, remove infected leaves.",
    "Tomato_Late_blight":
        "Apply fungicides (chlorothalonil/copper), improve airflow.",
    "Tomato_Leaf_Mold":
        "Reduce humidity, apply appropriate fungicide.",
    "Tomato_Septoria_leaf_spot":
        "Remove affected leaves, apply fungicide.",
    "Tomato_Spider_mites_Two_spotted_spider_mite":
        "Use miticides, spray water to reduce mites.",
    "Tomato_Target_Spot":
        "Apply fungicide and avoid overhead irrigation.",
    "Tomato_Tomato_YellowLeaf_Curl_Virus":
        "Control whiteflies, remove infected plants.",
    "Tomato_Tomato_mosaic_virus":
        "Remove infected plants, disinfect tools.",
    "Tomato_healthy":
        "No treatment required. Maintain good crop practices.",

    # 🥔 Potato
    "Potato_Early_blight":
        "Apply fungicide, rotate crops, remove plant debris.",
    "Potato_Late_blight":
        "Apply fungicides, destroy infected plants immediately.",
    "Potato_healthy":
        "No treatment required. Maintain soil health.",

    # 🌶️ Pepper
    "Pepper__bell___Bacterial_spot":
        "Use copper fungicide, avoid overhead watering.",
    "Pepper__bell___healthy":
        "No treatment required. Maintain good irrigation.",
}

    treatment = TREATMENT_MAP.get(top_label, "See recommended treatment")

    return {
        'disease': top_label,
        'confidence': top_conf,
        'top_predictions': top_preds,
        'status': 'Healthy Plant' if 'healthy' in top_label.lower() else 'Diseased',
        'severity': severity,
        'treatment': treatment,
        'message': f'Detected disease: {top_label}' if 'healthy' not in top_label.lower() else 'No disease detected. Maintain proper irrigation and nutrition.'
    }

if __name__ == "__main__":
    import sys
    if len(sys.argv) != 2:
        print("Usage: python disease_detection.py <image_path>")
        sys.exit(1)
    img_path = sys.argv[1]
    result = predict_disease(img_path)
    import pprint
    pprint.pprint(result)
