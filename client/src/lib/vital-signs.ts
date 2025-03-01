// Critical thresholds for vital signs based on medical guidelines
export const vitalSignThresholds = {
  heartRate: {
    tooLow: 50,
    tooHigh: 120,
    label: 'Heart Rate',
    unit: 'bpm',
    getMessage: (value: number) => {
      if (value < 50) return 'Dangerously low heart rate - possible bradycardia';
      if (value > 120) return 'Dangerously high heart rate - possible tachycardia';
      return null;
    }
  },
  bloodPressure: {
    // Format: "120/80"
    getMessage: (value: string) => {
      const [systolic, diastolic] = value.split('/').map(Number);
      if (systolic > 180 || diastolic > 120) return 'Hypertensive crisis - immediate intervention needed';
      if (systolic < 90 || diastolic < 60) return 'Hypotension - requires immediate attention';
      return null;
    }
  },
  respiratoryRate: {
    tooLow: 12,
    tooHigh: 25,
    label: 'Respiratory Rate',
    unit: '/min',
    getMessage: (value: number) => {
      if (value < 12) return 'Respiratory depression - requires immediate attention';
      if (value > 25) return 'Tachypnea - possible respiratory distress';
      return null;
    }
  },
  oxygenSaturation: {
    tooLow: 92,
    label: 'O2 Saturation',
    unit: '%',
    getMessage: (value: number) => {
      if (value < 92) return 'Hypoxemia - oxygen therapy may be needed';
      return null;
    }
  },
  temperature: {
    tooLow: 35,
    tooHigh: 38.5,
    label: 'Temperature',
    unit: '°C',
    getMessage: (value: number) => {
      if (value < 35) return 'Hypothermia - immediate warming needed';
      if (value > 38.5) return 'High fever - monitor closely';
      return null;
    }
  }
};

export interface VitalSignWarning {
  message: string;
  severity: 'critical' | 'warning';
}

export function analyzeVitalSigns(report: {
  heartRate: number;
  bloodPressure: string;
  respiratoryRate: number;
  oxygenSaturation: number;
  temperature: number;
}): VitalSignWarning[] {
  const warnings: VitalSignWarning[] = [];

  // Check each vital sign
  Object.entries(vitalSignThresholds).forEach(([key, threshold]) => {
    const value = report[key as keyof typeof report];
    if (!value) return;

    const message = threshold.getMessage(value);
    if (message) {
      warnings.push({
        message,
        severity: 'critical'
      });
    }
  });

  return warnings;
}
