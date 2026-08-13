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
  encoderPulseCount,
  direction = 'FORWARD',
  isPlaying = false
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white px-4 py-3 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Left Branding */}
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-tr from-amber-500 to-amber-600 p-2.5 rounded-xl text-slate-950 font-bold shadow-lg shadow-amber-500/20 flex items-center justify-center">
            <Train className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black tracking-tight text-white font-mono">
                TRACK<span className="text-amber-400">SENSE</span>
              </h1>
              <span className="bg-amber-500/10 text-amber-400 text-xs font-semibold px-2 py-0.5 rounded border border-amber-500/30">
                v2.4 RDSO DEMO
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span>Raspberry Pi 4 — Track Inspection System</span>
              <span className="text-slate-600">•</span>
              <span>Mock Track Testbed (1676 mm Broad Gauge)</span>
            </p>
          </div>
        </div>

        {/* Center Live Sensor Telemetry Status Badges */}
        <div className="hidden lg:flex items-center space-x-3 bg-slate-950/70 p-1.5 rounded-xl border border-slate-800 text-xs">
          {/* BO Motor Encoder Status */}
          <div className={`flex items-center space-x-2 px-2.5 py-1 rounded-lg border text-xs font-mono transition-colors ${
            isPlaying ? 'bg-amber-500/10 border-amber-500/40 text-amber-300' : 'bg-slate-900 border-slate-800 text-slate-400'
          }`}>
            <Radio className={`w-3.5 h-3.5 ${isPlaying ? 'text-amber-400 animate-spin' : 'text-slate-500'}`} />
            <div>
              <span className="text-[9px] uppercase text-slate-500 block leading-tight">BO Motor Encoder</span>
              <span className="font-semibold text-amber-300">
                {isPlaying ? (direction === 'FORWARD' ? 'SPINNING ⏩' : 'SPINNING ⏪') : 'STOPPED ⏸️'}
              </span>
            </div>
          </div>


          {/* MPU6050 IMU */}
          <div className="flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-800/80">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <div>
              <span className="text-[10px] uppercase text-slate-500 block leading-tight">MPU6050 IMU</span>
              <span className="font-mono text-emerald-300 font-semibold">3-Axis @ 1000 Hz</span>
            </div>
          </div>

          {/* Laser Line Module + RPi Camera */}
          <div className="flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-800/80">
            <Gauge className="w-3.5 h-3.5 text-indigo-400" />
            <div>
              <span className="text-[10px] uppercase text-slate-500 block leading-tight">Laser + RPi Cam</span>
              <span className="font-mono text-indigo-300 font-semibold">1676 mm Gauge</span>
            </div>
          </div>

          {/* Raspberry Pi 4 Fusion Engine Status */}
          <div className={`flex items-center space-x-2 px-2.5 py-1 rounded-lg border font-semibold ${
            fusionStatus === 'DEFECT' 
              ? 'bg-red-500/10 border-red-500/40 text-red-400 animate-pulse'
              : fusionStatus === 'ANOMALY'
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
              : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
          }`}>
            <Zap className="w-3.5 h-3.5" />
            <div>
              <span className="text-[10px] uppercase opacity-75 block leading-tight">RPi 4 Fusion Engine</span>
              <span className="font-mono">{fusionStatus}</span>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2">
          {/* Active Defects Alert Badge */}
          {activeDefectCount > 0 && (
            <div className="bg-red-500/20 text-red-400 border border-red-500/40 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 animate-pulse">
              <ShieldAlert className="w-4 h-4" />
              <span>{activeDefectCount} Defect{activeDefectCount > 1 ? 's' : ''} Tagged</span>
            </div>
          )}

          {/* Sound Mute Toggle — controls Buzzer */}
          <button
            onClick={onToggleMute}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
            title={isMuted ? "Unmute Buzzer & Rail Sound" : "Mute Buzzer Alert"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>

          {/* Reset Run Button */}
          <button
            onClick={onReset}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-xs font-medium flex items-center space-x-1.5 border border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Reset Track</span>
          </button>

          {/* Generate AI Inspection Directive Button */}
          <button
            onClick={onOpenReportModal}
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 transition-all flex items-center space-x-1.5"
          >
            <FileText className="w-4 h-4" />
            <span>RDSO Directive</span>
          </button>
        </div>
      </div>
    </header>
  );
};
