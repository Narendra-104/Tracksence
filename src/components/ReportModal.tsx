import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  X, 
  Sparkles, 
  Download, 
  Printer, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert,
  Loader2,
  Train
} from 'lucide-react';
import { DefectRecord } from '../types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defectLogs: DefectRecord[];
  selectedDefect?: DefectRecord | null;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  defectLogs,
  selectedDefect
}) => {
  const [reportContent, setReportContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [reportSource, setReportSource] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      generateReport();
    }
  }, [isOpen, defectLogs]);

  const generateReport = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defectLogs,
          trackStats: {
            totalLength: '2.50 meters',
            gaugeType: '1676 mm Broad Gauge',
            inspectionUnit: 'TrackSense Trolley Unit TS-4',
            timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
          }
        })
      });

      const data = await response.json();
      setReportContent(data.report || 'Unable to load report content.');
      setReportSource(data.source || 'ai-engine');
    } catch (err) {
      console.error('Error fetching report:', err);
      setReportContent('### Error Generating RDSO Directive\nFailed to connect to AI report service.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-mono text-xs">
        {/* Modal Header */}
        <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
              <Train className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                INDIAN RAILWAYS RDSO TRACK INSPECTION DIRECTIVE
              </h2>
              <p className="text-[11px] text-slate-400">TrackSense Automated AI Sensor Fusion Assessment</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Defect Snapshot Card if opened via table row click */}
        {selectedDefect && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 px-5 py-3 text-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-amber-300">INSPECTING DEFECT SNAPSHOT:</span>
              <span>{selectedDefect.defectType} at <strong>{selectedDefect.location.toFixed(2)}m</strong></span>
            </div>
            <div className="text-[11px] space-x-2 text-slate-400">
              <span>Gauge: <strong className="text-indigo-300">{selectedDefect.gaugeMm.toFixed(1)}mm</strong></span>
              <span>•</span>
              <span>Peak Vib: <strong className="text-emerald-300">{selectedDefect.vibrationG.toFixed(2)}G</strong></span>
              <span>•</span>
              <span>Confidence: <strong className="text-red-400">{selectedDefect.confidenceScore}%</strong></span>
            </div>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 leading-relaxed text-slate-300 bg-slate-900/60">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 space-y-3">
              <Loader2 className="w-8 h-8 mx-auto text-amber-400 animate-spin" />
              <p className="text-sm font-semibold">Synthesizing Sensor Fusion Telemetry via Gemini AI...</p>
            </div>
          ) : (
            <div className="prose prose-invert max-w-none text-xs space-y-3 font-sans">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] whitespace-pre-wrap leading-relaxed text-slate-200">
                {reportContent}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-slate-950 px-5 py-3 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-mono">
            Engine: {reportSource} • RDSO Standard Guidelines 2026
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs flex items-center space-x-1.5 border border-slate-700"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Directive</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-mono rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
