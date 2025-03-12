from ultralytics import YOLO
import matplotlib.pyplot as plt
import cv2

# image_path = 'assets/images/hospital_1_upscaled_sharpened.jpg'
# image_path = 'assets/images/hospital_1_mask_upscaled.jpg'
# image_path = 'assets/images/hospital_1_upscale.jpg'
image_path = 'assets/images/floor_plan_1.jpg'
# image_path = 'assets/images/hospital_1.jpg'
# image_path = 'assets/images/floor_plan_1_svg.png'

# Load the model
model = YOLO("full_set_menu-yolo11m_seg.pt")
results = model(image_path)[0]


names =results.names
print(names)

orig_image = cv2.imread(image_path)

# Convert the image from BGR to RGB
img = cv2.cvtColor(orig_image, cv2.COLOR_BGR2RGB)

# Define a dictionary to map each class to a specific color
class_colors = {
    'DOOR-SINGLE': (255, 0, 0),  # Blue
    'DOOR-DOUBLE': (0, 255, 0),  # Green
    'WINDOW': (0, 0, 255),       # Red
    # Add more classes and colors as needed
}

# Plot the predicted results
for result in results:
    points = result.masks.xy[0]
    boxes = result.boxes.xyxy.tolist()[0]
    cls = names[result.boxes.cls.tolist()[0]]
    conf = result.boxes.conf.tolist()[0] * 100

    # classes = ['DOOR-SINGLE', 'DOOR-DOUBLE', 'WINDOW']
    # if cls not in classes or conf < 70:
    #     continue

    # Get the color for the current class
    # color = class_colors.get(cls, (255, 255, 255))  # Default to white if class not found
    color = (255, 0, 0)

    x1 = int(boxes[0])
    y1 = int(boxes[1])
    x2 = int(boxes[2])
    y2 = int(boxes[3])

    label = f"{cls} {conf:.2f}"

    # Draw the bounding box
    #cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)

    print(points)
    # Draw the mask
    for i in range(0, len(points)):
        cv2.line(img, (int(points[i][0]), int(points[i][1])), (int(points[(i + 1) % len(points)][0]), int(points[(i + 1) % len(points)][1]),), color, 2)

    # Draw the label
    cv2.putText(img, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)

# Plot the image with bounding boxes
plt.figure(figsize=(15, 15))
plt.imshow(img)
plt.axis('off')
plt.show()

# save image with cv2
# cv2.imwrite('yolo_results_raw.jpg', cv2.cvtColor(img, cv2.COLOR_RGB2BGR))