let image = document.getElementById("image");
let zoomLevel = 1;
let transformOriginX = 50;
let transformOriginY = 50;
let transoffsetX = 0;
let transoffsetY = 0;
let pointCount = 0;
let translateX = 0;
let translateY = 0;
let canvas = document.getElementById('boxes-canvas');
let container = document.getElementById('canvas-container');
let ctx = canvas.getContext('2d');
// create a list of 4-points bounding boxes
let boxes = [];
let pointX, pointY;
let isDragging = false;
let imageIndex=0;
let colors  = ["blue", "orange", "green", "red", "purple", "brown", "pink", "gray", "cyan", "magenta"];

let object_id = 0;

let startX, startY;

// Handle zoom with the mouse wheel
image.addEventListener("wheel", (event) => {
    event.preventDefault();

    // Update transform origin based on mouse position and current zoom
    const rect = image.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;

    // Calculate the transform origin relative to the current zoom level
    const arrowX = (offsetX / rect.width) * 100;
    const arrowY = (offsetY / rect.height) * 100;

    let lefttopX = transformOriginX*(1 - 1/zoomLevel) - transoffsetX;
    let lefttopY = transformOriginY*(1 - 1/zoomLevel) - transoffsetY;
    // let rightbottomX = transformOriginX*(1 - 1/zoomLevel) + 100/zoomLevel - transoffsetX;
    // let rightbottomY = transformOriginY*(1 - 1/zoomLevel) + 100/zoomLevel - transoffsetY;

    const posX = (arrowX - lefttopX)*zoomLevel;
    const posY = (arrowY - lefttopY)*zoomLevel;

    // Adjust zoom level and limit it to prevent the image from being smaller than its container
    let newZoomLevel = zoomLevel + event.deltaY * -0.002;
    newZoomLevel = Math.min(Math.max(1, newZoomLevel), 10);  // Limit zoom level between 1x (original size) and 3x

    // Apply new zoom level only if it's within bounds
    if (newZoomLevel !== zoomLevel) {
        // clear canvas

        transoffsetX = - transformOriginX*(1 - 1/zoomLevel) + arrowX*(1 - 1/newZoomLevel) + posX*(1/newZoomLevel - 1/zoomLevel) + transoffsetX;
        transoffsetY = - transformOriginY*(1 - 1/zoomLevel) + arrowY*(1 - 1/newZoomLevel) + posY*(1/newZoomLevel - 1/zoomLevel) + transoffsetY;

        transformOriginX = arrowX;
        transformOriginY = arrowY;

        lefttopX = arrowX*(1 - 1/newZoomLevel) - transoffsetX;
        lefttopY = arrowY*(1 - 1/newZoomLevel) - transoffsetY;
        rightbottomX = arrowX*(1 - 1/newZoomLevel) + 100/newZoomLevel - transoffsetX;
        rightbottomY = arrowY*(1 - 1/newZoomLevel) + 100/newZoomLevel - transoffsetY;

        // check if the image is out of range
        if(lefttopX < 0) {
            transoffsetX = transformOriginX*(1 - 1/newZoomLevel);
        }
        if(rightbottomX > 100) {
            transoffsetX = transformOriginX*(1 - 1/newZoomLevel) + 100/newZoomLevel - 100;
        }
        if(lefttopY < 0) {
            transoffsetY = transformOriginY*(1 - 1/newZoomLevel);
        }
        if(rightbottomY > 100) {
            transoffsetY = transformOriginY*(1 - 1/newZoomLevel) + 100/newZoomLevel - 100;
        }

        zoomLevel = newZoomLevel;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        image.style.transformOrigin = `${transformOriginX}% ${transformOriginY}%`;
        image.style.transform = `scale(${zoomLevel}) translate(${transoffsetX}%, ${transoffsetY}%)`;

        // draw the bounding boxes
        redrawBoundingBoxes();
        if (pointCount === 1) {
            // Update transform origin based on mouse position and current zoom
            const rect = image.getBoundingClientRect();
            const offsetX = event.clientX - rect.left;
            const offsetY = event.clientY - rect.top;
    
            // Calculate the transform origin relative to the current zoom level
            const arrowX = (offsetX / rect.width) * 100;
            const arrowY = (offsetY / rect.height) * 100;
    
            // calculate the box points
            const topLeftX = Math.min(startX, arrowX);
            const topLeftY = Math.min(startY, arrowY);
            const bottomRightX = Math.max(startX, arrowX);
            const bottomRightY = Math.max(startY, arrowY);
            
            drawBoundingBox(topLeftX, topLeftY, bottomRightX, bottomRightY, colors[object_id]); // Draw the box
        }
    }
});

// add image move with mouse
image.addEventListener("mousedown", (event) => {
    image.classList.add('dragging');
    event.preventDefault();
    let lastX = event.clientX;
    let lastY = event.clientY;

    let isDragging = true;

    document.addEventListener("mousemove", (event) => {
        if (isDragging) {
            const deltaX = event.clientX - lastX;
            const deltaY = event.clientY - lastY;

            const rect = image.getBoundingClientRect();
            transoffsetX += (deltaX / rect.width) * 100;
            transoffsetY += (deltaY / rect.height) * 100;

            lefttopX = transformOriginX*(1 - 1/zoomLevel) - transoffsetX;
            lefttopY = transformOriginY*(1 - 1/zoomLevel) - transoffsetY;
            rightbottomX = transformOriginX*(1 - 1/zoomLevel) + 100/zoomLevel - transoffsetX;
            rightbottomY = transformOriginY*(1 - 1/zoomLevel) + 100/zoomLevel - transoffsetY;

            // check if the image is out of range
            if(lefttopX < 0) {
                transoffsetX = transformOriginX*(1 - 1/zoomLevel);
            }
            if(rightbottomX > 100) {
                transoffsetX = transformOriginX*(1 - 1/zoomLevel) + 100/zoomLevel - 100;
            }
            if(lefttopY < 0) {
                transoffsetY = transformOriginY*(1 - 1/zoomLevel);
            }
            if(rightbottomY > 100) {
                transoffsetY = transformOriginY*(1 - 1/zoomLevel) + 100/zoomLevel - 100;
            }

            lastX = event.clientX;
            lastY = event.clientY;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            image.style.transform = `scale(${zoomLevel}) translate(${transoffsetX}%, ${transoffsetY}%)`;

            // draw the bounding boxes
            redrawBoundingBoxes();
            if (pointCount === 1) {
                // Update transform origin based on mouse position and current zoom
                const offsetX = event.clientX - rect.left;
                const offsetY = event.clientY - rect.top;

                // Calculate the transform origin relative to the current zoom level
                const arrowX = (offsetX / rect.width) * 100;
                const arrowY = (offsetY / rect.height) * 100;

                // calculate the box points
                const topLeftX = Math.min(startX, arrowX);
                const topLeftY = Math.min(startY, arrowY);
                const bottomRightX = Math.max(startX, arrowX);
                const bottomRightY = Math.max(startY, arrowY);

                drawBoundingBox(topLeftX, topLeftY, bottomRightX, bottomRightY, colors[object_id]); // Draw the box
            }
        }
    });

    document.addEventListener("mouseup", () => {
        isDragging = false;
        image.classList.remove('dragging');
    });

    document.addEventListener("mouseleave", () => {
        isDragging = false;
        image.classList.remove('dragging');
    });
});

image.addEventListener("click", (event) => {
    // Update transform origin based on mouse position and current zoom
    const rect = image.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;

    // Calculate the transform origin relative to the current zoom level
    const arrowX = (offsetX / rect.width) * 100;
    const arrowY = (offsetY / rect.height) * 100;

    // Check if the click is on right top corner of a bounding box
    let deleted = false;
    for (let i = 0; i < boxes.length; i++) {
        let box = boxes[i];
        if (arrowX > box.x2 - 1 && arrowX < box.x2 + 1 && arrowY > box.y1 - 1 && arrowY < box.y1 + 1) {
            // remove the box
            boxes.splice(i, 1);
            i -= 1;
            deleted = true;
            deleteBoundingBox(box.id, box.x1, box.y1, box.x2, box.y2);
        }
    }
    if (deleted) {
        redrawBoundingBoxes();
    }
});

// if esc is pressed, reset the point count
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        pointCount = 0;
        redrawBoundingBoxes();
    }
});

// on mouse hover
image.addEventListener("mousemove", (event) => {
    redrawBoundingBoxes();
    if (pointCount === 1) {
        // Update transform origin based on mouse position and current zoom
        const rect = image.getBoundingClientRect();
        const offsetX = event.clientX - rect.left;
        const offsetY = event.clientY - rect.top;

        // Calculate the transform origin relative to the current zoom level
        const arrowX = (offsetX / rect.width) * 100;
        const arrowY = (offsetY / rect.height) * 100;

        // calculate the box points
        const topLeftX = Math.min(startX, arrowX);
        const topLeftY = Math.min(startY, arrowY);
        const bottomRightX = Math.max(startX, arrowX);
        const bottomRightY = Math.max(startY, arrowY);
        
        drawBoundingBox(topLeftX, topLeftY, bottomRightX, bottomRightY, colors[object_id]); // Draw the box
    }
});

function redrawBoundingBoxes() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < boxes.length; i++) {
        let box = boxes[i];
        drawBoundingBox(box.x1, box.y1, box.x2, box.y2, colors[box.id]);
    }
}

// Handle bounding box selection with right-click
image.addEventListener("contextmenu", (event) => {
    event.preventDefault();

    // Update transform origin based on mouse position and current zoom
    const rect = image.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;

    // Calculate the transform origin relative to the current zoom level
    const arrowX = (offsetX / rect.width) * 100;
    const arrowY = (offsetY / rect.height) * 100;

    // Plot points
    if (pointCount === 0) {
        startX = arrowX;
        startY = arrowY;
        // plotPoint(arrowX, arrowY, 'red'); // Plot starting point
        pointCount++;
    } else if (pointCount === 1) {
        // plotPoint(arrowX, arrowY, 'red'); // Plot ending point
        // calculate the box points
        const topLeftX = Math.min(startX, arrowX);
        const topLeftY = Math.min(startY, arrowY);
        const bottomRightX = Math.max(startX, arrowX);
        const bottomRightY = Math.max(startY, arrowY);

        boxes.push({ id: object_id, x1: topLeftX, y1: topLeftY, x2: bottomRightX, y2: bottomRightY });
        
        drawBoundingBox(topLeftX, topLeftY, bottomRightX, bottomRightY, colors[object_id]); // Draw the box
        pointCount = 0; // Reset for the next bounding box

        // make a post request to save the bounding box
        saveBoundingBox(object_id, topLeftX, topLeftY, bottomRightX, bottomRightY);
    }
});

// Function to plot a point on the image
function plotPoint(x, y, color) {

    // let lefttopX = transformOriginX*(1 - 1/zoomLevel) - transoffsetX;
    // let lefttopY = transformOriginY*(1 - 1/zoomLevel) - transoffsetY;
    // let rightbottomX = transformOriginX*(1 - 1/zoomLevel) + 100/zoomLevel - transoffsetX;
    // let rightbottomY = transformOriginY*(1 - 1/zoomLevel) + 100/zoomLevel - transoffsetY;
    
    // if (x < lefttopX || x > rightbottomX || y < lefttopY || y > rightbottomY) {
    //     console.log("OKKK");
    //     return;
    // }

    let lefttopX = transformOriginX*(1 - 1/zoomLevel) - transoffsetX;
    let lefttopY = transformOriginY*(1 - 1/zoomLevel) - transoffsetY;

    const posX = (x - lefttopX)*zoomLevel;
    const posY = (y - lefttopY)*zoomLevel;

    // get dimensions of the canvas
    pointX = posX * canvas.width / 100;
    pointY = posY * canvas.height / 100;

    ctx.beginPath();
    ctx.arc(pointX, pointY, 5, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
}

// Function to draw a bounding box on the image
function drawBoundingBox(x1, y1, x2, y2, color) {
    let lefttopX = transformOriginX*(1 - 1/zoomLevel) - transoffsetX;
    let lefttopY = transformOriginY*(1 - 1/zoomLevel) - transoffsetY;

    const posX1 = (x1 - lefttopX)*zoomLevel;
    const posY1 = (y1 - lefttopY)*zoomLevel;

    const posX2 = (x2 - lefttopX)*zoomLevel;
    const posY2 = (y2 - lefttopY)*zoomLevel;

    // get dimensions of the image
    x1 = posX1 * canvas.width / 100;
    y1 = posY1 * canvas.height / 100;
    x2 = posX2 * canvas.width / 100;
    y2 = posY2 * canvas.height / 100;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x1, y2);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // draw the top right corner
    ctx.beginPath();
    ctx.arc(x2, y1, 7, 0, 2 * Math.PI);
    ctx.fillStyle = 'red';
    ctx.fill();
}

function saveBoundingBox(object_id, x1, y1, x2, y2) {
    centerx = (x1 + x2) / 200;
    centery = (y1 + y2) / 200;
    width = (x2 - x1) / 100;
    height = (y2 - y1) / 100;
    fetch("/save_box", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            box: { object_id, centerx, centery, width, height },
            image_index: imageIndex,
        }),
    }).then(response => response.json()).then(data => {
        console.log("Bounding box saved:", data);
    });
}

function deleteBoundingBox(object_id, x1, y1, x2, y2) {
    centerx = (x1 + x2) / 200;
    centery = (y1 + y2) / 200;
    width = (x2 - x1) / 100;
    height = (y2 - y1) / 100;
    fetch("/delete_box", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            box: { object_id, centerx, centery, width, height },
            image_index: imageIndex,
        }),
    }).then(response => response.json()).then(data => {
        console.log("Bounding box saved:", data);
    });
}

// Add event listeners to the left-side buttons to change the object_id
document.querySelectorAll('.right-button-container .button').forEach(button => {
    button.addEventListener('click', () => {
        // set old object_id button's background to white
        let old_object_id = object_id;
        let old_button = document.querySelector(`.right-button-container .button[data-object-id="${old_object_id}"]`);
        if (old_button) {
            old_button.style.backgroundColor = ''; // Reset to default background color
            old_button.style.color = ''; // Reset to default text color
        }
        object_id = button.getAttribute('data-object-id');
        // add permanent hover effect to the selected button
        button.style.backgroundColor = colors[object_id];
        button.style.color = 'white';
    });
});

function get_image(url) {
    fetch(url, { method: "GET" })
        .then(response => response.json())
        .then(data => {
            // Fetch the image as a blob
            fetch(data.image_url)
                .then(response => response.blob())
                .then(blob => {
                    const imageUrl = URL.createObjectURL(blob);
                    image.src = imageUrl;
                    imageIndex = data.image_index;

                    // Update boxes according to data.boxes
                    boxes = [];
                    data.boxes.forEach(box => {
                        // Unpack the box which is a JSON object
                        const centerx = parseFloat(box[1])*100;
                        const centery = parseFloat(box[2])*100;
                        const width = parseFloat(box[3])*100;
                        const height = parseFloat(box[4])*100;
                        
                        let topLeftX = centerx - width/2;
                        let topLeftY = centery - height/2;
                        let bottomRightX = centerx + width/2;
                        let bottomRightY = centery + height/2;
                        boxes.push({ id: parseInt(box[0]), x1: topLeftX, y1: topLeftY, x2: bottomRightX, y2: bottomRightY });
                    });
                })
                .catch(error => console.error('Error fetching image blob:', error));
        })
        .catch(error => console.error('Error fetching next image data:', error));

    pointCount = 0;
    isDragging = false;
    transformOriginX = 50;
    transformOriginY = 50;
    transoffsetX = 0;
    transoffsetY = 0;
    zoomLevel = 1;
    image.style.transformOrigin = `${transformOriginX}% ${transformOriginY}%`;
    image.style.transform = `scale(${zoomLevel}) translate(${transoffsetX}%, ${transoffsetY}%)`;

    image.onload = () => {
        // resize the canvas according to the image size
        let imageWidth = image.width;
        let imageHeight = image.height;
        canvas.width = imageWidth;
        canvas.height = imageHeight;

        // change the image-container size
        let container = document.getElementById('img-container');
        container.style.width = `${imageWidth}px`;
        container.style.height = `${imageHeight}px`;

        redrawBoundingBoxes();
    }
}

document.getElementById("next").addEventListener("click", () => {
    get_image(`/next_image?image_index=${imageIndex}`);
});

document.getElementById("prev").addEventListener("click", () => {
    get_image(`/prev_image?image_index=${imageIndex}`);
});

// auto load the first image
get_image("/first_image");

let first_button = document.querySelector(`.right-button-container .button[data-object-id="${object_id}"]`);
first_button.style.backgroundColor = colors[object_id];
first_button.style.color = 'white';