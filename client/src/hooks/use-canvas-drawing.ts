import { useCallback, useRef, useState, useEffect } from "react";

export function useCanvasDrawing(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  brushSize: number
) {
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

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
        ctx.strokeStyle = '#000000'; // Black lines only
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = brushSize;
        // Ensure we're drawing on a transparent background
        ctx.globalCompositeOperation = 'source-over';
      }
    }
  }, [canvasRef, brushSize]);

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
    
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
  }, [canvasRef, getMousePos]);

  const continueDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current || !lastPointRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    const currentPos = getMousePos(e);
    
    ctx.lineTo(currentPos.x, currentPos.y);
    ctx.stroke();
    
    lastPointRef.current = currentPos;
  }, [isDrawing, canvasRef, getMousePos]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    lastPointRef.current = null;
  }, []);

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
      return canvasRef.current.toDataURL('image/png');
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
