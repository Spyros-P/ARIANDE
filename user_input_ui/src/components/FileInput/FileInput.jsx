import React from "react";
import { FileInput, Label } from "flowbite-react";

export function FileInputComponent({
  onChangeMethod,
  setFileType,
  customMessage,
  errorMessage,
  ...styleArgs
}) {
  console.log(styleArgs);
  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.style.backgroundColor = "#e5e7eb";
  };

  const handleDragLeave = (e) => {
    e.currentTarget.style.backgroundColor = "#f9fafb";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.style.backgroundColor = "#f9fafb";

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setFileType(files[0].type.split("/")[1]);
      onChangeMethod({ target: { files } });
    }
  };

  return (
    <div
      style={{
        display: "flex",
        width: "80%",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Label
        htmlFor="dropzone-file"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "16rem",
          width: "100%",
          cursor: "pointer",
          borderRadius: "0.5rem",
          border: "2px dashed",
          borderColor: "#d1d5db",
          backgroundColor: "#f9fafb",
          transition: "background-color 0.3s, border-color 0.3s",
          ...styleArgs.style,
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        // onMouseEnter={(e) => {
        //   e.currentTarget.style.backgroundColor = "#f3f4f6";
        // }}
        // onMouseLeave={(e) => {
        //   e.currentTarget.style.backgroundColor = "#f9fafb";
        // }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            paddingBottom: "1.5rem",
            paddingTop: "1.25rem",
          }}
        >
          <svg
            style={{
              marginBottom: "1rem",
              height: "2rem",
              width: "2rem",
              color: "#6b7280",
            }}
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 20 16"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
            />
          </svg>
          <p
            style={{
              marginBottom: "0.5rem",
              fontSize: "0.875rem",
              color: "#6b7280",
            }}
          >
            <span style={{ fontWeight: "600" }}>
              {customMessage || "Click to upload"}
            </span>{" "}
            or drag and drop
          </p>
          <p style={{ fontSize: "0.75rem", color: "#6b7280" }}>
            PNG, JPG, or JPEG
          </p>{" "}
          {errorMessage && (
            <p style={{ fontSize: "1rem", color: "rgb(192, 60, 60)" }}>
              {errorMessage}
            </p>
          )}
        </div>
        <FileInput
          id="dropzone-file"
          style={{ display: "none" }}
          onChange={onChangeMethod}
        />
      </Label>
    </div>
  );
}

export default FileInputComponent;
