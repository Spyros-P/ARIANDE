import React, { useEffect, useState, useRef } from "react";

const AnnotateImage = () => {
    const labelOptions = ["door", "wall"];

    const [imageData, setImageData] = useState(null);
    const [bboxes, setBboxes] = useState([]);
    const [drawing, setDrawing] = useState(false);
    const [startCoords, setStartCoords] = useState({ x: 0, y: 0 });
    const [currentBox, setCurrentBox] = useState(null);
    const canvasRef = useRef(null);
    const imgRef = useRef(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedBbox, setSelectedBbox] = useState(null);

    const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
    const [newLabel, setNewLabel] = useState("door");

    useEffect(() => {
        fetch("/image_data.json")
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Network response was not ok " + response.statusText);
                }
                return response.json();
            })
            .then((data) => {
                setImageData(data);
                setBboxes(data.bboxes);
            })
            .catch((error) => console.error("Error fetching JSON:", error));
    }, []);

    // Function to draw the image and bounding boxes
    const drawCanvas = (ctx, img) => {
        if (ctx && img) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.drawImage(img, 0, 0, ctx.canvas.width, ctx.canvas.height);
    
            // Draw existing bounding boxes and their indices
            bboxes.forEach((bbox, index) => {
                ctx.strokeStyle = "red";
                ctx.strokeRect(bbox.x, bbox.y, bbox.width, bbox.height);
    
                // Calculate position for the text
                const textX = bbox.x + 5;
                let textY = bbox.y - 5; // Try to position above by default
    
                // If positioning above would be outside the canvas, position below
                if (textY < 0) {
                    textY = bbox.y + bbox.height + 15; // Adjust to be below the box
                }
    
                ctx.fillStyle = "red"; // Text color
                ctx.font = "16px Arial"; // Font size and family
                ctx.fillText(index + 1, textX, textY); // Draw the index at the calculated position
            });
    
            // Draw the current box being created
            if (currentBox) {
                ctx.strokeStyle = "blue"; // Different color for the current box
                ctx.strokeRect(currentBox.x, currentBox.y, currentBox.width, currentBox.height);
            }
        }
    };
    

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        const img = imgRef.current;
    
        if (img) {
            img.onload = () => {
                // Set canvas dimensions to match image
                canvas.width = img.naturalWidth; // Use naturalWidth
                canvas.height = img.naturalHeight; // Use naturalHeight
                drawCanvas(ctx, img); // Draw the image and boxes after loading
            };
    
            // Redraw if image is already loaded
            if (img.complete) {
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                drawCanvas(ctx, img);
            }
        }
    }, [imageData, bboxes, currentBox]);

    const handleMouseDown = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        setStartCoords({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        setDrawing(true);
    };

    const handleMouseMove = (e) => {
        if (!drawing) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Calculate width and height
        const width = x - startCoords.x;
        const height = y - startCoords.y;

        setCurrentBox({ x: startCoords.x, y: startCoords.y, width, height, id: (Date.now()-Math.floor(Math.random() * 10000)), source: "user" });
    };

    const handleMouseUp = () => {
        if (drawing && currentBox) {
            openLabelModal(currentBox);
            setDrawing(false);
        }
    };

    const handleContextMenu = (e) => {
        e.preventDefault();
        setDrawing(false);
        setCurrentBox(null);
    };

    const openDeleteModal = (bbox) => {
        setSelectedBbox(bbox);
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setSelectedBbox(null);
    };

    const openLabelModal = (bbox) => {
        setIsLabelModalOpen(true);
        setSelectedBbox(bbox);
    };

    const closeLabelModal = () => {
        setIsLabelModalOpen(false);
        setSelectedBbox(null);
    };

    const confirmDelete = () => {
        setBboxes(bboxes.filter(bbox => bbox.id !== selectedBbox.id));
        closeDeleteModal();
    };

    const confirmLabel = () => {

        const newBbox = {
                ...currentBox,
                label: newLabel
            };

            setBboxes(prevBboxes => [
                ...prevBboxes,
                newBbox
            ]);
        // setBboxes((prevBboxes) => 
        //     prevBboxes.map((bbox) => 
        //         bbox.id === currentBox.id 
        //             ? { ...bbox, label: newLabel }
        //             : bbox
        //     )
        // );
        setCurrentBox(null);
        closeLabelModal();
    };

    if (!imageData) return <div>Loading...</div>;

    return (
            <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
            }}>
            <div style={{ position: "relative", display: "inline-block", paddingRight: "20px" }}>
                <canvas
                    ref={canvasRef}
                    style={{ border: "1px solid black", cursor: "crosshair" }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onContextMenu={handleContextMenu}
                />
                <img
                    ref={imgRef}
                    src={`data:image/jpeg;base64,${imageData.image_base64}`}
                    alt="Annotated"
                    style={{ display: "none" }} 
                />
            </div>

            <div style ={{
                 display: "flex",
                 justifyContent: "space-between"}}>

            <div style={{
                paddingLeft: "50px",
                backgroundColor: "#f8f9fa",
                padding: "20px",
                borderRadius: "8px",
                boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
                border: "1px solid blue",
                width: "300px", 
                maxHeight: "100vh", 
                overflowY: "auto",
                marginLeft: "auto", 
                marginRight: "auto" 
            }}>
                <h2 style={{ color: "#343a40", fontWeight: "600" }}>Model's Bounding Boxes:</h2>
                {bboxes
                    .filter((bbox) => bbox.source === "model")
                    .map((bbox) => {
                        const consistentIndex = bboxes.findIndex(item => item === bbox); 
                        return (
                            <div key={consistentIndex} style={{
                                backgroundColor: "#ffffff",
                                padding: "15px",
                                marginBottom: "10px",
                                borderRadius: "8px",
                                boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.1)"
                            }}>
                                <h3 style={{ margin: "0 0 5px", color: "#495057" }}>Object #{consistentIndex + 1} : {bbox.label}</h3>
                                <h4 style={{ margin: "0 0 10px", color: "#6c757d" }}>Width: {bbox.width}</h4>
                                <h4 style={{ margin: "0 0 10px", color: "#6c757d" }}>Height: {bbox.height}</h4>
                                <h4 style={{ margin: "0 0 10px", color: "#6c757d" }}>Start Coordinates: ({bbox.x.toFixed(1)}, {bbox.y.toFixed(1)})</h4>
                                <button onClick={() => openDeleteModal(bbox)} style={{
                                    backgroundColor: "#f8d7da",
                                    color: "#721c24",
                                    padding: "8px 12px",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    fontWeight: "500",
                                    transition: "background-color 0.3s",
                                }}>
                                    Delete
                                </button>
                            </div>
                        );
                    })}
            </div>

            <div style={{
                paddingLeft: "50px",
                backgroundColor: "#f8f9fa",
                padding: "20px",
                borderRadius: "8px",
                boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
                border: "1px solid blue",
                width: "300px", 
                maxHeight: "100vh",
                overflowY: "auto",
                marginLeft: "auto",
                marginRight: "auto"
            }}>
                <h2 style={{ color: "#343a40", fontWeight: "600" }}>Your Bounding Boxes:</h2>
                {bboxes
                    .filter((bbox) => bbox.source === "user")
                    .map((bbox) => {
                        const consistentIndex = bboxes.findIndex(item => item === bbox);
                        return (
                            <div key={consistentIndex} style={{
                                backgroundColor: "#ffffff",
                                padding: "15px",
                                marginBottom: "10px",
                                borderRadius: "8px",
                                boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.1)"
                            }}>
                                <h3 style={{ margin: "0 0 5px", color: "#495057" }}>Object #{consistentIndex + 1} : {bbox.label}</h3>
                                <h4 style={{ margin: "0 0 10px", color: "#6c757d" }}>Width: {bbox.width}</h4>
                                <h4 style={{ margin: "0 0 10px", color: "#6c757d" }}>Height: {bbox.height}</h4>
                                <h4 style={{ margin: "0 0 10px", color: "#6c757d" }}>Start Coordinates: ({bbox.x.toFixed(1)}, {bbox.y.toFixed(1)})</h4>
                                <button onClick={() => openDeleteModal(bbox)} style={{
                                    backgroundColor: "#f8d7da",
                                    color: "#721c24",
                                    padding: "8px 12px",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    fontWeight: "500",
                                    transition: "background-color 0.3s",
                                }}>
                                    Delete
                                </button>
                            </div>
                        );
                    })}
            </div>

        </div>



              {/* Modal */}
            {isDeleteModalOpen && (
                <div className="modal-overlay" onClick={closeDeleteModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="close-btn" onClick={closeDeleteModal}>&times;</button>
                        <h3>Confirm Deletion</h3>
                        <p>Are you sure you want to delete this annotation?</p>
                        <button style={{backgroundColor: "red"}} onClick={confirmDelete}>Delete</button>
                        <button onClick={closeDeleteModal}>Cancel</button>
                    </div>
                </div>
            )}

           {/* Modal */}
            {isLabelModalOpen && (
                <div className="modal-overlay" onClick={() => { }}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3 className="modal-title">Choose a label for your annotation:</h3>
                        <div className="select-dropdown">
                            <select 
                                value={newLabel} 
                                onChange={(e) => setNewLabel(e.target.value)}
                            >
                                {labelOptions.map((label) => (
                                    <option key={label} value={label}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="modal-actions">
                            <button className="confirm-button" onClick={confirmLabel}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AnnotateImage;
