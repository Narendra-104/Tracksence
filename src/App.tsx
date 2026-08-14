import React, { useState, useEffect, useRef } from 'react';
import { HeaderBar } from './components/HeaderBar';
import { LiveTrackVisualizer } from './components/LiveTrackVisualizer';
import { VibrationStreamChart } from './components/VibrationStreamChart';
import { OpticalGaugeChart } from './components/OpticalGaugeChart';
import { SensorFusionPanel } from './components/SensorFusionPanel';
import { AlertAndLogsPanel } from './components/AlertAndLogsPanel';
import { DemoControlPanel } from './components/DemoControlPanel';
import { ReportModal } from './components/ReportModal';
import { soundEngine } from './utils/audio';
import { DefectRecord, TelemetryPoint, PresetScenario, SeverityLevel, DefectType, DriveDirection } from './types';

export default function App() {
  // Trolley & Track Bed Config State
  const [trackLength, setTrackLength] = useState<number>(2.50); // Total track length in meters (e.g. 2.5m, 5m, 10m, 50m)
  const [position, setPosition] = useState<number>(0.0);
  const [speed, setSpeed] = useState<number>(0.8); // m/s
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [direction, setDirection] = useState<DriveDirection>('FORWARD');
  const [targetDistance, setTargetDistance] = useState<number>(2.50); // meters to travel before stopping
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [encoderPulseAccumulator, setEncoderPulseAccumulator] = useState<number>(0);

  // Active defects configured on the track bed
  const [activeDefectZones, setActiveDefectZones] = useState<{
    location: number;
    defectType: DefectType;
    severity: SeverityLevel;
    gaugeDevMm: number;
    vibrationAmpG: number;
  }>([
    { location: 0.85, defectType: 'Surface Corrugation', severity: 'HIGH', gaugeDevMm: 1.5, vibrationAmpG: 2.2 },
    { location: 1.45, defectType: 'Loose Joint / Fishplate Gap', severity: 'MEDIUM', gaugeDevMm: 3.0, vibrationAmpG: 1.8 },
    { location: 1.95, defectType: 'Gauge Widening', severity: 'HIGH', gaugeDevMm: 14.0, vibrationAmpG: 0.7 },
    { location: 1.0, defectType: 'Gauge Widening', severity: 'HIGH', gaugeDevMm: 14.0, vibrationAmpG: 0.7 }
  ]);

  // Logged Defect Records
  const [defectLogs, setDefectLogs] = useState<DefectRecord[]>([
    {
      id: 'def-1',
      timestamp: new Date(Date.now() - 360000).toLocaleTimeString(),
      location: 0.85,
      defectType: 'Surface Corrugation',
      severity: 'HIGH',
      gaugeMm: 1677.5,
      vibrationG: 2.2,
      confidenceScore: 78,
      actionRequired: 'Rail head grinding required within 48 hrs.',
      acknowledged: false,
      sensorTriggers: { vibrationSpike: true, gaugeSpread: false, opticalAnomaly: true }
    },
    {
      id: 'def-2',
      timestamp: new Date(Date.now() - 180000).toLocaleTimeString(),
      location: 1.95,
      defectType: 'Gauge Widening',
      severity: 'HIGH',
      gaugeMm: 1690.0,
      vibrationG: 0.7,
      confidenceScore: 85,
      actionRequired: 'Gauge tie realignment and spike replacement mandatory.',
      acknowledged: false,
      sensorTriggers: { vibrationSpike: false, gaugeSpread: true, opticalAnomaly: true }
    },
    {
      id: 'def-2',
      timestamp: new Date(Date.now() - 180000).toLocaleTimeString(),
      location: 1.0,
      defectType: 'Gauge Widening',
      severity: 'HIGH',
      gaugeMm: 1690.0,
      vibrationG: 0.7,
      confidenceScore: 85,
      actionRequired: 'Gauge tie realignment and spike replacement mandatory.',
      acknowledged: false,
      sensorTriggers: { vibrationSpike: false, gaugeSpread: true, opticalAnomaly: true }
    }
  ]);

  // Telemetry stream history
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPoint[]>([]);

  // Current real-time telemetry frame
  const [currentTelemetry, setCurrentTelemetry] = useState<TelemetryPoint>({
    position: 0.0,
    speed: 0.8,
    vibrationZ: 0.2,
    vibrationY: 0.05,
    gaugeMm: 1676.0,
    gaugeDevMm: 0.0,
    cameraSharpness: 98,
    confidenceScore: 12,
    status: 'NOMINAL',
    timestamp: new Date().toLocaleTimeString()
  });

  // UI Modal States
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [selectedDefectModal, setSelectedDefectModal] = useState<DefectRecord | null>(null);
  const [activeAlert, setActiveAlert] = useState<boolean>(false);

  // Synchronize audio engine mute state
  useEffect(() => {
    soundEngine.setMuted(isMuted);
  }, [isMuted]);

  // Master Simulation Loop
  useEffect(() => {
    let lastTime = performance.now();
    let animationFrameId: number;

    const tick = (now: number) => {
      const deltaSec = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      if (isPlaying) {
        // Calculate new position based on speed & direction
        let nextPos = position;
        const distStep = speed * deltaSec;

        if (direction === 'FORWARD') {
          nextPos += distStep;

          // Check target distance limit
          if (nextPos >= targetDistance) {
            nextPos = targetDistance;
            setIsPlaying(false);
            soundEngine.stopEngine();
          }

          // Check end of track
          if (nextPos >= trackLength) {
            if (isLooping) {
              nextPos = 0.0;
            } else {
              nextPos = trackLength;
              setIsPlaying(false);
              soundEngine.stopEngine();
            }
          }
        } else {
          // REVERSE direction
          nextPos -= distStep;

          if (nextPos <= 0.0) {
            if (isLooping) {
              nextPos = trackLength;
            } else {
              nextPos = 0.0;
              setIsPlaying(false);
              soundEngine.stopEngine();
            }
          }
        }

        setPosition(nextPos);

        // Update wheel rotation sound pitch
        soundEngine.updateEngineSound(speed, true);

        // Pulse count accumulator (e.g. 1000 pulses per meter)
        setEncoderPulseAccumulator(Math.floor(nextPos * 1000));
      } else {
        soundEngine.stopEngine();
      }

      // Check current position against configured defect zones
      let currentVibZ = (Math.random() - 0.5) * 0.25;
      let currentVibY = (Math.random() - 0.5) * 0.12;
      let currentGaugeDev = (Math.random() - 0.5) * 0.8;
      let currentScore = 12 + Math.random() * 5;
      let currentStatus: 'NOMINAL' | 'ANOMALY' | 'DEFECT' = 'NOMINAL';

      // Find if trolley is over a defect zone (within ±0.15m)
      const nearbyDefect = activeDefectZones.find(d => Math.abs(d.location - position) < 0.15);

      if (nearbyDefect) {
        // Synthesize sensor readings for this defect type
        if (nearbyDefect.defectType === 'Surface Corrugation' || nearbyDefect.defectType === 'Loose Joint / Fishplate Gap') {
          currentVibZ = (Math.random() > 0.3 ? 1.0 : -1.0) * (nearbyDefect.vibrationAmpG + (Math.random() - 0.5) * 0.6);
        }

        if (nearbyDefect.defectType === 'Gauge Widening') {
          currentGaugeDev = nearbyDefect.gaugeDevMm + (Math.random() - 0.5) * 1.2;
        }

        if (nearbyDefect.defectType === 'Rail Flaw / Crack') {
          currentVibZ = 1.8 + Math.random() * 0.8;
          currentGaugeDev = 4.5 + Math.random() * 2.0;
        }

        // Calculate AI confidence score
        const vibFactor = Math.min(100, (Math.abs(currentVibZ) / 2.5) * 50);
        const gaugeFactor = Math.min(100, (Math.abs(currentGaugeDev) / 15) * 50);
        currentScore = Math.round(vibFactor + gaugeFactor);

        if (currentScore > 65) {
          currentStatus = 'DEFECT';
          if (isPlaying) {
            soundEngine.playJoltSound(Math.abs(currentVibZ));
            soundEngine.triggerBuzzer();
            setActiveAlert(true);
            setTimeout(() => setActiveAlert(false), 2000);
          }
        } else if (currentScore > 35) {
          currentStatus = 'ANOMALY';
        }

        // Auto log new defect if not already logged at this location
        if (isPlaying && currentStatus === 'DEFECT') {
          setDefectLogs(prev => {
            const exists = prev.some(item => Math.abs(item.location - nearbyDefect.location) < 0.2);
            if (!exists) {
              const newRecord: DefectRecord = {
                id: `def-${Date.now().toString().slice(-4)}`,
                timestamp: new Date().toLocaleTimeString(),
                location: Number(nearbyDefect.location.toFixed(2)),
                defectType: nearbyDefect.defectType,
                severity: nearbyDefect.severity,
                gaugeMm: Number((1676.0 + currentGaugeDev).toFixed(1)),
                vibrationG: Number(Math.abs(currentVibZ).toFixed(2)),
                confidenceScore: currentScore,
                actionRequired: nearbyDefect.severity === 'HIGH' || nearbyDefect.severity === 'CRITICAL'
                  ? 'Urgent track engineering inspection directive issued.'
                  : 'Monitor during next maintenance cycle.',
                acknowledged: false,
                sensorTriggers: {
                  vibrationSpike: Math.abs(currentVibZ) > 1.5,
                  gaugeSpread: Math.abs(currentGaugeDev) > 8.0,
                  opticalAnomaly: true
                }
              };
              return [newRecord, ...prev];
            }
            return prev;
          });
        }
      }

      const point: TelemetryPoint = {
        position: Number(position.toFixed(2)),
        speed,
        vibrationZ: Number(currentVibZ.toFixed(2)),
        vibrationY: Number(currentVibY.toFixed(2)),
        gaugeMm: Number((1676.0 + currentGaugeDev).toFixed(1)),
        gaugeDevMm: Number(currentGaugeDev.toFixed(1)),
        cameraSharpness: Math.round(95 + (Math.random() - 0.5) * 6),
        confidenceScore: Math.round(currentScore),
        status: currentStatus,
        timestamp: new Date().toLocaleTimeString()
      };

      setCurrentTelemetry(point);

      // Keep rolling telemetry history buffer of 60 points
      setTelemetryHistory(prev => [...prev.slice(-59), point]);

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [position, speed, isPlaying, isLooping, direction, targetDistance, trackLength, activeDefectZones]);

  // Handlers
  const handleTogglePlay = () => {
    if (!isPlaying) {
      soundEngine.triggerJointClick();
    } else {
      soundEngine.stopEngine();
    }
    setIsPlaying(!isPlaying);
  };

  const handleStopRun = () => {
    setIsPlaying(false);
  };

  const handleResetRun = () => {
    setIsPlaying(false);
    setPosition(0.0);
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleSeekPosition = (pos: number) => {
    setPosition(pos);
  };

  const handleTrackLengthChange = (newLen: number) => {
    setTrackLength(newLen);
    if (targetDistance > newLen) setTargetDistance(newLen);
    if (position > newLen) setPosition(newLen);
  };

  const handleInjectPresetScenario = (scenario: PresetScenario) => {
    setIsPlaying(false);
    setPosition(0.0);

    if (scenario === 'smooth') {
      setActiveDefectZones([]);
      setDefectLogs([]);
    } else if (scenario === 'corrugation') {
      setActiveDefectZones([
        { location: 0.85, defectType: 'Surface Corrugation', severity: 'HIGH', gaugeDevMm: 1.0, vibrationAmpG: 2.4 }
      ]);
    } else if (scenario === 'loose_joint') {
      setActiveDefectZones([
        { location: 1.45, defectType: 'Loose Joint / Fishplate Gap', severity: 'MEDIUM', gaugeDevMm: 3.5, vibrationAmpG: 1.9 }
      ]);
    } else if (scenario === 'gauge_widening') {
      setActiveDefectZones([
        { location: 1.95, defectType: 'Gauge Widening', severity: 'HIGH', gaugeDevMm: 14.0, vibrationAmpG: 0.6 }
      ]);
    } else if (scenario === 'combined_critical') {
      setActiveDefectZones([
        { location: 1.20, defectType: 'Rail Flaw / Crack', severity: 'CRITICAL', gaugeDevMm: 16.0, vibrationAmpG: 2.8 }
      ]);
    }
  };

  const handleInjectCustomDefect = (location: number, type: DefectType, severity: SeverityLevel) => {
    const gaugeDev = type === 'Gauge Widening' ? 14.0 : 2.0;
    const vibAmp = type === 'Surface Corrugation' ? 2.5 : 1.2;

    setActiveDefectZones(prev => [
      ...prev,
      { location, defectType: type, severity, gaugeDevMm: gaugeDev, vibrationAmpG: vibAmp }
    ]);
  };

  const handleStartFromPosition = (startPos: number, startDir: DriveDirection = 'FORWARD') => {
    setPosition(startPos);
    setDirection(startDir);
    setIsPlaying(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Top Navigation Bar */}
      <HeaderBar
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onReset={handleResetRun}
        onOpenReportModal={() => {
          setSelectedDefectModal(null);
          setIsReportModalOpen(true);
        }}
        activeDefectCount={defectLogs.length}
        fusionStatus={currentTelemetry.status}
        encoderPulseCount={encoderPulseAccumulator || Math.floor(position * 1000)}
        direction={direction}
        isPlaying={isPlaying}
      />

      {/* Main Dashboard Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-5">

        {/* ── DRIVE CONTROL BAR — above the track ── */}
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-xs flex flex-wrap items-center gap-3 font-mono text-xs">

          {/* Play / Pause */}
          <button
            onClick={handleTogglePlay}
            className={`px-4 py-2 rounded-lg font-bold flex items-center space-x-2 transition-all ${
              isPlaying
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {isPlaying ? (
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            ) : (
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>
            )}
            <span>{isPlaying ? 'PAUSE' : 'START'}</span>
          </button>

          {/* Stop */}
          {isPlaying && (
            <button
              onClick={handleStopRun}
              className="px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold transition-colors"
            >
              STOP
            </button>
          )}

          {/* Reset */}
          <button
            onClick={handleResetRun}
            className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium border border-slate-300 transition-colors"
            title="Reset to 0.00m"
          >
            RESET
          </button>

          <div className="w-px h-6 bg-slate-200 hidden sm:block" />

          {/* Direction Toggle */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setDirection('FORWARD')}
              className={`px-3 py-1.5 rounded-lg font-semibold border transition-all ${
                direction === 'FORWARD'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              FORWARD
            </button>
            <button
              onClick={() => setDirection('REVERSE')}
              className={`px-3 py-1.5 rounded-lg font-semibold border transition-all ${
                direction === 'REVERSE'
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              REVERSE
            </button>
          </div>

          <div className="w-px h-6 bg-slate-200 hidden sm:block" />

          {/* Speed Slider */}
          <div className="flex items-center gap-2 min-w-[150px] max-w-xs">
            <span className="text-slate-600 font-medium text-[11px] whitespace-nowrap">SPEED:</span>
            <input
              type="range"
              min="0.2"
              max="3.0"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="flex-1 accent-amber-500 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
            />
            <span className="text-amber-700 font-bold text-xs w-12 text-right">{speed.toFixed(1)}m/s</span>
          </div>

          <div className="w-px h-6 bg-slate-200 hidden sm:block" />

          {/* BO Encoder Run Distance Limit */}
          <div className="flex items-center gap-2 min-w-[160px] max-w-xs">
            <span className="text-slate-600 font-medium text-[11px] whitespace-nowrap">LIMIT:</span>
            <input
              type="range"
              min="0.1"
              max={trackLength}
              step={trackLength > 20 ? "1" : "0.1"}
              value={targetDistance}
              onChange={(e) => setTargetDistance(parseFloat(e.target.value))}
              className="flex-1 accent-cyan-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
            />
            <span className="text-cyan-700 font-bold text-xs w-12 text-right">{targetDistance.toFixed(1)}m</span>
          </div>

          {/* Live position readout */}
          <div className="ml-auto bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-slate-500">POS:</span>
            <span className="text-slate-900 font-bold">{position.toFixed(2)} m</span>
            <span className="text-slate-400">/</span>
            <span className="text-slate-600">{trackLength.toFixed(1)} m</span>
          </div>
        </div>


        {/* Row 1: Interactive Track Visualizer */}
        <LiveTrackVisualizer
          currentPosition={position}
          speed={speed}
          isPlaying={isPlaying}
          latestTelemetry={currentTelemetry}
          defects={defectLogs}
          onSeekPosition={handleSeekPosition}
          onSelectDefect={(def) => {
            setSelectedDefectModal(def);
            setIsReportModalOpen(true);
          }}
          direction={direction}
          trackLength={trackLength}
        />


        {/* Row 2: Real-time Telemetry Streams (Vibration + Optical Gauge) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <VibrationStreamChart
            telemetryHistory={telemetryHistory}
            currentPoint={currentTelemetry}
          />

          <OpticalGaugeChart
            telemetryHistory={telemetryHistory}
            currentPoint={currentTelemetry}
          />
        </div>

        {/* Row 3: Sensor Fusion Widget & Demo Control Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7">
            <SensorFusionPanel
              currentTelemetry={currentTelemetry}
            />
          </div>

          <div className="lg:col-span-5">
            <DemoControlPanel
              isPlaying={isPlaying}
              onTogglePlay={handleTogglePlay}
              onStopRun={handleStopRun}
              onReset={handleResetRun}
              speed={speed}
              onChangeSpeed={setSpeed}
              isLooping={isLooping}
              onToggleLoop={() => setIsLooping(!isLooping)}
              direction={direction}
              onChangeDirection={setDirection}
              targetDistance={targetDistance}
              onChangeTargetDistance={setTargetDistance}
              trackLength={trackLength}
              onChangeTrackLength={handleTrackLengthChange}
              onStartFromPosition={handleStartFromPosition}
              onInjectPresetScenario={handleInjectPresetScenario}
              onInjectCustomDefect={handleInjectCustomDefect}
              currentPosition={position}
            />
          </div>
        </div>



        {/* Row 4: Auto-populating Alert & Log System Table */}
        <AlertAndLogsPanel
          defects={defectLogs}
          activeAlert={activeAlert}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onJumpToPosition={handleSeekPosition}
          onClearLogs={() => setDefectLogs([])}
          onOpenDefectDetail={(def) => {
            setSelectedDefectModal(def);
            setIsReportModalOpen(true);
          }}
        />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 text-center text-xs font-mono text-slate-500">
        TrackSense RDSO Demo Platform • Built for Raspberry Pi 4 Hardware Engine
      </footer>

      {/* Inspection Directive Report Modal */}
      {isReportModalOpen && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          defects={defectLogs}
          selectedDefect={selectedDefectModal}
          currentTelemetry={currentTelemetry}
          trackLength={trackLength}
        />
      )}
    </div>
  );
}
