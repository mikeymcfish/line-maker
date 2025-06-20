import { useRef, useEffect, useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCanvasDrawing } from "@/hooks/use-canvas-drawing";
import { ZoomIn, ZoomOut, Maximize2, Image as ImageIcon } from "lucide-react";
import type { Image } from "@shared/schema";

interface DrawingCanvasProps {
  selectedImage: Image | undefined;
  brushSize: number;
  onSaveStatusChange: (status: string) => void;
}

export default function DrawingCanvas({
  selectedImage,
  brushSize,
  onSaveStatusChange,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundImageRef = useRef<HTMLImageElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 800 });
  const [zoom, setZoom] = useState(1);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  const {
    isDrawing,
    startDrawing,
    continueDrawing,
    stopDrawing,
    clearCanvas,
    getCanvasDataURL,
    toggleStraightLine,
    isStraightLine,
  } = useCanvasDrawing(canvasRef, brushSize);

  const saveMutation = useMutation({
    mutationFn: async ({ imageId, filename, canvasData }: {
      imageId: number;
      filename: string;
      canvasData: string;
    }) => {
      const response = await apiRequest('POST', '/api/annotations', {
        imageId,
        filename,
        canvasData,
      });
      return response.json();
    },
    onSuccess: () => {
      onSaveStatusChange("Saved");
      toast({
        title: "Annotation saved",
        description: "Drawing saved to net folder",
      });
    },
    onError: (error) => {
      onSaveStatusChange("Error");
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Load background image when selected image changes
  useEffect(() => {
    if (selectedImage && backgroundImageRef.current) {
      const img = backgroundImageRef.current;
      img.onload = () => {
        setCanvasSize({ width: img.naturalWidth, height: img.naturalHeight });
        if (canvasRef.current) {
          canvasRef.current.width = img.naturalWidth;
          canvasRef.current.height = img.naturalHeight;
        }
      };
      img.src = `/api/images/${selectedImage.filename}`;
      
      // Clear canvas when image changes
      clearCanvas();
      onSaveStatusChange("Ready");
    }
  }, [selectedImage, clearCanvas, onSaveStatusChange]);

  const handleSaveAnnotation = useCallback(() => {
    if (!selectedImage) return;
    
    const canvasData = getCanvasDataURL();
    if (!canvasData) return;
    
    onSaveStatusChange("Saving...");
    saveMutation.mutate({
      imageId: selectedImage.id,
      filename: selectedImage.filename,
      canvasData,
    });
  }, [selectedImage, getCanvasDataURL, onSaveStatusChange, saveMutation]);

  const handleClearCanvas = useCallback(() => {
    clearCanvas();
    onSaveStatusChange("Ready");
  }, [clearCanvas, onSaveStatusChange]);

  // Auto-save functionality - only when there are actual changes
  useEffect(() => {
    if (!isDrawing && selectedImage && hasChanges) {
      const timer = setTimeout(() => {
        handleSaveAnnotation();
        setHasChanges(false);
      }, 2000); // Auto-save 2 seconds after drawing stops
      
      return () => clearTimeout(timer);
    }
  }, [isDrawing, selectedImage, hasChanges, handleSaveAnnotation]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.25));
  };

  const handleResetZoom = () => {
    setZoom(1);
  };

  // Expose save and clear functions to parent
  useEffect(() => {
    (window as any).saveAnnotation = handleSaveAnnotation;
    (window as any).clearCanvas = handleClearCanvas;
    
    return () => {
      delete (window as any).saveAnnotation;
      delete (window as any).clearCanvas;
    };
  }, [handleSaveAnnotation, handleClearCanvas]);

  if (!selectedImage) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <ImageIcon className="w-16 h-16 mx-auto mb-4" />
          <p className="text-lg font-medium">No Image Selected</p>
          <p className="text-sm">Choose an image from the sidebar to start annotating</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="relative"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'center',
        }}
      >
        <img
          ref={backgroundImageRef}
          src={`/api/images/${selectedImage.filename}`}
          alt={selectedImage.filename}
          className="max-w-full max-h-full object-contain"
          style={{ maxWidth: '90vw', maxHeight: '90vh' }}
        />

        {/* Drawing Canvas Overlay */}
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="absolute inset-0 cursor-crosshair"
          style={{ 
            touchAction: 'none',
            maxWidth: '90vw',
            maxHeight: '90vh',
          }}
          onMouseDown={startDrawing}
          onMouseMove={continueDrawing}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={(e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
              clientX: touch.clientX,
              clientY: touch.clientY,
            });
            startDrawing(mouseEvent as any);
          }}
          onTouchMove={(e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
              clientX: touch.clientX,
              clientY: touch.clientY,
            });
            continueDrawing(mouseEvent as any);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            stopDrawing();
          }}
        />
      </div>

      {/* Canvas Info Overlay */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-sm">
        <span>{canvasSize.width} × {canvasSize.height}px</span>
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
        <button
          onClick={handleZoomIn}
          className="w-10 h-10 bg-white border border-gray-300 rounded-lg shadow-sm flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-10 h-10 bg-white border border-gray-300 rounded-lg shadow-sm flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetZoom}
          className="w-10 h-10 bg-white border border-gray-300 rounded-lg shadow-sm flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
