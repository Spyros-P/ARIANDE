# Implementation Weaknesses 🛠️⚠️🔧

- Door detection process does not handle efficiently the output of the Deep Learning model (uses morphological filters in order to dilate the near wall segments and close the gap)

# Nebula of Ideas 🌌💡✨

- In order the path to be more centered, penaltize edges' weight by an amount depending of how close is it to a wall

- Create a sub graph of the main graph where nodes represent rooms and cache door to door routes

# Models & Datasets

- Roboflow Model: [Doors/Windows Detection](https://universe.roboflow.com/technical-university-of-munich-sabtf/doors-windows-detection/model/4)

- Roboflow Model: [old_obj_detection_new_img_jun2024](https://universe.roboflow.com/excelize-dgraz/old_obj_detection_new_img_jun2024/model/1)

- Roboflow Model: [Full-set-menu](https://universe.roboflow.com/autodesign/full-set-menu/model/5)
