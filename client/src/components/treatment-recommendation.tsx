import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Stethoscope } from "lucide-react";

interface TreatmentRecommendationProps {
  recommendation?: string;
  onSubmit?: (recommendation: string) => void;
  isDoctor?: boolean;
}

export default function TreatmentRecommendation({
  recommendation,
  onSubmit,
  isDoctor = false,
}: TreatmentRecommendationProps) {
  const form = useForm({
    defaultValues: {
      recommendation: "",
    },
  });

  const handleSubmit = (data: { recommendation: string }) => {
    onSubmit?.(data.recommendation);
  };

  if (!isDoctor && !recommendation) {
    return null;
  }

  return (
    <Card className="border border-blue-100 shadow-sm overflow-hidden">
      <CardHeader className="flex flex-row items-center gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
        <div className="bg-white p-2 rounded-full shadow-sm">
          <Stethoscope className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <CardTitle className="text-blue-800">Treatment Recommendation</CardTitle>
          <CardDescription className="text-blue-600 opacity-90">
            {isDoctor
              ? "Provide detailed treatment recommendations for the paramedic"
              : "Doctor's professional recommendations for treatment"}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {isDoctor ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="recommendation"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-blue-800 font-medium">Treatment Recommendation</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter detailed treatment recommendations..."
                        className="min-h-[150px] border-blue-200 focus:border-blue-400 focus:ring-blue-200"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full mt-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
              >
                Submit Recommendation
              </Button>
            </form>
          </Form>
        ) : (
          <div className="p-5 bg-blue-50 rounded-lg border border-blue-100 shadow-inner">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{recommendation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
