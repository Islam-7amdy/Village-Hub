import React, { useState } from 'react';
import { Prescription } from '../../types/medical';
import { X, Pill, CheckCircle2 } from 'lucide-react';

interface NewPrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPrescription: (rx: Prescription) => void;
  doctorName: string;
}

export const NewPrescriptionModal: React.FC<NewPrescriptionModalProps> = ({
  isOpen,
  onClose,
  onAddPrescription,
  doctorName
}) => {
  const [medicationName, setMedicationName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('Once daily');
  const [timing, setTiming] = useState<('morning' | 'afternoon' | 'evening' | 'bedtime')[]>(['morning']);
  const [daysSupply, setDaysSupply] = useState<number>(30);
  const [refills, setRefills] = useState<number>(3);
  const [instructions, setInstructions] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const toggleTiming = (slot: 'morning' | 'afternoon' | 'evening' | 'bedtime') => {
    if (timing.includes(slot)) {
      if (timing.length > 1) {
        setTiming(timing.filter((t) => t !== slot));
      }
    } else {
      setTiming([...timing, slot]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicationName.trim() || !dosage.trim()) return;

    const newRx: Prescription = {
      id: `rx-${Date.now()}`,
      medicationName: medicationName.trim(),
      dosage: dosage.trim(),
      frequency,
      timing,
      prescribedBy: doctorName,
      prescribedDate: new Date().toISOString().split('T')[0],
      refillsRemaining: refills,
      daysSupply,
      instructions: instructions.trim() || 'Take as directed by your physician.',
      adherenceStatus: {},
      refillRequested: false
    };

    onAddPrescription(newRx);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Pill className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Issue New Prescription</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Electronic prescription authorization & pharmacy routing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-12 h-12 bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Prescription Signed & Issued</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {medicationName} {dosage} has been routed to patient chart and active medication manager.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Medication Generic / Brand Name *
              </label>
              <input
                type="text"
                value={medicationName}
                onChange={(e) => setMedicationName(e.target.value)}
                placeholder="e.g. Metoprolol Tartrate, Metformin, Amoxicillin"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Dosage / Form *
                </label>
                <input
                  type="text"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="e.g. 25 mg Oral Tablet"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Frequency
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Once daily in morning">Once daily in morning</option>
                  <option value="Twice daily (Q12H)">Twice daily (Q12H)</option>
                  <option value="Three times daily with meals">Three times daily with meals</option>
                  <option value="Once nightly at bedtime">Once nightly at bedtime</option>
                  <option value="As needed for acute symptoms">As needed (PRN)</option>
                </select>
              </div>
            </div>

            {/* Dosing Times */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Dosing Administration Schedule
              </label>
              <div className="flex gap-2">
                {(['morning', 'afternoon', 'evening', 'bedtime'] as const).map((slot) => {
                  const active = timing.includes(slot);
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => toggleTiming(slot)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all capitalize ${
                        active
                          ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Days Supply
                </label>
                <input
                  type="number"
                  min="5"
                  max="365"
                  value={daysSupply}
                  onChange={(e) => setDaysSupply(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Authorized Refills
                </label>
                <input
                  type="number"
                  min="0"
                  max="11"
                  value={refills}
                  onChange={(e) => setRefills(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Clinical Patient Instructions
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={2}
                placeholder="Take with 8oz water. Monitor for mild sedation during first 3 days..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Sign & Authorize Rx
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
