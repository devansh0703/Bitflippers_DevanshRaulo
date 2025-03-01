
import { Patient } from "@shared/schema";

// Simulated EHR database with synthetic patient data
const ehrPatients: Patient[] = [
  {
    id: 1,
    medicalRecordNumber: "MRN12345",
    name: "John Smith",
    age: 68,
    gender: "male",
    bloodType: "A+",
    allergies: "Penicillin, Sulfa drugs",
    medicalHistory: "Hypertension, Type 2 Diabetes, CABG (2015)",
    medications: "Metformin 1000mg BID, Lisinopril 20mg daily, Atorvastatin 40mg daily",
    recentVisits: [
      {
        date: "2023-12-15",
        reason: "Routine diabetes follow-up",
        diagnosis: "Controlled diabetes, stable hypertension",
        treatment: "Continue current medications, blood work ordered"
      },
      {
        date: "2023-09-02",
        reason: "Chest pain",
        diagnosis: "Stable angina, no acute coronary syndrome",
        treatment: "Added low-dose aspirin, stress test scheduled"
      }
    ]
  },
  {
    id: 2,
    medicalRecordNumber: "MRN67890",
    name: "Mary Johnson",
    age: 42,
    gender: "female",
    bloodType: "O-",
    allergies: "Latex, Contrast dye",
    medicalHistory: "Asthma, Migraine headaches, Appendectomy (2010)",
    medications: "Albuterol inhaler PRN, Sumatriptan 50mg PRN, Fluticasone nasal spray daily",
    recentVisits: [
      {
        date: "2024-01-20",
        reason: "Severe migraine",
        diagnosis: "Migraine with aura",
        treatment: "IV fluids and antiemetics in ED, preventive therapy discussed"
      }
    ]
  },
  {
    id: 3,
    medicalRecordNumber: "MRN54321",
    name: "Robert Chen",
    age: 55,
    gender: "male",
    bloodType: "B+",
    allergies: "None known",
    medicalHistory: "Hyperlipidemia, GERD, Mild depression",
    medications: "Omeprazole 20mg daily, Rosuvastatin 10mg daily, Sertraline 50mg daily",
    recentVisits: [
      {
        date: "2023-11-12",
        reason: "Annual physical",
        diagnosis: "Hyperlipidemia, well-controlled",
        treatment: "Continue current medications, dietary counseling"
      }
    ]
  },
  {
    id: 4,
    medicalRecordNumber: "MRN24680",
    name: "Sarah Williams",
    age: 35,
    gender: "female",
    bloodType: "AB+",
    allergies: "Codeine, Shellfish",
    medicalHistory: "Anxiety disorder, Hypothyroidism, Cesarean section (2021)",
    medications: "Levothyroxine 75mcg daily, Escitalopram 10mg daily",
    recentVisits: [
      {
        date: "2024-02-05",
        reason: "Thyroid function check",
        diagnosis: "Controlled hypothyroidism",
        treatment: "Continue current levothyroxine dose"
      }
    ]
  },
  {
    id: 5,
    medicalRecordNumber: "MRN13579",
    name: "James Wilson",
    age: 72,
    gender: "male",
    bloodType: "A-",
    allergies: "ACE inhibitors (cough)",
    medicalHistory: "Atrial fibrillation, Osteoarthritis, COPD, Prostate cancer (in remission)",
    medications: "Apixaban 5mg BID, Tiotropium inhaler daily, Acetaminophen 500mg PRN",
    recentVisits: [
      {
        date: "2023-10-30",
        reason: "COPD exacerbation",
        diagnosis: "Acute bronchitis with COPD exacerbation",
        treatment: "Prednisone taper, azithromycin course, increased inhaler frequency"
      },
      {
        date: "2023-08-15",
        reason: "Fall at home",
        diagnosis: "Contusion of left hip, no fracture",
        treatment: "Physical therapy referral, home safety evaluation"
      }
    ]
  }
];

// API for EHR access
export class EHRService {
  // Get all patients (limited data for search purposes)
  getAllPatients(): Pick<Patient, 'id' | 'medicalRecordNumber' | 'name' | 'age' | 'gender'>[] {
    return ehrPatients.map(patient => ({
      id: patient.id,
      medicalRecordNumber: patient.medicalRecordNumber,
      name: patient.name,
      age: patient.age,
      gender: patient.gender
    }));
  }

  // Get detailed patient data by ID
  getPatientById(id: number): Patient | undefined {
    return ehrPatients.find(patient => patient.id === id);
  }

  // Search patients by name (case-insensitive partial match)
  searchPatients(query: string): Pick<Patient, 'id' | 'medicalRecordNumber' | 'name' | 'age' | 'gender'>[] {
    const normalizedQuery = query.toLowerCase();
    return this.getAllPatients().filter(patient =>
      patient.name.toLowerCase().includes(normalizedQuery) ||
      patient.medicalRecordNumber.toLowerCase().includes(normalizedQuery)
    );
  }

  // Add a new medical encounter to patient history
  addEncounter(patientId: number, encounter: any): Patient | undefined {
    const patient = ehrPatients.find(p => p.id === patientId);
    if (!patient) return undefined;
    
    const patientIndex = ehrPatients.findIndex(p => p.id === patientId);
    
    // Create a new encounter from the report data
    const newVisit = {
      date: new Date().toISOString().slice(0, 10),
      reason: encounter.complaints,
      diagnosis: encounter.triageAssessment?.explanation || "Pending diagnosis",
      treatment: encounter.treatment 
        ? `Medications: ${encounter.treatment.medications}. Interventions: ${encounter.treatment.interventions}` 
        : "Pending treatment"
    };
    
    // Add to patient's record
    const updatedPatient = {
      ...patient,
      recentVisits: [newVisit, ...patient.recentVisits]
    };
    
    // Update in our mock database
    ehrPatients[patientIndex] = updatedPatient;
    
    return updatedPatient;
  }
}

export const ehrService = new EHRService();
