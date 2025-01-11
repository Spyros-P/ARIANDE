# ARIADNE: A General Purpose Indoor Navigation System

**ARIADNE** is an advanced indoor navigation system, developed as part of the HiPEAC 2025 Student Challenge by a team of nine students from the National Technical University of Athens. The ARIADNE ecosystem comprises several key components designed to facilitate efficient indoor navigation.

## Components

### 1. Floor Plan Analysis Backend

The backend of the ARIADNE system is built using Python Flask. It is responsible for analyzing floor plans to detect and map critical features such as doors, walls, and rooms. Additionally, it generates a navigational graph by discretizing human-walkable spaces and connecting adjacent nodes with edges.

#### Key Features:
- **Door Detection**: Uses YOLOv8 with instance segmentation to identify and segment rooms.
- **Room Detection**: Employs YOLO11 with bounding box detection to accurately detect doors.
- **Wall Detection**: Utilizes Computer Vision techniques to map walls. We have also implemented an alternative method for this purpose: a Unet model with semantic segmentation.

By pinpointing the locations of doors and walls, the backend determines walkable spaces within the floor plan and constructs the aforementioned graph. This graph serves as the foundation for the navigation functionality.

### 2. Administrator User Interface (UI)

Through this user interface, building owners can register their building in the ARIADNE system. They can do so by uploading an image of the building’s floor plan, along with optional information such as the building's coordinates and a picture. Once the floor plan is uploaded, our Floor Plan Analysis models are triggered to detect rooms, doors, and walls. The user is then presented with the detected rooms and doors, and is required to label the rooms. Additionally, they can provide optional feedback on the door detection. After the labeling and feedback are complete, the data is sent to the backend to construct the navigation graph.  

### 3. Mobile Application  

The user can either download the map of a desired building or select one from their collection of saved maps. By selecting the room they wish to navigate to (from the list of room labels provided by the building owner), the application runs an A* algorithm on the building's navigation graph to calculate the shortest path to the destination. The user is then guided along the shortest path to reach the desired location. The location of the user at each time point is calculated using a localization algorithm that receives advertising signals from BLE (Bluetooth Low Energy) Beacons that must be installed in the building. 



