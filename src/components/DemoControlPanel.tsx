import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Repeat, 
  Zap, 
  Sliders, 
  PlusCircle, 
  Activity, 
  Gauge, 
  Sparkles,
  FastForward,
  ChevronRight
} from 'lucide-react';
import { DefectType, DriveDirection, PresetScenario, SeverityLevel } from '../types';

interface DemoControlPanelProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStopRun?: () => void;
  onReset: () => void;
  speed: number;
  onChangeSpeed: (spd: number) => void;
  isLooping: boolean;
  onToggleLoop: () => void;
  direction?: DriveDirection;
  onChangeDirection?: (dir: DriveDirection) => void;
  targetDistance?: number;
  onChangeTargetDistance?: (dist: number) => void;
  trackLength?: number;
  onChangeTrackLength?: (len: number) => void;
  onStartFromPosition?: (pos: number, dir?: DriveDirection) => void;
  onInjectPresetScenario: (scenario: PresetScenario) => void;
  onInjectCustomDefect: (location: number, type: DefectType, severity: SeverityLevel) => void;
  currentPosition: number;
}

export const DemoControlPanel: React.FC<DemoControlPanelProps> = ({
  isPlaying,
  onTogglePlay,
  onStopRun,
  onReset,
  speed,
  onChangeSpeed,
  isLooping,
  onToggleLoop,
  direction = 'FORWARD',
  onChangeDirection,
  targetDistance = 2.50,
  onChangeTargetDistance,
  trackLength = 2.50,
  onChangeTrackLength,
  onStartFromPosition,
  onInjectPresetScenario,
  onInjectCustomDefect,
  currentPosition
}) => {
  const [customLoc, setCustomLoc] = useState<number>(Number(currentPosition.toFixed(2)));
  const [customType, setCustomType] = useState<DefectType>('Surface Corrugation');
  const [customSev, setCustomSev] = useState<SeverityLevel>('HIGH');
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);

  const handleInjectCustom = (e: React.FormEvent) => {
    e.preventDefault();
    onInjectCustomDefect(customLoc, customType, customSev);
    setShowCustomModal(false);
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-xl flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 font-mono uppercase tracking-wide">
              BO MOTOR + L298N DRIVER CONTROLLER
            </h2>
            <p className="text-xs text-slate-400">Track size, BO motor drive, encoder distance & direction controls</p>
          </div>
        </div>

        {/* Custom Defect Injector Button */}
        <button
          onClick={() => {
            setCustomLoc(Number(currentPosition.toFixed(2)));
            setShowCustomModal(!showCustomModal);
          }}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition-colors border border-slate-700 text-xs font-mono font-bold flex items-center space-x-1.5"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Custom Anomaly</span>
        </button>
      </div>

      {/* Main Controls Grid */}
      <div className="space-y-4 font-mono">

        {/* Section 0: Track Size / Total Trackbed Length Selector */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>CONFIGURE TRACK SIZE / LENGTH:</span>
            </span>
            <span className="text-cyan-400 font-bold text-sm">{trackLength.toFixed(2)} meters</span>
          </div>

          {/* Quick Track Size Presets */}
          <div className="grid grid-cols-6 gap-1.5 text-[11px]">
            {[2.50, 5.00, 10.00, 25.00, 50.00, 100.00].map((len) => (
              <button
                key={len}
                onClick={() => onChangeTrackLength?.(len)}
                className={`py-1.5 rounded-lg border font-bold transition-all ${
                  Math.abs(trackLength - len) < 0.05
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {len >= 10 ? `${len}m` : `${len.toFixed(1)}m`}
              </button>
            ))}
          </div>

          {/* Track Size Fine-Tuning Slider */}
          <div className="flex items-center space-x-3 text-xs pt-1">
            <span className="text-slate-500 text-[10px]">1.0m</span>
            <input
              type="range"
              min="1.0"
              max="100.0"
              step="1.0"
              value={trackLength}
              onChange={(e) => onChangeTrackLength?.(parseFloat(e.target.value))}
              className="flex-1 accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <span className="text-slate-500 text-[10px]">100.0m</span>
          </div>
        </div>

        {/* Section 1: Direction & Rotary Wheel Status */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-1.5">
              <FastForward className="w-3.5 h-3.5 text-cyan-400" />
              <span>DRIVE DIRECTION:</span>
            </span>

            {/* BO Encoder Wheel Status Badge */}
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}>
              BO ENCODER WHEEL: {isPlaying ? 'SPINNING ⚙️' : 'STOPPED 🛑'}
            </span>
          </div>

          {/* Direction Selector Toggle */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => onChangeDirection?.('FORWARD')}
              className={`py-2 px-3 rounded-lg border font-bold flex items-center justify-center space-x-2 transition-all ${
                direction === 'FORWARD'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/10'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <ChevronRight className="w-4 h-4 text-emerald-400" />
              <span>BO MOTOR FORWARD (0m ➔ {trackLength.toFixed(1)}m)</span>
            </button>

            <button
              onClick={() => onChangeDirection?.('REVERSE')}
              className={`py-2 px-3 rounded-lg border font-bold flex items-center justify-center space-x-2 transition-all ${
                direction === 'REVERSE'
                  ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-500/10'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <ChevronRight className="w-4 h-4 text-indigo-400 rotate-180" />
              <span>BO MOTOR REVERSE ({trackLength.toFixed(1)}m ➔ 0m)</span>
            </button>
          </div>
        </div>

        {/* Section 2: Target Distance Setting */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-amber-400" />
              <span>BO ENCODER RUN DISTANCE LIMIT:</span>
            </span>
            <span className="text-amber-400 font-bold text-sm">{targetDistance.toFixed(2)} meters</span>
          </div>

          {/* Quick Distance Presets relative to Track Length */}
          <div className="grid grid-cols-5 gap-1.5 text-[11px]">
            {[
              Number((trackLength * 0.2).toFixed(1)),
              Number((trackLength * 0.4).toFixed(1)),
              Number((trackLength * 0.6).toFixed(1)),
              Number((trackLength * 0.8).toFixed(1)),
              trackLength
            ].map((dist, idx) => (
              <button
                key={idx}
                onClick={() => onChangeTargetDistance?.(dist)}
                className={`py-1.5 rounded-lg border font-bold transition-all ${
                  Math.abs(targetDistance - dist) < 0.05
                    ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {dist === trackLength ? `FULL (${trackLength.toFixed(1)}m)` : `${dist}m`}
              </button>
            ))}
          </div>

          {/* Target Distance Slider */}
          <div className="flex items-center space-x-3 text-xs pt-1">
            <span className="text-slate-500 text-[10px]">0.10m</span>
            <input
              type="range"
              min="0.10"
              max={trackLength}
              step={trackLength > 20 ? "1.0" : "0.1"}
              value={targetDistance}
              onChange={(e) => onChangeTargetDistance?.(parseFloat(e.target.value))}
              className="flex-1 accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <span className="text-slate-500 text-[10px]">{trackLength.toFixed(1)}m</span>
          </div>
        </div>


        {/* Section 3: Play/Stop/Start from End Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
          {/* Drive Play Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onTogglePlay}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shadow-lg ${
                isPlaying 
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-amber-500/20' 
                  : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-emerald-500/20'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isPlaying ? 'PAUSE RUN' : 'START RUN'}</span>
            </button>

            {/* Explicit Stop Button */}
            {isPlaying && (
              <button
                onClick={onStopRun}
                className="px-3 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 text-xs font-bold transition-colors"
                title="Immediate Stop"
              >
                STOP
              </button>
            )}

            {/* Quick Start from End Buttons */}
            <button
              onClick={() => onStartFromPosition?.(0.00, 'FORWARD')}
              className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700 transition-colors"
              title="Position at 0.00m & Start Forward"
            >
              Start @ 0.0m
            </button>

            <button
              onClick={() => onStartFromPosition?.(trackLength, 'REVERSE')}
              className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-[11px] font-medium border border-slate-700 transition-colors"
              title={`Position at ${trackLength.toFixed(2)}m & Start Reverse`}
            >
              Start @ {trackLength >= 10 ? `${trackLength}m` : `${trackLength.toFixed(1)}m`} (Rev)
            </button>


            <button
              onClick={onReset}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
              title="Reset trolley to 0.00m"
            >
              <RotateCcw className="w-4 h-4 text-cyan-400" />
            </button>

            <button
              onClick={onToggleLoop}
              className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors flex items-center space-x-1.5 ${
                isLooping 
                  ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300' 
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Repeat className="w-3.5 h-3.5" />
              <span>{isLooping ? 'LOOP ON' : 'SINGLE PASS'}</span>
            </button>
          </div>

          {/* Motor PWM Speed Slider via L298N */}
          <div className="flex items-center space-x-3 text-xs flex-1 min-w-[180px] max-w-xs">
            <span className="text-slate-400 text-[11px]">L298N PWM SPEED:</span>
            <input
              type="range"
              min="0.2"
              max="3.0"
              step="0.1"
              value={speed}
              onChange={(e) => onChangeSpeed(parseFloat(e.target.value))}
              className="flex-1 accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <span className="text-amber-400 font-bold w-12 text-right">{speed.toFixed(1)} m/s</span>
          </div>
        </div>


        {/* Synthetic Defect Scenario Quick Injection Buttons */}
        <div>
          <label className="text-xs text-slate-400 font-semibold mb-2 block flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>INJECT SYNTHETIC SCENARIOS ON 2.5m TRACK:</span>
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            {/* Scenario 1: Nominal Smooth */}
            <button
              onClick={() => onInjectPresetScenario('smooth')}
              className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:border-emerald-500/50 transition-all text-left group"
            >
              <div className="text-emerald-400 font-bold mb-0.5 flex items-center justify-between">
                <span>🟢 Nominal Track</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[10px] text-slate-500">Smooth baseline, no defect</p>
            </button>

            {/* Scenario 2: Corrugation */}
            <button
              onClick={() => onInjectPresetScenario('corrugation')}
              className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:border-amber-500/50 transition-all text-left group"
            >
              <div className="text-amber-400 font-bold mb-0.5 flex items-center justify-between">
                <span>🟠 Corrugation</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[10px] text-slate-500">Vibration jolt @ 0.85m</p>
            </button>

            {/* Scenario 3: Loose Joint */}
            <button
              onClick={() => onInjectPresetScenario('loose_joint')}
              className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:border-amber-500/50 transition-all text-left group"
            >
              <div className="text-amber-400 font-bold mb-0.5 flex items-center justify-between">
                <span>🟡 Loose Joint</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[10px] text-slate-500">Fishplate gap @ 1.45m</p>
            </button>

            {/* Scenario 4: Gauge Widening */}
            <button
              onClick={() => onInjectPresetScenario('gauge_widening')}
              className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:border-indigo-500/50 transition-all text-left group"
            >
              <div className="text-indigo-400 font-bold mb-0.5 flex items-center justify-between">
                <span>🟣 Gauge Spread</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[10px] text-slate-500">Laser +14mm @ 1.95m</p>
            </button>

            {/* Scenario 5: Combined Critical */}
            <button
              onClick={() => onInjectPresetScenario('combined_critical')}
              className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:border-red-500/50 transition-all text-left group col-span-2 sm:col-span-1"
            >
              <div className="text-red-400 font-bold mb-0.5 flex items-center justify-between">
                <span>🔴 Critical Flaw</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[10px] text-slate-500">Multi-sensor @ 1.20m</p>
            </button>
          </div>
        </div>
      </div>

      {/* Custom Injector Modal Dialog */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl font-mono">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                <PlusCircle className="w-4 h-4" />
                <span>INJECT CUSTOM SYNTHETIC ANOMALY</span>
              </h3>
              <button
                onClick={() => setShowCustomModal(false)}
                className="text-slate-500 hover:text-slate-300 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInjectCustom} className="space-y-4 text-xs">
              {/* Meter Location Slider */}
              <div>
                <label className="text-slate-400 block mb-1">
                  Track Location Marker (0.10m to 2.40m):
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="0.10"
                    max="2.40"
                    step="0.05"
                    value={customLoc}
                    onChange={(e) => setCustomLoc(parseFloat(e.target.value))}
                    className="flex-1 accent-amber-400"
                  />
                  <span className="text-amber-400 font-bold w-14 text-right">{customLoc.toFixed(2)} m</span>
                </div>
              </div>

              {/* Defect Type */}
              <div>
                <label className="text-slate-400 block mb-1">Defect Classification:</label>
                <select
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value as DefectType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="Surface Corrugation">Surface Corrugation (Vertical Jolt)</option>
                  <option value="Loose Joint / Fishplate Gap">Loose Joint / Fishplate Gap (Impact Peak)</option>
                  <option value="Gauge Widening">Gauge Widening / Track Spread (Laser +mm)</option>
                  <option value="Rail Flaw / Crack">Rail Flaw / Crack (Cross-Fusion)</option>
                  <option value="Ballast Settlement">Ballast Settlement (Bed Slump)</option>
                </select>
              </div>

              {/* Severity Level */}
              <div>
                <label className="text-slate-400 block mb-1">Severity Level:</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as SeverityLevel[]).map((sev) => (
                    <button
                      type="button"
                      key={sev}
                      onClick={() => setCustomSev(sev)}
                      className={`py-1.5 rounded-lg border text-[10px] font-bold ${
                        customSev === sev
                          ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                          : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold rounded-lg hover:from-amber-400 hover:to-amber-500 shadow-md shadow-amber-500/20"
                >
                  Inject Anomaly
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
