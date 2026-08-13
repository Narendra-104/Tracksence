import React, { useState } from 'react';
import { 
  Zap, 
  Sliders, 
  PlusCircle, 
  Activity, 
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
  trackLength = 2.50,
  onChangeTrackLength,
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
    <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4 sm:p-5 shadow-sm flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-100 font-mono uppercase tracking-wide">
              TRACK SETUP & ANOMALY SIMULATOR
            </h2>
            <p className="text-[11px] text-slate-400">Configure track size and trigger test scenarios</p>
          </div>
        </div>

        {/* Custom Defect Injector Button */}
        <button
          onClick={() => {
            setCustomLoc(Number(currentPosition.toFixed(2)));
            setShowCustomModal(!showCustomModal);
          }}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 transition-colors border border-slate-700/60 text-xs font-mono font-semibold flex items-center space-x-1.5"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Custom Anomaly</span>
        </button>
      </div>

      {/* Main Controls Grid */}
      <div className="space-y-4 font-mono">

        {/* Section 0: Track Size / Total Trackbed Length Selector */}
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>CONFIGURE TRACK SIZE:</span>
            </span>
            <span className="text-cyan-400 font-bold text-xs">{trackLength.toFixed(2)} meters</span>
          </div>

          {/* Quick Track Size Presets */}
          <div className="grid grid-cols-6 gap-1.5 text-[11px]">
            {[2.50, 5.00, 10.00, 25.00, 50.00, 100.00].map((len) => (
              <button
                key={len}
                onClick={() => onChangeTrackLength?.(len)}
                className={`py-1 rounded-lg border font-bold transition-all ${
                  Math.abs(trackLength - len) < 0.05
                    ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
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


        {/* Synthetic Defect Scenario Quick Injection Buttons */}
        <div>
          <label className="text-xs text-slate-400 font-semibold mb-2 block flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>PRESET ANOMALY SCENARIOS:</span>
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            {/* Scenario 1: Nominal Smooth */}
            <button
              onClick={() => onInjectPresetScenario('smooth')}
              className="p-2 rounded-xl bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 text-slate-300 transition-all text-left group"
            >
              <div className="text-emerald-400 font-bold mb-0.5 flex items-center justify-between text-[11px]">
                <span>🟢 Nominal</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[10px] text-slate-500">Smooth track</p>
            </button>

            {/* Scenario 2: Corrugation */}
            <button
              onClick={() => onInjectPresetScenario('corrugation')}
              className="p-2 rounded-xl bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 text-slate-300 transition-all text-left group"
            >
              <div className="text-amber-400 font-bold mb-0.5 flex items-center justify-between text-[11px]">
                <span>🟠 Corrugation</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[10px] text-slate-500">Vibration jolt</p>
            </button>

            {/* Scenario 3: Loose Joint */}
            <button
              onClick={() => onInjectPresetScenario('loose_joint')}
              className="p-2 rounded-xl bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 text-slate-300 transition-all text-left group"
            >
              <div className="text-amber-400 font-bold mb-0.5 flex items-center justify-between text-[11px]">
                <span>🟡 Loose Joint</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[10px] text-slate-500">Fishplate gap</p>
            </button>

            {/* Scenario 4: Gauge Widening */}
            <button
              onClick={() => onInjectPresetScenario('gauge_widening')}
              className="p-2 rounded-xl bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 text-slate-300 transition-all text-left group"
            >
              <div className="text-indigo-400 font-bold mb-0.5 flex items-center justify-between text-[11px]">
                <span>🟣 Gauge Spread</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[10px] text-slate-500">Laser +14mm</p>
            </button>

            {/* Scenario 5: Combined Critical */}
            <button
              onClick={() => onInjectPresetScenario('combined_critical')}
              className="p-2 rounded-xl bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 text-slate-300 transition-all text-left group col-span-2 sm:col-span-1"
            >
              <div className="text-red-400 font-bold mb-0.5 flex items-center justify-between text-[11px]">
                <span>🔴 Critical</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[10px] text-slate-500">Multi-sensor flaw</p>
            </button>
          </div>
        </div>
      </div>

      {/* Custom Injector Modal Dialog */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-5 shadow-2xl font-mono">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-xs font-bold text-amber-400 flex items-center gap-2">
                <PlusCircle className="w-4 h-4" />
                <span>INJECT CUSTOM ANOMALY</span>
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
                  Track Location Marker:
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="0.10"
                    max={Math.max(0.2, trackLength - 0.1)}
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
                  className="px-4 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-lg hover:bg-amber-400 shadow-sm"
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
