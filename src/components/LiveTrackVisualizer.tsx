import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Crosshair, Eye, AlertTriangle } from 'lucide-react';
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
  trackLength = 2.50,
}) => {
  const [showCameraFeed, setShowCameraFeed] = useState(true);
  const [hoveredPos, setHoveredPos] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const tieOffsetRef = useRef(0);

  const progressRatio = Math.min(1, Math.max(0, currentPosition / trackLength));

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    // Layout constants
    const PAD_X = 48;
    const trackW = W - PAD_X * 2;
    const CY = H / 2;
    const GAUGE = 44;
    const RAIL_T = 8;
    const RAIL_SIDE = 5;
    const TIE_W = 14;
    const TIE_H = GAUGE * 2 + 28;

    // Animate sleepers when playing
    if (isPlaying) {
      const shift = direction === '' ? 0.8 : -0.8;
      tieOffsetRef.current = (tieOffsetRef.current + shift + 38) % 38;
    }

    // ── Background (Clean Light Theme) ────────────────────────────────────
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#f8fafc');
    bgGrad.addColorStop(1, '#f1f5f9');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // ── Ballast bed ──────────────────────────────────────────────────────
    const bedTop = CY - GAUGE - 24;
    const bedBot = CY + GAUGE + 24 + RAIL_SIDE + 4;
    const ballastGrad = ctx.createLinearGradient(0, bedTop, 0, bedBot);
    ballastGrad.addColorStop(0, '#e2e8f0');
    ballastGrad.addColorStop(0.5, '#cbd5e1');
    ballastGrad.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = ballastGrad;
    ctx.beginPath();
    ctx.roundRect(PAD_X - 10, bedTop, trackW + 20, bedBot - bedTop, 4);
    ctx.fill();

    // Gravel dots
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(PAD_X - 10, bedTop, trackW + 20, bedBot - bedTop, 4);
    ctx.clip();
    for (let i = 0; i < 300; i++) {
      const gx = ((i * 97.3 + 11) % trackW) + PAD_X;
      const gy = bedTop + ((i * 41.7 + 7) % (bedBot - bedTop));
      const gr = 1 + (i % 3) * 0.6;
      ctx.beginPath();
      ctx.arc(gx, gy, gr, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${140 + (i % 40)},${150 + (i % 30)},${160 + (i % 25)},0.6)`;
      ctx.fill();
    }
    ctx.restore();

    // Subtle edge lines
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD_X - 10, bedTop); ctx.lineTo(PAD_X + trackW + 10, bedTop);
    ctx.moveTo(PAD_X - 10, bedBot); ctx.lineTo(PAD_X + trackW + 10, bedBot);
    ctx.stroke();

    // ── Sleepers (Wooden ties) ───────────────────────────────────────────
    const TIE_SPACING = 38;
    const numTies = Math.ceil(trackW / TIE_SPACING) + 2;
    const tieOffset = tieOffsetRef.current;

    for (let i = -1; i <= numTies; i++) {
      const tx = PAD_X + (i * TIE_SPACING - tieOffset % TIE_SPACING);
      if (tx < PAD_X - TIE_W || tx > PAD_X + trackW + TIE_W) continue;

      const ty = CY - TIE_H / 2;

      // Top face
      const tieGrad = ctx.createLinearGradient(tx, ty, tx + TIE_W, ty + TIE_H);
      tieGrad.addColorStop(0, '#78350f');
      tieGrad.addColorStop(0.5, '#92400e');
      tieGrad.addColorStop(1, '#78350f');
      ctx.fillStyle = tieGrad;
      ctx.beginPath();
      ctx.roundRect(tx - TIE_W / 2, ty, TIE_W, TIE_H, 2);
      ctx.fill();

      // Side face
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.rect(tx - TIE_W / 2, ty + TIE_H, TIE_W, RAIL_SIDE - 2);
      ctx.fill();

      // Bolt on each rail seat
      [-1, 1].forEach(side => {
        const bx = tx;
        const by = CY + side * GAUGE;
        ctx.beginPath();
        ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#475569';
        ctx.fill();
      });
    }

    // ── Steel Rails ──────────────────────────────────────────────────────
    const drawRail = (cy: number) => {
      const rx = PAD_X;
      const rw = trackW;

      // Side face
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.rect(rx, cy + RAIL_T / 2, rw, RAIL_SIDE);
      ctx.fill();

      // Top face
      const railBodyGrad = ctx.createLinearGradient(0, cy - RAIL_T / 2, 0, cy + RAIL_T / 2);
      railBodyGrad.addColorStop(0, '#475569');
      railBodyGrad.addColorStop(0.5, '#334155');
      railBodyGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = railBodyGrad;
      ctx.beginPath();
      ctx.rect(rx, cy - RAIL_T / 2, rw, RAIL_T);
      ctx.fill();

      // Top shiny line
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.rect(rx, cy - RAIL_T / 2, rw, 2);
      ctx.fill();
    };

    drawRail(CY - GAUGE);
    drawRail(CY + GAUGE);

    // ── Distance ticks ───────────────────────────────────────────────────
    const ticks = [0, 0.2, 0.4, 0.6, 0.8, 1.0];
    ticks.forEach(frac => {
      const tx = PAD_X + frac * trackW;
      const label = (frac * trackLength).toFixed(1) + 'm';
      const isEnd = frac === 0 || frac === 1;

      ctx.strokeStyle = isEnd ? '#d97706' : '#94a3b8';
      ctx.lineWidth = isEnd ? 1.5 : 1;
      ctx.setLineDash(isEnd ? [] : [3, 3]);
      ctx.beginPath();
      ctx.moveTo(tx, bedTop - 2);
      ctx.lineTo(tx, bedTop + 8);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = isEnd ? '#b45309' : '#64748b';
      ctx.font = `${isEnd ? 'bold ' : ''}10px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(isEnd ? (frac === 0 ? '0.00m' : `${trackLength.toFixed(2)}m`) : label, tx, bedTop - 4);
    });

    // ── Defect markers on track ───────────────────────────────────────────
    defects.forEach(defect => {
      const dx = PAD_X + (defect.location / trackLength) * trackW;
      const isCritical = defect.severity === 'CRITICAL' || defect.severity === 'HIGH';
      const color = isCritical ? '#dc2626' : '#d97706';

      // Vertical line
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(dx, CY - GAUGE - 16);
      ctx.lineTo(dx, CY + GAUGE + 16);
      ctx.stroke();
      ctx.setLineDash([]);

      // Badge
      const badgeW = 72;
      const badgeH = 18;
      const badgeY = CY - GAUGE - 34;
      ctx.fillStyle = isCritical ? '#fef2f2' : '#fffbeb';
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(dx - badgeW / 2, badgeY, badgeW, badgeH, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`⚠ ${defect.location.toFixed(2)}m`, dx, badgeY + badgeH / 2);
    });

    // ── Hover seek line ───────────────────────────────────────────────────
    if (hoveredPos !== null) {
      const hx = PAD_X + (hoveredPos / trackLength) * trackW;
      ctx.strokeStyle = '#0891b2';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(hx, bedTop - 2);
      ctx.lineTo(hx, bedBot + 2);
      ctx.stroke();
      ctx.setLineDash([]);

      const lbW = 86, lbH = 18;
      const lbX = Math.min(W - lbW - 4, Math.max(4, hx - lbW / 2));
      ctx.fillStyle = '#ecfeff';
      ctx.strokeStyle = '#0891b2';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(lbX, bedTop - 24, lbW, lbH, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#0e7490';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`Seek: ${hoveredPos.toFixed(2)}m`, lbX + lbW / 2, bedTop - 24 + lbH / 2);
    }

    // ── Trolley ───────────────────────────────────────────────────────────
    const TX = PAD_X + progressRatio * trackW;
    const TW = 90;
    const TH = 34;
    const WHEEL_R = 9;

    // Body Shadow
    ctx.beginPath();
    ctx.ellipse(TX, CY + GAUGE + 8, TW * 0.42, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fill();

    // Chassis body
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(TX - TW / 2, CY - TH / 2, TW, TH, 5);
    ctx.fill();

    // Amber stripe
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.roundRect(TX - TW / 2 + 4, CY - 2, TW - 8, 4, 2);
    ctx.fill();

    // Top sensor box
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(TX - 22, CY - TH / 2 - 12, 44, 12, 3);
    ctx.fill();

    // RPi label
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('RPi4 · MPU', TX, CY - TH / 2 - 6);

    // Laser LED dot
    ctx.beginPath();
    ctx.arc(TX, CY - TH / 2 - 12, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#dc2626';
    ctx.fill();

    // Wheels
    const wheelPositions = [
      { x: TX - TW * 0.32, y: CY - GAUGE },
      { x: TX + TW * 0.32, y: CY - GAUGE },
      { x: TX - TW * 0.32, y: CY + GAUGE },
      { x: TX + TW * 0.32, y: CY + GAUGE },
    ];

    const spokeAngle = (Date.now() / 140) * (isPlaying ? 1 : 0);
    wheelPositions.forEach(({ x: wx, y: wy }) => {
      ctx.beginPath();
      ctx.arc(wx, wy, WHEEL_R, 0, Math.PI * 2);
      ctx.fillStyle = '#334155';
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Spoke
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(wx, wy);
      ctx.lineTo(wx + Math.cos(spokeAngle) * WHEEL_R * 0.85, wy + Math.sin(spokeAngle) * WHEEL_R * 0.85);
      ctx.moveTo(wx, wy);
      ctx.lineTo(wx + Math.cos(spokeAngle) * WHEEL_R * 1.0, wy + Math.sin(spokeAngle) * WHEEL_R * 1.0);
      ctx.stroke();
    });

    // Laser lines across rails
    if (laserBeamActive) {
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(TX - TW * 0.55, CY - GAUGE);
      ctx.lineTo(TX + TW * 0.55, CY - GAUGE);
      ctx.moveTo(TX - TW * 0.55, CY + GAUGE);
      ctx.lineTo(TX + TW * 0.55, CY + GAUGE);
      ctx.stroke();
    }

    // Position pill label
    const labelW = 76;
    const labelH = 18;
    const labelX = Math.min(W - labelW - 2, Math.max(2, TX - labelW / 2));
    const labelY2 = CY + GAUGE + WHEEL_R + 8;
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.roundRect(labelX, labelY2, labelW, labelH, 9);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`📍 ${currentPosition.toFixed(2)}m`, labelX + labelW / 2, labelY2 + labelH / 2);

    animRef.current = requestAnimationFrame(draw);
  }, [currentPosition, progressRatio, trackLength, isPlaying, direction, defects, hoveredPos, laserBeamActive]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  // Seek handlers
  const getSeekPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const PAD_X = 48;
    const trackW = canvas.width - PAD_X * 2;
    const clickX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const ratio = Math.min(1, Math.max(0, (clickX - PAD_X) / trackW));
    return Number((ratio * trackLength).toFixed(2));
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getSeekPos(e);
    if (pos !== null) onSeekPosition(pos);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getSeekPos(e);
    if (pos !== null) setHoveredPos(pos);
  };

  const gridTicks = [0, 0.2, 0.4, 0.6, 0.8, 1].map(f => Number((f * trackLength).toFixed(1)));

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs relative overflow-hidden text-slate-800">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide font-mono flex items-center gap-2">
            <span>LIVE TRACK TELEMETRY VISUALIZER</span>
            <span className="bg-cyan-50 text-cyan-700 border border-cyan-200 text-[10px] px-2 py-0.5 rounded font-semibold">
              {trackLength.toFixed(2)} m
            </span>
          </h2>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono">
          <button
            onClick={() => setShowCameraFeed(!showCameraFeed)}
            className={`px-2.5 py-1 rounded-lg border transition-all flex items-center space-x-1.5 font-medium ${
              showCameraFeed ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{showCameraFeed ? '' : 'Show Camera'}</span>
          </button>

          <div className="bg-slate-50 px-3 py-1 rounded-lg border border-slate-200 text-slate-700">
            <span className="text-slate-500 mr-1">POS:</span>
            <span className="text-slate-900 font-bold">{currentPosition.toFixed(2)} m</span>
            <span className="text-slate-300 mx-1">/</span>
            <span className="text-slate-500">{trackLength.toFixed(1)} m</span>
          </div>

          <div className="bg-slate-50 px-3 py-1 rounded-lg border border-slate-200 text-slate-700">
            <span className="text-slate-500 mr-1">SPEED:</span>
            <span className="text-cyan-700 font-bold">{speed.toFixed(2)} m/s</span>
          </div>
        </div>
      </div>

      {/* 3D Straight Track Canvas */}
      <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-xs">
        <canvas
          ref={canvasRef}
          width={900}
          height={240}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={() => setHoveredPos(null)}
          className="w-full h-[200px] sm:h-[240px] cursor-crosshair block"
        />

        {/* Invisible clickable overlays for defects */}
        {defects.map(defect => {
          const pct = (defect.location / trackLength) * 100;
          return (
            <button
              key={defect.id}
              onClick={() => onSelectDefect?.(defect)}
              style={{ left: `${pct}%`, top: '50%', transform: 'translate(-50%, -50%)' }}
              className="absolute w-10 h-10 z-20 opacity-0 cursor-pointer"
              title={`${defect.defectType} @ ${defect.location.toFixed(2)}m`}
            />
          );
        })}

        {/* Motor status chip */}
        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-xs border border-slate-200 px-2.5 py-1 rounded-lg font-mono text-[10px] flex items-center gap-1.5 shadow-xs">
          <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-emerald-600' : 'bg-slate-400'}`} />
          <span className="text-slate-700 font-bold">
            {isPlaying ? (direction === 'FORWARD' ? 'BO MOTOR FWD' : '') : 'L298N STOPPED'}
          </span>
        </div>

        {/* Defect count chip */}
        {defects.length > 0 && (
          <div className="absolute top-2 right-2 bg-red-50 border border-red-200 text-red-700 px-2 py-1 rounded-lg font-mono text-[10px] flex items-center gap-1.5 font-bold shadow-xs">
            <AlertTriangle className="w-3 h-3 text-red-600" />
            <span>{defects.length} defect{defects.length > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Distance tick bar */}
      <div className="flex justify-between px-12 mt-1.5 text-[10px] font-mono text-slate-500 font-medium">
        {gridTicks.map((v, i) => (
          <span key={i} className={i === 0 || i === gridTicks.length - 1 ? 'text-amber-700 font-bold' : ''}>
            {i === 0 ? 'START' : i === gridTicks.length - 1 ? 'END' : `${v}m`}
          </span>
        ))}
      </div>

      {/* Optical Camera Feed */}
      {showCameraFeed && (
        <div className="mt-4 bg-slate-50 rounded-xl border border-slate-200 p-3 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-200 text-xs font-mono">
            <div className="flex items-center space-x-2 text-slate-700">
              <Crosshair className="w-3.5 h-3.5 text-red-600" />
              <span className="font-bold text-slate-900">OPTICAL LASER CAM FEED</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500">1080p @ 60 FPS</span>
            </div>
            <div className="flex items-center space-x-3 text-[11px]">
              <span className="text-slate-600">Gauge: <strong className="text-indigo-700">{latestTelemetry.gaugeMm.toFixed(1)} mm</strong></span>
              <span className="text-slate-600">Sharpness: <strong className="text-emerald-700">{latestTelemetry.cameraSharpness}%</strong></span>
            </div>
          </div>

          <div className="relative h-28 bg-white rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:16px_16px]" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-14 h-14 border border-dashed border-red-400 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-red-600 rounded-full" />
              </div>
            </div>

            <div className="relative w-4/5 h-12 flex items-center justify-between px-4">
              <div className="w-12 h-10 border-2 border-slate-400 bg-slate-100 rounded-t-lg relative flex items-center justify-center">
                <span className="text-[9px] font-mono text-slate-700 font-bold">L-RAIL</span>
                <div className="absolute -top-1 w-2 h-2 bg-red-600 rounded-full" />
              </div>
              <div className="flex-1 h-0.5 bg-gradient-to-r from-red-600 via-amber-500 to-red-600 relative flex items-center justify-center mx-2">
                <div className="bg-white text-slate-900 font-mono text-[10px] px-2 py-0.5 rounded border border-slate-300 font-bold shadow-xs">
                  {latestTelemetry.gaugeMm.toFixed(1)} mm
                </div>
              </div>
              <div className="w-12 h-10 border-2 border-slate-400 bg-slate-100 rounded-t-lg relative flex items-center justify-center">
                <span className="text-[9px] font-mono text-slate-700 font-bold">R-RAIL</span>
                <div className="absolute -top-1 w-2 h-2 bg-red-600 rounded-full" />
              </div>
            </div>

            {latestTelemetry.confidenceScore > 40 && (
              <div className="absolute top-2 right-4 bg-red-50 border border-red-200 text-red-700 text-[10px] font-mono px-2 py-1 rounded font-bold shadow-xs flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                <span>AI DEFECT DETECTED ({latestTelemetry.confidenceScore}%)</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
