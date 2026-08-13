import React, { useState } from 'react';
import { 
  Bell, 
  Search, 
  Download, 
  Trash2, 
  MapPin, 
  AlertTriangle, 
  Filter
} from 'lucide-react';
import { DefectRecord } from '../types';

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
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col justify-between text-slate-800">
      {/* Top Header & Visual Buzzer LED Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className={`p-2 rounded-lg border flex items-center justify-center transition-all ${
            activeAlert 
              ? 'bg-red-50 border-red-200 text-red-600 font-bold' 
              : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}>
            <Bell className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xs font-bold text-slate-900 font-mono uppercase tracking-wide">
                DEFECT LOG & ALERT SYSTEM
              </h2>
              {activeAlert && (
                <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                  ALARM ACTIVE
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Timestamped sensor anomaly records logged in real time</p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-2 text-xs font-mono">
          <button
            onClick={handleExportCSV}
            disabled={defects.length === 0}
            className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 disabled:opacity-40 text-slate-700 transition-colors border border-slate-200 flex items-center space-x-1.5 font-bold"
          >
            <Download className="w-3.5 h-3.5 text-cyan-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onClearLogs}
            disabled={defects.length === 0}
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 disabled:opacity-40 text-slate-500 hover:text-red-600 transition-colors border border-slate-200"
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
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search location or defect type..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 font-medium"
          />
        </div>

        {/* Severity Dropdown */}
        <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Severities ({defects.length})</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Only</option>
            <option value="MEDIUM">Medium Only</option>
            <option value="LOW">Low Only</option>
          </select>
        </div>
      </div>

      {/* Auto-Populating Defect Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto max-h-60 overflow-y-auto font-mono text-xs">
        <table className="w-full text-left text-slate-800 border-collapse">
          <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-[11px] text-slate-600 font-bold">
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
          <tbody className="divide-y divide-slate-100">
            {filteredDefects.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-slate-500">
                  <AlertTriangle className="w-5 h-5 mx-auto mb-1 opacity-40 text-amber-600" />
                  <span>No defect records logged for current run. Track is nominal.</span>
                </td>
              </tr>
            ) : (
              filteredDefects.map((d) => {
                const isCritical = d.severity === 'CRITICAL' || d.severity === 'HIGH';

                return (
                  <tr 
                    key={d.id} 
                    className="hover:bg-slate-50 transition-colors group cursor-pointer"
                    onClick={() => onOpenDefectDetail(d)}
                  >
                    <td className="p-2.5 text-slate-500 text-[11px] whitespace-nowrap">{d.timestamp}</td>

                    <td className="p-2.5 font-bold text-amber-800 whitespace-nowrap">
                      {d.location.toFixed(2)} m
                    </td>

                    <td className="p-2.5 font-semibold text-slate-800 whitespace-nowrap flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${isCritical ? 'bg-red-600' : 'bg-amber-500'}`} />
                      <span>{d.defectType}</span>
                    </td>

                    <td className="p-2.5 text-indigo-700 whitespace-nowrap font-medium">{d.gaugeMm.toFixed(1)} mm</td>

                    <td className={`p-2.5 whitespace-nowrap font-medium ${d.vibrationG > 1.2 ? 'text-red-600 font-bold' : 'text-emerald-700'}`}>
                      {d.vibrationG.toFixed(2)} G
                    </td>

                    <td className="p-2.5 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        d.confidenceScore >= 70
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : d.confidenceScore >= 40
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
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
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-cyan-700 rounded text-[10px] border border-slate-200 inline-flex items-center space-x-1 font-bold"
                        title="Jump trolley to location"
                      >
                        <MapPin className="w-3 h-3 text-cyan-600" />
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
