import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "default_key");

export async function getTriageAssessment(patientData: any) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  
  const prompt = `You are a medical expert AI Triage, analyze this patient data:
    Name: ${patientData.patientName}
    Age: ${patientData.patientAge}
    Gender: ${patientData.patientGender}
    Heart Rate: ${patientData.heartRate} bpm
    Blood Pressure: ${patientData.bloodPressure} mmHg
    Respiratory Rate: ${patientData.respiratoryRate} breaths/min
    Oxygen Saturation: ${patientData.oxygenSaturation}%
    Temperature: ${patientData.temperature}°C
    Complaints: ${patientData.complaints}
    Medical History: ${patientData.medicalHistory}
    Allergies: ${patientData.allergies}
    Current Medications: ${patientData.currentMedications}
    
    Provide severity level (Immediate, Urgent, Delayed) and explanation.`;

  const result = await model.generateContent(prompt);
  const response = result.response.text();
  const [severity, ...explanation] = response.split("\n");
  
  return {
    severity: severity.trim(),
    explanation: explanation.join("\n").trim()
  };
}
