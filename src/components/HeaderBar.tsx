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
    <header className="bg-white border-b border-slate-200 text-slate-900 px-4 py-3 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Left Branding */}
        <div className="flex items-center space-x-3">
          <div className="bg-amber-500 text-slate-950 p-2 rounded-xl font-bold flex items-center justify-center shadow-xs">
            <Train className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-900 font-mono">
                TRACK<span className="text-amber-600">SENSE</span>
              </h1>
              <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200">
                v2.4 RDSO DEMO
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 font-medium">
              <span>Raspberry Pi 4 Inspection System</span>
              <span className="text-slate-300">•</span>
              <span>1676 mm Broad Gauge Testbed</span>
            </p>
          </div>
        </div>

        {/* Center Telemetry Status Chips */}
        <div className="hidden lg:flex items-center space-x-2 text-xs font-mono">
          {/* BO Motor Encoder */}
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border transition-colors ${
            isPlaying ? 'bg-amber-50 border-amber-300 text-amber-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            <Radio className={`w-3.5 h-3.5 ${isPlaying ? 'text-amber-600 animate-spin' : 'text-slate-400'}`} />
            <span>
              {isPlaying ? (direction === 'FORWARD' ? 'ENCODER: FWD' : 'ENCODER: REV') : 'ENCODER: STOPPED'}
            </span>
          </div>

          {/* MPU6050 IMU */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-700 border border-slate-200 font-medium">
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span>MPU6050 3-Axis</span>
          </div>

          {/* Laser + RPi Cam */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-700 border border-slate-200 font-medium">
            <Gauge className="w-3.5 h-3.5 text-indigo-600" />
            <span>Laser + RPi Cam</span>
          </div>

          {/* RPi 4 Fusion Status */}
          <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border font-semibold text-xs ${
            fusionStatus === 'DEFECT' 
              ? 'bg-red-50 border-red-200 text-red-700'
              : fusionStatus === 'ANOMALY'
              ? 'bg-amber-50 border-amber-200 text-amber-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}>
            <Zap className="w-3.5 h-3.5" />
            <span>FUSION: {fusionStatus}</span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2">
          {activeDefectCount > 0 && (
            <div className="bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
              <span>{activeDefectCount} Defect{activeDefectCount > 1 ? 's' : ''}</span>
            </div>
          )}

          <button
            onClick={onToggleMute}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
            title={isMuted ? "Unmute Buzzer" : "Mute Buzzer"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-amber-600" />}
          </button>

          <button
            onClick={onReset}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors text-xs font-semibold flex items-center space-x-1.5 border border-slate-200"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-600" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            onClick={onOpenReportModal}
            className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all flex items-center space-x-1.5 shadow-xs"
          >
            <FileText className="w-4 h-4" />
            <span>RDSO Directive</span>
          </button>
        </div>
      </div>
    </header>
  );
};
