import React, { useState } from 'react';
import { VitalRecord } from '../../types/medical';
import { Activity, Heart, Droplets, Wind, Scale, Plus, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface VitalsMonitorProps {
  vitals: VitalRecord[];
  onOpenLogVitals: () => void;
}

export const VitalsMonitor: React.FC<VitalsMonitorProps> = ({ vitals, onOpenLogVitals }) => {
  const [selectedMetric, setSelectedMetric] = useState<'bp' | 'hr' | 'glucose' | 'spo2' | 'weight'>('bp');

  const latest = vitals[0] || {
    systolicBp: 122,
    diastolicBp: 80,
    heartRate: 68,
    bloodGlucose: 94,
    spo2: 99,
    temperature: 98.6,
    weightLbs: 168.2,
    timestamp: '2026-11-12 08:15'
  };

  // Reverse chronological for chart plotting (left to right = oldest to newest)
  const chartData = [...vitals].reverse();

  // Helper to generate SVG polyline points
  const getSvgPoints = (getter: (v: VitalRecord) => number, minVal: number, maxVal: number) => {
    if (chartData.length === 0) return '';
    const width = 600;
    const height = 180;
    const padding = 20;
    const usableW = width - padding * 2;
    const usableH = height - padding * 2;

    return chartData
      .map((d, i) => {
        const x = padding + (i / Math.max(chartData.length - 1, 1)) * usableW;
        const val = getter(d);
        const norm = Math.max(0, Math.min(1, (val - minVal) / Math.max(maxVal - minVal, 1)));
        const y = height - padding - norm * usableH;
        return `${x},${y}`;
      })
      .join(' ');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-600" />
            Vitals Telemetry & Cardiovascular Monitoring
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Synchronized home medical device readings with clinician alerts and reference ranges
          </p>
        </div>

        <button
          onClick={onOpenLogVitals}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Record New Vitals
        </button>
      </div>

      {/* Metric Selector Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Blood Pressure */}
        <button
          onClick={() => setSelectedMetric('bp')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedMetric === 'bp'
              ? 'border-teal-600 bg-teal-50/50 dark:bg-teal-950/30 ring-1 ring-teal-600'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
          }`}
        >
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Blood Pressure</span>
            <Activity className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
            {latest.systolicBp}/{latest.diastolicBp}
          </div>
          <div className="text-[11px] text-teal-700 dark:text-teal-400 font-medium mt-1">mmHg · Target &lt; 130/80</div>
        </button>

        {/* Heart Rate */}
        <button
          onClick={() => setSelectedMetric('hr')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedMetric === 'hr'
              ? 'border-teal-600 bg-teal-50/50 dark:bg-teal-950/30 ring-1 ring-teal-600'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
          }`}
        >
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Resting Heart Rate</span>
            <Heart className="w-3.5 h-3.5 text-red-500" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
            {latest.heartRate}
          </div>
          <div className="text-[11px] text-teal-700 dark:text-teal-400 font-medium mt-1">bpm · Target 60-100</div>
        </button>

        {/* Glucose */}
        <button
          onClick={() => setSelectedMetric('glucose')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedMetric === 'glucose'
              ? 'border-teal-600 bg-teal-50/50 dark:bg-teal-950/30 ring-1 ring-teal-600'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
          }`}
        >
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Fasting Glucose</span>
            <Droplets className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
            {latest.bloodGlucose}
          </div>
          <div className="text-[11px] text-teal-700 dark:text-teal-400 font-medium mt-1">mg/dL · Target 70-99</div>
        </button>

        {/* SpO2 */}
        <button
          onClick={() => setSelectedMetric('spo2')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedMetric === 'spo2'
              ? 'border-teal-600 bg-teal-50/50 dark:bg-teal-950/30 ring-1 ring-teal-600'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
          }`}
        >
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Oxygen (SpO2)</span>
            <Wind className="w-3.5 h-3.5 text-teal-500" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
            {latest.spo2}%
          </div>
          <div className="text-[11px] text-teal-700 dark:text-teal-400 font-medium mt-1">Target 95-100%</div>
        </button>

        {/* Weight */}
        <button
          onClick={() => setSelectedMetric('weight')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedMetric === 'weight'
              ? 'border-teal-600 bg-teal-50/50 dark:bg-teal-950/30 ring-1 ring-teal-600'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
          }`}
        >
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Body Weight</span>
            <Scale className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
            {latest.weightLbs}
          </div>
          <div className="text-[11px] text-teal-700 dark:text-teal-400 font-medium mt-1">lbs · BMI: 23.4 (Normal)</div>
        </button>
      </div>

      {/* Interactive SVG Chart Container */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {selectedMetric === 'bp' && 'Blood Pressure Telemetry Trend (Systolic & Diastolic)'}
              {selectedMetric === 'hr' && 'Resting Heart Rate Progression'}
              {selectedMetric === 'glucose' && 'Fasting Blood Glucose Longitudinal Curve'}
              {selectedMetric === 'spo2' && 'Oxygen Saturation SpO2 Curve'}
              {selectedMetric === 'weight' && 'Weight & Body Composition Trajectory'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">7-Day consecutive continuous clinical record</p>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3">
            {selectedMetric === 'bp' ? (
              <>
                <span className="flex items-center gap-1.5 font-medium text-rose-600 dark:text-rose-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Systolic
                </span>
                <span className="flex items-center gap-1.5 font-medium text-teal-600 dark:text-teal-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block" /> Diastolic
                </span>
              </>
            ) : (
              <span className="flex items-center gap-1.5 font-medium text-teal-600 dark:text-teal-400">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block" /> Daily Reading
              </span>
            )}
          </div>
        </div>

        {/* SVG Drawing */}
        <div className="w-full h-56 pt-2">
          <svg viewBox="0 0 600 180" className="w-full h-full overflow-visible">
            {/* Grid lines */}
            <line x1="20" y1="20" x2="580" y2="20" stroke="currentColor" strokeDasharray="3 3" className="text-slate-100 dark:text-slate-800" strokeWidth="1" />
            <line x1="20" y1="90" x2="580" y2="90" stroke="currentColor" strokeDasharray="3 3" className="text-slate-100 dark:text-slate-800" strokeWidth="1" />
            <line x1="20" y1="160" x2="580" y2="160" stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth="1" />

            {selectedMetric === 'bp' ? (
              <>
                {/* Systolic Line (Rose) */}
                <polyline
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={getSvgPoints((v) => v.systolicBp, 110, 140)}
                />
                {/* Diastolic Line (Teal) */}
                <polyline
                  fill="none"
                  stroke="#0d9488"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={getSvgPoints((v) => v.diastolicBp, 70, 95)}
                />
              </>
            ) : selectedMetric === 'hr' ? (
              <polyline
                fill="none"
                stroke="#ef4444"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={getSvgPoints((v) => v.heartRate, 60, 90)}
              />
            ) : selectedMetric === 'glucose' ? (
              <polyline
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={getSvgPoints((v) => v.bloodGlucose, 80, 120)}
              />
            ) : selectedMetric === 'spo2' ? (
              <polyline
                fill="none"
                stroke="#0d9488"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={getSvgPoints((v) => v.spo2, 94, 100)}
              />
            ) : (
              <polyline
                fill="none"
                stroke="#6366f1"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={getSvgPoints((v) => v.weightLbs, 165, 172)}
              />
            )}
          </svg>
        </div>

        {/* Date labels at bottom of chart */}
        <div className="flex justify-between text-[11px] font-mono text-slate-400 px-4">
          {chartData.map((d, i) => (
            <span key={i}>{d.timestamp.split(' ')[0].slice(5)}</span>
          ))}
        </div>
      </div>

      {/* Historical Telemetry Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Historical Telemetry Log</h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">Total Entries: {vitals.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3 font-semibold">Timestamp</th>
                <th className="px-6 py-3 font-semibold text-right">Blood Pressure</th>
                <th className="px-6 py-3 font-semibold text-right">Heart Rate</th>
                <th className="px-6 py-3 font-semibold text-right">Glucose</th>
                <th className="px-6 py-3 font-semibold text-right">SpO2</th>
                <th className="px-6 py-3 font-semibold text-right">Weight</th>
                <th className="px-6 py-3 font-semibold">Clinical Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {vitals.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-3 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {item.timestamp}
                  </td>
                  <td className="px-6 py-3 font-mono font-medium text-right tabular-nums whitespace-nowrap">
                    {item.systolicBp}/{item.diastolicBp} <span className="text-[10px] text-slate-400">mmHg</span>
                  </td>
                  <td className="px-6 py-3 font-mono font-medium text-right tabular-nums whitespace-nowrap">
                    {item.heartRate} <span className="text-[10px] text-slate-400">bpm</span>
                  </td>
                  <td className="px-6 py-3 font-mono font-medium text-right tabular-nums whitespace-nowrap">
                    {item.bloodGlucose} <span className="text-[10px] text-slate-400">mg/dL</span>
                  </td>
                  <td className="px-6 py-3 font-mono font-medium text-right tabular-nums whitespace-nowrap">
                    {item.spo2}%
                  </td>
                  <td className="px-6 py-3 font-mono font-medium text-right tabular-nums whitespace-nowrap">
                    {item.weightLbs} <span className="text-[10px] text-slate-400">lbs</span>
                  </td>
                  <td className="px-6 py-3 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                    {item.notes || 'Routine measurement'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
