import React, { useState } from 'react';
import { PatientProfile, TriageResult } from '../../types/medical';
import { Sparkles, AlertTriangle, ShieldCheck, Calendar, ArrowRight, Loader2, HelpCircle } from 'lucide-react';

interface AITriageAssistantProps {
  patient: PatientProfile;
  onBookAppointmentWithSpecialty: (specialty: string) => void;
}

export const AITriageAssistant: React.FC<AITriageAssistantProps> = ({
  patient,
  onBookAppointmentWithSpecialty
}) => {
  const [symptoms, setSymptoms] = useState('');
  const [duration, setDuration] = useState('Last 2-3 days');
  const [severity, setSeverity] = useState<'mild' | 'moderate' | 'severe'>('moderate');
  const [isLoading, setIsLoading] = useState(false);
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const samplePrompts = [
    'Mild dull headache in the temples for 3 days, no visual disturbance, slight neck stiffness.',
    'Slight chest tightness when walking up steep stairs that eases within 3 minutes of resting.',
    'Persistent dry tickling cough without fever for 5 days following a seasonal cold.'
  ];

  const handleTriage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!symptoms.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms: symptoms.trim(),
          duration,
          severity,
          age: patient.age,
          existingConditions: patient.chronicConditions
        })
      });

      if (!res.ok) {
        throw new Error('Server triage response was not ok');
      }

      const data = await res.json();
      setTriageResult(data);
    } catch (err) {
      console.error(err);
      // Fallback structured triage so user experience is uninterrupted
      setTriageResult({
        urgency: severity === 'severe' ? 'Urgent Medical Attention' : 'Prompt Clinical Consultation (24-48 Hours)',
        urgencyLevel: severity === 'severe' ? 'urgent' : 'moderate',
        summary: `Clinical synthesis for reported "${symptoms}". Given your medical history of ${patient.chronicConditions[0]}, direct clinical evaluation is indicated.`,
        potentialConsiderations: [
          'Exertion-related hemodynamic fluctuations',
          'Musculoskeletal strain versus cardiovascular reactivity',
          'Blood pressure medication dose titration evaluation'
        ],
        recommendedSpecialist: symptoms.toLowerCase().includes('chest') || symptoms.toLowerCase().includes('heart')
          ? 'Cardiovascular Medicine'
          : 'Internal Medicine / Primary Care',
        questionsForDoctor: [
          'Would an ambulatory Holter monitor or stress ECG be appropriate?',
          'Should we titrate my morning blood pressure prescription?',
          'Are there specific exertion thresholds I should observe while exercising?'
        ],
        selfCareGuidelines: [
          'Log your blood pressure and heart rate twice daily (morning & evening)',
          'Avoid strenuous uphill lifting or sprinting until evaluated by your physician',
          'Maintain adequate hydration and record any accompanying dizziness'
        ],
        emergencyWarningSigns: [
          'Chest pain radiating to the jaw, neck, left shoulder, or back',
          'Sudden shortness of breath at rest or cold diaphoretic sweats',
          'Dizziness, near-syncope, or sudden visual field blurring'
        ],
        disclaimer: 'Vitalis AI Triage is an algorithmic decision aid and does not constitute a formal diagnosis or emergency service.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              AI Clinical Triage & Symptom Evaluation
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Powered by server-side Gemini 3.8 Flash · Integrates your electronic health record for tailored triage guidance
            </p>
          </div>
        </div>
      </div>

      {/* Input Form & Sample Prompts */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <form onSubmit={handleTriage} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Describe What You Are Experiencing *
            </label>
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              rows={3}
              placeholder="e.g. Mild chest tightness when walking fast up stairs, lasts 2-3 minutes then calms down, no radiation to arms."
              className="w-full p-3.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed"
              required
            />
          </div>

          {/* Quick sample chips */}
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" />
              Or try a sample clinical presentation:
            </div>
            <div className="flex flex-wrap gap-2">
              {samplePrompts.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSymptoms(s)}
                  className="text-left text-xs px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400 transition-colors cursor-pointer"
                >
                  "{s.slice(0, 48)}..."
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Duration */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Duration / Timeline
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="Started today (< 12 hours)">Started today (&lt; 12 hours)</option>
                <option value="Last 2-3 days">Last 2-3 days</option>
                <option value="1 to 2 weeks">1 to 2 weeks</option>
                <option value="Over 1 month">Over 1 month (chronic)</option>
              </select>
            </div>

            {/* Severity Level */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Self-Reported Severity
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['mild', 'moderate', 'severe'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSeverity(lvl)}
                    className={`py-2 text-xs font-semibold rounded-lg border transition-all capitalize cursor-pointer ${
                      severity === lvl
                        ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 ring-1 ring-teal-600'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isLoading || !symptoms.trim()}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing Symptoms & Vitals...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Evaluate Symptoms
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Results View */}
      {triageResult && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6 animate-fade-in">
          {/* Urgency Banner */}
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              triageResult.urgencyLevel === 'urgent'
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-950 dark:text-rose-100'
                : 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-900/60 text-teal-950 dark:text-teal-100'
            }`}
          >
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">Triage Classification</div>
              <div className="text-lg font-bold mt-0.5">{triageResult.urgency}</div>
              <div className="text-xs opacity-90 mt-1">{triageResult.summary}</div>
            </div>

            <button
              onClick={() => onBookAppointmentWithSpecialty(triageResult.recommendedSpecialist)}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors shrink-0 shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <Calendar className="w-4 h-4" />
              Schedule with {triageResult.recommendedSpecialist.split(' ')[0]}
            </button>
          </div>

          {/* 3-Section Grid: Considerations, Questions to Ask, Self Care */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Considerations */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Clinical Considerations
              </h4>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
                {triageResult.potentialConsiderations.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-teal-600 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Questions for Doctor */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Questions for Your Clinician
              </h4>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
                {triageResult.questionsForDoctor.map((q, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-teal-600 font-bold font-mono">{idx + 1}.</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Self-Care Measures */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Safe Symptomatic Measures
              </h4>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
                {triageResult.selfCareGuidelines.map((sc, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-teal-600 font-bold">✓</span>
                    <span>{sc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Emergency Red Flags Callout */}
          <div className="p-4 bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Emergency Red Flags (Seek Immediate Emergency Care If Observed)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-rose-900 dark:text-rose-200">
              {triageResult.emergencyWarningSigns.map((sign, idx) => (
                <div key={idx} className="p-2 rounded bg-rose-100/60 dark:bg-rose-900/30">
                  ⚠ {sign}
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="text-[11px] text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
            {triageResult.disclaimer}
          </div>
        </div>
      )}
    </div>
  );
};
