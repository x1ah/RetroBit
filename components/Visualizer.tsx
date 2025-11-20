import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
}

export const Visualizer: React.FC<VisualizerProps> = ({ analyser, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !analyser) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let animationId: number;

    const draw = () => {
      if (!isPlaying) {
         // Draw a flat line or static
         ctx.fillStyle = '#000';
         ctx.fillRect(0, 0, canvas.width, canvas.height);
         ctx.strokeStyle = '#4ade80';
         ctx.beginPath();
         ctx.moveTo(0, canvas.height / 2);
         ctx.lineTo(canvas.width, canvas.height / 2);
         ctx.stroke();
         return;
      }

      animationId = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = '#111'; // Dark background
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;

        // Retro green color palette
        const r = 50;
        const g = barHeight + 100;
        const b = 50;

        ctx.fillStyle = `rgb(${r},${g},${b})`;
        // Pixelated look: draw rects
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [analyser, isPlaying]);

  return (
    <div className="border-4 border-gray-700 bg-black p-2 rounded shadow-lg w-full h-32 flex items-center justify-center">
      <canvas 
        ref={canvasRef} 
        width={600} 
        height={100} 
        className="w-full h-full object-contain image-pixelated"
      />
    </div>
  );
};