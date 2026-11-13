import React, { useState } from 'react';
import { ChatMessage, Doctor, PatientProfile } from '../../types/medical';
import { DOCTORS } from '../../data/mockMedicalData';
import { MessageSquare, Send, Paperclip, CheckCheck, Clock, User } from 'lucide-react';

interface SecureMessagingProps {
  messages: ChatMessage[];
  onSendMessage: (msg: ChatMessage) => void;
  patient: PatientProfile;
  currentRole: 'patient' | 'doctor';
}

export const SecureMessaging: React.FC<SecureMessagingProps> = ({
  messages,
  onSendMessage,
  patient,
  currentRole
}) => {
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(DOCTORS[0].id);
  const [text, setText] = useState('');

  const selectedDoctor = DOCTORS.find((d) => d.id === selectedDoctorId) || DOCTORS[0];

  const quickTemplates = [
    'Question about adjusting my medication dosage timing',
    'Follow-up regarding my latest lipid blood panel',
    'Requesting verification note for workplace health screening'
  ];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    const now = new Date();
    const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentRole === 'patient' ? patient.id : selectedDoctor.id,
      senderName: currentRole === 'patient' ? patient.name : selectedDoctor.name,
      senderRole: currentRole,
      recipientId: currentRole === 'patient' ? selectedDoctor.id : patient.id,
      timestamp: timeStr,
      text: text.trim(),
      isRead: true
    };

    onSendMessage(newMsg);
    setText('');

    // If patient sent, simulate clinician reply after 2.5 seconds
    if (currentRole === 'patient') {
      setTimeout(() => {
        const replyMsg: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          senderId: selectedDoctor.id,
          senderName: selectedDoctor.name,
          senderRole: 'doctor',
          recipientId: patient.id,
          timestamp: 'Just now',
          text: `Thank you for the update, Alex. I have logged this in your clinical chart. Please continue monitoring your readings as discussed.`,
          isRead: false
        };
        onSendMessage(replyMsg);
      }, 2500);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col md:flex-row h-[720px]">
      {/* Clinician Directory Sidebar */}
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-teal-600" />
            Care Team Direct Messaging
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">HIPAA-encrypted secure clinical communication</p>
        </div>

        <div className="p-3 space-y-2 overflow-y-auto flex-1">
          {DOCTORS.map((doc) => {
            const isSelected = selectedDoctorId === doc.id;
            return (
              <button
                key={doc.id}
                onClick={() => setSelectedDoctorId(doc.id)}
                className={`w-full p-3 rounded-xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                  isSelected
                    ? 'border-teal-600 bg-white dark:bg-slate-800 shadow-xs ring-1 ring-teal-600'
                    : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <img
                  src={doc.avatar}
                  alt={doc.name}
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-xl object-cover shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{doc.name}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{doc.specialty}</div>
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium mt-0.5">
                    Available Today
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Thread */}
      <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900">
        {/* Thread Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={selectedDoctor.avatar}
              alt={selectedDoctor.name}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-xl object-cover"
            />
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">{selectedDoctor.name}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">{selectedDoctor.title}</p>
            </div>
          </div>
          <div className="text-xs text-slate-400">Response time: &lt; 2 hrs</div>
        </div>

        {/* Message Bubble List */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((m) => {
            const isMe = (currentRole === 'patient' && m.senderRole === 'patient') ||
                         (currentRole === 'doctor' && m.senderRole === 'doctor');
            return (
              <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1 px-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{m.senderName}</span>
                  <span>·</span>
                  <span>{m.timestamp}</span>
                </div>
                <div
                  className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed ${
                    isMe
                      ? 'bg-teal-600 text-white rounded-br-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-xs'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Template Prompts */}
        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
            Quick Ask:
          </span>
          {quickTemplates.map((tpl, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setText(tpl)}
              className="text-xs px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              {tpl}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Send secure medical message to ${selectedDoctor.name.split(',')[0]}...`}
            className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="p-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white transition-colors cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
