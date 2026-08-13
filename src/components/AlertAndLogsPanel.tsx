import React, { useState } from 'react';
import { 
  Bell, 
  Search, 
  Download, 
  Trash2, 
  MapPin, 
  AlertTriangle, 
  ShieldAlert, 
  Filter, 
  ExternalLink,
  Volume2,
  VolumeX,
  FileSpreadsheet
} from 'lucide-react';
import { DefectRecord, SeverityLevel } from '../types';

interface AlertAndLogsPanelProps {
  defects: DefectRecord[];
  activeAlert: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onJumpToPosition: (location: number) => void;
  onClearLogs: () => void;
  onOpenDefectDetail: (defect: DefectRecord) => void;
}

export const AlertAndLogsPanel: React.FC<AlertAndLogsPanelProps> = ({
  defects,
  activeAlert,
  isMuted,
  onToggleMute,
  onJumpToPosition,
  onClearLogs,
  onOpenDefectDetail
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  // Filter defects
  const filteredDefects = defects.filter(d => {
    const matchesSearch = d.defectType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          d.location.toFixed(2).includes(searchTerm);
    const matchesSeverity = severityFilter === 'ALL' || d.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  // Export CSV
  const handleExportCSV = () => {
    if (defects.length === 0) return;
    const headers = ['ID', 'Timestamp', 'Location_m', 'Defect_Type', 'Gauge_mm', 'Vibration_G', 'Confidence_Score', 'Severity', 'Action_Required'];
    const rows = defects.map(d => [
      d.id,
      d.timestamp,
      d.location.toFixed(2),
      `"${d.defectType}"`,
      d.gaugeMm.toFixed(1),
      d.vibrationG.toFixed(2),
      `${d.confidenceScore}%`,
      d.severity,
      `"${d.actionRequired}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tracksense_defect_log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-xl flex flex-col justify-between">
      {/* Top Header & Visual Buzzer LED Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          {/* Flashing Visual LED Buzzer Widget */}
          <div className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${
            activeAlert 
              ? 'bg-red-500/30 border-red-500 text-red-400 animate-pulse shadow-lg shadow-red-500/30' 
              : 'bg-slate-800 border-slate-700 text-slate-400'
          }`}>
            <Bell className={`w-5 h-5 ${activeAlert ? 'animate-bounce' : ''}`} />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-slate-100 font-mono tracking-tight uppercase">
                DEFECT LOG & BUZZER / LED ALERT SYSTEM
              </h2>
              {activeAlert && (
                <span className="bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-mono px-2 py-0.5 rounded font-bold animate-pulse">
                  🔔 BUZZER + 🔴 LED ALARM ACTIVE
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">RPi 4 Fusion Engine → Buzzer beep + LED red on defect detection</p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={handleExportCSV}
            disabled={defects.length === 0}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition-colors border border-slate-700 flex items-center space-x-1.5 font-mono"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onClearLogs}
            disabled={defects.length === 0}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-400 hover:text-red-400 transition-colors border border-slate-700"
            title="Clear defect log"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 text-xs font-mono">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search location or defect type..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        {/* Severity Dropdown */}
        <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-transparent text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="ALL" className="bg-slate-900">All Severities ({defects.length})</option>
            <option value="CRITICAL" className="bg-slate-900">Critical Only</option>
            <option value="HIGH" className="bg-slate-900">High Only</option>
            <option value="MEDIUM" className="bg-slate-900">Medium Only</option>
            <option value="LOW" className="bg-slate-900">Low Only</option>
          </select>
        </div>
      </div>

      {/* Auto-Populating Defect Table */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto max-h-60 overflow-y-auto font-mono text-xs">
        <table className="w-full text-left text-slate-300 border-collapse">
          <thead className="bg-slate-900/90 sticky top-0 border-b border-slate-800 text-[11px] text-slate-400">
            <tr>
              <th className="p-2.5">TIME</th>
              <th className="p-2.5">LOC (m)</th>
              <th className="p-2.5">DEFECT TYPE</th>
              <th className="p-2.5">GAUGE</th>
              <th className="p-2.5">VIB (G)</th>
              <th className="p-2.5">SCORE</th>
              <th className="p-2.5 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredDefects.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500">
                  <AlertTriangle className="w-6 h-6 mx-auto mb-1 opacity-40 text-amber-500" />
                  <span>No defect records logged for current run. Track is nominal.</span>
                </td>
              </tr>
            ) : (
              filteredDefects.map((d) => {
                const isCritical = d.severity === 'CRITICAL' || d.severity === 'HIGH';

                return (
                  <tr 
                    key={d.id} 
                    className="hover:bg-slate-900/60 transition-colors group cursor-pointer"
                    onClick={() => onOpenDefectDetail(d)}
                  >
                    <td className="p-2.5 text-slate-400 text-[11px] whitespace-nowrap">{d.timestamp}</td>

                    <td className="p-2.5 font-bold text-amber-400 whitespace-nowrap">
                      {d.location.toFixed(2)} m
                    </td>

                    <td className="p-2.5 font-medium text-slate-200 whitespace-nowrap flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${isCritical ? 'bg-red-500 animate-ping' : 'bg-amber-400'}`} />
                      <span>{d.defectType}</span>
                    </td>

                    <td className="p-2.5 text-indigo-300 whitespace-nowrap">{d.gaugeMm.toFixed(1)} mm</td>

                    <td className={`p-2.5 whitespace-nowrap ${d.vibrationG > 1.2 ? 'text-red-400 font-bold' : 'text-emerald-400'}`}>
                      {d.vibrationG.toFixed(2)} G
                    </td>

                    <td className="p-2.5 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        d.confidenceScore >= 70
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                          : d.confidenceScore >= 40
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      }`}>
                        {d.confidenceScore}%
                      </span>
                    </td>

                    <td className="p-2.5 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onJumpToPosition(d.location);
                        }}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 rounded text-[10px] border border-slate-700 inline-flex items-center space-x-1"
                        title="Jump trolley to location"
                      >
                        <MapPin className="w-3 h-3" />
                        <span>Locate</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
