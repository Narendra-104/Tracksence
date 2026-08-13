import React from 'react';
import { 
  Zap, 
  ShieldCheck, 
  ShieldAlert, 
  Layers, 
  Activity, 
  Gauge, 
  Camera,
  CheckCircle2,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { TelemetryPoint } from '../types';

interface SensorFusionPanelProps {
  currentTelemetry: TelemetryPoint;
}

export const SensorFusionPanel: React.FC<SensorFusionPanelProps> = ({
  currentTelemetry
}) => {
  const confidence = Math.round(currentTelemetry.confidenceScore);
  const status = currentTelemetry.status;

  // Calculate fusion component weights for visual breakdown
  const vibrationWeight = Math.min(100, Math.round((Math.abs(currentTelemetry.vibrationZ) / 2.5) * 100));
  const gaugeWeight = Math.min(100, Math.round((Math.abs(currentTelemetry.gaugeDevMm) / 15) * 100));
  const visionMatch = currentTelemetry.confidenceScore > 35;

  let badgeColor = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
  let badgeText = 'NOMINAL TRACK BED';
  let gaugeStrokeColor = '#10b981';

  if (confidence >= 66) {
    badgeColor = 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse';
    badgeText = 'CRITICAL DEFECT CONFIRMED';
    gaugeStrokeColor = '#ef4444';
  } else if (confidence >= 35) {
    badgeColor = 'bg-amber-500/20 border-amber-500/50 text-amber-400';
    badgeText = 'MODERATE TRACK ANOMALY';
    gaugeStrokeColor = '#f59e0b';
  }

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between">
      {/* Background Subtle Gradient Glow */}
      <div className={`absolute -right-16 -top-16 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none ${
        confidence >= 66 ? 'bg-red-500' : confidence >= 35 ? 'bg-amber-500' : 'bg-emerald-500'
      }`} />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500/20 to-amber-600/10 border border-amber-500/30 text-amber-400 shadow-inner">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 font-mono tracking-wide uppercase">
              RPi 4 SENSOR FUSION CROSS-VALIDATION PANEL
            </h2>
            <p className="text-xs text-slate-400">MPU6050 IMU + Laser Line/RPi Camera → Raspberry Pi 4 Fusion Engine</p>
          </div>
        </div>

        {/* Fusion Status Badge */}
        <div className={`px-3 py-1 rounded-lg border text-xs font-mono font-bold flex items-center space-x-1.5 ${badgeColor}`}>
          {confidence >= 66 ? (
            <ShieldAlert className="w-4 h-4" />
          ) : confidence >= 35 ? (
            <AlertTriangle className="w-4 h-4" />
          ) : (
            <ShieldCheck className="w-4 h-4" />
          )}
          <span>{badgeText}</span>
        </div>
      </div>

      {/* Core Center Display: Score Circular Meter & Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center my-1">
        {/* Arc / Circle Meter (5 cols) */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-3 bg-slate-950/80 rounded-xl border border-slate-800/90 shadow-inner relative">
          <div className="relative w-36 h-36 flex items-center justify-center">
            {/* SVG Arc Gauge Meter */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Background Circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-slate-800"
                strokeWidth="8"
                fill="transparent"
              />
              {/* Progress Arc */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke={gaugeStrokeColor}
                strokeWidth="8"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * confidence) / 100}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-300 ease-out"
              />
            </svg>

            {/* Inner Score Readout */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-black font-mono tracking-tight text-white">
                {confidence}<span className="text-lg text-slate-400">%</span>
              </span>
              <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold tracking-wider mt-0.5">
                DEFECT CONFIDENCE
              </span>
            </div>
          </div>

          <p className="text-[11px] font-mono text-slate-400 mt-2 text-center">
            Location Marker: <strong className="text-amber-400">{currentTelemetry.position.toFixed(2)} m</strong>
          </p>
        </div>

        {/* Fusion Channels Breakdown (7 cols) */}
        <div className="md:col-span-7 space-y-3">
          {/* Channel 1: MPU6050 Vibration IMU */}
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 text-xs font-mono">
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-300 flex items-center gap-1.5 font-semibold">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                MPU6050 Vibration Weight
              </span>
              <span className="text-emerald-400 font-bold">{vibrationWeight}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${vibrationWeight}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              MPU6050: {Math.abs(currentTelemetry.vibrationZ).toFixed(2)} G (Vert) / {Math.abs(currentTelemetry.vibrationY).toFixed(2)} G (Lat)
            </p>
          </div>

          {/* Channel 2: Laser Line Module + RPi Camera Optical Gauge */}
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 text-xs font-mono">
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-300 flex items-center gap-1.5 font-semibold">
                <Gauge className="w-3.5 h-3.5 text-indigo-400" />
                Laser + RPi Camera Gauge Weight
              </span>
              <span className="text-indigo-400 font-bold">{gaugeWeight}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${gaugeWeight}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              RPi Cam Gauge: {currentTelemetry.gaugeMm.toFixed(1)} mm (Dev: {currentTelemetry.gaugeDevMm >= 0 ? `+${currentTelemetry.gaugeDevMm.toFixed(1)}` : currentTelemetry.gaugeDevMm.toFixed(1)} mm)
            </p>
          </div>

          {/* Vision Corroboration — RPi Camera */}
          <div className="flex items-center justify-between bg-slate-950/60 px-3 py-2 rounded-xl border border-slate-800/80 text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-cyan-400" />
              RPi Camera Rail Profile:
            </span>
            <span className={`font-semibold flex items-center gap-1 ${
              visionMatch ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {visionMatch ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Optical Anomaly Corroborated</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Rail Profile Normal</span>
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Fusion Logic Banner */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400">
        <span className="text-slate-500">
          RPi 4 Rule: <strong className="text-slate-300">MPU6050 Jolt (&gt;1.5G) + RPi Cam Gauge Spread (&gt;8mm) = CRITICAL FLAG</strong>
        </span>
        <span className="text-amber-400 font-semibold">
          Raspberry Pi 4 — Real-time Fusion
        </span>
      </div>
    </div>
  );
};
