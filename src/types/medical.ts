export type UserRole = 'patient' | 'doctor';

export interface Doctor {
  id: string;
  name: string;
  title: string;
  specialty: string;
  department: string;
  avatar: string;
  rating: number;
  reviewsCount: number;
  availableDays: string[];
  education: string;
  bio: string;
}

export interface PatientProfile {
  id: string;
  name: string;
  age: number;
  dob: string;
  gender: string;
  bloodType: string;
  mrn: string; // Medical Record Number
  avatar: string;
  phone: string;
  email: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  allergies: Array<{ substance: string; severity: 'Mild' | 'Moderate' | 'Severe'; reaction: string }>;
  chronicConditions: string[];
  primaryDoctorId: string;
  height: string;
  weight: string;
}

export type AppointmentStatus = 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled';
export type VisitType = 'telehealth' | 'in_person';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientAvatar: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorAvatar: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "09:30 AM"
  type: VisitType;
  location: string;
  reason: string;
  status: AppointmentStatus;
  symptoms?: string;
  notes?: string;
}

export interface VitalRecord {
  id: string;
  timestamp: string;
  systolicBp: number;
  diastolicBp: number;
  heartRate: number;
  bloodGlucose: number;
  spo2: number;
  temperature: number;
  weightLbs: number;
  notes?: string;
}

export interface Prescription {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  timing: ('morning' | 'afternoon' | 'evening' | 'bedtime')[];
  prescribedBy: string;
  prescribedDate: string;
  refillsRemaining: number;
  daysSupply: number;
  instructions: string;
  adherenceStatus: {
    morningTaken?: boolean;
    afternoonTaken?: boolean;
    eveningTaken?: boolean;
  };
  refillRequested?: boolean;
}

export interface LabResultItem {
  id: string;
  name: string;
  category: string;
  value: number | string;
  unit: string;
  referenceRange: string;
  status: 'normal' | 'low' | 'high' | 'critical';
  collectedDate: string;
  orderingDoctor: string;
  notes?: string;
}

export interface SoapNote {
  id: string;
  appointmentId?: string;
  date: string;
  doctorName: string;
  patientName: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  signed: boolean;
  signedAt?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  recipientId: string;
  timestamp: string;
  text: string;
  attachmentName?: string;
  isRead: boolean;
}

export interface TriageResult {
  urgency: string;
  urgencyLevel: 'urgent' | 'moderate' | 'routine';
  summary: string;
  potentialConsiderations: string[];
  recommendedSpecialist: string;
  questionsForDoctor: string[];
  selfCareGuidelines: string[];
  emergencyWarningSigns: string[];
  disclaimer: string;
}
