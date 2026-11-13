import React, { useState } from 'react';
import { Appointment } from '../../types/medical';
import { Calendar, Video, Clock, MapPin, CheckCircle2, Plus, Download, AlertCircle } from 'lucide-react';

interface AppointmentsManagerProps {
  appointments: Appointment[];
  onOpenBookAppointment: () => void;
  onJoinTelehealth: (apt: Appointment) => void;
  onCheckIn: (aptId: string) => void;
  onCancelAppointment: (aptId: string) => void;
}

export const AppointmentsManager: React.FC<AppointmentsManagerProps> = ({
  appointments,
  onOpenBookAppointment,
  onJoinTelehealth,
  onCheckIn,
  onCancelAppointment
}) => {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('upcoming');

  const filteredAppointments = appointments.filter((apt) => {
    if (filter === 'upcoming') return apt.status === 'confirmed' || apt.status === 'checked_in';
    if (filter === 'completed') return apt.status === 'completed';
    return true;
  });

  const generateICS = (apt: Appointment) => {
    const title = `Medical Consultation: ${apt.doctorName} (${apt.doctorSpecialty})`;
    const description = `Reason: ${apt.reason}\\nLocation: ${apt.location}`;
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Vitalis Health//Clinical Calendar//EN
BEGIN:VEVENT
SUMMARY:${title}
DESCRIPTION:${description}
LOCATION:${apt.location}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `appointment-${apt.id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Clinical Consultations</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage upcoming video appointments, hospital visits, and clinical summaries
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Segmented Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            {(['upcoming', 'completed', 'all'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors capitalize cursor-pointer ${
                  filter === tab
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            onClick={onOpenBookAppointment}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Book Visit
          </button>
        </div>
      </div>

      {/* Appointment Cards Grid */}
      {filteredAppointments.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <Calendar className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">No Consultations Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            You currently have no {filter} appointments. Schedule a new consultation with your clinician anytime.
          </p>
          <button
            onClick={onOpenBookAppointment}
            className="px-4 py-2 text-xs font-medium text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 rounded-xl hover:bg-teal-100 transition-colors inline-block cursor-pointer"
          >
            Schedule Consultation Now
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((apt) => {
            const isTelehealth = apt.type === 'telehealth';
            const isConfirmed = apt.status === 'confirmed';
            const isCheckedIn = apt.status === 'checked_in';
            const isCompleted = apt.status === 'completed';

            return (
              <div
                key={apt.id}
                className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:border-slate-300 dark:hover:border-slate-700 space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Doctor Info */}
                  <div className="flex items-start gap-4">
                    <img
                      src={apt.doctorAvatar}
                      alt={apt.doctorName}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">{apt.doctorName}</h3>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">· {apt.doctorSpecialty}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">{apt.reason}</p>
                      {apt.symptoms && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Symptoms: {apt.symptoms}</p>
                      )}
                    </div>
                  </div>

                  {/* Status Indicator (Text Separator style, NO static pill enclosures) */}
                  <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2 shrink-0">
                    <span className="font-semibold capitalize text-teal-700 dark:text-teal-400">
                      {isCompleted ? 'Encounter Completed' : isCheckedIn ? 'Checked In Online' : 'Confirmed'}
                    </span>
                    <span>·</span>
                    <span className="text-slate-500 dark:text-slate-400">Ref #{apt.id}</span>
                  </div>
                </div>

                {/* Details Bar: Date, Time, Location */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
                    <span><strong>Date:</strong> {apt.date}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Clock className="w-4 h-4 text-teal-600 shrink-0" />
                    <span><strong>Time:</strong> {apt.time}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    {isTelehealth ? (
                      <>
                        <Video className="w-4 h-4 text-teal-600 shrink-0" />
                        <span><strong>HD Video Room:</strong> Encrypted</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
                        <span><strong>Location:</strong> {apt.location}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Bottom Action Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      onClick={() => generateICS(apt)}
                      className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Add to Calendar (.ics)
                    </button>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {isConfirmed && (
                      <button
                        onClick={() => onCheckIn(apt.id)}
                        className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                      >
                        Check-in Online
                      </button>
                    )}

                    {isTelehealth && !isCompleted && (
                      <button
                        onClick={() => onJoinTelehealth(apt)}
                        className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors shadow-sm cursor-pointer"
                      >
                        <Video className="w-3.5 h-3.5" />
                        Join Telehealth Room
                      </button>
                    )}

                    {!isCompleted && (
                      <button
                        onClick={() => onCancelAppointment(apt.id)}
                        className="text-xs text-rose-600 dark:text-rose-400 hover:underline px-2 py-1"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
