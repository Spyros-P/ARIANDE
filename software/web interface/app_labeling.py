from flask import Flask, render_template, request, jsonify, send_from_directory
import os
import json

app = Flask(__name__)

# Path to image dataset
#IMAGE_FOLDER = "../YOLO/Floor-Plan/test/images"
IMAGE_FOLDER = "../web interface/assets/images"
# Path to save bounding box labels
# LABELS_FOLDER = "labels"

# Load image file names
image_files = sorted([f for f in os.listdir(IMAGE_FOLDER) if f.endswith(('jpg', 'jpeg', 'png'))])
current_image_index = 0  # Tracks the current image index

# if not os.path.exists(LABELS_FOLDER):
#     os.makedirs(LABELS_FOLDER)

@app.route('/')
def index():
    global current_image_index
    return render_template('labeling.html', image=image_files[current_image_index])

# Render any static file
@app.route('/assets/<path:path>')
def static_file(path):
    return send_from_directory('assets', path)

@app.route('/next_image')
def next_image():
    global current_image_index
    if current_image_index < len(image_files) - 1:
        current_image_index += 1
    else:
        current_image_index = 0
    return send_from_directory(IMAGE_FOLDER, image_files[current_image_index])

@app.route('/prev_image')
def prev_image():
    global current_image_index
    if current_image_index > 0:
        current_image_index -= 1
    else:
        current_image_index = len(image_files) - 1
    return send_from_directory(IMAGE_FOLDER, image_files[current_image_index])

@app.route('/save_bbox', methods=['POST'])
def save_bbox():
    # data = request.json
    # bbox = data.get('bbox')
    # image_name = image_files[current_image_index]
    
    # label_file = os.path.join(LABELS_FOLDER, f"{image_name}.json")
    
    # with open(label_file, 'w') as f:
    #     json.dump({"bbox": bbox}, f)
    
    return jsonify({"status": "success"})

if __name__ == '__main__':
    app.run(debug=True)
