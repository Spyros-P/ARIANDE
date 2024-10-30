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
    newZoomLevel = Math.min(Math.max(1, newZoomLevel), 8);  // Limit zoom level between 1x (original size) and 3x

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
            
            drawBoundingBox(topLeftX, topLeftY, bottomRightX, bottomRightY); // Draw the box
        }
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
        
        drawBoundingBox(topLeftX, topLeftY, bottomRightX, bottomRightY); // Draw the box
    }
});

function redrawBoundingBoxes() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < boxes.length; i++) {
        let box = boxes[i];
        drawBoundingBox(box.x1, box.y1, box.x2, box.y2);
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

        boxes.push({ x1: topLeftX, y1: topLeftY, x2: bottomRightX, y2: bottomRightY });
        
        drawBoundingBox(topLeftX, topLeftY, bottomRightX, bottomRightY); // Draw the box
        pointCount = 0; // Reset for the next bounding box
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
function drawBoundingBox(x1, y1, x2, y2) {
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
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 2;
    ctx.stroke();
}

function saveBoundingBox(x1, y1, x2, y2) {
    fetch("/save_bbox", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            bbox: {x1: x1, y1: y1, x2: x2, y2: y2},
        }),
    }).then(response => response.json()).then(data => {
        console.log("Bounding box saved:", data);
    });
}

document.getElementById("next").addEventListener("click", () => {
    fetch("/next_image", { method: "GET" })
        .then(response => response.blob())
        .then(blob => {
            const image = document.getElementById("image");
            const url = URL.createObjectURL(blob);
            image.src = url;
        })
        .catch(error => console.error('Error fetching next image:', error));
    
    boxes = [];
    transformOriginX = 50;
    transformOriginY = 50;
    transoffsetX = 0;
    transoffsetY = 0;
    zoomLevel = 1;
    image.style.transformOrigin = `${transformOriginX}% ${transformOriginY}%`;
    image.style.transform = `scale(${zoomLevel}) translate(${transoffsetX}%, ${transoffsetY}%)`;
    redrawBoundingBoxes();

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
    }
});

document.getElementById("prev").addEventListener("click", () => {
    fetch("/prev_image", { method: "GET" })
        .then(response => response.blob())
        .then(blob => {
            const image = document.getElementById("image");
            const url = URL.createObjectURL(blob);
            image.src = url;
        })
        .catch(error => console.error('Error fetching previous image:', error));
    
    boxes = [];
    transformOriginX = 50;
    transformOriginY = 50;
    transoffsetX = 0;
    transoffsetY = 0;
    zoomLevel = 1;
    image.style.transformOrigin = `${transformOriginX}% ${transformOriginY}%`;
    image.style.transform = `scale(${zoomLevel}) translate(${transoffsetX}%, ${transoffsetY}%)`;
    redrawBoundingBoxes();

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
    }
});

// auto load the first image
document.getElementById("next").click();