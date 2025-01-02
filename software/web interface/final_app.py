from flask import Flask, request, jsonify
from super_gradients.training import models
import cv2
import numpy as np
import os
import base64
import subprocess

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

@app.route('/predict_doors', methods=['POST'])
def predict_doors():
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

@app.route('/predict_rooms', methods=['POST'])
def predict_rooms():
    try:
        # Define paths
        model_path = "C:/Users/thano/Indoor-Navigation/software/web interface/models/best.pt"
        
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

        temp_path = "C:/Users/thano/Indoor-Navigation/software/web interface/assets/temp_images"
        temp_image_path = os.path.join(temp_path, 'temp_image.jpg')
        success = cv2.imwrite(temp_image_path, image)

        if image is None:
            return jsonify({"error": "Invalid image format"}), 400
        
        # YOLO command
        yolo_command = [
            "yolo",
            "task=segment",
            "mode=predict",
            f"model={model_path}",
            "conf=0.5",
            f"source={os.path.join(temp_path, 'temp_image.jpg')}",
            "save=True",
            "save_txt=True",  # This saves the txt files
            f"project={temp_path}",  # Specify the directory to save the files
            "show_labels=False",
            "show_conf=False",
            "show_boxes=False"
        ]
        
        # Execute YOLO command
        result = subprocess.run(yolo_command, capture_output=True, text=True)
        
        # Check for errors
        if result.returncode != 0:
            return jsonify({"error": "YOLO command failed", "details": result.stderr}), 500
        
        txt_path = os.path.join(temp_path, 'predict/labels')
        # Get the .txt file (assuming single file output for simplicity)
        txt_files = [f for f in os.listdir(txt_path) if f.endswith('.txt')]
        if not txt_files:
            return jsonify({"error": "No .txt file generated"}), 500
        
        txt_file_path = os.path.join(temp_path, txt_files[0])
        
        # Serve the .txt file
        return jsonify({"ok" : "ok"}) #send_from_directory(directory=temp_path, path=txt_files[0], as_attachment=True)

    except Exception as e:
        return jsonify({"error": "An error occurred", "details": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
