import React, { useState, useEffect } from 'react';
import { Appointment, PatientProfile, VitalRecord } from '../types/medical';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MessageSquare,
  Activity,
  FileText,
  Share2,
  CheckCircle2,
  Sparkles,
  Send
} from 'lucide-react';

interface TelehealthRoomProps {
  appointment: Appointment;
  patient: PatientProfile;
  latestVitals: VitalRecord;
  onEndCall: () => void;
  userRole: 'patient' | 'doctor';
}

export const TelehealthRoom: React.FC<TelehealthRoomProps> = ({
  appointment,
  patient,
  latestVitals,
  onEndCall,
  userRole
}) => {
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [activeSidePanel, setActiveSidePanel] = useState<'chat' | 'vitals' | 'notes'>('vitals');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string; time: string }>>([
    { sender: 'System', text: 'Encrypted HD Telehealth session established (256-bit AES).', time: '10:30 AM' },
    { sender: appointment.doctorName, text: 'Hello Alex! I have your latest blood pressure telemetry open on my screen.', time: '10:31 AM' }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [callDuration, setCallDuration] = useState(142); // seconds
  const [clinicalNotes, setClinicalNotes] = useState('Patient reports adherence to Lisinopril 10mg. Home BP steady at 122/80. No dizziness reported.');

  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    const now = new Date();
    const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    setChatMessages((prev) => [
      ...prev,
      {
        sender: userRole === 'patient' ? patient.name : appointment.doctorName,
        text: inputMsg.trim(),
        time: timeStr
      }
    ]);
    setInputMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col overflow-hidden">
      {/* Top Header */}
      <div className="h-14 px-6 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="font-semibold text-sm tracking-tight">Telehealth Consultation Room</span>
          </div>
          <span className="text-slate-500 text-xs">|</span>
          <span className="text-xs text-slate-300 font-mono tabular-nums">{formatDuration(callDuration)}</span>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-300">
          <span className="hidden sm:inline">Physician: <strong className="text-white">{appointment.doctorName}</strong></span>
          <span className="hidden sm:inline">Patient: <strong className="text-white">{patient.name}</strong></span>
          <span className="text-emerald-400 font-mono text-[11px] bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/80">
            Encrypted HD
          </span>
        </div>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Video Canvas Area */}
        <div className="flex-1 p-4 flex flex-col gap-4 relative">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
            {/* Primary Remote Feed (Doctor if patient, Patient if doctor) */}
            <div className="relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center group shadow-xl">
              <img
                src={userRole === 'patient' ? appointment.doctorAvatar : patient.avatar}
                alt="Remote video"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2">
                <span>{userRole === 'patient' ? appointment.doctorName : patient.name}</span>
                <span className="text-[10px] text-teal-400 font-mono">1080p · 60fps</span>
              </div>
            </div>

            {/* Local Feed (Self) */}
            <div className="relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center group shadow-xl">
              {videoOn ? (
                <img
                  src={userRole === 'patient' ? patient.avatar : appointment.doctorAvatar}
                  alt="Self video"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <div className="text-center p-6 space-y-2">
                  <div className="w-16 h-16 rounded-full bg-slate-800 mx-auto flex items-center justify-center text-slate-400">
                    <VideoOff className="w-8 h-8" />
                  </div>
                  <p className="text-xs text-slate-400">Your camera is turned off</p>
                </div>
              )}
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2">
                <span>You ({userRole === 'patient' ? 'Patient' : 'Clinician'})</span>
                {!micOn && <span className="text-rose-400 text-[10px]">[Muted]</span>}
              </div>
            </div>
          </div>

          {/* Bottom Call Controls Toolbar */}
          <div className="h-16 bg-slate-900/90 border border-slate-800 rounded-2xl px-6 flex items-center justify-between shrink-0 shadow-2xl">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMicOn(!micOn)}
                className={`p-3 rounded-xl transition-all cursor-pointer ${
                  micOn ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-rose-600 text-white'
                }`}
                title={micOn ? 'Mute Microphone' : 'Unmute Microphone'}
              >
                {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>

              <button
                onClick={() => setVideoOn(!videoOn)}
                className={`p-3 rounded-xl transition-all cursor-pointer ${
                  videoOn ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-rose-600 text-white'
                }`}
                title={videoOn ? 'Turn Camera Off' : 'Turn Camera On'}
              >
                {videoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>

              <button
                onClick={() => setScreenSharing(!screenSharing)}
                className={`p-3 rounded-xl transition-all cursor-pointer ${
                  screenSharing ? 'bg-teal-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
                title="Share Screen"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            {/* End Call Button */}
            <button
              onClick={onEndCall}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs transition-colors shadow-lg cursor-pointer"
            >
              <PhoneOff className="w-4 h-4" />
              <span>Leave Consultation</span>
            </button>

            {/* Side Panel Selectors */}
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setActiveSidePanel('vitals')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  activeSidePanel === 'vitals' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Vitals HUD</span>
              </button>
              <button
                onClick={() => setActiveSidePanel('chat')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  activeSidePanel === 'chat' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat</span>
              </button>
              <button
                onClick={() => setActiveSidePanel('notes')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  activeSidePanel === 'notes' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Clinical Notes</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Side Panel (Vitals HUD / Chat / Notes) */}
        <div className="w-80 lg:w-96 border-l border-slate-800 bg-slate-900 flex flex-col shrink-0">
          {activeSidePanel === 'vitals' && (
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-400" />
                  Live Patient Vitals Telemetry
                </h4>
                <span className="text-[10px] font-mono text-emerald-400">STREAMING</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
                  <div className="text-[11px] text-slate-400">Blood Pressure</div>
                  <div className="text-xl font-bold font-mono text-white mt-0.5">
                    {latestVitals.systolicBp}/{latestVitals.diastolicBp}
                  </div>
                  <div className="text-[10px] text-emerald-400 mt-1">Normal Resting</div>
                </div>

                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
                  <div className="text-[11px] text-slate-400">Heart Rate</div>
                  <div className="text-xl font-bold font-mono text-rose-400 mt-0.5">
                    {latestVitals.heartRate} <span className="text-xs font-normal text-slate-400">bpm</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Sinus Rhythm</div>
                </div>

                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
                  <div className="text-[11px] text-slate-400">Blood Glucose</div>
                  <div className="text-xl font-bold font-mono text-blue-400 mt-0.5">
                    {latestVitals.bloodGlucose} <span className="text-xs font-normal text-slate-400">mg/dL</span>
                  </div>
                  <div className="text-[10px] text-emerald-400 mt-1">Fasting Optimal</div>
                </div>

                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
                  <div className="text-[11px] text-slate-400">Oxygen (SpO2)</div>
                  <div className="text-xl font-bold font-mono text-teal-400 mt-0.5">
                    {latestVitals.spo2}%
                  </div>
                  <div className="text-[10px] text-emerald-400 mt-1">Room Air</div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-800/50 rounded-xl border border-slate-700/50 space-y-2">
                <div className="text-xs font-semibold text-slate-300">Allergies Directives</div>
                {patient.allergies.map((a, i) => (
                  <div key={i} className="text-xs text-amber-300">
                    ⚠ {a.substance} ({a.reaction})
                  </div>
                ))}
              </div>

              <div className="p-3.5 bg-slate-800/50 rounded-xl border border-slate-700/50 space-y-2">
                <div className="text-xs font-semibold text-slate-300">Consultation Reason</div>
                <p className="text-xs text-slate-400">{appointment.reason}</p>
                {appointment.symptoms && (
                  <p className="text-xs text-teal-300">Notes: {appointment.symptoms}</p>
                )}
              </div>
            </div>
          )}

          {activeSidePanel === 'chat' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-3.5 border-b border-slate-800 text-xs font-semibold text-slate-300">
                In-Call Encrypted Chat
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {chatMessages.map((m, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-200">{m.sender}</span>
                      <span>{m.time}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-800 text-xs text-slate-200 leading-relaxed">
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleSendChat} className="p-3 border-t border-slate-800 flex gap-2">
                <input
                  type="text"
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  placeholder="Type message in call..."
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                <button
                  type="submit"
                  className="p-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {activeSidePanel === 'notes' && (
            <div className="p-5 flex-1 flex flex-col space-y-3 overflow-hidden">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-400" />
                  Clinical Encounter Notes
                </h4>
                <span className="text-[10px] text-slate-400">Autosaved</span>
              </div>
              <p className="text-xs text-slate-400">
                Live doctor observations recorded during this telehealth consultation.
              </p>
              <textarea
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                className="flex-1 w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono leading-relaxed resize-none"
              />
              <div className="pt-2 flex items-center justify-between">
                <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Synched to Patient EHR
                </div>
                <button
                  onClick={() => alert('Encounter brief saved to Medical Records.')}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors cursor-pointer"
                >
                  Save to Record
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
