// Note: This is a mock implementation since we don't have actual Gemini API access
// In production, this would make real API calls to Google's Gemini API

type VitalSigns = {
  heartRate: number;
  oxygenSaturation: number;
  bloodPressure: string;
  respirationRate: number;
};

type TriageInput = {
  vitals: VitalSigns;
  symptoms: string[];
};

type TriageResult = {
  severity: "immediate" | "urgent" | "delayed";
  explanation: string;
};

function analyzeVitals(vitals: VitalSigns): number {
  let score = 0;
  
  // Heart rate analysis
  if (vitals.heartRate > 120 || vitals.heartRate < 50) score += 2;
  else if (vitals.heartRate > 100 || vitals.heartRate < 60) score += 1;
  
  // Oxygen saturation
  if (vitals.oxygenSaturation < 90) score += 2;
  else if (vitals.oxygenSaturation < 95) score += 1;
  
  // Blood pressure - parse systolic/diastolic
  const [systolic, diastolic] = vitals.bloodPressure.split('/').map(Number);
  if (systolic > 180 || systolic < 90 || diastolic > 120 || diastolic < 60) score += 2;
  else if (systolic > 140 || systolic < 100 || diastolic > 90 || diastolic < 70) score += 1;
  
  // Respiration rate
  if (vitals.respirationRate > 30 || vitals.respirationRate < 8) score += 2;
  else if (vitals.respirationRate > 20 || vitals.respirationRate < 12) score += 1;
  
  return score;
}

function analyzeSymptoms(symptoms: string[]): number {
  const criticalSymptoms = [
    "chest pain",
    "difficulty breathing",
    "unconscious",
    "severe bleeding",
    "stroke",
    "seizure",
  ];
  
  const urgentSymptoms = [
    "fever",
    "vomiting",
    "dizziness",
    "moderate pain",
    "trauma",
    "injury",
  ];
  
  let score = 0;
  const symptomsLower = symptoms.map(s => s.toLowerCase());
  
  for (const symptom of symptomsLower) {
    if (criticalSymptoms.some(s => symptom.includes(s))) score += 2;
    else if (urgentSymptoms.some(s => symptom.includes(s))) score += 1;
  }
  
  return score;
}

export async function getTriageAssessment(input: TriageInput): Promise<TriageResult> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const vitalScore = analyzeVitals(input.vitals);
  const symptomScore = analyzeSymptoms(input.symptoms);
  const totalScore = vitalScore + symptomScore;
  
  if (totalScore >= 4) {
    return {
      severity: "immediate",
      explanation: "Critical condition detected. Immediate medical attention required due to abnormal vital signs and severe symptoms.",
    };
  } else if (totalScore >= 2) {
    return {
      severity: "urgent",
      explanation: "Urgent care needed. Patient shows concerning vital signs or symptoms that require prompt medical attention.",
    };
  } else {
    return {
      severity: "delayed",
      explanation: "Non-urgent condition. Patient is stable with minor symptoms. Monitor for any changes in condition.",
    };
  }
}
