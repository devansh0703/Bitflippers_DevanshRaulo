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
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <Stethoscope className="h-6 w-6 text-blue-600" />
        <div>
          <CardTitle>Treatment Recommendation</CardTitle>
          <CardDescription>
            {isDoctor
              ? "Provide treatment recommendations for the paramedic"
              : "Doctor's recommendations for treatment"}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {isDoctor ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="recommendation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Treatment Recommendation</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter detailed treatment recommendations..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button type="submit">Submit Recommendation</Button>
            </form>
          </Form>
        ) : (
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-gray-700 whitespace-pre-wrap">{recommendation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
