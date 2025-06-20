import { ChevronLeft, ChevronRight, Eraser, Download, CheckCircle, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface ToolbarProps {
  selectedImageIndex: number;
  totalImages: number;
  brushSize: number;
  saveStatus: string;
  isStraightLine?: boolean;
  onBrushSizeChange: (size: number) => void;
  onNextImage: () => void;
  onPrevImage: () => void;
  onSaveAnnotation: () => void;
  onClearCanvas: () => void;
  onToggleStraightLine?: () => void;
}

export default function Toolbar({
  selectedImageIndex,
  totalImages,
  brushSize,
  saveStatus,
  isStraightLine = false,
  onBrushSizeChange,
  onNextImage,
  onPrevImage,
  onSaveAnnotation,
  onClearCanvas,
  onToggleStraightLine,
}: ToolbarProps) {
  const handleSave = () => {
    if ((window as any).saveAnnotation) {
      (window as any).saveAnnotation();
    } else {
      onSaveAnnotation();
    }
  };

  const handleClear = () => {
    if ((window as any).clearCanvas) {
      (window as any).clearCanvas();
    } else {
      onClearCanvas();
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Navigation Controls */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onPrevImage}
              disabled={selectedImageIndex === 0}
              className="w-8 h-8 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-600 min-w-0">
              {totalImages > 0 ? `${selectedImageIndex + 1} of ${totalImages}` : '0 of 0'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onNextImage}
              disabled={selectedImageIndex >= totalImages - 1}
              className="w-8 h-8 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="h-6 w-px bg-gray-300"></div>

          {/* Drawing Tools */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Brush Size:</label>
              <div className="w-20">
                <Slider
                  value={[brushSize]}
                  onValueChange={(value) => onBrushSizeChange(value[0])}
                  max={20}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>
              <span className="text-sm text-gray-600 min-w-0">{brushSize}px</span>
            </div>

            <Button
              variant={isStraightLine ? "default" : "outline"}
              size="sm"
              onClick={onToggleStraightLine}
              className="flex items-center"
              title="Hold Shift or click to draw straight lines"
            >
              <Minus className="w-4 h-4 mr-2" />
              {isStraightLine ? "Straight" : "Freehand"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="flex items-center"
            >
              <Eraser className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Save Status Indicator */}
          <div className="flex items-center text-sm text-green-600">
            <CheckCircle className="w-4 h-4 mr-2" />
            <span>{saveStatus}</span>
          </div>

          {/* Manual Save Button */}
          <Button
            onClick={handleSave}
            size="sm"
            className="flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Save PNG
          </Button>
        </div>
      </div>
    </div>
  );
}
