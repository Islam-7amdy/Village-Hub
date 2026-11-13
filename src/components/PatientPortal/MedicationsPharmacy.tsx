import React, { useState } from 'react';
import { Prescription } from '../../types/medical';
import { Pill, CheckCircle2, Clock, RefreshCw, AlertTriangle, Building, Truck, Check } from 'lucide-react';

interface MedicationsPharmacyProps {
  prescriptions: Prescription[];
  onToggleAdherence: (rxId: string, slot: 'morning' | 'afternoon' | 'evening') => void;
  onRequestRefill: (rxId: string, pharmacyName: string) => void;
}

export const MedicationsPharmacy: React.FC<MedicationsPharmacyProps> = ({
  prescriptions,
  onToggleAdherence,
  onRequestRefill
}) => {
  const [refillingRxId, setRefillingRxId] = useState<string | null>(null);
  const [selectedPharmacy, setSelectedPharmacy] = useState<string>('CVS Health #4021 (Broadway & 42nd)');
  const [refillSuccessMsg, setRefillSuccessMsg] = useState<string | null>(null);

  const pharmacies = [
    'CVS Health #4021 (Broadway & 42nd St)',
    'Walgreens Pharmacy #1128 (Main Campus Blvd)',
    'Vitalis In-House Hospital Pharmacy (Suite 100)',
    'Vitalis Express Courier (Free Home Delivery)'
  ];

  const handleConfirmRefill = (rxId: string) => {
    onRequestRefill(rxId, selectedPharmacy);
    setRefillSuccessMsg(`Refill order transmitted to ${selectedPharmacy}. Pharmacist review pending.`);
    setRefillingRxId(null);
    setTimeout(() => {
      setRefillSuccessMsg(null);
    }, 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Pill className="w-5 h-5 text-teal-600" />
            Prescriptions & Pharmacy Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Active physician orders, daily dosing schedules, and electronic refill routing
          </p>
        </div>

        <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
          <span>Active Regimens: <strong>{prescriptions.length}</strong></span>
          <span>·</span>
          <span className="text-emerald-700 dark:text-emerald-400 font-medium">Synced with Doctor EHR</span>
        </div>
      </div>

      {refillSuccessMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{refillSuccessMsg}</span>
        </div>
      )}

      {/* Daily Pill Schedule Box */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600" />
              Daily Dosing Schedule Tracker
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Mark doses as taken to update your clinical adherence record</p>
          </div>
          <span className="text-xs font-semibold text-teal-700 dark:text-teal-400">Today's Schedule</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Morning Slot */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Morning (08:00 AM)
              </span>
              <span className="text-[11px] text-slate-400">With breakfast</span>
            </div>

            <div className="space-y-2">
              {prescriptions
                .filter((r) => r.timing.includes('morning'))
                .map((rx) => (
                  <div
                    key={rx.id}
                    onClick={() => onToggleAdherence(rx.id, 'morning')}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                      rx.adherenceStatus.morningTaken
                        ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{rx.medicationName}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{rx.dosage}</div>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                        rx.adherenceStatus.morningTaken
                          ? 'bg-emerald-600 text-white'
                          : 'border border-slate-300 dark:border-slate-600 text-transparent'
                      }`}
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Afternoon Slot */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Afternoon (01:00 PM)
              </span>
              <span className="text-[11px] text-slate-400">Midday</span>
            </div>

            <div className="space-y-2">
              {prescriptions.filter((r) => r.timing.includes('afternoon')).length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">No midday medications scheduled.</div>
              ) : (
                prescriptions
                  .filter((r) => r.timing.includes('afternoon'))
                  .map((rx) => (
                    <div
                      key={rx.id}
                      onClick={() => onToggleAdherence(rx.id, 'afternoon')}
                      className={`p-3 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                        rx.adherenceStatus.afternoonTaken
                          ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-semibold">{rx.medicationName}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{rx.dosage}</div>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                          rx.adherenceStatus.afternoonTaken
                            ? 'bg-emerald-600 text-white'
                            : 'border border-slate-300 dark:border-slate-600 text-transparent'
                        }`}
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Evening / Night Slot */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Evening (09:00 PM)
              </span>
              <span className="text-[11px] text-slate-400">At bedtime</span>
            </div>

            <div className="space-y-2">
              {prescriptions
                .filter((r) => r.timing.includes('evening') || r.timing.includes('bedtime'))
                .map((rx) => (
                  <div
                    key={rx.id}
                    onClick={() => onToggleAdherence(rx.id, 'evening')}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                      rx.adherenceStatus.eveningTaken
                        ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{rx.medicationName}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{rx.dosage}</div>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                        rx.adherenceStatus.eveningTaken
                          ? 'bg-emerald-600 text-white'
                          : 'border border-slate-300 dark:border-slate-600 text-transparent'
                      }`}
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Active Prescription Cards Grid */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Active Authorized Prescriptions</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {prescriptions.map((rx) => (
            <div
              key={rx.id}
              className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">{rx.medicationName}</h4>
                    <p className="text-xs text-teal-700 dark:text-teal-400 font-semibold">{rx.dosage}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">
                      {rx.refillsRemaining} Refills Left
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">{rx.daysSupply}-Day Supply</div>
                  </div>
                </div>

                <div className="mt-3 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                  <div><strong>Sig:</strong> {rx.instructions}</div>
                  <div className="text-slate-500 dark:text-slate-400">Prescribing Clinician: {rx.prescribedBy}</div>
                  <div className="text-slate-400 text-[11px]">Authorized: {rx.prescribedDate}</div>
                </div>
              </div>

              {/* Refill trigger area */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                {rx.refillRequested ? (
                  <span className="text-xs text-teal-700 dark:text-teal-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Refill Order Processing
                  </span>
                ) : (
                  <button
                    onClick={() => setRefillingRxId(rx.id)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Order Pharmacy Refill
                  </button>
                )}

                <span className="text-[11px] text-slate-400 font-mono">Rx #{rx.id}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Refill Selector Modal */}
      {refillingRxId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building className="w-5 h-5 text-teal-600" />
              Select Preferred Pharmacy
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Choose your pickup location or select express courier delivery directly to your home address.
            </p>

            <div className="space-y-2">
              {pharmacies.map((pharm) => (
                <button
                  key={pharm}
                  type="button"
                  onClick={() => setSelectedPharmacy(pharm)}
                  className={`w-full p-3 rounded-xl border text-left text-xs font-medium transition-all ${
                    selectedPharmacy === pharm
                      ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {pharm}
                </button>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => setRefillingRxId(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmRefill(refillingRxId)}
                className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                Send Refill Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drug & Food Safety Advisories */}
      <div className="p-5 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 dark:text-amber-200 space-y-1">
          <strong className="block font-semibold">Important Clinical Drug Interaction Notice:</strong>
          <p>
            You are currently prescribed <strong>Atorvastatin</strong> and <strong>Lisinopril</strong>. Avoid consuming grapefruit or grapefruit juice, as it inhibits CYP3A4 enzymes and can elevate statin blood concentrations. Consult your doctor if experiencing persistent muscle cramping.
          </p>
        </div>
      </div>
    </div>
  );
};
