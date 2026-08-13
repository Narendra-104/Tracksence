import React from 'react';
import { 
  Zap, 
  ShieldCheck, 
  ShieldAlert, 
  Activity, 
  Gauge, 
  Camera,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { TelemetryPoint } from '../types';

interface SensorFusionPanelProps {
  currentTelemetry: TelemetryPoint;
}

export const SensorFusionPanel: React.FC<SensorFusionPanelProps> = ({
  currentTelemetry
}) => {
  const confidence = Math.round(currentTelemetry.confidenceScore);

  // Calculate fusion component weights for visual breakdown
  const vibrationWeight = Math.min(100, Math.round((Math.abs(currentTelemetry.vibrationZ) / 2.5) * 100));
  const gaugeWeight = Math.min(100, Math.round((Math.abs(currentTelemetry.gaugeDevMm) / 15) * 100));
  const visionMatch = currentTelemetry.confidenceScore > 35;

  let badgeColor = 'bg-emerald-50 border-emerald-200 text-emerald-700';
  let badgeText = 'NOMINAL TRACK';
  let gaugeStrokeColor = '#059669';

  if (confidence >= 66) {
    badgeColor = 'bg-red-50 border-red-200 text-red-700 font-bold';
    badgeText = 'CRITICAL DEFECT';
    gaugeStrokeColor = '#dc2626';
  } else if (confidence >= 35) {
    badgeColor = 'bg-amber-50 border-amber-200 text-amber-700 font-bold';
    badgeText = 'TRACK ANOMALY';
    gaugeStrokeColor = '#d97706';
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col justify-between h-full text-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 font-mono uppercase tracking-wide">
              RPi 4 SENSOR FUSION ENGINE
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">MPU6050 IMU + Laser Line & RPi Camera</p>
          </div>
        </div>

        {/* Fusion Status Badge */}
        <div className={`px-3 py-1 rounded-lg border text-xs font-mono flex items-center space-x-1.5 ${badgeColor}`}>
          {confidence >= 66 ? (
            <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
          ) : confidence >= 35 ? (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          ) : (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          )}
          <span>{badgeText}</span>
        </div>
      </div>

      {/* Core Center Display: Score Circular Meter & Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center my-1">
        {/* Arc / Circle Meter (5 cols) */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div className="relative w-32 h-32 flex items-center justify-center">
            {/* SVG Arc Gauge Meter */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-slate-200"
                strokeWidth="7"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke={gaugeStrokeColor}
                strokeWidth="7"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * confidence) / 100}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-300 ease-out"
              />
            </svg>

            {/* Inner Score Readout */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-bold font-mono tracking-tight text-slate-900">
                {confidence}<span className="text-sm text-slate-500">%</span>
              </span>
              <span className="text-[9px] font-mono uppercase text-slate-500 font-bold tracking-wider">
                CONFIDENCE
              </span>
            </div>
          </div>

          <p className="text-[10px] font-mono text-slate-600 mt-2 text-center">
            Location: <strong className="text-amber-700">{currentTelemetry.position.toFixed(2)} m</strong>
          </p>
        </div>

        {/* Fusion Channels Breakdown (7 cols) */}
        <div className="md:col-span-7 space-y-2.5">
          {/* Channel 1: MPU6050 Vibration IMU */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs font-mono">
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-700 flex items-center gap-1.5 font-medium">
                <Activity className="w-3.5 h-3.5 text-emerald-600" />
                MPU6050 Vibration
              </span>
              <span className="text-emerald-700 font-bold">{vibrationWeight}%</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${vibrationWeight}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              {Math.abs(currentTelemetry.vibrationZ).toFixed(2)} G (Vert) / {Math.abs(currentTelemetry.vibrationY).toFixed(2)} G (Lat)
            </p>
          </div>

          {/* Channel 2: Laser Line Module + RPi Camera Optical Gauge */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs font-mono">
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-700 flex items-center gap-1.5 font-medium">
                <Gauge className="w-3.5 h-3.5 text-indigo-600" />
                Laser + RPi Cam Gauge
              </span>
              <span className="text-indigo-700 font-bold">{gaugeWeight}%</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${gaugeWeight}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Gauge: {currentTelemetry.gaugeMm.toFixed(1)} mm (Dev: {currentTelemetry.gaugeDevMm >= 0 ? `+${currentTelemetry.gaugeDevMm.toFixed(1)}` : currentTelemetry.gaugeDevMm.toFixed(1)} mm)
            </p>
          </div>

          {/* Vision Corroboration — RPi Camera */}
          <div className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono">
            <span className="text-slate-600 flex items-center gap-1.5 font-medium">
              <Camera className="w-3.5 h-3.5 text-cyan-600" />
              RPi Cam Profile:
            </span>
            <span className={`font-bold flex items-center gap-1 text-[11px] ${
              visionMatch ? 'text-amber-700' : 'text-emerald-700'
            }`}>
              {visionMatch ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Anomaly Corroborated</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Profile Normal</span>
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Fusion Logic Banner */}
      <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-500 font-medium">
        <span>
          RPi 4 Rule: <strong className="text-slate-800">MPU6050 Jolt (&gt;1.5G) + RPi Cam Gauge Spread (&gt;8mm) = CRITICAL</strong>
        </span>
        <span className="text-amber-700 font-bold">
          Raspberry Pi 4
        </span>
      </div>
    </div>
  );
};
