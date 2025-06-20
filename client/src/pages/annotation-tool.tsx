import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import ImageSidebar from "@/components/image-sidebar";
import DrawingCanvas from "@/components/drawing-canvas";
import Toolbar from "@/components/toolbar";
import type { Image } from "@shared/schema";

export default function AnnotationTool() {
  const [images, setImages] = useState<Image[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [brushSize, setBrushSize] = useState<number>(3);
  const [saveStatus, setSaveStatus] = useState<string>("Ready");

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
          onBrushSizeChange={setBrushSize}
          onNextImage={handleNextImage}
          onPrevImage={handlePrevImage}
          onSaveAnnotation={() => {}}
          onClearCanvas={() => {}}
        />
        
        <div className="flex-1 p-4 overflow-hidden">
          <div className="h-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden relative">
            <DrawingCanvas
              selectedImage={selectedImage}
              brushSize={brushSize}
              onSaveStatusChange={setSaveStatus}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
