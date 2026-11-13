import React from 'react';
import { PatientProfile, Appointment, VitalRecord, Prescription, LabResultItem, Doctor } from '../../types/medical';
import {
  Calendar,
  Video,
  Clock,
  Heart,
  Activity,
  Droplets,
  Wind,
  Pill,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';

interface PatientOverviewProps {
  patient: PatientProfile;
  appointments: Appointment[];
  vitals: VitalRecord[];
  prescriptions: Prescription[];
  labs: LabResultItem[];
  primaryDoctor?: Doctor;
  onOpenBookAppointment: () => void;
  onOpenLogVitals: () => void;
  onOpenEmergencyCard: () => void;
  onJoinTelehealth: (apt: Appointment) => void;
  onToggleAdherence: (rxId: string, slot: 'morning' | 'afternoon' | 'evening') => void;
  onNavigateTab: (tab: string) => void;
}

export const PatientOverview: React.FC<PatientOverviewProps> = ({
  patient,
  appointments,
  vitals,
  prescriptions,
  labs,
  primaryDoctor,
  onOpenBookAppointment,
  onOpenLogVitals,
  onOpenEmergencyCard,
  onJoinTelehealth,
  onToggleAdherence,
  onNavigateTab
}) => {
  const nextAppointment = appointments
    .filter((a) => a.status === 'confirmed' || a.status === 'checked_in')
    .sort((a, b) => new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime())[0];

  const latestVital = vitals[0] || {
    systolicBp: 120,
    diastolicBp: 80,
    heartRate: 72,
    bloodGlucose: 95,
    spo2: 98,
    temperature: 98.6,
    weightLbs: 168
  };

  const todayDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="space-y-6">
      {/* Patient Welcome & Quick Action Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={patient.avatar}
              alt={patient.name}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-2xl object-cover border-2 border-white dark:border-slate-800 shadow-md shrink-0"
            />
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Welcome back,</div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{patient.name}</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span className="font-mono">MRN: {patient.mrn}</span>
                <span>·</span>
                <span>Blood: {patient.bloodType}</span>
                <span>·</span>
                <span>Primary Care: {primaryDoctor?.name.split(',')[0] || 'Dr. Jenkins'}</span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={onOpenEmergencyCard}
              className="px-3.5 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-900/50 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              Emergency ID
            </button>
            <button
              onClick={onOpenLogVitals}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Activity className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              Log Vitals
            </button>
            <button
              onClick={onOpenBookAppointment}
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              Book Consultation
            </button>
          </div>
        </div>
      </div>

      {/* Hero Section: Upcoming Appointment & Medical Center */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Next Appointment Card */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                Upcoming Consultation
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {nextAppointment ? nextAppointment.date : 'No upcoming visits'}
              </span>
            </div>

            {nextAppointment ? (
              <div className="mt-5 space-y-4">
                <div className="flex items-start gap-4">
                  <img
                    src={nextAppointment.doctorAvatar}
                    alt={nextAppointment.doctorName}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-800"
                  />
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {nextAppointment.doctorName}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {nextAppointment.doctorSpecialty}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 mt-2">
                      <span className="font-semibold text-teal-700 dark:text-teal-300 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {nextAppointment.time}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        {nextAppointment.type === 'telehealth' ? (
                          <>
                            <Video className="w-3.5 h-3.5 text-teal-600" />
                            Telehealth Video Room
                          </>
                        ) : (
                          <span>In-Person: {nextAppointment.location}</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-slate-900 dark:text-white">Purpose: </span>
                  {nextAppointment.reason}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                No scheduled consultations for this week.
              </div>
            )}
          </div>

          <div className="pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between mt-4">
            <button
              onClick={() => onNavigateTab('appointments')}
              className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1"
            >
              View Full Schedule <ArrowRight className="w-3.5 h-3.5" />
            </button>
            {nextAppointment && nextAppointment.type === 'telehealth' && (
              <button
                onClick={() => onJoinTelehealth(nextAppointment)}
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Video className="w-4 h-4" />
                Join Telehealth Room
              </button>
            )}
          </div>
        </div>

        {/* Medical Center & Facility Card */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col justify-between">
          <div className="relative h-40 overflow-hidden">
            <img
              src="/src/assets/images/medical_center_exterior_1794474297224.jpg"
              alt="Wellspring Health Pavilion"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
            <div className="absolute bottom-3 left-4 text-white">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-teal-300">Campus Facility</div>
              <div className="text-base font-bold">The Wellspring Health Pavilion</div>
            </div>
          </div>

          <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
              <p>450 Innovation Parkway, Medical Quad B</p>
              <p className="text-slate-500 dark:text-slate-400">Open Daily: 07:00 AM – 09:00 PM · Urgent Care 24/7</p>
              <div className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">Direct Line: (555) 749-3000</div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <button
                onClick={() => onNavigateTab('triage')}
                className="text-teal-700 dark:text-teal-400 font-semibold hover:underline flex items-center gap-1"
              >
                Launch AI Symptom Triage <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4-Column Key Vitals Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Blood Pressure */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Blood Pressure</span>
            <Activity className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {latestVital.systolicBp}/{latestVital.diastolicBp}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px]">
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">Within Target</span>
            <span className="text-slate-400">mmHg</span>
          </div>
        </div>

        {/* Resting Heart Rate */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Resting Heart Rate</span>
            <Heart className="w-4 h-4 text-red-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {latestVital.heartRate}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px]">
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">Optimal Sinus</span>
            <span className="text-slate-400">bpm</span>
          </div>
        </div>

        {/* Blood Glucose */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Blood Glucose</span>
            <Droplets className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {latestVital.bloodGlucose}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px]">
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">Fasting Normal</span>
            <span className="text-slate-400">mg/dL</span>
          </div>
        </div>

        {/* SpO2 */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Oxygen Saturation</span>
            <Wind className="w-4 h-4 text-teal-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {latestVital.spo2}%
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px]">
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">Room Air</span>
            <span className="text-slate-400">SpO2</span>
          </div>
        </div>
      </div>

      {/* Two-Column Grid: Today's Prescriptions Adherence & Recent Lab Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Pill Adherence */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Pill className="w-4 h-4 text-teal-600" />
                Medication Adherence
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{todayDateStr}</p>
            </div>
            <button
              onClick={() => onNavigateTab('medications')}
              className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline"
            >
              Manage Rx
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {prescriptions.map((rx) => {
              const isMorning = rx.timing.includes('morning');
              const isEvening = rx.timing.includes('evening') || rx.timing.includes('bedtime');
              return (
                <div
                  key={rx.id}
                  className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">{rx.medicationName}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{rx.dosage} · {rx.frequency}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isMorning && (
                      <button
                        onClick={() => onToggleAdherence(rx.id, 'morning')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                          rx.adherenceStatus.morningTaken
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-semibold'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Morning
                      </button>
                    )}
                    {isEvening && (
                      <button
                        onClick={() => onToggleAdherence(rx.id, 'evening')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                          rx.adherenceStatus.eveningTaken
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-semibold'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Evening
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Diagnostic Lab Results */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" />
                Diagnostic Lab Highlights
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Last panel collected October 28, 2026</p>
            </div>
            <button
              onClick={() => onNavigateTab('labs')}
              className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline"
            >
              Full Blood Panel
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {labs.slice(0, 4).map((lab) => (
              <div
                key={lab.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">{lab.name}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Target: {lab.referenceRange}</div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                    {lab.value} <span className="text-xs font-normal text-slate-500">{lab.unit}</span>
                  </div>
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold uppercase">
                    {lab.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
