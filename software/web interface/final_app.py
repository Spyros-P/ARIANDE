from flask import Flask, request, jsonify
from super_gradients.training import models
import cv2
import numpy as np
import os
import base64

from flask_cors import CORS

app = Flask(__name__)
CORS(app)  

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

    label_names = {
        2: "door",  
    }

    bboxes = model_result.prediction.bboxes_xyxy.tolist() 
    confidence = model_result.prediction.confidence.tolist() 
    labels = model_result.prediction.labels.tolist() 

    filtered_bboxes = [bbox for bbox, label in zip(bboxes, labels) if label == 2]
    filtered_confidence = [conf for conf, label in zip(confidence, labels) if label == 2]
    filtered_labels = [label for label in labels if label == 2]
    
    formatted_bboxes = [
        {
            "x": bbox[0],  # x coordinate
            "y": bbox[1],  # y coordinate
            "width": bbox[2] - bbox[0],  # width (difference between x2 and x1)
            "height": bbox[3] - bbox[1],  # height (difference between y2 and y1)
            "label": label_names.get(label, "unknown")  # Get the label name from the dictionary
        }
        for bbox, label in zip(filtered_bboxes, filtered_labels)
    ]

    response = {
        "bboxes": filtered_bboxes,
        "confidence": filtered_confidence,
        "labels": filtered_labels,
        "formatted_bboxes": formatted_bboxes
    }
    
    return jsonify(response)

@app.route('/predict1', methods=['POST'])
def predict1():
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

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Get the JSON data from the request body
        data = request.get_json()

        if 'image' not in data:
            return jsonify({"error": "No image data provided"}), 400
        
        # Extract base64 string from the request
        base64_string = data['image']
        
        # Check if the string contains metadata (e.g., 'data:image/jpeg;base64,...')
        if base64_string.startswith('data:image'):
            # Remove the data:image/*;base64, part from the string
            base64_string = base64_string.split(',')[1]

        # Decode the base64 string to bytes
        image_data = base64.b64decode(base64_string)

        # Convert the image data to a numpy array and decode using OpenCV
        image_array = np.frombuffer(image_data, dtype=np.uint8)
        image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

        if image is None:
            return jsonify({"error": "Invalid image format"}), 400

        # Predict using the model (you can call your model's prediction method here)
        model_result = best_model.predict(image, conf=0.25)

        # Process and return predictions
        return process_predictions(model_result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
