from fastapi import FastAPI, File, UploadFile, Form
import uvicorn
import numpy as np
from io import BytesIO
from PIL import Image
from fastapi.middleware.cors import CORSMiddleware
import tensorflow as tf
import joblib
from tensorflow.keras.applications import EfficientNetB0

feature_extractor = EfficientNetB0(include_top=False, pooling='avg', input_shape=(256, 256, 3))
feature_extractor.trainable = False


# --- App Setup ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Load Models ---
model_v1 = tf.keras.models.load_model("../models/model_v1.keras")
mobilenet_model = tf.keras.models.load_model("../models/mobilenetv2_model.keras")
resnet_model = tf.keras.models.load_model("../models/resnet50_model.keras")

with open("../models/rf_model.pkl", "rb") as f:
    rf_model = joblib.load(f)

with open("../models/svm_model.pkl", "rb") as f:
    svm_model = joblib.load(f)

with open("../models/svm_scaler.pkl", "rb") as f:
    svm_scaler = joblib.load(f)

with open("../models/svm_pca.pkl", "rb") as f:
    svm_pca = joblib.load(f)

# --- Class Labels ---
CLASS_NAMES = ["Early Blight", "Late Blight", "Healthy"]

# --- Image Utilities ---
def read_file_as_image(data) -> np.ndarray:
    image = Image.open(BytesIO(data)).convert("RGB")
    image = image.resize((256, 256))  # consistent with training size
    return np.array(image)

def preprocess(img: np.ndarray):
    img = np.expand_dims(img, axis=0)  # no division!
    return img.astype(np.float32)

# --- Routes ---
@app.get("/ping")
async def ping():
    return {"message": "API is live"}

@app.post("/model1")  # Custom CNN
async def predict_model1(file: UploadFile = File(...)):
    img = read_file_as_image(await file.read())
    pred = model_v1.predict(preprocess(img))[0]
    return {
        "class": CLASS_NAMES[np.argmax(pred)],
        "confidence": float(np.max(pred)),
        "diseaseClass": CLASS_NAMES[np.argmax(pred)]
    }

@app.post("/model2")  # MobileNetV2
async def predict_model2(file: UploadFile = File(...)):
    img = read_file_as_image(await file.read())
    processed = preprocess(img)
    pred = mobilenet_model.predict(processed)[0]
    return {
        "class": CLASS_NAMES[np.argmax(pred)],
        "confidence": float(np.max(pred)),
        "diseaseClass": CLASS_NAMES[np.argmax(pred)]
    }

@app.post("/model3")  # ResNet50
async def predict_model3(file: UploadFile = File(...)):
    img = read_file_as_image(await file.read())
    pred = resnet_model.predict(preprocess(img))[0]
    return {
        "class": CLASS_NAMES[np.argmax(pred)],
        "confidence": float(np.max(pred)),
        "diseaseClass": CLASS_NAMES[np.argmax(pred)]
    }

@app.post("/model4")  # Random Forest with CNN features
async def predict_model4(file: UploadFile = File(...)):
    img = read_file_as_image(await file.read())         # shape: (256, 256, 3)
    img = img / 255.0                                    # normalize
    processed = np.expand_dims(img, axis=0).astype(np.float32)  # shape: (1, 256, 256, 3)

    features = feature_extractor.predict(processed, verbose=0)  # shape: (1, 1280)

    pred = rf_model.predict_proba(features)[0]
    predicted_index = np.argmax(pred)

    return {
        "class": CLASS_NAMES[predicted_index],
        "confidence": float(np.max(pred)),
        "diseaseClass": CLASS_NAMES[predicted_index]
    }


@app.post("/model5")  # SVM with CNN features
async def predict_model5(file: UploadFile = File(...)):
    img = read_file_as_image(await file.read())
    img_tensor = tf.convert_to_tensor(img, dtype=tf.float32)

    img_resized = tf.image.resize(img_tensor, (128, 128))
    img_resized = tf.expand_dims(img_resized, axis=0) / 255.0
    cnn_features = feature_extractor.predict(img_resized)

    svm_model = joblib.load("../models/svm_model.pkl")
    scaler = joblib.load("../models/svm_scaler.pkl")
    pca = joblib.load("../models/svm_pca.pkl")

    cnn_scaled = scaler.transform(cnn_features)
    cnn_pca = pca.transform(cnn_scaled)
    probs = svm_model.predict_proba(cnn_pca)[0]

    predicted_index = int(np.argmax(probs))
    return {
        "class": CLASS_NAMES[predicted_index],
        "confidence": float(np.max(probs)),
        "diseaseClass": CLASS_NAMES[predicted_index]
    }


# --- Main Runner ---
if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)
