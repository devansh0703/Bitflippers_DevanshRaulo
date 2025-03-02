import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { getDoctorRecommendation } from "@/lib/gemini";
import { Report } from "@shared/schema";

type DoctorRecommendationInput = Pick<Report, 'vitals' | 'symptoms' | 'triageResult'>;

export function useDoctorRecommendation() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateRecommendation = async (input: DoctorRecommendationInput) => {
    setIsGenerating(true);
    try {
      const recommendation = await getDoctorRecommendation(input);
      return recommendation;
    } catch (error) {
      toast({
        title: "Recommendation Generation Failed",
        description: "Could not get AI recommendation. Please write your recommendation manually.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateRecommendation,
    isGenerating,
  };
}
