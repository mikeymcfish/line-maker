import { ChevronLeft, ChevronRight, Eraser, Download, CheckCircle, Minus, Edit3, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface ToolbarProps {
  selectedImageIndex: number;
  totalImages: number;
  brushSize: number;
  saveStatus: string;
  isStraightLine?: boolean;
  drawingColor?: string;
  drawingTool?: "pen" | "circle";
  onBrushSizeChange: (size: number) => void;
  onNextImage: () => void;
  onPrevImage: () => void;
  onSaveAnnotation: () => void;
  onClearCanvas: () => void;
  onToggleStraightLine?: () => void;
  onColorChange?: (color: string) => void;
  onToolChange?: (tool: "pen" | "circle") => void;
}

export default function Toolbar({
  selectedImageIndex,
  totalImages,
  brushSize,
  saveStatus,
  isStraightLine = false,
  drawingColor = "#000000",
  drawingTool = "pen",
  onBrushSizeChange,
  onNextImage,
  onPrevImage,
  onSaveAnnotation,
  onClearCanvas,
  onToggleStraightLine,
  onColorChange,
  onToolChange,
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

            {/* Color Selection */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Color:</span>
              <div className="flex space-x-1">
                <Button
                  variant={drawingColor === "#000000" ? "default" : "outline"}
                  size="sm"
                  onClick={() => onColorChange?.("#000000")}
                  className="w-8 h-8 p-0"
                  style={{ backgroundColor: drawingColor === "#000000" ? "#000000" : "transparent" }}
                  title="Black (X key)"
                >
                  <div className="w-4 h-4 bg-black rounded"></div>
                </Button>
                <Button
                  variant={drawingColor === "#FF0000" ? "default" : "outline"}
                  size="sm"
                  onClick={() => onColorChange?.("#FF0000")}
                  className="w-8 h-8 p-0"
                  title="Red (X key)"
                >
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                </Button>
                <Button
                  variant={drawingColor === "#0000FF" ? "default" : "outline"}
                  size="sm"
                  onClick={() => onColorChange?.("#0000FF")}
                  className="w-8 h-8 p-0"
                  title="Blue (X key)"
                >
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                </Button>
              </div>
            </div>

            {/* Tool Selection */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Tool:</span>
              <div className="flex space-x-1">
                <Button
                  variant={drawingTool === "pen" ? "default" : "outline"}
                  size="sm"
                  onClick={() => onToolChange?.("pen")}
                  title="Pen Tool (S key)"
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={drawingTool === "circle" ? "default" : "outline"}
                  size="sm"
                  onClick={() => onToolChange?.("circle")}
                  title="Circle Tool (S key)"
                >
                  <Circle className="w-4 h-4" />
                </Button>
              </div>
            </div>

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
