from flask import Flask, request, jsonify, render_template
import tensorflow as tf
import numpy as np
from PIL import Image
import io

app = Flask(__name__)

# Load your trained model
MODEL_PATH = "model.h5"  # Ensure this path is correct
model = tf.keras.models.load_model(MODEL_PATH)

# Class labels dictionary
class_labels = {0: "Covid", 1: "Normal", 2: "Viral Pneumonia"}

# Define image preprocessing function
def preprocess_image(image):
    img = Image.open(io.BytesIO(image)).convert("RGB")  # Ensure 3 channels
    img = img.resize((224, 224))  # Resize to match model input size
    img = np.array(img) / 255.0  # Normalize pixel values
    img = np.expand_dims(img, axis=0)  # Add batch dimension (1, 224, 224, 3)
    return img

@app.route("/", methods=["GET"])
def home():
    return render_template("index.html")


@app.route("/predict", methods=["POST"])
def predict():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    image = file.read()
    processed_image = preprocess_image(image)

    prediction = model.predict(processed_image)
    predicted_class = int(np.argmax(prediction, axis=1)[0])  # Convert np.int64 to int
    confidence = float(np.max(prediction))  # Get highest probability

    disease_name = class_labels.get(predicted_class, "Unknown")

    return jsonify({
        "prediction": predicted_class,
        "disease": disease_name,
        "confidence": f"{confidence * 100:.2f}%"  # Convert to percentage
    })


if __name__ == "__main__":
    app.run(debug=True)
