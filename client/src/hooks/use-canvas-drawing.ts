import { useCallback, useRef, useState, useEffect } from "react";

export function useCanvasDrawing(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  brushSize: number,
  isStraightLine: boolean = false,
  drawingColor: string = "#000000",
  drawingTool: "pen" | "circle" = "pen"
) {
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const imageDataRef = useRef<ImageData | null>(null);

  // Update brush size when it changes
  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.lineWidth = brushSize;
      }
    }
  }, [brushSize, canvasRef]);

  // Initialize canvas properties
  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = drawingColor;
        ctx.fillStyle = drawingColor;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = brushSize;
        // Ensure we're drawing on a transparent background
        ctx.globalCompositeOperation = 'source-over';
      }
    }
  }, [canvasRef, brushSize, drawingColor]);

  const getMousePos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, [canvasRef]);

  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    setIsDrawing(true);
    const pos = getMousePos(e);
    lastPointRef.current = pos;
    startPointRef.current = pos;
    
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      // Save the current canvas state for straight line drawing
      imageDataRef.current = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
  }, [canvasRef, getMousePos]);

  const continueDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current || !startPointRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    const currentPos = getMousePos(e);
    const currentIsStraightLine = isStraightLine || e.shiftKey;
    
    if (drawingTool === "circle") {
      // Circle drawing tool
      if (imageDataRef.current) {
        ctx.putImageData(imageDataRef.current, 0, 0);
      }
      
      const radius = Math.sqrt(
        Math.pow(currentPos.x - startPointRef.current.x, 2) + 
        Math.pow(currentPos.y - startPointRef.current.y, 2)
      );
      
      ctx.beginPath();
      ctx.arc(startPointRef.current.x, startPointRef.current.y, radius, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (currentIsStraightLine) {
      // For straight lines, clear and redraw from start to current position
      if (imageDataRef.current) {
        ctx.putImageData(imageDataRef.current, 0, 0);
      }
      ctx.beginPath();
      ctx.moveTo(startPointRef.current.x, startPointRef.current.y);
      ctx.lineTo(currentPos.x, currentPos.y);
      ctx.stroke();
    } else {
      // Normal freehand drawing
      if (lastPointRef.current) {
        ctx.lineTo(currentPos.x, currentPos.y);
        ctx.stroke();
      }
      lastPointRef.current = currentPos;
    }
  }, [isDrawing, canvasRef, getMousePos, isStraightLine, drawingTool]);

  const stopDrawing = useCallback(() => {
    if (isDrawing) {
      // Mark that changes have been made when drawing stops
      (window as any).markCanvasChanged?.();
    }
    setIsDrawing(false);
    lastPointRef.current = null;
  }, [isDrawing]);

  const clearCanvas = useCallback(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  }, [canvasRef]);

  const getCanvasDataURL = useCallback(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      
      // Create a new canvas with white background
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      
      if (tempCtx) {
        // Fill with white background
        tempCtx.fillStyle = '#FFFFFF';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        // Draw the original canvas on top
        tempCtx.drawImage(canvas, 0, 0);
        
        return tempCanvas.toDataURL('image/png');
      }
    }
    return null;
  }, [canvasRef]);

  return {
    isDrawing,
    startDrawing,
    continueDrawing,
    stopDrawing,
    clearCanvas,
    getCanvasDataURL,
  };
}
