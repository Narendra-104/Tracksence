import React, { useRef, useEffect } from 'react';
import { Activity, Zap, Info, ShieldAlert } from 'lucide-react';
import { TelemetryPoint } from '../types';

interface VibrationStreamChartProps {
  telemetryHistory: TelemetryPoint[];
  currentPoint: TelemetryPoint;
}

export const VibrationStreamChart: React.FC<VibrationStreamChartProps> = ({
  telemetryHistory,
  currentPoint
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Calculate live stats
  const peakG = Math.max(0, ...telemetryHistory.map(p => Math.abs(p.vibrationZ)));
  const rmsG = Math.sqrt(
    telemetryHistory.reduce((acc, p) => acc + p.vibrationZ * p.vibrationZ, 0) / (telemetryHistory.length || 1)
  );
  
  const isHighJolt = Math.abs(currentPoint.vibrationZ) >= 1.2;

  // Render high-frequency streaming accelerometer canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 24;

    // Clear background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Center baseline 0G
    const centerY = height / 2;
    ctx.moveTo(padding, centerY);
    ctx.lineTo(width - padding, centerY);
    ctx.stroke();

    // +1.5G Threshold (Red) line
    const redYUpper = centerY - (1.5 / 3) * (height / 2 - padding);
    const redYLower = centerY + (1.5 / 3) * (height / 2 - padding);

    ctx.strokeStyle = '#ef444455';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padding, redYUpper);
    ctx.lineTo(width - padding, redYUpper);
    ctx.moveTo(padding, redYLower);
    ctx.lineTo(width - padding, redYLower);
    ctx.stroke();
    ctx.setLineDash([]);

    // Plot Z-Axis Acceleration (Vertical Jolt)
    if (telemetryHistory.length > 1) {
      const step = (width - padding * 2) / (telemetryHistory.length - 1);

      // Gradient under curve
      ctx.beginPath();
      telemetryHistory.forEach((pt, idx) => {
        const x = padding + idx * step;
        // Map -3G..+3G to canvas Y
        const valClamped = Math.min(3, Math.max(-3, pt.vibrationZ));
        const y = centerY - (valClamped / 3) * (height / 2 - padding);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      ctx.strokeStyle = isHighJolt ? '#f59e0b' : '#10b981';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Highlight peak spikes
      telemetryHistory.forEach((pt, idx) => {
        if (Math.abs(pt.vibrationZ) >= 1.2) {
          const x = padding + idx * step;
          const valClamped = Math.min(3, Math.max(-3, pt.vibrationZ));
          const y = centerY - (valClamped / 3) * (height / 2 - padding);

          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }
  }, [telemetryHistory, isHighJolt]);

  return (
    <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4 sm:p-5 shadow-sm flex flex-col justify-between">
      {/* Chart Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 font-mono tracking-wide uppercase">
              MPU6050 VIBRATION STREAM (3-AXIS IMU)
            </h3>
            <p className="text-[11px] text-slate-400">MPU6050 GY-521 → Vertical Z-axis G-force jolt</p>
          </div>
        </div>

        {/* Live Metrics */}
        <div className="flex items-center space-x-2 text-xs font-mono">
          <div className="bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800">
            <span className="text-slate-500 mr-1">PEAK:</span>
            <span className={`font-bold ${peakG > 1.2 ? 'text-red-400' : 'text-emerald-400'}`}>
              {peakG.toFixed(2)} G
            </span>
          </div>

          <div className="bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800">
            <span className="text-slate-500 mr-1">RMS:</span>
            <span className="text-cyan-400 font-bold">{rmsG.toFixed(2)} G</span>
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

        {/* Floating High Jolt Warning overlay if active */}
        {isHighJolt && (
          <div className="absolute top-2 right-2 bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-mono px-2 py-0.5 rounded flex items-center space-x-1">
            <Zap className="w-3 h-3" />
            <span>MPU6050 JOLT ({currentPoint.vibrationZ.toFixed(2)}G)</span>
          </div>
        )}
      </div>

      {/* Footer Metrics & Legend */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-2 border-t border-slate-800/60">
        <div className="flex items-center space-x-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>Baseline (&lt;0.5G)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
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
