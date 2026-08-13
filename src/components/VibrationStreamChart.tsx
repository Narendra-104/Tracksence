import React, { useEffect, useRef } from 'react';
import { Activity, Info, Zap } from 'lucide-react';
import { TelemetryPoint } from '../types';

interface VibrationStreamChartProps {
  telemetryHistory: TelemetryPoint[];
  currentPoint: TelemetryPoint;
}

export const VibrationStreamChart: React.FC<VibrationStreamChartProps> = ({
  telemetryHistory,
  currentPoint
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Peak and RMS metrics calculation
  const values = telemetryHistory.map(t => Math.abs(t.vibrationZ));
  const peakG = values.length > 0 ? Math.max(...values) : Math.abs(currentPoint.vibrationZ);
  const sumSq = values.reduce((acc, val) => acc + val * val, 0);
  const rmsG = values.length > 0 ? Math.sqrt(sumSq / values.length) : Math.abs(currentPoint.vibrationZ);

  const isHighJolt = Math.abs(currentPoint.vibrationZ) > 1.5;

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

    // Grid lines (Light Mode)
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;

    // Horizontal grid
    [0.2, 0.4, 0.5, 0.6, 0.8].forEach(ratio => {
      ctx.beginPath();
      ctx.moveTo(0, H * ratio);
      ctx.lineTo(W, H * ratio);
      ctx.stroke();
    });

    // Center Baseline (Zero G)
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(W, midY);
    ctx.stroke();

    // Upper/Lower Threshold Lines (1.5G)
    const thresholdOffset = (1.5 / 3.0) * (H / 2);
    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    ctx.beginPath();
    ctx.moveTo(0, midY - thresholdOffset);
    ctx.lineTo(W, midY - thresholdOffset);
    ctx.moveTo(0, midY + thresholdOffset);
    ctx.lineTo(W, midY + thresholdOffset);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Stream Line
    if (telemetryHistory.length > 1) {
      const stepX = W / 59;

      // Gradient under line
      const areaGrad = ctx.createLinearGradient(0, 0, 0, H);
      areaGrad.addColorStop(0, 'rgba(16, 185, 129, 0.15)');
      areaGrad.addColorStop(0.5, 'rgba(16, 185, 129, 0.02)');
      areaGrad.addColorStop(1, 'rgba(16, 185, 129, 0.15)');

      ctx.beginPath();
      telemetryHistory.forEach((pt, i) => {
        const x = i * stepX;
        const normalized = Math.max(-3.0, Math.min(3.0, pt.vibrationZ));
        const y = midY - (normalized / 3.0) * (H / 2 - 10);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      ctx.strokeStyle = isHighJolt ? '#dc2626' : '#059669';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Active lead point dot
      const lastIdx = telemetryHistory.length - 1;
      const lastPt = telemetryHistory[lastIdx];
      const lastX = lastIdx * stepX;
      const lastNorm = Math.max(-3.0, Math.min(3.0, lastPt.vibrationZ));
      const lastY = midY - (lastNorm / 3.0) * (H / 2 - 10);

      ctx.fillStyle = isHighJolt ? '#dc2626' : '#059669';
      ctx.beginPath();
      ctx.arc(lastX, lastY, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [telemetryHistory, isHighJolt]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col justify-between text-slate-800">
      {/* Chart Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 font-mono tracking-wide uppercase">
              MPU6050 VIBRATION STREAM (3-AXIS IMU)
            </h3>
            <p className="text-[11px] text-slate-500">MPU6050 GY-521 → Vertical Z-axis G-force jolt</p>
          </div>
        </div>

        {/* Live Metrics */}
        <div className="flex items-center space-x-2 text-xs font-mono">
          <div className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <span className="text-slate-500 mr-1">PEAK:</span>
            <span className={`font-bold ${peakG > 1.2 ? 'text-red-600' : 'text-emerald-700'}`}>
              {peakG.toFixed(2)} G
            </span>
          </div>

          <div className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <span className="text-slate-500 mr-1">RMS:</span>
            <span className="text-cyan-700 font-bold">{rmsG.toFixed(2)} G</span>
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

        {/* Floating High Jolt Warning overlay if active */}
        {isHighJolt && (
          <div className="absolute top-2 right-2 bg-red-50 border border-red-200 text-red-700 text-[10px] font-mono px-2 py-0.5 rounded font-bold flex items-center space-x-1 shadow-xs">
            <Zap className="w-3 h-3 text-red-600" />
            <span>MPU6050 HIGH JOLT ({currentPoint.vibrationZ.toFixed(2)}G)</span>
          </div>
        )}
      </div>

      {/* Footer Metrics & Legend */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-2 border-t border-slate-100">
        <div className="flex items-center space-x-3 font-medium">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
            <span>Baseline (&lt;0.5G)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-600 inline-block" />
            <span>Threshold (&gt;1.5G)</span>
          </span>
        </div>

        <div className="text-slate-500 flex items-center gap-1">
          <Info className="w-3 h-3 text-slate-400" />
          <span>1000 Hz I²C</span>
        </div>
      </div>
    </div>
  );
};
