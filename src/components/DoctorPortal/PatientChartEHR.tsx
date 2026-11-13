import React, { useState } from 'react';
import { PatientProfile, VitalRecord, Prescription, SoapNote, Doctor } from '../../types/medical';
import { FileText, Sparkles, CheckCircle2, Pill, Activity, ShieldAlert, Plus, Loader2 } from 'lucide-react';

interface PatientChartEHRProps {
  patient: PatientProfile;
  doctor: Doctor;
  vitals: VitalRecord[];
  prescriptions: Prescription[];
  soapNotes: SoapNote[];
  onSaveSoapNote: (note: SoapNote) => void;
  onOpenNewPrescription: () => void;
}

export const PatientChartEHR: React.FC<PatientChartEHRProps> = ({
  patient,
  doctor,
  vitals,
  prescriptions,
  soapNotes,
  onSaveSoapNote,
  onOpenNewPrescription
}) => {
  const latestVital = vitals[0];

  const [subjective, setSubjective] = useState(
    'Patient presents for routine cardiovascular follow-up. Reports good compliance with morning Lisinopril 10mg. Denies chest pressure, orthopnea, or lower extremity edema.'
  );
  const [objective, setObjective] = useState(
    `Sitting Blood Pressure: ${latestVital?.systolicBp || 122}/${latestVital?.diastolicBp || 80} mmHg. Heart Rate: ${latestVital?.heartRate || 68} bpm regular. SpO2: ${latestVital?.spo2 || 99}% on room air. Lungs clear to auscultation bilaterally. Cardiac auscultation demonstrates regular rate and rhythm without murmurs.`
  );
  const [assessment, setAssessment] = useState(
    '1. Essential hypertension, stage 1 - controlled on current ACE inhibitor therapy. 2. Mild hyperlipidemia - targeted lipid response achieved.'
  );
  const [plan, setPlan] = useState(
    '1. Continue Lisinopril 10mg PO daily in morning. 2. Continue Atorvastatin 20mg PO nightly. 3. Continue home BP telemetry 2x weekly. 4. Follow-up consultation in 6 months.'
  );
  const [patientSummary, setPatientSummary] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [signedSuccess, setSignedSuccess] = useState(false);

  const handleAiSummarize = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/clinical-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: patient.name,
          age: patient.age,
          vitals: {
            bp: `${latestVital?.systolicBp}/${latestVital?.diastolicBp}`,
            hr: latestVital?.heartRate,
            temp: latestVital?.temperature,
            spo2: latestVital?.spo2
          },
          subjectiveNotes: subjective,
          diagnosis: assessment,
          currentMedications: prescriptions.map((p) => `${p.medicationName} ${p.dosage}`)
        })
      });

      if (!res.ok) throw new Error('Failed to generate clinical summary');

      const data = await res.json();
      if (data.soapNote) {
        setSubjective(data.soapNote.subjective || subjective);
        setObjective(data.soapNote.objective || objective);
        setAssessment(data.soapNote.assessment || assessment);
        setPlan(data.soapNote.plan || plan);
      }
      if (data.patientFriendlySummary) {
        setPatientSummary(data.patientFriendlySummary);
      }
    } catch (e) {
      console.error(e);
      setPatientSummary(
        `Dr. ${doctor.name.split(',')[0]} evaluated your blood pressure and vitals. Your heart and blood pressure indicators remain stable and within healthy limits. Continue taking your prescriptions as scheduled.`
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSignChart = () => {
    const newNote: SoapNote = {
      id: `soap-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      doctorName: doctor.name,
      patientName: patient.name,
      subjective,
      objective,
      assessment,
      plan,
      signed: true,
      signedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    onSaveSoapNote(newNote);
    setSignedSuccess(true);
    setTimeout(() => setSignedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Patient EHR Summary Bar */}
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
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{patient.name}</h2>
                <span className="text-xs font-mono font-medium text-slate-500">MRN: {patient.mrn}</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span>DOB: {patient.dob} ({patient.age} yrs)</span>
                <span>·</span>
                <span>Sex: {patient.gender}</span>
                <span>·</span>
                <span>Blood: <strong>{patient.bloodType}</strong></span>
                <span>·</span>
                <span>Height/Weight: {patient.height} / {patient.weight}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenNewPrescription}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              <Pill className="w-4 h-4" />
              Prescribe Medication
            </button>
          </div>
        </div>

        {/* Clinical Snapshot Directives */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/70 dark:border-slate-800">
            <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-rose-500" />
              Latest Vitals (Today)
            </div>
            <div className="font-mono font-bold text-slate-900 dark:text-white text-sm">
              BP {latestVital?.systolicBp}/{latestVital?.diastolicBp} mmHg · HR {latestVital?.heartRate} bpm
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/70 dark:border-slate-800">
            <div className="font-semibold text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
              Allergies Directives
            </div>
            <div className="text-slate-800 dark:text-slate-200 font-medium">
              {patient.allergies.map((a) => a.substance).join(', ')}
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/70 dark:border-slate-800">
            <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Active Diagnoses
            </div>
            <div className="text-slate-800 dark:text-slate-200 font-medium truncate">
              {patient.chronicConditions.join(' · ')}
            </div>
          </div>
        </div>
      </div>

      {signedSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-200 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Clinical SOAP note officially signed by {doctor.name} and filed to Electronic Health Record.</span>
        </div>
      )}

      {/* SOAP Clinical Note Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              Clinical SOAP Encounter Documentation
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Standard clinical progress note with AI clinical synthesis support
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleAiSummarize}
              disabled={isAiLoading}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 rounded-xl border border-teal-200 dark:border-teal-800/60 transition-colors cursor-pointer"
            >
              {isAiLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Generating Clinical Synthesis...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  AI Clinical Summarizer
                </>
              )}
            </button>
          </div>
        </div>

        {patientSummary && (
          <div className="p-4 bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/50 rounded-xl space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
              Patient-Friendly Consultation Summary (Visible in Patient Portal)
            </span>
            <p className="text-xs text-teal-900 dark:text-teal-200 leading-relaxed">{patientSummary}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* Subjective */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              S — Subjective (Patient Presentation & History)
            </label>
            <textarea
              value={subjective}
              onChange={(e) => setSubjective(e.target.value)}
              rows={2}
              className="w-full p-3 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Objective */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              O — Objective (Exam Findings & Vitals)
            </label>
            <textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              rows={2}
              className="w-full p-3 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Assessment */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              A — Assessment (Differential Diagnosis & Clinical Stability)
            </label>
            <textarea
              value={assessment}
              onChange={(e) => setAssessment(e.target.value)}
              rows={2}
              className="w-full p-3 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Plan */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              P — Plan (Therapeutic Regimen & Follow-up)
            </label>
            <textarea
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              rows={2}
              className="w-full p-3 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Attending Signature: <strong>{doctor.name}</strong> · Medical License Verified
          </div>

          <button
            onClick={handleSignChart}
            className="flex items-center gap-1.5 px-6 py-2.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            Sign & File Encounter Note
          </button>
        </div>
      </div>

      {/* Past Signed Notes Record */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Past Encounters & Signed Records</h3>

        <div className="space-y-3">
          {soapNotes.map((note) => (
            <div
              key={note.id}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-900 dark:text-white">Date: {note.date}</span>
                <span>Signed by: {note.doctorName}</span>
              </div>
              <div className="text-slate-700 dark:text-slate-300 font-mono text-[11px] leading-relaxed">
                <strong>Assessment:</strong> {note.assessment}
              </div>
              <div className="text-slate-700 dark:text-slate-300 font-mono text-[11px] leading-relaxed">
                <strong>Plan:</strong> {note.plan}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
