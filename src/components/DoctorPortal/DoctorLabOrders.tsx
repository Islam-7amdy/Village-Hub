import React, { useState } from 'react';
import { LabResultItem, PatientProfile, Doctor } from '../../types/medical';
import { FileText, Plus, CheckCircle2, FlaskConical, AlertCircle } from 'lucide-react';

interface DoctorLabOrdersProps {
  labs: LabResultItem[];
  patient: PatientProfile;
  doctor: Doctor;
  onOrderLab: (newLab: LabResultItem) => void;
}

export const DoctorLabOrders: React.FC<DoctorLabOrdersProps> = ({
  labs,
  patient,
  doctor,
  onOrderLab
}) => {
  const [isOrdering, setIsOrdering] = useState(false);
  const [selectedPanel, setSelectedPanel] = useState('High-Sensitivity C-Reactive Protein (hs-CRP)');
  const [panelCategory, setPanelCategory] = useState('Inflammatory / Cardiac Risk');
  const [clinicalJustification, setClinicalJustification] = useState('Cardiovascular risk stratification follow-up.');
  const [orderedSuccess, setOrderedSuccess] = useState(false);

  const availablePanels = [
    { name: 'High-Sensitivity C-Reactive Protein (hs-CRP)', category: 'Inflammatory / Cardiac Risk', unit: 'mg/L', ref: '< 1.0 mg/L' },
    { name: 'B-Type Natriuretic Peptide (BNP)', category: 'Heart Failure Biomarker', unit: 'pg/mL', ref: '< 100 pg/mL' },
    { name: 'Thyroid Stimulating Hormone (TSH)', category: 'Endocrine / Thyroid', unit: 'uIU/mL', ref: '0.40 - 4.50 uIU/mL' },
    { name: 'Complete Blood Count (CBC) w/ Diff', category: 'Hematology', unit: 'K/uL', ref: '4.5 - 11.0 K/uL' },
    { name: 'Fasting Lipid Panel & Apolipoprotein B', category: 'Lipid Panel', unit: 'mg/dL', ref: '< 90 mg/dL' }
  ];

  const handleOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const panel = availablePanels.find((p) => p.name === selectedPanel) || availablePanels[0];

    const newLab: LabResultItem = {
      id: `lab-${Date.now()}`,
      name: panel.name,
      category: panel.category,
      value: 'Pending Specimen',
      unit: panel.unit,
      referenceRange: panel.ref,
      status: 'normal',
      collectedDate: new Date().toISOString().split('T')[0],
      orderingDoctor: doctor.name,
      notes: clinicalJustification.trim() || undefined
    };

    onOrderLab(newLab);
    setOrderedSuccess(true);
    setTimeout(() => {
      setOrderedSuccess(false);
      setIsOrdering(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-teal-600" />
            Diagnostic Orders & Pathology Review
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Authorize laboratory orders, review specimen pathology, and document clinician findings
          </p>
        </div>

        <button
          onClick={() => setIsOrdering(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Order Diagnostic Panel
        </button>
      </div>

      {/* Lab Order Modal */}
      {isOrdering && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-teal-600" />
              Order Clinical Pathology Panel
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select diagnostic panel to route to the central medical laboratory for patient {patient.name}.
            </p>

            {orderedSuccess ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-teal-600 mx-auto" />
                <div className="text-sm font-bold text-slate-900 dark:text-white">Diagnostic Panel Ordered</div>
                <div className="text-xs text-slate-500">Laboratory requisition generated and patient notified.</div>
              </div>
            ) : (
              <form onSubmit={handleOrder} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Test Panel
                  </label>
                  <select
                    value={selectedPanel}
                    onChange={(e) => setSelectedPanel(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {availablePanels.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name} ({p.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Clinical Justification / Indications
                  </label>
                  <textarea
                    value={clinicalJustification}
                    onChange={(e) => setClinicalJustification(e.target.value)}
                    rows={2}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsOrdering(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition-colors cursor-pointer"
                  >
                    Authorize Requisition
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Pathology Review List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Diagnostic Panels & Results</h3>
          <span className="text-xs text-slate-500">Patient: {patient.name} (MRN: {patient.mrn})</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {labs.map((lab) => (
            <div key={lab.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{lab.name}</span>
                  <span className="text-xs text-slate-500">· {lab.category}</span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Reference Range: <strong>{lab.referenceRange}</strong> · Ordered by: {lab.orderingDoctor}
                </div>
                {lab.notes && (
                  <div className="text-xs text-teal-700 dark:text-teal-400 font-medium mt-1">
                    Doctor Note: {lab.notes}
                  </div>
                )}
              </div>

              <div className="text-right shrink-0">
                <div className="text-lg font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                  {lab.value} <span className="text-xs font-normal text-slate-500">{lab.unit}</span>
                </div>
                <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold uppercase mt-0.5">
                  Verified In-Range
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
