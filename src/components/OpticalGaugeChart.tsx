import React, { useRef, useEffect } from 'react';
import { Gauge, ArrowUpRight, Check, AlertCircle } from 'lucide-react';
import { TelemetryPoint } from '../types';

interface OpticalGaugeChartProps {
  telemetryHistory: TelemetryPoint[];
  currentPoint: TelemetryPoint;
}

export const OpticalGaugeChart: React.FC<OpticalGaugeChartProps> = ({
  telemetryHistory,
  currentPoint
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const nominalGauge = 1676; // Broad Gauge standard mm
  const dev = currentPoint.gaugeDevMm;
  const isDeviation = Math.abs(dev) >= 6.0;

  // Render optical gauge stream
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 24;

    // Background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // Baseline 1676mm Center
    const centerY = height / 2;

    // Green nominal tolerance band (1672 to 1680mm = +/- 4mm)
    const bandHeight = (8 / 40) * (height - padding * 2);
    ctx.fillStyle = '#10b98115';
    ctx.fillRect(padding, centerY - bandHeight / 2, width - padding * 2, bandHeight);

    // Center nominal line (1676mm)
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, centerY);
    ctx.lineTo(width - padding, centerY);
    ctx.stroke();

    // Plot Optical Gauge Stream Line
    if (telemetryHistory.length > 1) {
      const step = (width - padding * 2) / (telemetryHistory.length - 1);

      ctx.beginPath();
      telemetryHistory.forEach((pt, idx) => {
        const x = padding + idx * step;
        // Map 1656mm to 1696mm (+/- 20mm range)
        const delta = pt.gaugeMm - nominalGauge;
        const clampedDelta = Math.min(20, Math.max(-20, delta));
        const y = centerY - (clampedDelta / 20) * (height / 2 - padding);

        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      ctx.strokeStyle = isDeviation ? '#f59e0b' : '#6366f1';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Highlight widening points
      telemetryHistory.forEach((pt, idx) => {
        if (Math.abs(pt.gaugeMm - nominalGauge) >= 8) {
          const x = padding + idx * step;
          const delta = pt.gaugeMm - nominalGauge;
          const clampedDelta = Math.min(20, Math.max(-20, delta));
          const y = centerY - (clampedDelta / 20) * (height / 2 - padding);

          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }
  }, [telemetryHistory, isDeviation]);

  return (
    <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4 sm:p-5 shadow-sm flex flex-col justify-between">
      {/* Chart Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 font-mono tracking-wide uppercase">
              LASER LINE + RPi CAM GAUGE STREAM
            </h3>
            <p className="text-[11px] text-slate-400">Laser Line Module → OpenCV Triangulation</p>
          </div>
        </div>

        {/* Live Gauge Delta Readout */}
        <div className="flex items-center space-x-2 text-xs font-mono">
          <div className="bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800">
            <span className="text-slate-500 mr-1">GAUGE:</span>
            <span className={`font-bold ${isDeviation ? 'text-amber-400' : 'text-indigo-300'}`}>
              {currentPoint.gaugeMm.toFixed(1)} mm
            </span>
          </div>

          <div className={`px-2.5 py-1 rounded-lg border font-bold flex items-center space-x-1 ${
            dev > 5 
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
              : dev < -5
              ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          }`}>
            <span>DEV: {dev >= 0 ? `+${dev.toFixed(1)}` : dev.toFixed(1)} mm</span>
          </div>
        </div>
      </div>

      {/* Canvas Stream Container */}
      <div className="relative my-2 rounded-lg border border-slate-800/80 overflow-hidden bg-slate-950/80">
        <canvas 
          ref={canvasRef} 
          width={500} 
          height={160} 
          className="w-full h-40 block"
        />

        {/* Floating Warning Tag */}
        {isDeviation && (
          <div className="absolute top-2 right-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono px-2 py-0.5 rounded flex items-center space-x-1">
            <AlertCircle className="w-3 h-3" />
            <span>GAUGE SPREAD (+{dev.toFixed(1)}mm)</span>
          </div>
        )}
      </div>

      {/* Footer Metrics & Legend */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-2 border-t border-slate-800/60">
        <div className="flex items-center space-x-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-1.5 rounded-sm bg-emerald-500/30 border border-emerald-500 inline-block" />
            <span>Tolerance (1672–1680mm)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
            <span>Out of Specs (&gt;8mm)</span>
          </span>
        </div>

        <div className="text-slate-500 flex items-center gap-1">
          <Check className="w-3 h-3 text-emerald-400" />
          <span>Laser + RPi Cam Active</span>
        </div>
      </div>
    </div>
  );
};
