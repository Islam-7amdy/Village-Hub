import React, { useState } from 'react';
import { VitalRecord } from '../../types/medical';
import { X, Heart, Activity, Droplets, Thermometer, Wind, Scale, CheckCircle2 } from 'lucide-react';

interface LogVitalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: VitalRecord) => void;
  latestVitals?: VitalRecord;
}

export const LogVitalsModal: React.FC<LogVitalsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  latestVitals
}) => {
  const [systolic, setSystolic] = useState<number>(latestVitals?.systolicBp || 120);
  const [diastolic, setDiastolic] = useState<number>(latestVitals?.diastolicBp || 80);
  const [heartRate, setHeartRate] = useState<number>(latestVitals?.heartRate || 70);
  const [glucose, setGlucose] = useState<number>(latestVitals?.bloodGlucose || 95);
  const [spo2, setSpo2] = useState<number>(latestVitals?.spo2 || 99);
  const [temperature, setTemperature] = useState<number>(latestVitals?.temperature || 98.6);
  const [weight, setWeight] = useState<number>(latestVitals?.weightLbs || 168.0);
  const [notes, setNotes] = useState<string>('');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestampStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    const newRecord: VitalRecord = {
      id: `vit-${Date.now()}`,
      timestamp: timestampStr,
      systolicBp: Number(systolic),
      diastolicBp: Number(diastolic),
      heartRate: Number(heartRate),
      bloodGlucose: Number(glucose),
      spo2: Number(spo2),
      temperature: Number(temperature),
      weightLbs: Number(weight),
      notes: notes.trim() || undefined
    };

    onSave(newRecord);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Record Vital Signs</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Log home telemetry data for continuous clinical monitoring</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {savedSuccess ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-12 h-12 bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Vitals Recorded</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Your clinical dashboard and trends have been updated with your latest readings.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            {/* Blood Pressure Pair */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
              <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Activity className="w-4 h-4 text-rose-500" />
                Blood Pressure (mmHg)
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-500 dark:text-slate-400">Systolic (Top)</label>
                  <input
                    type="number"
                    min="70"
                    max="240"
                    value={systolic}
                    onChange={(e) => setSystolic(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-1.5 text-sm font-mono font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 dark:text-slate-400">Diastolic (Bottom)</label>
                  <input
                    type="number"
                    min="40"
                    max="140"
                    value={diastolic}
                    onChange={(e) => setDiastolic(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-1.5 text-sm font-mono font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Heart Rate & Glucose */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center gap-1.5 mb-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <Heart className="w-4 h-4 text-red-500" />
                  Heart Rate (BPM)
                </div>
                <input
                  type="number"
                  min="40"
                  max="200"
                  value={heartRate}
                  onChange={(e) => setHeartRate(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-1.5 text-sm font-mono font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center gap-1.5 mb-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  Blood Glucose (mg/dL)
                </div>
                <input
                  type="number"
                  min="40"
                  max="400"
                  value={glucose}
                  onChange={(e) => setGlucose(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-1.5 text-sm font-mono font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
            </div>

            {/* SpO2, Temp & Weight */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center gap-1 mb-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <Wind className="w-3.5 h-3.5 text-teal-500" />
                  SpO2 (%)
                </div>
                <input
                  type="number"
                  min="70"
                  max="100"
                  value={spo2}
                  onChange={(e) => setSpo2(Number(e.target.value))}
                  className="w-full mt-1 px-2.5 py-1.5 text-sm font-mono font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center gap-1 mb-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <Thermometer className="w-3.5 h-3.5 text-amber-500" />
                  Temp (°F)
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="95"
                  max="106"
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  className="w-full mt-1 px-2.5 py-1.5 text-sm font-mono font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center gap-1 mb-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <Scale className="w-3.5 h-3.5 text-indigo-500" />
                  Weight (lbs)
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="50"
                  max="500"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-full mt-1 px-2.5 py-1.5 text-sm font-mono font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
            </div>

            {/* Context Notes */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Context / Symptoms (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Taken 10 mins post-breakfast; well-rested."
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Footer */}
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
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
                Save Vitals Record
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
