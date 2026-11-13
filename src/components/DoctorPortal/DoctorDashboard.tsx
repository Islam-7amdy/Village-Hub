import React from 'react';
import { Appointment, Doctor, PatientProfile } from '../../types/medical';
import { Users, Video, Calendar, Clock, CheckCircle2, FileText, ArrowRight, Activity, Plus } from 'lucide-react';

interface DoctorDashboardProps {
  doctor: Doctor;
  appointments: Appointment[];
  patient: PatientProfile;
  onJoinTelehealth: (apt: Appointment) => void;
  onOpenEHR: (apt: Appointment) => void;
  onStatusChange: (aptId: string, status: any) => void;
  onOpenNewPrescription: () => void;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({
  doctor,
  appointments,
  patient,
  onJoinTelehealth,
  onOpenEHR,
  onStatusChange,
  onOpenNewPrescription
}) => {
  const doctorAppointments = appointments.filter((a) => a.doctorId === doctor.id || a.patientId === patient.id);

  const completedCount = doctorAppointments.filter((a) => a.status === 'completed').length;
  const pendingCount = doctorAppointments.filter((a) => a.status === 'confirmed' || a.status === 'checked_in').length;

  return (
    <div className="space-y-6">
      {/* Clinician Welcome Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={doctor.avatar}
              alt={doctor.name}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-2xl object-cover border-2 border-white dark:border-slate-800 shadow-md shrink-0"
            />
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Clinician Workstation</div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{doctor.name}</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span>{doctor.title}</span>
                <span>·</span>
                <span>{doctor.department}</span>
                <span>·</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">On-Duty / Active Schedule</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenNewPrescription}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Write Prescription
            </button>
          </div>
        </div>
      </div>

      {/* 4 Clinic Metric Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Scheduled Today</span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
            {doctorAppointments.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Clinical Encounters</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Pending Consultation</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
            {pendingCount}
          </div>
          <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium mt-0.5">Awaiting Exam</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Completed Encounters</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
            {completedCount}
          </div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium mt-0.5">SOAP Signed</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Abnormal Lab Flags</span>
            <Activity className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
            0
          </div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium mt-0.5">All Panels In-Range</div>
        </div>
      </div>

      {/* Patient Queue & Schedule */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Patient Queue & Appointments</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Clinical intake status and direct telehealth dispatch</p>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">Queue: {doctorAppointments.length} patients</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3 font-semibold">Patient</th>
                <th className="px-6 py-3 font-semibold">Time & Type</th>
                <th className="px-6 py-3 font-semibold">Chief Complaint / Purpose</th>
                <th className="px-6 py-3 font-semibold">Intake Status</th>
                <th className="px-6 py-3 font-semibold text-right">Clinical Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {doctorAppointments.map((apt) => {
                const isCompleted = apt.status === 'completed';
                const isCheckedIn = apt.status === 'checked_in';
                const isTelehealth = apt.type === 'telehealth';

                return (
                  <tr key={apt.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Patient Column */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <img
                          src={apt.patientAvatar}
                          alt={apt.patientName}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                        />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{apt.patientName}</div>
                          <div className="text-[11px] font-mono text-slate-500">MRN: VR-80924</div>
                        </div>
                      </div>
                    </td>

                    {/* Time & Type */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {apt.time}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        {isTelehealth ? (
                          <>
                            <Video className="w-3 h-3 text-teal-600" />
                            HD Telehealth
                          </>
                        ) : (
                          <span>In-Person Suite 340</span>
                        )}
                      </div>
                    </td>

                    {/* Reason */}
                    <td className="px-6 py-4 max-w-xs">
                      <div className="font-medium text-slate-800 dark:text-slate-200 truncate">{apt.reason}</div>
                      {apt.symptoms && (
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">Note: {apt.symptoms}</div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold text-xs capitalize text-teal-700 dark:text-teal-400">
                        {isCompleted ? 'Encounter Signed' : isCheckedIn ? 'Checked-In Waiting' : 'Scheduled'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right whitespace-nowrap space-x-2">
                      <button
                        onClick={() => onOpenEHR(apt)}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5 text-teal-600" />
                        EHR Chart
                      </button>

                      {isTelehealth && !isCompleted && (
                        <button
                          onClick={() => onJoinTelehealth(apt)}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <Video className="w-3.5 h-3.5" />
                          Start Telehealth
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
