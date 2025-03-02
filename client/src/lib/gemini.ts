import { z } from "zod";

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

type DoctorRecommendationInput = {
  vitals: VitalSigns;
  symptoms: string[];
  triageResult: TriageResult;
};

function analyzeVitals(vitals: VitalSigns): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // Heart rate analysis
  if (vitals.heartRate > 120) {
    score += 2;
    reasons.push("Tachycardia (elevated heart rate > 120 bpm)");
  } else if (vitals.heartRate < 50) {
    score += 2;
    reasons.push("Bradycardia (low heart rate < 50 bpm)");
  } else if (vitals.heartRate > 100 || vitals.heartRate < 60) {
    score += 1;
    reasons.push("Heart rate outside normal range (60-100 bpm)");
  }

  // Oxygen saturation
  if (vitals.oxygenSaturation < 90) {
    score += 2;
    reasons.push("Severe hypoxemia (oxygen saturation < 90%)");
  } else if (vitals.oxygenSaturation < 95) {
    score += 1;
    reasons.push("Mild hypoxemia (oxygen saturation < 95%)");
  }

  // Blood pressure - parse systolic/diastolic
  const [systolic, diastolic] = vitals.bloodPressure.split('/').map(Number);
  if (systolic > 180 || systolic < 90 || diastolic > 120 || diastolic < 60) {
    score += 2;
    reasons.push(`Critical blood pressure: ${vitals.bloodPressure} mmHg`);
  } else if (systolic > 140 || systolic < 100 || diastolic > 90 || diastolic < 70) {
    score += 1;
    reasons.push(`Abnormal blood pressure: ${vitals.bloodPressure} mmHg`);
  }

  // Respiration rate
  if (vitals.respirationRate > 30 || vitals.respirationRate < 8) {
    score += 2;
    reasons.push(`Severe respiratory distress (rate: ${vitals.respirationRate}/min)`);
  } else if (vitals.respirationRate > 20 || vitals.respirationRate < 12) {
    score += 1;
    reasons.push(`Abnormal respiratory rate: ${vitals.respirationRate}/min`);
  }

  return { score, reasons };
}

function analyzeSymptoms(symptoms: string[]): { score: number; reasons: string[] } {
  const criticalSymptoms = [
    { pattern: /chest pain|chest pressure/i, desc: "Chest pain/pressure" },
    { pattern: /difficulty breathing|shortness of breath/i, desc: "Respiratory distress" },
    { pattern: /unconscious|unresponsive/i, desc: "Altered consciousness" },
    { pattern: /severe bleeding|hemorrhage/i, desc: "Severe bleeding" },
    { pattern: /stroke|facial drooping|slurred speech/i, desc: "Stroke symptoms" },
    { pattern: /seizure|convulsion/i, desc: "Seizure activity" },
  ];

  const urgentSymptoms = [
    { pattern: /fever|high temperature/i, desc: "Fever" },
    { pattern: /vomiting|nausea/i, desc: "Vomiting" },
    { pattern: /dizziness|vertigo/i, desc: "Dizziness" },
    { pattern: /moderate pain/i, desc: "Moderate pain" },
    { pattern: /trauma|injury/i, desc: "Trauma/injury" },
    { pattern: /allergic|allergy/i, desc: "Allergic reaction" },
  ];

  let score = 0;
  const reasons: string[] = [];

  for (const symptom of symptoms) {
    for (const critical of criticalSymptoms) {
      if (critical.pattern.test(symptom)) {
        score += 2;
        reasons.push(`Critical symptom: ${critical.desc}`);
      }
    }
    for (const urgent of urgentSymptoms) {
      if (urgent.pattern.test(symptom)) {
        score += 1;
        reasons.push(`Urgent symptom: ${urgent.desc}`);
      }
    }
  }

  return { score, reasons };
}

export async function getTriageAssessment(input: TriageInput): Promise<TriageResult> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  const vitalsAnalysis = analyzeVitals(input.vitals);
  const symptomsAnalysis = analyzeSymptoms(input.symptoms);
  const totalScore = vitalsAnalysis.score + symptomsAnalysis.score;

  const allReasons = [...vitalsAnalysis.reasons, ...symptomsAnalysis.reasons];

  if (totalScore >= 4) {
    return {
      severity: "immediate",
      explanation: `IMMEDIATE ATTENTION REQUIRED\n\nRationale:\n${allReasons.map(r => "- " + r).join("\n")}\n\nRecommendation: Patient requires immediate emergency intervention due to critical vital signs and/or symptoms.`,
    };
  } else if (totalScore >= 2) {
    return {
      severity: "urgent",
      explanation: `URGENT CARE NEEDED\n\nRationale:\n${allReasons.map(r => "- " + r).join("\n")}\n\nRecommendation: Patient requires prompt medical attention but is not immediately life-threatening.`,
    };
  } else {
    return {
      severity: "delayed",
      explanation: `NON-URGENT STATUS\n\nAssessment:\n${allReasons.length ? allReasons.map(r => "- " + r).join("\n") : "- Vital signs within normal ranges\n- No critical or urgent symptoms reported"}\n\nRecommendation: Patient is stable and can be evaluated in order of arrival.`,
    };
  }
}

export async function getDoctorRecommendation(input: DoctorRecommendationInput): Promise<string> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  const { vitals, symptoms, triageResult } = input;

  // Common medications based on symptoms
  const medicationRecommendations: string[] = [];
  const interventions: string[] = [];
  const monitoringInstructions: string[] = [];

  // Analyze vitals for interventions
  if (vitals.heartRate > 120 || vitals.heartRate < 50) {
    interventions.push("- Continuous cardiac monitoring");
    monitoringInstructions.push("- Monitor heart rate every 5 minutes");
  }

  if (vitals.oxygenSaturation < 95) {
    interventions.push("- Administer supplemental oxygen");
    monitoringInstructions.push("- Monitor oxygen saturation continuously");
  }

  const [systolic, diastolic] = vitals.bloodPressure.split('/').map(Number);
  if (systolic > 180 || systolic < 90 || diastolic > 120 || diastolic < 60) {
    interventions.push("- Regular blood pressure monitoring");
    monitoringInstructions.push("- Record blood pressure every 10 minutes");
  }

  // Analyze symptoms for medication recommendations
  for (const symptom of symptoms) {
    if (/pain|ache/i.test(symptom)) {
      medicationRecommendations.push("- Consider appropriate analgesics based on pain severity");
    }
    if (/fever|temperature/i.test(symptom)) {
      medicationRecommendations.push("- Antipyretic medication if temperature exceeds 38.5°C");
    }
    if (/breathing|breath/i.test(symptom)) {
      medicationRecommendations.push("- Bronchodilators may be indicated");
      interventions.push("- Position patient for optimal breathing");
    }
    if (/bleeding/i.test(symptom)) {
      interventions.push("- Apply direct pressure to bleeding sites");
      interventions.push("- Prepare for potential fluid resuscitation");
    }
    if (/allergic|allergy/i.test(symptom)) {
      medicationRecommendations.push("- Consider antihistamines if allergic reaction suspected");
    }
  }

  // Generate comprehensive recommendation
  return `MEDICAL RECOMMENDATION

TRIAGE LEVEL: ${triageResult.severity.toUpperCase()}
${triageResult.explanation}

RECOMMENDED INTERVENTIONS:
${interventions.length ? interventions.join('\n') : '- No immediate interventions required'}

MEDICATION CONSIDERATIONS:
${medicationRecommendations.length ? medicationRecommendations.join('\n') : '- No specific medications indicated at this time'}

MONITORING INSTRUCTIONS:
${monitoringInstructions.length ? monitoringInstructions.join('\n') : '- Standard vital sign monitoring'}

ADDITIONAL NOTES:
- Reassess patient condition regularly
- Document all interventions and patient responses
- Contact medical control for any significant changes
`;
}