import React, { useState } from 'react';
import { LabResultItem } from '../../types/medical';
import { FileText, Printer, Filter, CheckCircle2, AlertCircle, TrendingDown, TrendingUp } from 'lucide-react';

interface LabReportsViewProps {
  labs: LabResultItem[];
}

export const LabReportsView: React.FC<LabReportsViewProps> = ({ labs }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', 'Lipid Panel', 'Comprehensive Metabolic', 'Renal Function Panel', 'Electrolyte Panel'];

  const filteredLabs = selectedCategory === 'all'
    ? labs
    : labs.filter((l) => l.category.toLowerCase().includes(selectedCategory.toLowerCase()));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-600" />
            Diagnostic Laboratory Reports
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pathology specimen evaluations, reference range comparisons, and longitudinal trends
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </button>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-colors cursor-pointer capitalize ${
              selectedCategory === cat
                ? 'bg-teal-600 text-white shadow-xs font-semibold'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            {cat === 'all' ? 'All Panels' : cat}
          </button>
        ))}
      </div>

      {/* Lab Results Table / Cards */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Collected: <strong>October 28, 2026</strong> · Specimen: Venous Blood · Fasting (12 hrs)
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Pathologist Sign-off: <strong className="text-slate-800 dark:text-slate-200">Verified Complete</strong>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredLabs.map((lab) => {
            const isNormal = lab.status === 'normal';
            return (
              <div key={lab.id} className="p-6 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Test Info */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{lab.name}</h4>
                      <span className="text-xs text-slate-500 dark:text-slate-400">({lab.category})</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Standard Reference Range: <strong className="text-slate-700 dark:text-slate-300">{lab.referenceRange}</strong>
                    </div>
                    {lab.notes && (
                      <p className="text-xs text-teal-700 dark:text-teal-400 font-medium pt-1">
                        Doctor Observation: {lab.notes}
                      </p>
                    )}
                  </div>

                  {/* Value and Normal Status */}
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                        {lab.value} <span className="text-xs font-normal text-slate-500">{lab.unit}</span>
                      </div>
                      <div className="text-[11px] font-semibold uppercase text-emerald-700 dark:text-emerald-400 flex items-center justify-end gap-1 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Within Normal Limits
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
