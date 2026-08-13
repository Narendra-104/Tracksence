import React, { useEffect, useRef } from 'react';
import { Gauge, Check, AlertCircle } from 'lucide-react';
import { TelemetryPoint } from '../types';

interface OpticalGaugeChartProps {
  telemetryHistory: TelemetryPoint[];
  currentPoint: TelemetryPoint;
}

export const OpticalGaugeChart: React.FC<OpticalGaugeChartProps> = ({
  telemetryHistory,
  currentPoint
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDeviation = Math.abs(currentPoint.gaugeDevMm) > 8;
  const dev = currentPoint.gaugeDevMm;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const midY = H / 2;

    // ── Light Theme Background ──────────────────────────────────────────
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;

    [0.2, 0.4, 0.5, 0.6, 0.8].forEach(ratio => {
      ctx.beginPath();
      ctx.moveTo(0, H * ratio);
      ctx.lineTo(W, H * ratio);
      ctx.stroke();
    });

    // Nominal Gauge Line (1676 mm)
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(W, midY);
    ctx.stroke();

    // Tolerance Band (±4mm around 1676mm)
    const bandHeight = (4 / 20) * (H / 2);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
    ctx.fillRect(0, midY - bandHeight, W, bandHeight * 2);

    ctx.strokeStyle = '#a7f3d0';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(0, midY - bandHeight);
    ctx.lineTo(W, midY - bandHeight);
    ctx.moveTo(0, midY + bandHeight);
    ctx.lineTo(W, midY + bandHeight);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Stream Line
    if (telemetryHistory.length > 1) {
      const stepX = W / 59;

      ctx.beginPath();
      telemetryHistory.forEach((pt, i) => {
        const x = i * stepX;
        const normalizedDev = Math.max(-20, Math.min(20, pt.gaugeDevMm));
        const y = midY - (normalizedDev / 20) * (H / 2 - 10);

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      ctx.strokeStyle = isDeviation ? '#d97706' : '#4f46e5';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Lead point
      const lastIdx = telemetryHistory.length - 1;
      const lastPt = telemetryHistory[lastIdx];
      const lastX = lastIdx * stepX;
      const lastDev = Math.max(-20, Math.min(20, lastPt.gaugeDevMm));
      const lastY = midY - (lastDev / 20) * (H / 2 - 10);

      ctx.fillStyle = isDeviation ? '#d97706' : '#4f46e5';
      ctx.beginPath();
      ctx.arc(lastX, lastY, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [telemetryHistory, isDeviation]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col justify-between text-slate-800">
      {/* Chart Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 font-mono tracking-wide uppercase">
              LASER LINE + RPi CAM GAUGE STREAM
            </h3>
            <p className="text-[11px] text-slate-500">Laser Line Module → OpenCV Triangulation</p>
          </div>
        </div>

        {/* Live Gauge Delta Readout */}
        <div className="flex items-center space-x-2 text-xs font-mono">
          <div className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <span className="text-slate-500 mr-1">GAUGE:</span>
            <span className={`font-bold ${isDeviation ? 'text-amber-700' : 'text-indigo-700'}`}>
              {currentPoint.gaugeMm.toFixed(1)} mm
            </span>
          </div>

          <div className={`px-2.5 py-1 rounded-lg border font-bold flex items-center space-x-1 ${
            dev > 5 
              ? 'bg-amber-50 border-amber-200 text-amber-700' 
              : dev < -5
              ? 'bg-cyan-50 border-cyan-200 text-cyan-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}>
            <span>DEV: {dev >= 0 ? `+${dev.toFixed(1)}` : dev.toFixed(1)} mm</span>
          </div>
        </div>
      </div>

      {/* Canvas Stream Container */}
      <div className="relative my-2 rounded-lg border border-slate-200 overflow-hidden bg-white shadow-xs">
        <canvas 
          ref={canvasRef} 
          width={500} 
          height={160} 
          className="w-full h-40 block"
        />

        {/* Floating Warning Tag */}
        {isDeviation && (
          <div className="absolute top-2 right-2 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-mono px-2 py-0.5 rounded font-bold flex items-center space-x-1 shadow-xs">
            <AlertCircle className="w-3 h-3 text-amber-600" />
            <span>GAUGE SPREAD (+{dev.toFixed(1)}mm)</span>
          </div>
        )}
      </div>

      {/* Footer Metrics & Legend */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-2 border-t border-slate-100">
        <div className="flex items-center space-x-3 font-medium">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-1.5 rounded-sm bg-emerald-100 border border-emerald-500 inline-block" />
            <span>Tolerance (1672–1680mm)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-600 inline-block" />
            <span>Out of Specs (&gt;8mm)</span>
          </span>
        </div>

        <div className="text-slate-500 flex items-center gap-1">
          <Check className="w-3 h-3 text-emerald-600" />
          <span>Laser + RPi Cam Active</span>
        </div>
      </div>
    </div>
  );
};
