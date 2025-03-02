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
import { useState } from "react";
import { useTriage } from "@/hooks/use-triage";
import { Loader2 } from "lucide-react";

export default function CreateReport() {
  const [, setLocation] = useLocation();
  const [patientId, setPatientId] = useState<number | null>(null);
  const { getTriage, isAnalyzing } = useTriage();

  const patientForm = useForm<InsertPatient>({
    resolver: zodResolver(insertPatientSchema),
    defaultValues: {
      name: "",
      age: 0,
      gender: "male",
      medicalHistory: [],
      allergies: [],
      medications: [],
    },
  });

  type ReportFormData = Omit<InsertReport, "patientId" | "paramedicId">;

  const reportForm = useForm<ReportFormData>({
    resolver: zodResolver(
      insertReportSchema.omit({ patientId: true, paramedicId: true })
    ),
    defaultValues: {
      location: { lat: 0, lng: 0 },
      vitals: {
        heartRate: 0,
        oxygenSaturation: 0,
        bloodPressure: "",
        respirationRate: 0,
      },
      symptoms: [],
      triageResult: null,
      doctorRecommendation: null,
      createdAt: null,
    },
  });

  const createPatientMutation = useMutation({
    mutationFn: async (data: InsertPatient) => {
      const res = await apiRequest("POST", "/api/patients", data);
      return res.json();
    },
    onSuccess: (data) => {
      setPatientId(data.id);
    },
  });

  const createReportMutation = useMutation({
    mutationFn: async (data: Omit<InsertReport, "paramedicId">) => {
      const res = await apiRequest("POST", "/api/reports", data);
      return res.json();
    },
    onSuccess: () => {
      setLocation("/paramedic");
    },
  });

  const onSubmitPatient = patientForm.handleSubmit((data) => {
    createPatientMutation.mutate(data);
  });

  const onSubmitReport = reportForm.handleSubmit(async (data) => {
    if (!patientId) return;

    // Get current location
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const reportData = {
          ...data,
          patientId,
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
        };

        // Get AI triage
        const triageResult = await getTriage({
          vitals: reportData.vitals,
          symptoms: reportData.symptoms,
        });

        createReportMutation.mutate({
          ...reportData,
          triageResult,
        });
      },
      (error) => {
        console.error("Error getting location:", error);
        // Fallback to default location
        createReportMutation.mutate({
          ...data,
          patientId,
        });
      }
    );
  });

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create New Report</h1>

      {!patientId ? (
        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...patientForm}>
              <form onSubmit={onSubmitPatient} className="space-y-4">
                <FormField
                  control={patientForm.control}
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
                    control={patientForm.control}
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
                    control={patientForm.control}
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
                  control={patientForm.control}
                  name="medicalHistory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medical History</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          value={field.value?.join(", ") || ""}
                          onChange={(e) => 
                            field.onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))
                          }
                          placeholder="Separate with commas" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={patientForm.control}
                  name="allergies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Allergies</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          value={field.value?.join(", ") || ""}
                          onChange={(e) => 
                            field.onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))
                          }
                          placeholder="Separate with commas"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={patientForm.control}
                  name="medications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Medications</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          value={field.value?.join(", ") || ""}
                          onChange={(e) => 
                            field.onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))
                          }
                          placeholder="Separate with commas"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={createPatientMutation.isPending}>
                  {createPatientMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Continue to Vitals"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Vital Signs & Symptoms</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...reportForm}>
              <form onSubmit={onSubmitReport} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={reportForm.control}
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
                    control={reportForm.control}
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
                    control={reportForm.control}
                    name="vitals.bloodPressure"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Blood Pressure</FormLabel>
                        <FormControl>
                          <Input 
                            type="text"
                            placeholder="120/80"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={reportForm.control}
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
                  control={reportForm.control}
                  name="symptoms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Symptoms</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value?.join("\n") || ""}
                          onChange={(e) => 
                            field.onChange(e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))
                          }
                          placeholder="Enter symptoms (one per line)"
                          className="h-32"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPatientId(null)}
                  >
                    Back to Patient Info
                  </Button>
                  <Button
                    type="submit"
                    disabled={createReportMutation.isPending || isAnalyzing}
                  >
                    {(createReportMutation.isPending || isAnalyzing) ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isAnalyzing ? "Analyzing..." : "Saving..."}
                      </>
                    ) : (
                      "Submit Report"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}