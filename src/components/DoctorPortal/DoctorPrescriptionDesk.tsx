import React from 'react';
import { Prescription, PatientProfile } from '../../types/medical';
import { Pill, Plus, CheckCircle2, AlertCircle, RefreshCw, XCircle } from 'lucide-react';

interface DoctorPrescriptionDeskProps {
  prescriptions: Prescription[];
  patient: PatientProfile;
  onOpenNewPrescription: () => void;
  onApproveRefill: (rxId: string) => void;
}

export const DoctorPrescriptionDesk: React.FC<DoctorPrescriptionDeskProps> = ({
  prescriptions,
  patient,
  onOpenNewPrescription,
  onApproveRefill
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Pill className="w-5 h-5 text-teal-600" />
            Prescription Desk & Electronic Pharmacotherapy
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage authorized pharmacotherapy, review electronic refill requests, and dispatch to pharmacies
          </p>
        </div>

        <button
          onClick={onOpenNewPrescription}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Write New Prescription
        </button>
      </div>

      {/* Refill Approvals Queue */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-teal-600" />
              Incoming Patient Refill Requests
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Electronic pharmacy refill queue pending authorization</p>
          </div>
        </div>

        {prescriptions.filter((p) => p.refillRequested).length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            No pending refill requests in the queue. All patient orders are up-to-date.
          </div>
        ) : (
          <div className="space-y-3">
            {prescriptions
              .filter((p) => p.refillRequested)
              .map((rx) => (
                <div
                  key={rx.id}
                  className="p-4 rounded-xl border border-teal-200 dark:border-teal-900 bg-teal-50/50 dark:bg-teal-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{rx.medicationName}</span>
                      <span className="text-xs text-teal-700 dark:text-teal-400 font-semibold">{rx.dosage}</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Patient: <strong>{patient.name}</strong> (MRN: {patient.mrn}) · {rx.frequency}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onApproveRefill(rx.id)}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Authorize +3 Refills
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Active Formularies Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Authorized Prescriptions</h3>
          <span className="text-xs text-slate-500">Patient: {patient.name}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3 font-semibold">Medication & Dosage</th>
                <th className="px-6 py-3 font-semibold">Instructions (Sig)</th>
                <th className="px-6 py-3 font-semibold">Refills Left</th>
                <th className="px-6 py-3 font-semibold">Prescribed Date</th>
                <th className="px-6 py-3 font-semibold">Prescriber</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {prescriptions.map((rx) => (
                <tr key={rx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                    <div>{rx.medicationName}</div>
                    <div className="text-[11px] font-normal text-teal-600 dark:text-teal-400">{rx.dosage}</div>
                  </td>
                  <td className="px-6 py-4 max-w-sm text-slate-600 dark:text-slate-300">
                    {rx.instructions}
                  </td>
                  <td className="px-6 py-4 font-mono font-medium whitespace-nowrap">
                    {rx.refillsRemaining} Refills
                  </td>
                  <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                    {rx.prescribedDate}
                  </td>
                  <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                    {rx.prescribedBy}
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
