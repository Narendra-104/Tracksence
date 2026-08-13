import React from 'react';
import { 
  Activity, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  ShieldAlert, 
  Radio, 
  Gauge, 
  Zap,
  FileText,
  Train
} from 'lucide-react';

import { DriveDirection } from '../types';

interface HeaderBarProps {
  isMuted: boolean;
  onToggleMute: () => void;
  onReset: () => void;
  onOpenReportModal: () => void;
  activeDefectCount: number;
  fusionStatus: 'NOMINAL' | 'ANOMALY' | 'DEFECT';
  encoderPulseCount: number;
  direction?: DriveDirection;
  isPlaying?: boolean;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  isMuted,
  onToggleMute,
  onReset,
  onOpenReportModal,
  activeDefectCount,
  fusionStatus,
  direction = 'FORWARD',
  isPlaying = false
}) => {
  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white px-4 py-3 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Left Branding */}
        <div className="flex items-center space-x-3">
          <div className="bg-amber-500 text-slate-950 p-2 rounded-xl font-bold flex items-center justify-center shadow-md">
            <Train className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-tight text-white font-mono">
                TRACK<span className="text-amber-400">SENSE</span>
              </h1>
              <span className="bg-amber-500/10 text-amber-400 text-[10px] font-semibold px-2 py-0.5 rounded border border-amber-500/20">
                v2.4 RDSO
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span>Raspberry Pi 4 Inspection System</span>
              <span className="text-slate-600">•</span>
              <span>1676 mm Broad Gauge Testbed</span>
            </p>
          </div>
        </div>

        {/* Center Telemetry Status Chips */}
        <div className="hidden lg:flex items-center space-x-2 text-xs">
          {/* BO Motor Encoder */}
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border transition-colors ${
            isPlaying ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-slate-950/60 border-slate-800 text-slate-400'
          }`}>
            <Radio className={`w-3.5 h-3.5 ${isPlaying ? 'text-amber-400 animate-spin' : 'text-slate-500'}`} />
            <span className="font-mono text-xs">
              {isPlaying ? (direction === 'FORWARD' ? 'BO ENCODER: FWD' : 'BO ENCODER: REV') : 'BO ENCODER: STOPPED'}
            </span>
          </div>

          {/* MPU6050 IMU */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-950/60 text-slate-300 border border-slate-800">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono text-xs text-slate-300">MPU6050 3-Axis</span>
          </div>

          {/* Laser + RPi Cam */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-950/60 text-slate-300 border border-slate-800">
            <Gauge className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-mono text-xs text-slate-300">Laser + RPi Cam</span>
          </div>

          {/* RPi 4 Fusion Status */}
          <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border font-mono font-semibold text-xs ${
            fusionStatus === 'DEFECT' 
              ? 'bg-red-500/10 border-red-500/30 text-red-400'
              : fusionStatus === 'ANOMALY'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          }`}>
            <Zap className="w-3.5 h-3.5" />
            <span>FUSION: {fusionStatus}</span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2">
          {activeDefectCount > 0 && (
            <div className="bg-red-500/10 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{activeDefectCount} Defect{activeDefectCount > 1 ? 's' : ''}</span>
            </div>
          )}

          <button
            onClick={onToggleMute}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/60"
            title={isMuted ? "Unmute Buzzer" : "Mute Buzzer"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>

          <button
            onClick={onReset}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-xs font-medium flex items-center space-x-1.5 border border-slate-700/60"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            onClick={onOpenReportModal}
            className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm"
          >
            <FileText className="w-4 h-4" />
            <span>RDSO Directive</span>
          </button>
        </div>
      </div>
    </header>
  );
};
