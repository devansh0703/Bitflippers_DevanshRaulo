import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { getTriageAssessment } from "@/lib/gemini";

type VitalSigns = {
  heartRate: number;
  oxygenSaturation: number;
  bloodPressure: string;
  respirationRate: number;
};

type TriageAssessmentInput = {
  vitals: VitalSigns;
  symptoms: string[];
};

export function useTriage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const getTriage = async (input: TriageAssessmentInput) => {
    setIsAnalyzing(true);
    try {
      const assessment = await getTriageAssessment(input);
      return assessment;
    } catch (error) {
      toast({
        title: "Triage Analysis Failed",
        description: "Could not get AI assessment. Using default triage level.",
        variant: "destructive",
      });
      return {
        severity: "urgent" as const,
        explanation: "AI triage unavailable - please assess manually",
      };
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    getTriage,
    isAnalyzing,
  };
}
