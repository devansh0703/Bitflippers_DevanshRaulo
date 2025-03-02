import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertReportSchema, insertPatientSchema, InsertReport, InsertPatient } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useTriage } from "@/hooks/use-triage";
import { Loader2 } from "lucide-react";
import { z } from "zod";

// Combine both schemas into one
const createReportSchema = z.object({
  // Patient fields
  name: insertPatientSchema.shape.name,
  age: insertPatientSchema.shape.age,
  gender: insertPatientSchema.shape.gender,
  medicalHistory: insertPatientSchema.shape.medicalHistory,
  allergies: insertPatientSchema.shape.allergies,
  medications: insertPatientSchema.shape.medications,
  // Report fields (excluding patientId and paramedicId which are handled separately)
  vitals: insertReportSchema.shape.vitals,
  symptoms: insertReportSchema.shape.symptoms,
});

type FormData = z.infer<typeof createReportSchema>;

export default function CreateReport() {
  const [, setLocation] = useLocation();
  const { getTriage, isAnalyzing } = useTriage();

  const form = useForm<FormData>({
    resolver: zodResolver(createReportSchema),
    defaultValues: {
      name: "",
      age: 0,
      gender: "male",
      medicalHistory: [],
      allergies: [],
      medications: [],
      vitals: {
        heartRate: 0,
        oxygenSaturation: 0,
        bloodPressure: "",
        respirationRate: 0,
      },
      symptoms: [],
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // First create patient
      const patientRes = await apiRequest("POST", "/api/patients", {
        name: data.name,
        age: data.age,
        gender: data.gender,
        medicalHistory: data.medicalHistory,
        allergies: data.allergies,
        medications: data.medications,
      });
      const patient = await patientRes.json();

      // Get current location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      // Get AI triage assessment
      const triageResult = await getTriage({
        vitals: data.vitals,
        symptoms: data.symptoms,
      });

      // Create report
      const reportRes = await apiRequest("POST", "/api/reports", {
        patientId: patient.id,
        location: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        },
        vitals: data.vitals,
        symptoms: data.symptoms,
        triageResult,
      });

      return reportRes.json();
    },
    onSuccess: () => {
      setLocation("/paramedic");
    },
  });

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create New Report</h1>

      <Card>
        <CardHeader>
          <CardTitle>Patient Information & Vitals</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
              {/* Patient Information */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="medicalHistory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medical History</FormLabel>
                      <FormControl>
                        <Input 
                          value={field.value?.join(", ") || ""}
                          onChange={(e) => field.onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                          placeholder="Separate with commas"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="allergies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Allergies</FormLabel>
                      <FormControl>
                        <Input 
                          value={field.value?.join(", ") || ""}
                          onChange={(e) => field.onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                          placeholder="Separate with commas"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="medications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Medications</FormLabel>
                      <FormControl>
                        <Input 
                          value={field.value?.join(", ") || ""}
                          onChange={(e) => field.onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                          placeholder="Separate with commas"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Vital Signs */}
              <div className="space-y-4 pt-4">
                <h3 className="font-medium">Vital Signs</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="vitals.heartRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Heart Rate (bpm)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="vitals.oxygenSaturation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Oxygen Saturation (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="vitals.bloodPressure"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Blood Pressure</FormLabel>
                        <FormControl>
                          <Input 
                            {...field}
                            placeholder="120/80"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="vitals.respirationRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Respiration Rate (/min)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="symptoms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Symptoms</FormLabel>
                      <FormControl>
                        <Textarea
                          value={field.value?.join("\n") || ""}
                          onChange={(e) => field.onChange(e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))}
                          placeholder="Enter symptoms (one per line)"
                          className="h-32"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={createMutation.isPending || isAnalyzing}
              >
                {(createMutation.isPending || isAnalyzing) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isAnalyzing ? "Analyzing..." : "Saving..."}
                  </>
                ) : (
                  "Submit Report"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}