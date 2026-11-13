import React from 'react';
import { PatientProfile, Doctor } from '../../types/medical';
import { X, ShieldAlert, Phone, AlertTriangle, HeartPulse, User, Printer } from 'lucide-react';

interface EmergencyCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientProfile;
  primaryDoctor?: Doctor;
}

export const EmergencyCardModal: React.FC<EmergencyCardModalProps> = ({
  isOpen,
  onClose,
  patient,
  primaryDoctor
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-100 dark:border-rose-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-rose-950 dark:text-rose-100">Universal Medical Emergency ID</h3>
              <p className="text-xs text-rose-700 dark:text-rose-300">Vital clinical directives for emergency first responders</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Card Top: Patient Details & Blood Group */}
          <div className="flex items-start justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center gap-3.5">
              <img
                src={patient.avatar}
                alt={patient.name}
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-full object-cover border-2 border-white dark:border-slate-700 shadow-sm"
              />
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">{patient.name}</h4>
                <div className="text-xs text-slate-500 dark:text-slate-400 space-x-2">
                  <span>DOB: {patient.dob} ({patient.age} yrs)</span>
                  <span>·</span>
                  <span>Sex: {patient.gender}</span>
                </div>
                <div className="text-xs font-mono font-medium text-slate-600 dark:text-slate-300 mt-0.5">
                  MRN: {patient.mrn}
                </div>
              </div>
            </div>

            {/* Blood Type Badge */}
            <div className="text-center px-3.5 py-2 bg-rose-100 dark:bg-rose-900/40 rounded-xl border border-rose-200 dark:border-rose-800">
              <div className="text-[10px] font-bold uppercase text-rose-600 dark:text-rose-300 tracking-wider">Blood Group</div>
              <div className="text-xl font-black text-rose-700 dark:text-rose-200 font-mono">{patient.bloodType}</div>
            </div>
          </div>

          {/* Critical Allergies */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-amber-700 dark:text-amber-400 tracking-wider mb-2">
              <AlertTriangle className="w-4 h-4" />
              Documented Severe Allergies & Adverse Reactions
            </div>
            <div className="space-y-2">
              {patient.allergies.map((allergy, i) => (
                <div
                  key={i}
                  className="p-3 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl flex items-start justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-amber-950 dark:text-amber-200">{allergy.substance}</span>
                    <span className="text-amber-800 dark:text-amber-400 ml-2">({allergy.reaction})</span>
                  </div>
                  <span className="font-semibold px-2 py-0.5 rounded text-[10px] bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                    {allergy.severity}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Active Diagnoses / Conditions */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-700 dark:text-slate-300 tracking-wider mb-2">
              <HeartPulse className="w-4 h-4 text-teal-600" />
              Chronic Conditions & Medical Directives
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {patient.chronicConditions.map((cond, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-medium"
                >
                  • {cond}
                </div>
              ))}
            </div>
          </div>

          {/* Contacts: Emergency Contact & Attending Doctor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Primary Emergency Contact
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">{patient.emergencyContact.name}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{patient.emergencyContact.relationship}</div>
              <a
                href={`tel:${patient.emergencyContact.phone}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400 mt-2 hover:underline"
              >
                <Phone className="w-3.5 h-3.5" />
                {patient.emergencyContact.phone}
              </a>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1">
                <HeartPulse className="w-3.5 h-3.5 text-teal-600" />
                Attending Physician
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">{primaryDoctor?.name || 'Dr. Sarah Jenkins'}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{primaryDoctor?.specialty || 'Cardiovascular Medicine'}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">Clinic: (555) 749-3000</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Encrypted Health Record ID · HIPAA / GDPR Compliant
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-white bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
