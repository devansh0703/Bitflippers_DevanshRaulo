import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertReportSchema } from "@shared/schema";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { getCurrentLocation } from "@/lib/tomtom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, ThumbsUp } from "lucide-react";
import { NavBar } from "@/components/nav-bar";

export default function ParamedicForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for latest reports to show the assessment
  const { data: reports } = useQuery({
    queryKey: ["/api/reports"],
    refetchInterval: 2000, // Refresh every 2 seconds to get assessment update
  });

  const form = useForm({
    resolver: zodResolver(insertReportSchema),
    defaultValues: {
      patientName: "",
      patientAge: 0,
      patientGender: "",
      heartRate: 0,
      bloodPressure: "",
      respiratoryRate: 0,
      oxygenSaturation: 0,
      temperature: 0,
      complaints: "",
      medicalHistory: "",
      allergies: "",
      currentMedications: "",
      location: { lat: 0, lon: 0 }
    }
  });

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      const location = await getCurrentLocation();
      const reportData = {
        ...data,
        // Convert string inputs to numbers
        patientAge: Number(data.patientAge),
        heartRate: Number(data.heartRate),
        respiratoryRate: Number(data.respiratoryRate),
        oxygenSaturation: Number(data.oxygenSaturation),
        temperature: Number(data.temperature),
        location: { lat: location[1], lon: location[0] }
      };

      const res = await apiRequest("POST", "/api/reports", reportData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({
        title: "Report submitted",
        description: "The report has been sent for AI triage assessment"
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error submitting report",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Get the latest report for this paramedic
  const latestReport = reports?.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];

  const getSeverityColor = (severity?: string) => {
    switch (severity?.toLowerCase()) {
      case "immediate": return "bg-destructive text-destructive-foreground";
      case "urgent": return "bg-orange-500 text-white";
      case "delayed": return "bg-green-500 text-white";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getSeverityIcon = (severity?: string) => {
    switch (severity?.toLowerCase()) {
      case "immediate": return <AlertTriangle className="h-4 w-4" />;
      case "urgent": return <Clock className="h-4 w-4" />;
      case "delayed": return <ThumbsUp className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container mx-auto p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Latest Report Assessment Card */}
          {latestReport && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Latest Assessment</span>
                  <Badge
                    className={`flex items-center gap-2 ${getSeverityColor(latestReport.triageAssessment?.severity)}`}
                  >
                    {getSeverityIcon(latestReport.triageAssessment?.severity)}
                    {latestReport.triageAssessment?.severity || "Assessment pending..."}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{latestReport.patientName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(latestReport.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {latestReport.triageAssessment ? (
                    <div className="space-y-4">
                      <div className="rounded-lg bg-muted p-4">
                        <h4 className="font-medium mb-2">AI Assessment</h4>
                        <p className="text-sm whitespace-pre-wrap">
                          {latestReport.triageAssessment.explanation}
                        </p>
                      </div>

                      {latestReport.treatment && latestReport.treatment.approved && (
                        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                          <h4 className="font-medium mb-2 text-green-700 flex items-center gap-2">
                            <ThumbsUp className="h-4 w-4" />
                            Doctor-Approved Treatment Plan
                          </h4>
                          
                          <div className="space-y-3">
                            <div>
                              <h5 className="text-sm font-semibold">Medications:</h5>
                              <p className="text-sm whitespace-pre-wrap">
                                {latestReport.treatment.medications}
                              </p>
                            </div>
                            
                            <div>
                              <h5 className="text-sm font-semibold">Interventions:</h5>
                              <p className="text-sm whitespace-pre-wrap">
                                {latestReport.treatment.interventions}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Vitals:</span>
                          <ul className="mt-1 space-y-1 text-muted-foreground">
                            <li>Heart Rate: {latestReport.heartRate} bpm</li>
                            <li>Blood Pressure: {latestReport.bloodPressure}</li>
                            <li>Respiratory Rate: {latestReport.respiratoryRate}/min</li>
                          </ul>
                        </div>
                        <div>
                          <span className="font-medium">Additional:</span>
                          <ul className="mt-1 space-y-1 text-muted-foreground">
                            <li>O2 Saturation: {latestReport.oxygenSaturation}%</li>
                            <li>Temperature: {latestReport.temperature}°C</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>AI is analyzing the patient data...</p>
                      <p className="text-sm">Assessment will appear here shortly</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Patient Report Form */}
          <Card>
            <CardHeader>
              <CardTitle>Patient Report Form</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(data => submitMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="patientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Patient Name</FormLabel>
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
                      name="patientAge"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Age</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="patientGender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
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

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="heartRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Heart Rate (BPM)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bloodPressure"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Blood Pressure (mmHg)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="120/80" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="respiratoryRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Respiratory Rate</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="oxygenSaturation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>O2 Saturation (%)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="temperature"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Temperature (°C)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="complaints"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Complaints and Symptoms</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="medicalHistory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Medical History</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
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
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currentMedications"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Medications</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={submitMutation.isPending}>
                    {submitMutation.isPending ? "Submitting..." : "Submit Report"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}