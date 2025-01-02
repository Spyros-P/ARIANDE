from flask import Flask, request, jsonify
from super_gradients.training import models
import cv2
import numpy as np
import os

app = Flask(__name__)

DEVICE = 'cpu'
MODEL_ARCH = "yolo_nas_m"
classes = ['bathroom', 'bathtub', 'door', 'en_suite', 'kitchen', 'window']

checkpoint_path = "C:/Users/thano/Indoor-Navigation/software/web interface/models/average_model.pth"


best_model = models.get(
    MODEL_ARCH,
    num_classes=len(classes),
    checkpoint_path=checkpoint_path
).to(DEVICE)

def process_predictions(model_result):

    bboxes = model_result.prediction.bboxes_xyxy.tolist() 
    print(bboxes)
    confidence = model_result.prediction.confidence.tolist() 
    labels = model_result.prediction.labels.tolist() 
    
    response = {
        "bboxes": bboxes,
        "confidence": confidence,
        "labels": labels
    }
    
    return jsonify(response)

@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    file = request.files['image']

    try:
        
        temp_path = "./assets/temp_images/temp_image.jpg"
        file.save(temp_path)

        image = cv2.imread(temp_path)
        if image is None:
            return jsonify({"error": "Invalid image format"}), 400

        model_result = best_model.predict(image, conf=0.25)

        return process_predictions(model_result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
