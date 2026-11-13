import React, { useState } from 'react';
import { DOCTORS } from '../../data/mockMedicalData';
import { Appointment, VisitType } from '../../types/medical';
import { X, Calendar, Clock, Video, Building, CheckCircle2 } from 'lucide-react';

interface BookAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBook: (newApt: Appointment) => void;
  patientId: string;
  patientName: string;
  patientAvatar: string;
  initialDoctorId?: string;
}

export const BookAppointmentModal: React.FC<BookAppointmentModalProps> = ({
  isOpen,
  onClose,
  onBook,
  patientId,
  patientName,
  patientAvatar,
  initialDoctorId
}) => {
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(initialDoctorId || DOCTORS[0].id);
  const [visitType, setVisitType] = useState<VisitType>('telehealth');
  const [selectedDate, setSelectedDate] = useState<string>('2026-11-18');
  const [selectedTime, setSelectedTime] = useState<string>('10:00 AM');
  const [reason, setReason] = useState<string>('');
  const [symptoms, setSymptoms] = useState<string>('');
  const [bookedSuccess, setBookedSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const selectedDoctor = DOCTORS.find((d) => d.id === selectedDoctorId) || DOCTORS[0];

  const timeSlots = [
    '09:00 AM', '09:45 AM', '10:30 AM', '11:15 AM',
    '01:30 PM', '02:15 PM', '03:00 PM', '04:00 PM'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    const newAppointment: Appointment = {
      id: `apt-${Date.now()}`,
      patientId,
      patientName,
      patientAvatar,
      doctorId: selectedDoctor.id,
      doctorName: selectedDoctor.name,
      doctorSpecialty: selectedDoctor.specialty,
      doctorAvatar: selectedDoctor.avatar,
      date: selectedDate,
      time: selectedTime,
      type: visitType,
      location: visitType === 'telehealth' ? 'Encrypted HD Video Room' : 'Wellspring Health Pavilion, Suite 340',
      reason,
      symptoms,
      status: 'confirmed'
    };

    onBook(newAppointment);
    setBookedSuccess(true);
    setTimeout(() => {
      setBookedSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Schedule Consultation</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Book in-person clinic visits or encrypted telehealth sessions</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {bookedSuccess ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-12 h-12 bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Appointment Confirmed</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Your consultation with {selectedDoctor.name} on {selectedDate} at {selectedTime} has been scheduled.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            {/* Step 1: Select Doctor */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Select Clinician
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DOCTORS.map((doc) => {
                  const isSelected = selectedDoctorId === doc.id;
                  return (
                    <button
                      type="button"
                      key={doc.id}
                      onClick={() => setSelectedDoctorId(doc.id)}
                      className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50/50 dark:bg-teal-950/30 dark:border-teal-500 ring-1 ring-teal-600'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <img
                        src={doc.avatar}
                        alt={doc.name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-lg object-cover shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">{doc.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{doc.specialty}</div>
                        <div className="text-xs text-teal-600 dark:text-teal-400 font-medium mt-1">★ {doc.rating} ({doc.reviewsCount})</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Visit Type */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Consultation Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setVisitType('telehealth')}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                    visitType === 'telehealth'
                      ? 'border-teal-600 bg-teal-50/50 dark:bg-teal-950/30 dark:border-teal-500 ring-1 ring-teal-600'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                  }`}
                >
                  <Video className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">HD Telehealth</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Encrypted video visit</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setVisitType('in_person')}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                    visitType === 'in_person'
                      ? 'border-teal-600 bg-teal-50/50 dark:bg-teal-950/30 dark:border-teal-500 ring-1 ring-teal-600'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                  }`}
                >
                  <Building className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">In-Person Clinic</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Wellspring Pavilion</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Step 3: Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  Preferred Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  min="2026-11-13"
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  Time Slot
                </label>
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Step 4: Reason & Symptoms */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Primary Reason for Consultation *
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Routine blood pressure check, medication side-effect, follow-up"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Symptoms or Clinical Notes (Optional)
              </label>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                rows={2}
                placeholder="Describe any current symptoms, recent changes in medication, or specific questions..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Footer Buttons */}
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
                Confirm Appointment
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
