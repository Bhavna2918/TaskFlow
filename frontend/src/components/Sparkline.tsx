import React, { useEffect, useRef } from 'react';

interface SparklineProps {
  data?: number[];
  color?: string;
  width?: number;
  height?: number;
}

const Sparkline: React.FC<SparklineProps> = ({ 
  data = [], 
  color = '#6366f1', 
  width = 120, 
  height = 40 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min === 0 ? 1 : max - min;

    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const getX = (index: number) => (index / (data.length - 1)) * (width - 4) + 2;
    const getY = (value: number) => height - 4 - ((value - min) / range) * (height - 8);

    ctx.moveTo(getX(0), getY(data[0]));
    for (let i = 1; i < data.length; i++) {
      ctx.lineTo(getX(i), getY(data[i]));
    }

    ctx.strokeStyle = color;
    ctx.stroke();

    ctx.lineTo(getX(data.length - 1), height);
    ctx.lineTo(getX(0), height);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    
    // Fallback if color is not in hex format
    let r = 99, g = 102, b = 241;
    if (color.startsWith('#') && color.length === 7) {
      r = parseInt(color.slice(1, 3), 16);
      g = parseInt(color.slice(3, 5), 16);
      b = parseInt(color.slice(5, 7), 16);
    }

    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.25)`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.0)`);
    
    ctx.fillStyle = gradient;
    ctx.fill();

  }, [data, color, width, height]);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ width: `${width}px`, height: `${height}px` }} 
      className="sparkline-canvas"
    />
  );
};

export default Sparkline;
