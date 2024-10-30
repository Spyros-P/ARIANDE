from PIL import Image
import base64
from io import BytesIO
import json
import random

def encode_image_to_base64(image_path):
    with Image.open(image_path) as img:
        width, height = img.size
        buffered = BytesIO()
        img.save(buffered, format="JPEG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
    return img_base64, width, height

image_path = "../assets/dummy_img.jpg" 
encoded_image, img_width, img_height = encode_image_to_base64(image_path)

def create_random_bboxes(num_bboxes, max_width, max_height):
    bboxes = []
    count = 1
    for _ in range(num_bboxes):
        x = random.randint(0, max_width)
        y = random.randint(0, max_height)
        width = random.randint(10, max_width//10)  
        height = random.randint(10, max_height//10)
        
        if x + width > max_width:
            width = max_width - x
        if y + height > max_height:
            height = max_height - y
        
        bboxes.append({"x": x, "y": y, "width": width, "height": height, "id": count, "label" : "door", "source": "model"})
        count += 1
    return bboxes


bboxes = create_random_bboxes(3, img_width, img_height)

data = {
    "image_base64": encoded_image,
    "bboxes": bboxes
}

with open("../public/image_data.json", "w") as json_file:
    json.dump(data, json_file)

print("Image and bounding boxes saved to image_data_with_bboxes.json")
