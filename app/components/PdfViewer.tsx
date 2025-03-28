"use client";

import { useState, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Worker, Viewer, SpecialZoomLevel } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function PdfViewer() {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [highlightColor, setHighlightColor] = useState<string>("#FFFF00");
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [underlinedText, setUnderlinedText] = useState<string | null>(null); // New state for underlining
  const [comments, setComments] = useState<{ text: string; comment: string }[]>([]);
  const [selectedComment, setSelectedComment] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState<boolean>(false); // New state for signing mode
  const [signatureImage, setSignatureImage] = useState<string | null>(null); // New state for signature image
  const [signaturePosition, setSignaturePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 }); // Track the signature's starting position
  const pdfContainerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<any>(null);

  // Missing handleMouseDown function
  const handleMouseDown = (event: MouseEvent) => {
    console.log("Mouse down event detected:", event);
  };

  // File upload handler
  const onDrop = (acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    if (uploadedFile.type === "application/pdf") {
      const url = URL.createObjectURL(uploadedFile);
      setFileUrl(url);
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  // Detect text selection and store the text
  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const text = range.toString().trim();
      console.log("Selected text:", text);
      if (text.length > 0) {
        setSelectedText(text);
        setUnderlinedText(text);
      }
    }
  };

  // Function to highlight selected text (single word & multi-line fix)
  const handleHighlight = () => {
    if (!selectedText) return;

    console.log("Selected text for highlighting:", selectedText);

    const pdfContainer = pdfContainerRef.current;
    if (!pdfContainer) return;

    const textLayerElements = pdfContainer.querySelectorAll(".rpv-core__text-layer span");
    let foundMatch = false;

    textLayerElements.forEach((span) => {
      if (span.textContent) {
        const regex = new RegExp(`\\b${selectedText}\\b`, "i"); // Word boundary match
        if (regex.test(span.textContent.trim())) {
          foundMatch = true;
          span.style.backgroundColor = highlightColor;
          span.style.cursor = "pointer";
          span.onclick = () => {
            const matchingComment = comments.find(c => c.text === selectedText);
            if (matchingComment) {
              setSelectedComment(matchingComment.comment);
            } else {
              setSelectedComment("No comment available.");
            }
          };

          span.querySelectorAll(".tooltip").forEach(el => el.remove());
        }
      }
    });

    if (foundMatch) {
      const userComment = prompt("Add a comment for this highlight (optional):");
      if (userComment) {
        console.log("Adding comment:", userComment);
        setComments(prevComments => [...prevComments, { text: selectedText, comment: userComment }]);
        setSelectedComment(userComment); // Update sidebar with the new comment
      }
    }

    setSelectedText(null);
    window.getSelection()?.removeAllRanges();
  };

  // Function to apply underlining
  const handleUnderline = () => {
    if (!underlinedText) return;

    const pdfContainer = pdfContainerRef.current;
    if (!pdfContainer) return;

    const textLayerElements = pdfContainer.querySelectorAll(".rpv-core__text-layer span");

    textLayerElements.forEach((span) => {
      if (span.textContent) {
        const regex = new RegExp(`\\b${underlinedText}\\b`, "i");
        if (regex.test(span.textContent.trim())) {
          span.style.textDecoration = "underline";
          span.style.textDecorationColor = highlightColor; // Match color selection
          span.style.textDecorationThickness = "2px"; // Ensure visibility
        }
      }
    });

    // Clear selection after underlining
    setUnderlinedText(null);
    window.getSelection()?.removeAllRanges();
  };

  // Function to initialize canvas for signing
  const initializeCanvas = () => {
    if (!pdfContainerRef.current) return;

    const existingCanvas = pdfContainerRef.current.querySelector("canvas.signing-canvas");
    if (existingCanvas) return; // Prevent duplicate canvas creation

    const canvas = document.createElement("canvas");
    const rect = pdfContainerRef.current.getBoundingClientRect();

    canvas.width = rect.width;
    canvas.height = rect.height;
    canvas.classList.add("signing-canvas");
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.zIndex = "10"; // Ensure it's above the PDF
    canvas.style.backgroundColor = "transparent";

    pdfContainerRef.current.appendChild(canvas);
    setupDrawingEvents(canvas);
  };

  // Function to enable drawing on canvas
  const setupDrawingEvents = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    let drawing = false;

    const startDrawing = (event: MouseEvent) => {
      drawing = true;
      ctx.beginPath();

      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      setSignaturePosition({ x, y }); // Store position in state
      ctx.moveTo(x, y);
    };

    const draw = (event: MouseEvent) => {
      if (!drawing) return;
      ctx.lineTo(event.offsetX, event.offsetY);
      ctx.stroke();
    };

    const stopDrawing = () => {
      drawing = false;
    };

    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseleave", stopDrawing);
  };

  // Function to export annotated PDF
  const exportPDF = () => {
    const docElement = pdfContainerRef.current; // Ensure this ID exists
    if (!docElement) {
      console.error("Document container not found!");
      return;
    }

    html2canvas(docElement).then(canvas => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      pdf.addImage(imgData, "PNG", 10, 10, 190, 277);
      pdf.save("annotated-document.pdf");
    }).catch(error => console.error("Error capturing document:", error));
  };

  // Drag-and-drop setup
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
  });

  useEffect(() => {
    const container = pdfContainerRef.current;
    if (container) {
      container.addEventListener("mousedown", handleMouseDown as any);
    }
    return () => {
      if (container) {
        container.removeEventListener("mousedown", handleMouseDown as any);
      }
    };
  }, [isSigning]);

  // Effect to initialize canvas when signing mode is enabled
  useEffect(() => {
    if (isSigning) {
      initializeCanvas();
    } else {
      const canvas = pdfContainerRef.current?.querySelector("canvas.signing-canvas");
      if (canvas) {
        const imageData = canvas.toDataURL("image/png");
        setSignatureImage(imageData); // Store the image in state

        // Create an image element and overlay it on the PDF
        const img = document.createElement("img");
        img.src = imageData;
        img.style.position = "absolute";

        img.style.top = `${signaturePosition.y}px`;
        img.style.left = `${signaturePosition.x}px`;

        img.style.width = "150px"; // Adjust if necessary
        img.style.zIndex = "10"; 

        pdfContainerRef.current?.appendChild(img);
        
        // Remove the canvas after saving the signature
        pdfContainerRef.current?.removeChild(canvas);
      }
    }
  }, [isSigning, signaturePosition]);

  useEffect(() => {
    console.log("Current comments:", comments);
  }, [comments]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">PDF Document Signer</h1>

      {/* Drag-and-Drop Upload */}
      <div
        {...getRootProps()}
        className={`border-2 p-6 rounded-lg w-96 text-center bg-white cursor-pointer transition-all duration-300 ${
          isDragActive ? "border-blue-500 bg-blue-100" : "border-gray-400"
        }`}
      >
        <input {...getInputProps()} />
        <p className="font-medium text-gray-700">
          {isDragActive ? "Drop the PDF here..." : "Drag & drop a PDF here, or click to select one"}
        </p>
      </div>

      {/* Show Toolbar & Viewer Only After Upload */}
      {fileUrl && (
        <>
          {/* Toolbar with Color Selector & Highlight, Underline, and Sign Buttons */}
          <div className="flex items-center space-x-4 bg-white p-3 shadow-md rounded-lg my-4">
            <label className="flex items-center space-x-2">
              <span className="text-gray-700 font-medium">Color:</span>
              <input
                type="color"
                value={highlightColor}
                onChange={(e) => setHighlightColor(e.target.value)}
                className="w-10 h-10 border rounded"
              />
            </label>

            <button
              className="px-4 py-2 bg-blue-500 text-white rounded shadow"
              onClick={handleHighlight}
              disabled={!selectedText}
            >
              Highlight
            </button>

            <button
              className="px-4 py-2 bg-green-500 text-white rounded shadow"
              onClick={handleUnderline}
              disabled={!underlinedText}
            >
              Underline
            </button>

            <button
              className={`px-4 py-2 rounded shadow ${isSigning ? "bg-red-500" : "bg-yellow-500"} text-white`}
              onClick={() => setIsSigning(!isSigning)}
            >
              {isSigning ? "Stop Signing" : "Sign"}
            </button>

            <button
              className="px-4 py-2 bg-purple-500 text-white rounded shadow"
              onClick={exportPDF}
            >
              Export PDF
            </button>
          </div>

          {/* Centered PDF Viewer and Sidebar */}
          <div className="flex justify-center w-full max-w-5xl">
            {/* PDF Viewer */}
            <div
              ref={pdfContainerRef}
              className="flex-1 max-w-2xl h-[600px] overflow-auto border bg-white shadow-lg relative"
              onMouseUp={handleMouseUp} // Detect selection on mouse up
            >
              <Worker workerUrl={`https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`}>
                <Viewer fileUrl={fileUrl} defaultScale={SpecialZoomLevel.PageFit} ref={viewerRef} />
              </Worker>
              {signatureImage && (
                <div
                  style={{
                    position: 'absolute',
                    top: `${signaturePosition.y}px`,
                    left: `${signaturePosition.x}px`,
                    width: '150px',
                    height: '50px',
                  }}
                >
                  <img
                    src={signatureImage}
                    alt="Signature"
                    style={{ width: '100%', height: '100%' }} // Adjust as needed
                  />
                </div>
              )}
            </div>

            {/* Sidebar for Comments */}
            <div className="w-1/4 flex-shrink-0 h-[600px] overflow-auto border-l bg-gray-50 p-4">
              <h2 className="text-lg font-semibold mb-2">Comments</h2>
              <ul>
                {comments.map((comment, index) => (
                  <li key={index} className="mb-2">
                    <strong>{comment.text}:</strong> {comment.comment}
                  </li>
                ))}
              </ul>
              {selectedComment && (
                <div className="mt-4 p-2 border rounded bg-white">
                  <h3 className="font-semibold">Selected Comment:</h3>
                  <p>{selectedComment}</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}