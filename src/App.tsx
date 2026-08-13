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
    { location: 1.95, defectType: 'Gauge Widening', severity: 'HIGH', gaugeDevMm: 14.0, vibrationAmpG: 0.7 }
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
      confidenceScore: 82,
      actionRequired: 'Re-gauge fasteners & check tie condition.',
      acknowledged: false,
      sensorTriggers: { vibrationSpike: false, gaugeSpread: true, opticalAnomaly: true }
    }
  ]);

  // Telemetry Stream
  const [currentTelemetry, setCurrentTelemetry] = useState<TelemetryPoint>({
    timestamp: Date.now(),
    position: 0.0,
    vibrationZ: 0.04,
    vibrationY: 0.02,
    gaugeMm: 1676.0,
    gaugeDevMm: 0.0,
    confidenceScore: 5,
    status: 'NOMINAL',
    laserSignalQuality: 98,
    cameraSharpness: 95
  });

  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPoint[]>([]);
  const [activeAlert, setActiveAlert] = useState<boolean>(false);

  // Modals
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [selectedDefectModal, setSelectedDefectModal] = useState<DefectRecord | null>(null);

  // References for tick calculation
  const lastTickTime = useRef<number>(performance.now());
  const lastWheelClickPos = useRef<number>(0.0);
  const runStartPosRef = useRef<number>(0.0);
  const loggedZonesThisPass = useRef<Set<number>>(new Set());

  // Handle Mute Toggle
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundEngine.setMuted(nextMuted);
  };

  // Change Total Track Length / Size
  const handleTrackLengthChange = (newLen: number) => {
    const validLen = Math.max(1.0, Number(newLen.toFixed(2)));
    setTrackLength(validLen);

    // Adjust target distance & position if out of bounds
    if (targetDistance > validLen || targetDistance === trackLength) {
      setTargetDistance(validLen);
    }
    if (position > validLen) {
      setPosition(validLen);
    }

    // Scale synthetic defect locations proportionally
    const scaleRatio = validLen / trackLength;
    setActiveDefectZones(prev =>
      prev.map(z => ({ ...z, location: Number((z.location * scaleRatio).toFixed(2)) }))
    );
  };

  // Toggle Play / Pause with position auto-adjustments
  const handleTogglePlay = () => {
    if (!isPlaying) {
      let startP = position;
      if (direction === 'FORWARD' && position >= trackLength) {
        startP = 0.0;
        setPosition(0.0);
      } else if (direction === 'REVERSE' && position <= 0.0) {
        startP = trackLength;
        setPosition(trackLength);
      }
      runStartPosRef.current = startP;
      lastWheelClickPos.current = startP;
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  const handleStopRun = () => {
    setIsPlaying(false);
  };

  // Start from specific end position
  const handleStartFromPosition = (startPos: number, dir?: DriveDirection) => {
    const newDir = dir || (startPos >= trackLength ? 'REVERSE' : 'FORWARD');
    setPosition(startPos);
    setDirection(newDir);
    runStartPosRef.current = startPos;
    lastWheelClickPos.current = startPos;
    setIsPlaying(true);
  };

  // Preset Scenario Injector
  const handleInjectPresetScenario = (scenario: PresetScenario) => {
    if (scenario === 'smooth') {
      setActiveDefectZones([]);
    } else if (scenario === 'corrugation') {
      setActiveDefectZones([
        { location: Number((trackLength * 0.34).toFixed(2)), defectType: 'Surface Corrugation', severity: 'HIGH', gaugeDevMm: 1.2, vibrationAmpG: 2.5 }
      ]);
    } else if (scenario === 'loose_joint') {
      setActiveDefectZones([
        { location: Number((trackLength * 0.58).toFixed(2)), defectType: 'Loose Joint / Fishplate Gap', severity: 'MEDIUM', gaugeDevMm: 3.5, vibrationAmpG: 2.1 }
      ]);
    } else if (scenario === 'gauge_widening') {
      setActiveDefectZones([
        { location: Number((trackLength * 0.78).toFixed(2)), defectType: 'Gauge Widening', severity: 'HIGH', gaugeDevMm: 14.5, vibrationAmpG: 0.6 }
      ]);
    } else if (scenario === 'combined_critical') {
      setActiveDefectZones([
        { location: Number((trackLength * 0.48).toFixed(2)), defectType: 'Rail Flaw / Crack', severity: 'CRITICAL', gaugeDevMm: 16.0, vibrationAmpG: 3.4 },
        { location: Number((trackLength * 0.84).toFixed(2)), defectType: 'Surface Corrugation', severity: 'HIGH', gaugeDevMm: 2.0, vibrationAmpG: 2.3 }
      ]);
    }
  };

  // Custom Defect Injector
  const handleInjectCustomDefect = (loc: number, type: DefectType, severity: SeverityLevel) => {
    let gaugeDev = 2.0;
    let ampG = 1.8;

    if (type === 'Gauge Widening') {
      gaugeDev = 14.0;
      ampG = 0.8;
    } else if (type === 'Surface Corrugation') {
      gaugeDev = 1.0;
      ampG = 2.6;
    } else if (type === 'Loose Joint / Fishplate Gap') {
      gaugeDev = 4.0;
      ampG = 2.2;
    } else if (type === 'Rail Flaw / Crack') {
      gaugeDev = 15.0;
      ampG = 3.2;
    }

    setActiveDefectZones(prev => [
      ...prev.filter(z => Math.abs(z.location - loc) > 0.1),
      { location: loc, defectType: type, severity, gaugeDevMm: gaugeDev, vibrationAmpG: ampG }
    ]);
  };

  // Reset Trolley Position
  const handleResetRun = () => {
    setIsPlaying(false);
    setPosition(0.0);
    setDirection('FORWARD');
    lastWheelClickPos.current = 0.0;
    runStartPosRef.current = 0.0;
    loggedZonesThisPass.current.clear();
  };

  // Seek Trolley Position
  const handleSeekPosition = (pos: number) => {
    const seekP = Math.min(trackLength, Math.max(0, pos));
    setPosition(seekP);
    lastWheelClickPos.current = seekP;
    runStartPosRef.current = seekP;
  };

  // Jump to Position and open modal
  const handleJumpToPosition = (loc: number) => {
    setPosition(loc);
    setIsPlaying(false);
  };

  // Main 60fps Telemetry Tick Loop
  useEffect(() => {
    let animationFrameId: number;

    const tick = (now: number) => {
      const dt = (now - lastTickTime.current) / 1000; // in seconds
      lastTickTime.current = now;

      let nextPos = position;

      if (isPlaying) {
        const step = speed * dt;

        if (direction === 'FORWARD') {
          nextPos = position + step;
          const covered = Math.max(0, nextPos - runStartPosRef.current);

          // Wheel click audio
          if (Math.abs(nextPos - lastWheelClickPos.current) >= 0.25) {
            soundEngine.playWheelClick();
            lastWheelClickPos.current = nextPos;
          }

          // Check limits against dynamic trackLength & targetDistance
          if (covered >= targetDistance || nextPos >= trackLength) {
            if (isLooping) {
              nextPos = 0.0;
              runStartPosRef.current = 0.0;
              lastWheelClickPos.current = 0.0;
              loggedZonesThisPass.current.clear();
            } else {
              nextPos = Math.min(trackLength, Math.max(0, runStartPosRef.current + targetDistance));
              setIsPlaying(false);
            }
          }
        } else {
          // REVERSE MODE
          nextPos = position - step;
          const covered = Math.max(0, runStartPosRef.current - nextPos);

          if (Math.abs(nextPos - lastWheelClickPos.current) >= 0.25) {
            soundEngine.playWheelClick();
            lastWheelClickPos.current = nextPos;
          }

          if (covered >= targetDistance || nextPos <= 0.0) {
            if (isLooping) {
              nextPos = trackLength;
              runStartPosRef.current = trackLength;
              lastWheelClickPos.current = trackLength;
              loggedZonesThisPass.current.clear();
            } else {
              nextPos = Math.max(0.0, Math.min(trackLength, runStartPosRef.current - targetDistance));
              setIsPlaying(false);
            }
          }
        }

        setPosition(nextPos);
        setEncoderPulseAccumulator(prev => prev + Math.round(step * 1000));
      }

      // Check active defect proximity
      let curVibZ = (Math.random() - 0.5) * 0.1; // Baseline rolling noise
      let curVibY = (Math.random() - 0.5) * 0.05;
      let curGaugeDev = (Math.random() - 0.5) * 0.4;
      let matchedDefectZone: any = null;

      activeDefectZones.forEach(zone => {
        const dist = Math.abs(nextPos - zone.location);
        if (dist <= 0.08) {
          // Gaussian proximity profile
          const proximity = Math.exp(-Math.pow(dist / 0.03, 2));
          curVibZ += (zone.vibrationAmpG + (Math.random() - 0.5) * 0.4) * proximity;
          curVibY += (zone.vibrationAmpG * 0.4 + (Math.random() - 0.5) * 0.2) * proximity;
          curGaugeDev += zone.gaugeDevMm * proximity;
          matchedDefectZone = zone;
        }
      });

      const measuredGauge = 1676.0 + curGaugeDev;

      // Sensor Fusion Score Calculation
      const vibScore = Math.min(50, (Math.abs(curVibZ) / 2.5) * 50);
      const gaugeScore = Math.min(50, (Math.abs(curGaugeDev) / 14) * 50);
      const confidence = Math.round(Math.min(100, vibScore + gaugeScore));

      let fusionStatus: 'NOMINAL' | 'ANOMALY' | 'DEFECT' = 'NOMINAL';
      if (confidence >= 66) fusionStatus = 'DEFECT';
      else if (confidence >= 35) fusionStatus = 'ANOMALY';

      setActiveAlert(confidence >= 66);

      // Play Alert Sound if high confidence
      if (confidence >= 66 && isPlaying) {
        soundEngine.playAlertBuzzer('CRITICAL');
      } else if (Math.abs(curVibZ) >= 1.5 && isPlaying) {
        soundEngine.playJoltSound(Math.abs(curVibZ));
      }

      // Auto-Log Defect to Table if new anomaly found in this pass
      if (matchedDefectZone && confidence >= 45 && !loggedZonesThisPass.current.has(matchedDefectZone.location)) {
        loggedZonesThisPass.current.add(matchedDefectZone.location);

        const newRecord: DefectRecord = {
          id: `def-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          location: matchedDefectZone.location,
          defectType: matchedDefectZone.defectType,
          severity: matchedDefectZone.severity,
          gaugeMm: measuredGauge,
          vibrationG: Math.abs(curVibZ),
          confidenceScore: confidence,
          actionRequired: matchedDefectZone.defectType === 'Surface Corrugation'
            ? 'Schedule rail grinding.'
            : matchedDefectZone.defectType === 'Gauge Widening'
            ? 'Re-gauge tie fasteners.'
            : 'Inspect joint bolt torque.',
          acknowledged: false,
          sensorTriggers: {
            vibrationSpike: Math.abs(curVibZ) > 1.2,
            gaugeSpread: Math.abs(curGaugeDev) > 6,
            opticalAnomaly: true
          }
        };

        setDefectLogs(prev => [newRecord, ...prev]);
      }

      const point: TelemetryPoint = {
        timestamp: now,
        position: nextPos,
        vibrationZ: curVibZ,
        vibrationY: curVibY,
        gaugeMm: measuredGauge,
        gaugeDevMm: curGaugeDev,
        confidenceScore: confidence,
        status: fusionStatus,
        laserSignalQuality: 98,
        cameraSharpness: 94
      };

      setCurrentTelemetry(point);

      setTelemetryHistory(prev => {
        const updated = [...prev, point];
        return updated.length > 40 ? updated.slice(updated.length - 40) : updated;
      });

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [position, speed, isPlaying, isLooping, direction, targetDistance, trackLength, activeDefectZones]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
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
        <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 shadow-xl flex flex-wrap items-center gap-3 font-mono">

          {/* Play / Pause */}
          <button
            onClick={handleTogglePlay}
            className={`px-5 py-2 rounded-xl text-sm font-bold flex items-center space-x-2 shadow-lg transition-all ${
              isPlaying
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-amber-500/20'
                : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-emerald-500/20'
            }`}
          >
            {isPlaying ? (
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            ) : (
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>
            )}
            <span>{isPlaying ? 'PAUSE' : 'START'}</span>
          </button>

          {/* Stop */}
          {isPlaying && (
            <button
              onClick={handleStopRun}
              className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 text-sm font-bold transition-colors"
            >
              ⏹ STOP
            </button>
          )}

          {/* Reset */}
          <button
            onClick={handleResetRun}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
            title="Reset to 0.00m"
          >
            ↺ RESET
          </button>

          {/* Divider */}
          <div className="w-px h-8 bg-slate-700 hidden sm:block" />

          {/* Direction Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDirection('FORWARD')}
              className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all ${
                direction === 'FORWARD'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              ▶ FORWARD
            </button>
            <button
              onClick={() => setDirection('REVERSE')}
              className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all ${
                direction === 'REVERSE'
                  ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              ◀ REVERSE
            </button>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-slate-700 hidden sm:block" />

          {/* Speed Slider */}
          <div className="flex items-center gap-2 flex-1 min-w-[160px] max-w-xs">
            <span className="text-slate-400 text-[11px] whitespace-nowrap">⚡ SPEED:</span>
            <input
              type="range"
              min="0.2"
              max="3.0"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="flex-1 accent-amber-400 cursor-pointer h-1.5 rounded-lg"
            />
            <span className="text-amber-400 font-bold text-xs w-14 text-right">{speed.toFixed(1)} m/s</span>
          </div>

          {/* Live position readout */}
          <div className="ml-auto bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-slate-400">POS:</span>
            <span className="text-amber-400 font-bold">{position.toFixed(2)} m</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400">{trackLength.toFixed(1)} m</span>
            <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${
              isPlaying
                ? direction === 'FORWARD'
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}>
              {isPlaying ? (direction === 'FORWARD' ? '⏩' : '⏪') : '⏸'}
            </span>
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
          onJumpToPosition={handleJumpToPosition}
          onClearLogs={() => setDefectLogs([])}
          onOpenDefectDetail={(def) => {
            setSelectedDefectModal(def);
            setIsReportModalOpen(true);
          }}
        />
      </main>

      {/* RDSO Inspection Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        defectLogs={defectLogs}
        selectedDefect={selectedDefectModal}
      />

      {/* Footer Status Line */}
      <footer className="border-t border-slate-900 bg-slate-950 py-3 px-4 text-center text-xs text-slate-500 font-mono">
        <span>TrackSense Railway Track Monitoring System • Indian Railways RDSO Lab Prototype</span>
      </footer>
    </div>
  );
}
