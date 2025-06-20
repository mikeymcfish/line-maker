import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import ImageSidebar from "@/components/image-sidebar";
import DrawingCanvas from "@/components/drawing-canvas";
import Toolbar from "@/components/toolbar";
import type { Image } from "@shared/schema";

export default function AnnotationTool() {
  const [images, setImages] = useState<Image[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [brushSize, setBrushSize] = useState<number>(10);
  const [saveStatus, setSaveStatus] = useState<string>("Ready");
  const [isStraightLine, setIsStraightLine] = useState<boolean>(false);
  const [drawingColor, setDrawingColor] = useState<string>("#000000"); // black, red, blue
  const [drawingTool, setDrawingTool] = useState<"pen" | "circle">("pen");

  const { data: imagesData, refetch: refetchImages } = useQuery({
    queryKey: ["/api/images"],
    enabled: false, // Only fetch when we have uploaded images
  });

  useEffect(() => {
    if (imagesData?.images) {
      setImages(imagesData.images);
      if (imagesData.images.length > 0 && selectedImageIndex >= imagesData.images.length) {
        setSelectedImageIndex(0);
      }
    }
  }, [imagesData, selectedImageIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle keys when not typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      // Prevent default behavior for our handled keys
      if (e.key.toLowerCase() === 'x') {
        e.preventDefault();
        // Cycle through colors: black -> red -> blue -> black
        setDrawingColor(prev => {
          switch (prev) {
            case "#000000": return "#FF0000"; // black to red
            case "#FF0000": return "#0000FF"; // red to blue
            case "#0000FF": return "#000000"; // blue to black
            default: return "#000000";
          }
        });
      } else if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        // Cycle through tools: pen -> circle -> pen
        setDrawingTool(prev => prev === "pen" ? "circle" : "pen");
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const selectedImage = images[selectedImageIndex];

  const handleImagesUploaded = (uploadedImages: Image[]) => {
    setImages(uploadedImages);
    setSelectedImageIndex(0);
    refetchImages();
  };

  const handleNextImage = () => {
    if (selectedImageIndex < images.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  const handlePrevImage = () => {
    if (selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  const handleSelectImage = (index: number) => {
    setSelectedImageIndex(index);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      <ImageSidebar
        images={images}
        selectedImageIndex={selectedImageIndex}
        onImagesUploaded={handleImagesUploaded}
        onSelectImage={handleSelectImage}
      />
      
      <div className="flex-1 flex flex-col">
        <Toolbar
          selectedImageIndex={selectedImageIndex}
          totalImages={images.length}
          brushSize={brushSize}
          saveStatus={saveStatus}
          isStraightLine={isStraightLine}
          drawingColor={drawingColor}
          drawingTool={drawingTool}
          onBrushSizeChange={setBrushSize}
          onNextImage={handleNextImage}
          onPrevImage={handlePrevImage}
          onToggleStraightLine={() => setIsStraightLine(!isStraightLine)}
          onColorChange={setDrawingColor}
          onToolChange={setDrawingTool}
          onSaveAnnotation={() => {
            if ((window as any).saveAnnotation) {
              (window as any).saveAnnotation();
            }
          }}
          onClearCanvas={() => {
            if ((window as any).clearCanvas) {
              (window as any).clearCanvas();
            }
          }}
        />
        
        <div className="flex-1 p-4 overflow-hidden">
          <div className="h-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden relative">
            <DrawingCanvas
              selectedImage={selectedImage}
              brushSize={brushSize}
              isStraightLine={isStraightLine}
              drawingColor={drawingColor}
              drawingTool={drawingTool}
              onSaveStatusChange={setSaveStatus}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
