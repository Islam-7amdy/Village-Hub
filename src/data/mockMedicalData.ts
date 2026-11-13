import { Doctor, PatientProfile, Appointment, VitalRecord, Prescription, LabResultItem, SoapNote, ChatMessage } from '../types/medical';

export const DOCTORS: Doctor[] = [
  {
    id: 'doc-jenkins',
    name: 'Dr. Sarah Jenkins, MD, FACC',
    title: 'Director of Preventive Cardiology',
    specialty: 'Cardiovascular Medicine',
    department: 'Heart & Vascular Institute',
    avatar: '/src/assets/images/doctor_sarah_jenkins_1794474295843.jpg',
    rating: 4.95,
    reviewsCount: 142,
    availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    education: 'Harvard Medical School · Johns Hopkins Residency',
    bio: 'Board-certified cardiologist specializing in preventive cardiology, hypertensive disease management, and remote cardiovascular monitoring.'
  },
  {
    id: 'doc-vance',
    name: 'Dr. Marcus Vance, MD',
    title: 'Senior Attending Physician',
    specialty: 'Internal Medicine',
    department: 'Adult Comprehensive Care',
    avatar: '/src/assets/images/doctor_marcus_vance_1794474296129.jpg',
    rating: 4.91,
    reviewsCount: 189,
    availableDays: ['Mon', 'Wed', 'Fri', 'Sat'],
    education: 'UCSF School of Medicine · Mayo Clinic Fellowship',
    bio: 'Clinical internist focusing on diagnostic synthesis, metabolic health, preventative wellness, and chronic illness coordination.'
  }
];

export const INITIAL_PATIENT: PatientProfile = {
  id: 'pat-rivera',
  name: 'Alex Rivera',
  age: 34,
  dob: '1992-05-18',
  gender: 'Male',
  bloodType: 'O Positive',
  mrn: 'VR-80924-B',
  avatar: '/src/assets/images/patient_alex_rivera_1794474296188.jpg',
  phone: '(555) 749-3820',
  email: 'alex.rivera@example.com',
  emergencyContact: {
    name: 'Elena Rivera',
    relationship: 'Spouse',
    phone: '(555) 749-3821'
  },
  allergies: [
    { substance: 'Amoxicillin / Penicillin', severity: 'Moderate', reaction: 'Urticaria (hives) & pruritus' },
    { substance: 'Contrast Dye (Iodinated)', severity: 'Mild', reaction: 'Flushing & localized rash' }
  ],
  chronicConditions: [
    'Stage 1 Essential Hypertension (Controlled)',
    'Mild Hyperlipidemia'
  ],
  primaryDoctorId: 'doc-jenkins',
  height: '5 ft 11 in (180 cm)',
  weight: '168 lbs (76.2 kg)'
};

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-101',
    patientId: 'pat-rivera',
    patientName: 'Alex Rivera',
    patientAvatar: '/src/assets/images/patient_alex_rivera_1794474296188.jpg',
    doctorId: 'doc-jenkins',
    doctorName: 'Dr. Sarah Jenkins, MD, FACC',
    doctorSpecialty: 'Cardiovascular Medicine',
    doctorAvatar: '/src/assets/images/doctor_sarah_jenkins_1794474295843.jpg',
    date: '2026-11-14',
    time: '10:30 AM',
    type: 'telehealth',
    location: 'Encrypted HD Video Room #4',
    reason: 'Routine 6-Month Cardiovascular Follow-up & Vitals Review',
    status: 'confirmed',
    symptoms: 'Stable home blood pressures; mild exertion fatigue last week.'
  },
  {
    id: 'apt-102',
    patientId: 'pat-rivera',
    patientName: 'Alex Rivera',
    patientAvatar: '/src/assets/images/patient_alex_rivera_1794474296188.jpg',
    doctorId: 'doc-vance',
    doctorName: 'Dr. Marcus Vance, MD',
    doctorSpecialty: 'Internal Medicine',
    doctorAvatar: '/src/assets/images/doctor_marcus_vance_1794474296129.jpg',
    date: '2026-11-22',
    time: '02:00 PM',
    type: 'in_person',
    location: 'Wellspring Health Pavilion, Suite 340',
    reason: 'Annual Wellness Exam & Fasting Metabolic Panel Review',
    status: 'confirmed'
  },
  {
    id: 'apt-099',
    patientId: 'pat-rivera',
    patientName: 'Alex Rivera',
    patientAvatar: '/src/assets/images/patient_alex_rivera_1794474296188.jpg',
    doctorId: 'doc-jenkins',
    doctorName: 'Dr. Sarah Jenkins, MD, FACC',
    doctorSpecialty: 'Cardiovascular Medicine',
    doctorAvatar: '/src/assets/images/doctor_sarah_jenkins_1794474295843.jpg',
    date: '2026-05-10',
    time: '11:00 AM',
    type: 'in_person',
    location: 'Heart Institute Clinic A',
    reason: 'Initial Blood Pressure Optimization Consultation',
    status: 'completed',
    notes: 'Prescribed Lisinopril 10mg daily. Tolerated with zero orthostasis.'
  }
];

export const INITIAL_VITALS: VitalRecord[] = [
  {
    id: 'vit-7',
    timestamp: '2026-11-12 08:15',
    systolicBp: 122,
    diastolicBp: 80,
    heartRate: 68,
    bloodGlucose: 94,
    spo2: 99,
    temperature: 98.6,
    weightLbs: 168.2,
    notes: 'Morning measurement before breakfast. Felt well rested.'
  },
  {
    id: 'vit-6',
    timestamp: '2026-11-11 08:30',
    systolicBp: 124,
    diastolicBp: 82,
    heartRate: 72,
    bloodGlucose: 96,
    spo2: 98,
    temperature: 98.4,
    weightLbs: 168.5,
    notes: 'Post morning 20-minute brisk walk.'
  },
  {
    id: 'vit-5',
    timestamp: '2026-11-10 08:00',
    systolicBp: 126,
    diastolicBp: 83,
    heartRate: 70,
    bloodGlucose: 98,
    spo2: 99,
    temperature: 98.7,
    weightLbs: 169.0
  },
  {
    id: 'vit-4',
    timestamp: '2026-11-09 08:10',
    systolicBp: 128,
    diastolicBp: 84,
    heartRate: 74,
    bloodGlucose: 102,
    spo2: 98,
    temperature: 98.6,
    weightLbs: 169.2
  },
  {
    id: 'vit-3',
    timestamp: '2026-11-08 08:20',
    systolicBp: 125,
    diastolicBp: 81,
    heartRate: 69,
    bloodGlucose: 95,
    spo2: 99,
    temperature: 98.5,
    weightLbs: 168.8
  },
  {
    id: 'vit-2',
    timestamp: '2026-11-07 08:45',
    systolicBp: 130,
    diastolicBp: 85,
    heartRate: 76,
    bloodGlucose: 99,
    spo2: 98,
    temperature: 98.6,
    weightLbs: 169.5
  },
  {
    id: 'vit-1',
    timestamp: '2026-11-06 08:15',
    systolicBp: 127,
    diastolicBp: 82,
    heartRate: 71,
    bloodGlucose: 97,
    spo2: 99,
    temperature: 98.4,
    weightLbs: 169.1
  }
];

export const INITIAL_PRESCRIPTIONS: Prescription[] = [
  {
    id: 'rx-201',
    medicationName: 'Lisinopril',
    dosage: '10 mg Oral Tablet',
    frequency: 'Once daily in the morning',
    timing: ['morning'],
    prescribedBy: 'Dr. Sarah Jenkins, MD',
    prescribedDate: '2026-05-10',
    refillsRemaining: 2,
    daysSupply: 30,
    instructions: 'Take 1 tablet every morning with or without food. Avoid potassium salt substitutes.',
    adherenceStatus: {
      morningTaken: true
    },
    refillRequested: false
  },
  {
    id: 'rx-202',
    medicationName: 'Atorvastatin Calcium',
    dosage: '20 mg Oral Tablet',
    frequency: 'Once nightly at bedtime',
    timing: ['evening', 'bedtime'],
    prescribedBy: 'Dr. Sarah Jenkins, MD',
    prescribedDate: '2026-05-10',
    refillsRemaining: 3,
    daysSupply: 90,
    instructions: 'Take 1 tablet at bedtime. Avoid grapefruit products while taking this medication.',
    adherenceStatus: {
      eveningTaken: false
    },
    refillRequested: false
  },
  {
    id: 'rx-203',
    medicationName: 'CoQ10 (Ubiquinol) Clinical Grade',
    dosage: '100 mg Softgel',
    frequency: 'Once daily with meals',
    timing: ['morning'],
    prescribedBy: 'Dr. Marcus Vance, MD',
    prescribedDate: '2026-06-14',
    refillsRemaining: 4,
    daysSupply: 60,
    instructions: 'Cardioprotective adjunct. Take with breakfast containing healthy fats.',
    adherenceStatus: {
      morningTaken: true
    },
    refillRequested: false
  }
];

export const INITIAL_LABS: LabResultItem[] = [
  {
    id: 'lab-301',
    name: 'Total Cholesterol',
    category: 'Lipid Panel',
    value: 178,
    unit: 'mg/dL',
    referenceRange: '< 200 mg/dL',
    status: 'normal',
    collectedDate: '2026-10-28',
    orderingDoctor: 'Dr. Sarah Jenkins, MD',
    notes: 'Improved by 24 mg/dL since baseline initiation of Atorvastatin.'
  },
  {
    id: 'lab-302',
    name: 'HDL ("Good") Cholesterol',
    category: 'Lipid Panel',
    value: 58,
    unit: 'mg/dL',
    referenceRange: '> 45 mg/dL',
    status: 'normal',
    collectedDate: '2026-10-28',
    orderingDoctor: 'Dr. Sarah Jenkins, MD'
  },
  {
    id: 'lab-303',
    name: 'LDL ("Bad") Cholesterol',
    category: 'Lipid Panel',
    value: 98,
    unit: 'mg/dL',
    referenceRange: '< 100 mg/dL',
    status: 'normal',
    collectedDate: '2026-10-28',
    orderingDoctor: 'Dr. Sarah Jenkins, MD',
    notes: 'Achieved targeted target range for intermediate cardiovascular risk stratification.'
  },
  {
    id: 'lab-304',
    name: 'Triglycerides',
    category: 'Lipid Panel',
    value: 110,
    unit: 'mg/dL',
    referenceRange: '< 150 mg/dL',
    status: 'normal',
    collectedDate: '2026-10-28',
    orderingDoctor: 'Dr. Sarah Jenkins, MD'
  },
  {
    id: 'lab-305',
    name: 'Fasting Plasma Glucose',
    category: 'Comprehensive Metabolic',
    value: 92,
    unit: 'mg/dL',
    referenceRange: '70 - 99 mg/dL',
    status: 'normal',
    collectedDate: '2026-10-28',
    orderingDoctor: 'Dr. Marcus Vance, MD'
  },
  {
    id: 'lab-306',
    name: 'Hemoglobin A1c',
    category: 'Glycemic Assessment',
    value: 5.3,
    unit: '%',
    referenceRange: '< 5.7 %',
    status: 'normal',
    collectedDate: '2026-10-28',
    orderingDoctor: 'Dr. Marcus Vance, MD'
  },
  {
    id: 'lab-307',
    name: 'Serum Creatinine',
    category: 'Renal Function Panel',
    value: 0.95,
    unit: 'mg/dL',
    referenceRange: '0.70 - 1.30 mg/dL',
    status: 'normal',
    collectedDate: '2026-10-28',
    orderingDoctor: 'Dr. Sarah Jenkins, MD',
    notes: 'Estimated GFR > 90 mL/min/1.73m² (Normal kidney clearance).'
  },
  {
    id: 'lab-308',
    name: 'Serum Potassium (K+)',
    category: 'Electrolyte Panel',
    value: 4.4,
    unit: 'mEq/L',
    referenceRange: '3.5 - 5.0 mEq/L',
    status: 'normal',
    collectedDate: '2026-10-28',
    orderingDoctor: 'Dr. Sarah Jenkins, MD',
    notes: 'Normal electrolyte homeostasis maintained under ACE inhibitor regimen.'
  }
];

export const INITIAL_SOAP_NOTES: SoapNote[] = [
  {
    id: 'soap-401',
    appointmentId: 'apt-099',
    date: '2026-05-10',
    doctorName: 'Dr. Sarah Jenkins, MD, FACC',
    patientName: 'Alex Rivera',
    subjective: 'Patient reports well-tolerated home lifestyle modifications, regular aerobic walking 4x weekly. Mild workplace stress noted, denies chest pain, palpitations, or dyspnea on exertion.',
    objective: 'BP sitting: 128/82 mmHg. HR: 72 bpm regular. S1/S2 present, no murmurs, gallops, or rubs. Lungs clear to auscultation bilaterally. Peripheral pulses 2+ intact throughout.',
    assessment: 'Primary essential hypertension, stage 1. Excellent responsiveness to current pharmacological regimen and lifestyle optimization. Lipid panel within optimal parameters.',
    plan: 'Continue Lisinopril 10mg PO QAM and Atorvastatin 20mg PO QHS. Continue home automated blood pressure telemetry twice weekly. Follow up in 6 months via virtual or in-person consultation.',
    signed: true,
    signedAt: '2026-05-10 11:45 AM'
  }
];

export const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    senderId: 'doc-jenkins',
    senderName: 'Dr. Sarah Jenkins, MD',
    senderRole: 'doctor',
    recipientId: 'pat-rivera',
    timestamp: '2026-11-10 09:20 AM',
    text: 'Good morning Alex. I reviewed your recent blood pressure logs from this week. Averaging 124/81 mmHg is right in our target therapeutic window. Keep up the consistent morning routine.',
    isRead: true
  },
  {
    id: 'msg-2',
    senderId: 'pat-rivera',
    senderName: 'Alex Rivera',
    senderRole: 'patient',
    recipientId: 'doc-jenkins',
    timestamp: '2026-11-10 10:05 AM',
    text: 'Thank you Dr. Jenkins! I am feeling energetic and haven\'t had any dizziness. I have our telehealth follow-up scheduled for this Friday.',
    isRead: true
  },
  {
    id: 'msg-3',
    senderId: 'doc-jenkins',
    senderName: 'Dr. Sarah Jenkins, MD',
    senderRole: 'doctor',
    recipientId: 'pat-rivera',
    timestamp: '2026-11-10 10:15 AM',
    text: 'Perfect. Have your latest home cuff readings handy during the call so we can calibrate. See you Friday!',
    isRead: true
  }
];
