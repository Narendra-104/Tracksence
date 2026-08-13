import React, { useState } from 'react';
import { 
  Crosshair, 
  MapPin, 
  Eye, 
  SlidersHorizontal, 
  AlertTriangle, 
  CheckCircle2, 
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';
import { DriveDirection, DefectRecord, TelemetryPoint } from '../types';


interface LiveTrackVisualizerProps {
  currentPosition: number;
  speed: number;
  isPlaying: boolean;
  latestTelemetry: TelemetryPoint;
  defects: DefectRecord[];
  onSeekPosition: (pos: number) => void;
  onSelectDefect?: (defect: DefectRecord) => void;
  laserBeamActive?: boolean;
  direction?: DriveDirection;
  trackLength?: number;
}

export const LiveTrackVisualizer: React.FC<LiveTrackVisualizerProps> = ({
  currentPosition,
  speed,
  isPlaying,
  latestTelemetry,
  defects,
  onSeekPosition,
  onSelectDefect,
  laserBeamActive = true,
  direction = 'FORWARD',
  trackLength = 2.50
}) => {
  const [showCameraFeed, setShowCameraFeed] = useState(true);
  const [hoveredPos, setHoveredPos] = useState<number | null>(null);

  // Percent along current configured track size
  const progressPercent = Math.min(100, Math.max(0, (currentPosition / trackLength) * 100));

  // Handle clicking track line to seek position
  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.min(1, Math.max(0, clickX / rect.width));
    const seekPos = Number((ratio * trackLength).toFixed(2));
    onSeekPosition(seekPos);
  };

  const handleTrackMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const moveX = e.clientX - rect.left;
    const ratio = Math.min(1, Math.max(0, moveX / rect.width));
    setHoveredPos(Number((ratio * trackLength).toFixed(2)));
  };

  // Generate 6 dynamic grid ticks for track length
  const gridTicks = [
    0.00,
    Number((trackLength * 0.2).toFixed(1)),
    Number((trackLength * 0.4).toFixed(1)),
    Number((trackLength * 0.6).toFixed(1)),
    Number((trackLength * 0.8).toFixed(1)),
    trackLength
  ];

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-xl relative overflow-hidden">
      {/* Visual Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono flex items-center gap-2">
            <span>Mock Track Testbed — Laser + MPU6050 Fusion</span>
            <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] px-2 py-0.5 rounded">
              TOTAL SIZE: {trackLength.toFixed(2)}m
            </span>
          </h2>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <button
            onClick={() => setShowCameraFeed(!showCameraFeed)}
            className={`px-2.5 py-1 rounded-lg border transition-all flex items-center space-x-1.5 ${
              showCameraFeed 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{showCameraFeed ? 'Hide Optical Camera' : 'Show Optical Camera'}</span>
          </button>

          <div className="bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 font-mono text-slate-300">
            <span className="text-slate-500 mr-1.5">BO ENC POS:</span>
            <span className="text-amber-400 font-bold text-sm">{currentPosition.toFixed(2)} m</span>
            <span className="text-slate-600 mx-1.5">/</span>
            <span className="text-slate-400">{trackLength.toFixed(2)} m</span>
          </div>

          <div className="bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 font-mono text-slate-300">
            <span className="text-slate-500 mr-1.5">VELOCITY:</span>
            <span className="text-cyan-400 font-bold text-sm">{speed.toFixed(2)} m/s</span>
            <span className="ml-1 text-[10px] text-indigo-400 font-bold">({direction})</span>
          </div>
        </div>
      </div>

      {/* Track Visualizer Stage */}
      <div className="relative py-3">
        {/* Trackbed Container with Horizontal Rail Background */}
        <div
          onClick={handleTrackClick}
          onMouseMove={handleTrackMouseMove}
          onMouseLeave={() => setHoveredPos(null)}
          className="relative h-48 rounded-xl border border-amber-500/40 cursor-crosshair overflow-hidden group select-none shadow-2xl bg-cover bg-center"
          style={{ backgroundImage: 'url("/railway_trackbed.jpg")' }}
        >
          {/* Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-slate-950/80 pointer-events-none" />

          {/* Dynamic Distance Grid Ticks Bar at bottom */}
          <div className="absolute bottom-0 inset-x-0 flex justify-between px-4 text-[11px] font-mono text-amber-300 font-bold pointer-events-none bg-slate-950/70 py-1 border-t border-slate-800">
            {gridTicks.map((tickVal, i) => (
              <span key={i}>
                {i === 0 ? '0.00m (START)' : i === gridTicks.length - 1 ? `${tickVal.toFixed(1)}m (END)` : `${tickVal}m`}
              </span>
            ))}
          </div>

          {/* Tagged Defect Markers on Track */}
          {defects.map((defect) => {
            const defPercent = (defect.location / trackLength) * 100;
            const isCritical = defect.severity === 'CRITICAL' || defect.severity === 'HIGH';

            return (
              <div
                key={defect.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectDefect?.(defect);
                }}
                style={{ left: `${defPercent}%` }}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 cursor-pointer group/marker"
              >
                {/* Defect Pulsing Beacon */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-transform group-hover/marker:scale-125 shadow-xl ${
                  isCritical 
                    ? 'bg-red-500/40 border-red-500 text-red-300 animate-bounce' 
                    : 'bg-amber-500/40 border-amber-500 text-amber-300'
                }`}>
                  <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
                </div>

                {/* Defect Label Flag */}
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-950 border border-slate-700 text-[10px] font-mono px-2 py-0.5 rounded shadow-xl text-slate-200 pointer-events-none opacity-90 group-hover/marker:opacity-100">
                  <span className="text-amber-400 font-bold">{defect.location.toFixed(2)}m:</span> {defect.defectType}
                </div>
              </div>
            );
          })}

          {/* Mouse Hover Position Indicator Line */}
          {hoveredPos !== null && (
            <div
              style={{ left: `${(hoveredPos / trackLength) * 100}%` }}
              className="absolute top-0 bottom-0 border-l-2 border-dashed border-cyan-400 pointer-events-none z-10"
            >
              <div className="absolute top-2 left-1 bg-cyan-950/90 text-cyan-300 border border-cyan-500/60 text-[9px] font-mono px-1.5 py-0.5 rounded font-bold shadow-lg">
                Seek: {hoveredPos.toFixed(2)}m
              </div>
            </div>
          )}

          {/* Real-life Inspection Trolley Cart Rolling Straight Along Rail Length */}
          <div
            style={{ left: `${progressPercent}%` }}
            className="absolute top-0 bottom-0 -translate-x-1/2 z-30 pointer-events-none transition-all duration-75 ease-out flex flex-col justify-between py-1"
          >
            {/* Trolley Chassis Aligned Horizontally with Rails */}
            <div className="relative w-48 h-32 my-auto flex items-center justify-center">
              {/* Photorealistic Horizontal Trolley Texture Image */}
              <img
                src="/inspection_trolley.jpg"
                alt="Track Monitoring Trolley"
                className="w-full h-full object-contain filter brightness-110 contrast-105 drop-shadow-[0_12px_20px_rgba(0,0,0,0.9)]"
              />

              {/* Dynamic Rotary Encoder Wheel Spinner Overlay on Rail Encoder Unit */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full border-2 border-amber-400 bg-slate-950/90 flex items-center justify-center shadow-lg">
                <div className={`w-4 h-4 rounded-full border border-amber-300 bg-amber-500/30 flex items-center justify-center ${isPlaying ? 'animate-spin' : ''}`}>
                  <div className="w-0.5 h-3 bg-amber-400" />
                </div>
              </div>

              {/* Status Badge Overlay — RPi 4 Hardware */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-slate-950/90 border border-amber-500/60 px-2 py-0.5 rounded text-[8px] font-mono font-bold text-amber-300 text-center shadow-2xl backdrop-blur-xs">
                <div>RPi 4 · MPU6050 · Laser Cam</div>
                <div className="text-[7px] text-cyan-400">
                  {isPlaying ? (direction === 'FORWARD' ? `⏩ BO MOTOR FWD (0m→${trackLength.toFixed(1)}m)` : `⏪ BO MOTOR REV (${trackLength.toFixed(1)}m→0m)`) : '⏹️ L298N STOPPED'}
                </div>
              </div>

              {/* Active Optical Laser Sensor Beams Across Track Rails */}
              {laserBeamActive && (
                <>
                  <div className="absolute inset-y-1 left-4 w-[2px] bg-red-500 shadow-[0_0_12px_#ef4444] animate-pulse" />
                  <div className="absolute inset-y-1 right-4 w-[2px] bg-red-500 shadow-[0_0_12px_#ef4444] animate-pulse" />
                </>
              )}
            </div>

            {/* Position Cursor Tag Below */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 font-mono font-bold text-[10px] px-2.5 py-0.5 rounded-full shadow-2xl flex items-center space-x-1 whitespace-nowrap border border-amber-300">
              <MapPin className="w-3 h-3 text-slate-950" />
              <span>{currentPosition.toFixed(2)}m</span>
            </div>
          </div>
        </div>
      </div>



      {/* Simulated Optical Triangulation Camera Feed Overlay */}
      {showCameraFeed && (
        <div className="mt-4 bg-slate-950 rounded-xl border border-slate-800 p-3 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800 text-xs">
            <div className="flex items-center space-x-2 text-slate-300 font-mono">
              <Crosshair className="w-3.5 h-3.5 text-red-400 animate-spin" />
              <span className="font-bold text-amber-400">OPTICAL LASER TRIANGULATION CAM</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">1080p @ 60 FPS</span>
            </div>

            <div className="flex items-center space-x-3 text-[11px] font-mono">
              <span className="text-slate-400">
                Gauge: <strong className="text-indigo-400">{latestTelemetry.gaugeMm.toFixed(1)} mm</strong>
              </span>
              <span className="text-slate-400">
                Sharpness: <strong className="text-emerald-400">{latestTelemetry.cameraSharpness}%</strong>
              </span>
            </div>
          </div>

          {/* Camera Viewport Simulation */}
          <div className="relative h-28 bg-slate-900/90 rounded-lg border border-slate-800/80 overflow-hidden flex items-center justify-center">
            {/* Grid Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:16px_16px] opacity-40" />

            {/* Center Reticle */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 border border-dashed border-red-500/40 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
              </div>
            </div>

            {/* Laser Line Profile Across Rail Cross Section */}
            <div className="relative w-4/5 h-12 flex items-center justify-between px-4">
              {/* Left Rail Profile */}
              <div className="w-12 h-10 border-2 border-cyan-400/80 bg-cyan-950/40 rounded-t-lg relative flex items-center justify-center">
                <span className="text-[9px] font-mono text-cyan-300">L-RAIL</span>
                {/* Laser Point */}
                <div className="absolute -top-1 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_#ef4444]" />
              </div>

              {/* Optical Laser Distance Gauge Line */}
              <div className="flex-1 h-0.5 bg-gradient-to-r from-red-500 via-amber-400 to-red-500 relative flex items-center justify-center mx-2">
                <div className="bg-slate-950 text-amber-300 font-mono text-[10px] px-2 py-0.5 rounded border border-amber-500/40 shadow-sm">
                  {latestTelemetry.gaugeMm.toFixed(1)} mm
                </div>
              </div>

              {/* Right Rail Profile */}
              <div className="w-12 h-10 border-2 border-cyan-400/80 bg-cyan-950/40 rounded-t-lg relative flex items-center justify-center">
                <span className="text-[9px] font-mono text-cyan-300">R-RAIL</span>
                {/* Laser Point */}
                <div className="absolute -top-1 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_#ef4444]" />
              </div>
            </div>

            {/* AI Bounding Box Overlay if Anomaly detected */}
            {latestTelemetry.confidenceScore > 40 && (
              <div className="absolute top-2 right-4 bg-red-500/20 border-2 border-red-500 text-red-300 text-[10px] font-mono px-2 py-1 rounded shadow-lg flex items-center space-x-1.5 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <span>AI DEFECT DETECTED ({latestTelemetry.confidenceScore}%)</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
