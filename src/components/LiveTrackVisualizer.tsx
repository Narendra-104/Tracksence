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
    const PAD_X = 48;           // left/right padding
    const trackW = W - PAD_X * 2; // usable track width
    const CY = H / 2;           // vertical center
    const GAUGE = 44;           // half-gauge between rails (px)
    const RAIL_T = 8;           // rail height (3D top face)
    const RAIL_SIDE = 5;        // rail side face height (3D depth)
    const TIE_W = 14;           // sleeper width
    const TIE_H = GAUGE * 2 + 28; // sleeper full height

    // Animate sleepers when playing
    if (isPlaying) {
      const shift = direction === 'FORWARD' ? 0.8 : -0.8;
      tieOffsetRef.current = (tieOffsetRef.current + shift + 38) % 38;
    }

    // ── Background ─────────────────────────────────────────────────────────
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#0a0f1a');
    bgGrad.addColorStop(1, '#111827');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // ── Ballast bed (trapezoid shape giving 3D depth illusion) ────────────
    const bedTop = CY - GAUGE - 24;
    const bedBot = CY + GAUGE + 24 + RAIL_SIDE + 4;
    const ballastGrad = ctx.createLinearGradient(0, bedTop, 0, bedBot);
    ballastGrad.addColorStop(0, '#1c1a16');
    ballastGrad.addColorStop(0.4, '#2a2620');
    ballastGrad.addColorStop(1, '#1a1712');
    ctx.fillStyle = ballastGrad;
    ctx.beginPath();
    ctx.roundRect(PAD_X - 10, bedTop, trackW + 20, bedBot - bedTop, 4);
    ctx.fill();

    // Gravel texture dots
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(PAD_X - 10, bedTop, trackW + 20, bedBot - bedTop, 4);
    ctx.clip();
    for (let i = 0; i < 320; i++) {
      const gx = ((i * 97.3 + 11) % trackW) + PAD_X;
      const gy = bedTop + ((i * 41.7 + 7) % (bedBot - bedTop));
      const gr = 1 + (i % 3) * 0.7;
      ctx.beginPath();
      ctx.arc(gx, gy, gr, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${80 + (i % 40)},${70 + (i % 30)},${55 + (i % 25)},0.55)`;
      ctx.fill();
    }
    ctx.restore();

    // Subtle edge shadow lines
    ctx.strokeStyle = '#0a0806';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(PAD_X - 10, bedTop + 2);
    ctx.lineTo(PAD_X + trackW + 10, bedTop + 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(PAD_X - 10, bedBot - 2);
    ctx.lineTo(PAD_X + trackW + 10, bedBot - 2);
    ctx.stroke();

    // ── Sleepers (cross-ties) ─────────────────────────────────────────────
    const TIE_SPACING = 38;
    const numTies = Math.ceil(trackW / TIE_SPACING) + 2;
    const tieOffset = tieOffsetRef.current;

    for (let i = -1; i <= numTies; i++) {
      const tx = PAD_X + (i * TIE_SPACING - tieOffset % TIE_SPACING);
      if (tx < PAD_X - TIE_W || tx > PAD_X + trackW + TIE_W) continue;

      const ty = CY - TIE_H / 2;

      // Top face
      const tieGrad = ctx.createLinearGradient(tx, ty, tx + TIE_W, ty + TIE_H);
      tieGrad.addColorStop(0, '#5c4a30');
      tieGrad.addColorStop(0.5, '#6b5638');
      tieGrad.addColorStop(1, '#4a3820');
      ctx.fillStyle = tieGrad;
      ctx.beginPath();
      ctx.roundRect(tx - TIE_W / 2, ty, TIE_W, TIE_H, 2);
      ctx.fill();

      // Side face (3D depth)
      ctx.fillStyle = '#2e2216';
      ctx.beginPath();
      ctx.rect(tx - TIE_W / 2, ty + TIE_H, TIE_W, RAIL_SIDE - 2);
      ctx.fill();

      // Wood grain lines
      ctx.strokeStyle = '#4a3820';
      ctx.lineWidth = 0.5;
      [0.25, 0.5, 0.75].forEach(f => {
        ctx.beginPath();
        ctx.moveTo(tx - TIE_W / 2, ty + TIE_H * f);
        ctx.lineTo(tx + TIE_W / 2, ty + TIE_H * f);
        ctx.stroke();
      });

      // Spike bolt on each rail seat
      [-1, 1].forEach(side => {
        const bx = tx;
        const by = CY + side * GAUGE;
        ctx.beginPath();
        ctx.arc(bx, by, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#888';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(bx, by, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#aaa';
        ctx.fill();
      });
    }

    // ── Draw one steel rail ───────────────────────────────────────────────
    const drawRail = (cy: number) => {
      const rx = PAD_X;
      const rw = trackW;

      // Rail web / base (side face — 3D depth)
      ctx.fillStyle = '#1e1e1e';
      ctx.beginPath();
      ctx.rect(rx, cy + RAIL_T / 2, rw, RAIL_SIDE);
      ctx.fill();

      // Rail body (top face)
      const railBodyGrad = ctx.createLinearGradient(0, cy - RAIL_T / 2, 0, cy + RAIL_T / 2);
      railBodyGrad.addColorStop(0, '#6b6b6b');
      railBodyGrad.addColorStop(0.5, '#4a4a4a');
      railBodyGrad.addColorStop(1, '#2d2d2d');
      ctx.fillStyle = railBodyGrad;
      ctx.beginPath();
      ctx.rect(rx, cy - RAIL_T / 2, rw, RAIL_T);
      ctx.fill();

      // Rail head highlight (bright worn top)
      const highlightGrad = ctx.createLinearGradient(rx, cy - RAIL_T / 2, rx + rw, cy - RAIL_T / 2);
      for (let i = 0; i <= 20; i++) {
        const f = i / 20;
        const brightness = 0.4 + Math.sin(f * Math.PI * 6) * 0.15;
        highlightGrad.addColorStop(f, `rgba(200,200,200,${brightness})`);
      }
      ctx.fillStyle = highlightGrad;
      ctx.beginPath();
      ctx.rect(rx, cy - RAIL_T / 2, rw, 2.5);
      ctx.fill();

      // Rail bolted joint marks every ~120px
      for (let jx = rx + 60; jx < rx + rw - 30; jx += 120) {
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.roundRect(jx - 3, cy - RAIL_T / 2 - 1, 6, RAIL_T + RAIL_SIDE + 1, 1);
        ctx.fill();
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(jx - 3, cy - RAIL_T / 2 - 1, 6, RAIL_T + RAIL_SIDE + 1);
      }
    };

    drawRail(CY - GAUGE); // top rail
    drawRail(CY + GAUGE); // bottom rail

    // ── Distance ruler ticks above track ─────────────────────────────────
    const ticks = [0, 0.2, 0.4, 0.6, 0.8, 1.0];
    ticks.forEach(frac => {
      const tx = PAD_X + frac * trackW;
      const label = (frac * trackLength).toFixed(1) + 'm';
      const isEnd = frac === 0 || frac === 1;

      ctx.strokeStyle = isEnd ? '#f59e0b66' : '#33415566';
      ctx.lineWidth = isEnd ? 1.5 : 1;
      ctx.setLineDash(isEnd ? [] : [3, 3]);
      ctx.beginPath();
      ctx.moveTo(tx, bedTop - 4);
      ctx.lineTo(tx, bedTop + 8);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = isEnd ? '#f59e0b' : '#475569';
      ctx.font = `${isEnd ? 'bold ' : ''}10px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(isEnd ? (frac === 0 ? '0.00m ▼' : `${trackLength.toFixed(2)}m ▼`) : label, tx, bedTop - 6);
    });

    // ── Defect markers on track ───────────────────────────────────────────
    defects.forEach(defect => {
      const dx = PAD_X + (defect.location / trackLength) * trackW;
      const isCritical = defect.severity === 'CRITICAL' || defect.severity === 'HIGH';
      const color = isCritical ? '#ef4444' : '#f59e0b';

      // Glow halo
      const glow = ctx.createRadialGradient(dx, CY, 0, dx, CY, 36);
      glow.addColorStop(0, isCritical ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.25)');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(dx, CY, 36, 0, Math.PI * 2);
      ctx.fill();

      // Vertical marker line
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(dx, CY - GAUGE - 20);
      ctx.lineTo(dx, CY + GAUGE + 20);
      ctx.stroke();
      ctx.setLineDash([]);

      // Badge
      const badgeW = 72;
      const badgeH = 18;
      const badgeY = CY - GAUGE - 38;
      ctx.fillStyle = isCritical ? '#7f1d1d' : '#78350f';
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
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(hx, bedTop - 2);
      ctx.lineTo(hx, bedBot + 2);
      ctx.stroke();
      ctx.setLineDash([]);

      const lbW = 86, lbH = 18;
      const lbX = Math.min(W - lbW - 4, Math.max(4, hx - lbW / 2));
      ctx.fillStyle = '#083344';
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(lbX, bedTop - 24, lbW, lbH, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#22d3ee';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`Seek: ${hoveredPos.toFixed(2)} m`, lbX + lbW / 2, bedTop - 24 + lbH / 2);
    }

    // ── Trolley ───────────────────────────────────────────────────────────
    const TX = PAD_X + progressRatio * trackW;
    const TW = 90;  // trolley body width
    const TH = 34;  // trolley body height
    const WHEEL_R = 9;
    const WHEEL_Y = CY; // wheels sit on rail center

    // Shadow
    ctx.beginPath();
    ctx.ellipse(TX, CY + GAUGE + 8, TW * 0.42, 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fill();

    // Chassis body (3D box: top face + side face)
    // Side face (bottom)
    const sideGrad = ctx.createLinearGradient(TX - TW / 2, CY, TX - TW / 2, CY + 8);
    sideGrad.addColorStop(0, '#1e2a3a');
    sideGrad.addColorStop(1, '#111820');
    ctx.fillStyle = sideGrad;
    ctx.beginPath();
    ctx.roundRect(TX - TW / 2, CY - TH / 2 + TH, TW, 8, [0, 0, 3, 3]);
    ctx.fill();

    // Top face
    const bodyGrad = ctx.createLinearGradient(TX, CY - TH / 2, TX, CY + TH / 2);
    bodyGrad.addColorStop(0, '#3b5068');
    bodyGrad.addColorStop(0.5, '#2d3e52');
    bodyGrad.addColorStop(1, '#1e2a38');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.roundRect(TX - TW / 2, CY - TH / 2, TW, TH, 5);
    ctx.fill();
    ctx.strokeStyle = '#4a6580';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Amber accent stripe
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.roundRect(TX - TW / 2 + 4, CY - 3, TW - 8, 5, 2);
    ctx.fill();

    // Sensor box on top
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#f59e0b66';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(TX - 22, CY - TH / 2 - 14, 44, 14, 3);
    ctx.fill();
    ctx.stroke();

    // RPi label on sensor box
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('RPi4 · MPU6050', TX, CY - TH / 2 - 7);

    // Laser line module indicator dot on top
    ctx.beginPath();
    ctx.arc(TX, CY - TH / 2 - 14, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ff2020';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Wheels — flanged, sitting on the two rails
    const wheelPositions = [
      { x: TX - TW * 0.32, y: CY - GAUGE },
      { x: TX + TW * 0.32, y: CY - GAUGE },
      { x: TX - TW * 0.32, y: CY + GAUGE },
      { x: TX + TW * 0.32, y: CY + GAUGE },
    ];

    const spokeAngle = (Date.now() / 140) * (isPlaying ? 1 : 0);
    wheelPositions.forEach(({ x: wx, y: wy }) => {
      // Wheel body
      ctx.beginPath();
      ctx.arc(wx, wy, WHEEL_R, 0, Math.PI * 2);
      ctx.fillStyle = '#1a1a1a';
      ctx.fill();
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Flange ring
      ctx.beginPath();
      ctx.arc(wx, wy, WHEEL_R * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = '#2d2d2d';
      ctx.fill();

      // Encoder spoke (spins when running)
      ctx.strokeStyle = '#f59e0b99';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(wx, wy);
      ctx.lineTo(wx + Math.cos(spokeAngle) * WHEEL_R * 0.85, wy + Math.sin(spokeAngle) * WHEEL_R * 0.85);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(wx, wy);
      ctx.lineTo(wx + Math.cos(spokeAngle + Math.PI) * WHEEL_R * 0.85, wy + Math.sin(spokeAngle + Math.PI) * WHEEL_R * 0.85);
      ctx.stroke();
    });

    // Laser beams from trolley across both rails
    if (laserBeamActive) {
      ctx.save();
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 10;
      // Top rail beam
      const laserGrad1 = ctx.createLinearGradient(TX - TW * 0.55, CY - GAUGE, TX + TW * 0.55, CY - GAUGE);
      laserGrad1.addColorStop(0, 'rgba(255,30,30,0)');
      laserGrad1.addColorStop(0.5, '#ff3030');
      laserGrad1.addColorStop(1, 'rgba(255,30,30,0)');
      ctx.strokeStyle = laserGrad1;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(TX - TW * 0.55, CY - GAUGE);
      ctx.lineTo(TX + TW * 0.55, CY - GAUGE);
      ctx.stroke();
      // Bottom rail beam
      const laserGrad2 = ctx.createLinearGradient(TX - TW * 0.55, CY + GAUGE, TX + TW * 0.55, CY + GAUGE);
      laserGrad2.addColorStop(0, 'rgba(255,30,30,0)');
      laserGrad2.addColorStop(0.5, '#ff3030');
      laserGrad2.addColorStop(1, 'rgba(255,30,30,0)');
      ctx.strokeStyle = laserGrad2;
      ctx.beginPath();
      ctx.moveTo(TX - TW * 0.55, CY + GAUGE);
      ctx.lineTo(TX + TW * 0.55, CY + GAUGE);
      ctx.stroke();
      ctx.restore();
    }

    // ── Position label under trolley ──────────────────────────────────────
    const labelW = 78;
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
    ctx.fillText(`📍 ${currentPosition.toFixed(2)} m`, labelX + labelW / 2, labelY2 + labelH / 2);

    animRef.current = requestAnimationFrame(draw);
  }, [currentPosition, progressRatio, trackLength, isPlaying, direction, defects, hoveredPos, laserBeamActive]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  // ── Seek handlers ────────────────────────────────────────────────────────
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
    <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4 sm:p-5 shadow-sm relative overflow-hidden">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wide font-mono flex items-center gap-2">
            <span>LIVE TRACK TELEMETRY VISUALIZER</span>
            <span className="bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[10px] px-2 py-0.5 rounded">
              {trackLength.toFixed(2)} m
            </span>
          </h2>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono">
          <button
            onClick={() => setShowCameraFeed(!showCameraFeed)}
            className={`px-2.5 py-1 rounded-lg border transition-all flex items-center space-x-1.5 ${
              showCameraFeed ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-slate-800 border-slate-700/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{showCameraFeed ? 'Hide Camera' : 'Show Camera'}</span>
          </button>

          <div className="bg-slate-950/60 px-3 py-1 rounded-lg border border-slate-800 text-slate-300">
            <span className="text-slate-500 mr-1.5">POS:</span>
            <span className="text-amber-400 font-bold">{currentPosition.toFixed(2)} m</span>
            <span className="text-slate-600 mx-1.5">/</span>
            <span className="text-slate-400">{trackLength.toFixed(2)} m</span>
          </div>

          <div className="bg-slate-950/60 px-3 py-1 rounded-lg border border-slate-800 text-slate-300">
            <span className="text-slate-500 mr-1.5">SPEED:</span>
            <span className="text-cyan-400 font-bold">{speed.toFixed(2)} m/s</span>
          </div>
        </div>
      </div>

      {/* 3D Straight Track Canvas */}
      <div className="relative rounded-xl overflow-hidden border border-slate-700/60 shadow-2xl">
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
        <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-sm border border-slate-700 px-2.5 py-1 rounded-lg font-mono text-[10px] flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
          <span className="text-slate-400">
            {isPlaying ? (direction === 'FORWARD' ? '⏩ BO MOTOR FWD' : '⏪ BO MOTOR REV') : '⏸ L298N STOPPED'}
          </span>
        </div>

        {/* Defect count chip */}
        {defects.length > 0 && (
          <div className="absolute top-2 right-2 bg-red-500/20 border border-red-500/40 text-red-400 px-2 py-1 rounded-lg font-mono text-[10px] flex items-center gap-1.5 animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            <span>{defects.length} defect{defects.length > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Distance tick bar */}
      <div className="flex justify-between px-12 mt-1.5 text-[10px] font-mono text-slate-500">
        {gridTicks.map((v, i) => (
          <span key={i} className={i === 0 || i === gridTicks.length - 1 ? 'text-amber-500 font-bold' : ''}>
            {i === 0 ? 'START' : i === gridTicks.length - 1 ? 'END' : `${v}m`}
          </span>
        ))}
      </div>

      {/* Optical Camera Feed */}
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
              <span className="text-slate-400">Gauge: <strong className="text-indigo-400">{latestTelemetry.gaugeMm.toFixed(1)} mm</strong></span>
              <span className="text-slate-400">Sharpness: <strong className="text-emerald-400">{latestTelemetry.cameraSharpness}%</strong></span>
            </div>
          </div>

          <div className="relative h-28 bg-slate-900/90 rounded-lg border border-slate-800/80 overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:16px_16px] opacity-40" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 border border-dashed border-red-500/40 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
              </div>
            </div>

            <div className="relative w-4/5 h-12 flex items-center justify-between px-4">
              <div className="w-12 h-10 border-2 border-cyan-400/80 bg-cyan-950/40 rounded-t-lg relative flex items-center justify-center">
                <span className="text-[9px] font-mono text-cyan-300">L-RAIL</span>
                <div className="absolute -top-1 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_#ef4444]" />
              </div>
              <div className="flex-1 h-0.5 bg-gradient-to-r from-red-500 via-amber-400 to-red-500 relative flex items-center justify-center mx-2">
                <div className="bg-slate-950 text-amber-300 font-mono text-[10px] px-2 py-0.5 rounded border border-amber-500/40 shadow-sm">
                  {latestTelemetry.gaugeMm.toFixed(1)} mm
                </div>
              </div>
              <div className="w-12 h-10 border-2 border-cyan-400/80 bg-cyan-950/40 rounded-t-lg relative flex items-center justify-center">
                <span className="text-[9px] font-mono text-cyan-300">R-RAIL</span>
                <div className="absolute -top-1 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_#ef4444]" />
              </div>
            </div>

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
