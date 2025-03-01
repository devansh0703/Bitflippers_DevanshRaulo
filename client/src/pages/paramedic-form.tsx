import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertReportWithEhrSchema, Patient } from "@shared/schema";
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
import { AlertTriangle, Clock, ThumbsUp, Search, User, Database } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NavBar } from "@/components/nav-bar";
import { useState } from "react";

export default function ParamedicForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [patientSource, setPatientSource] = useState<"new" | "existing">("new");
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);

  // Query for all reports for this paramedic
  const { data: reports } = useQuery({
    queryKey: ["/api/reports"],
    refetchInterval: 2000, // Refresh every 2 seconds to get assessment update
  });

  // Query for EHR patients
  const { data: ehrPatients, isLoading: loadingPatients } = useQuery({
    queryKey: ["/api/ehr/patients", searchQuery],
    queryFn: async () => {
      const endpoint = searchQuery 
        ? `/api/ehr/patients?q=${encodeURIComponent(searchQuery)}` 
        : "/api/ehr/patients";
      const res = await apiRequest("GET", endpoint);
      return res.json();
    },
    enabled: patientSource === "existing"
  });

  // Query for selected patient details
  const { data: selectedPatient } = useQuery({
    queryKey: ["/api/ehr/patients", selectedPatientId],
    queryFn: async () => {
      if (!selectedPatientId) return null;
      const res = await apiRequest("GET", `/api/ehr/patients/${selectedPatientId}`);
      return res.json();
    },
    enabled: !!selectedPatientId,
    onSuccess: (patient: Patient) => {
      if (patient) {
        // Pre-fill form with patient data
        form.setValue("patientName", patient.name);
        form.setValue("patientAge", patient.age);
        form.setValue("patientGender", patient.gender);
        form.setValue("allergies", patient.allergies);
        form.setValue("medicalHistory", patient.medicalHistory);
        form.setValue("currentMedications", patient.medications);
      }
    }
  });

  const form = useForm({
    resolver: zodResolver(insertReportWithEhrSchema),
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
      location: { lat: 0, lon: 0 },
      ehrPatientId: undefined
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
        location: { lat: location[1], lon: location[0] },
        // Add EHR patient ID if using existing patient
        ehrPatientId: patientSource === "existing" && selectedPatientId ? selectedPatientId : undefined
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
      setSelectedPatientId(null);
      setPatientSource("new");
    },
    onError: (error: Error) => {
      toast({
        title: "Error submitting report",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Sort reports by creation time (newest first)
  const sortedReports = reports?.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

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
          {/* Patient Reports List */}
          <Card>
            <CardHeader>
              <CardTitle>Patient Reports</CardTitle>
            </CardHeader>
            <CardContent>
              {sortedReports && sortedReports.length > 0 ? (
                <div className="space-y-6">
                  {sortedReports.map((report) => (
                    <Card key={report.id} className="border shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between border-b pb-3 mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{report.patientName}</h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(report.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <Badge
                            className={`flex items-center gap-2 ${getSeverityColor(report.triageAssessment?.severity)}`}
                          >
                            {getSeverityIcon(report.triageAssessment?.severity)}
                            {report.triageAssessment?.severity || "Assessment pending..."}
                          </Badge>
                        </div>

                        <Tabs defaultValue="assessment" className="mt-2">
                          <TabsList className="w-full">
                            <TabsTrigger value="assessment">AI Assessment</TabsTrigger>
                            <TabsTrigger value="vitals">Vitals</TabsTrigger>
                            <TabsTrigger value="treatment">Treatment</TabsTrigger>
                          </TabsList>

                          <TabsContent value="assessment" className="mt-3">
                            {report.triageAssessment ? (
                              <div className="rounded-lg bg-muted p-3">
                                <p className="text-sm whitespace-pre-wrap">
                                  {report.triageAssessment.explanation}
                                </p>
                              </div>
                            ) : (
                              <div className="text-center py-4 text-muted-foreground">
                                <p>AI is analyzing the patient data...</p>
                                <p className="text-sm">Assessment will appear here shortly</p>
                              </div>
                            )}
                          </TabsContent>

                          <TabsContent value="vitals" className="mt-3">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Vitals:</span>
                                <ul className="mt-1 space-y-1 text-muted-foreground">
                                  <li>Heart Rate: {report.heartRate} bpm</li>
                                  <li>Blood Pressure: {report.bloodPressure}</li>
                                  <li>Respiratory Rate: {report.respiratoryRate}/min</li>
                                </ul>
                              </div>
                              <div>
                                <span className="font-medium">Additional:</span>
                                <ul className="mt-1 space-y-1 text-muted-foreground">
                                  <li>O2 Saturation: {report.oxygenSaturation}%</li>
                                  <li>Temperature: {report.temperature}°C</li>
                                </ul>
                              </div>
                            </div>
                          </TabsContent>

                          <TabsContent value="treatment" className="mt-3">
                            {report.treatment && report.treatment.approved ? (
                              <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                                <h4 className="font-medium mb-2 text-green-700 flex items-center gap-2">
                                  <ThumbsUp className="h-4 w-4" />
                                  Doctor-Approved Treatment Plan
                                </h4>
                                
                                <div className="space-y-3">
                                  <div>
                                    <h5 className="text-sm font-semibold">Medications:</h5>
                                    <p className="text-sm whitespace-pre-wrap">
                                      {report.treatment.medications}
                                    </p>
                                  </div>
                                  
                                  <div>
                                    <h5 className="text-sm font-semibold">Interventions:</h5>
                                    <p className="text-sm whitespace-pre-wrap">
                                      {report.treatment.interventions}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-4 text-muted-foreground">
                                <p>No treatment plan available yet</p>
                                <p className="text-sm">Doctor will provide treatment recommendations</p>
                              </div>
                            )}
                          </TabsContent>
                        </Tabs>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No patient reports yet</p>
                  <p className="text-sm">Submit a new patient report using the form below</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Patient Report Form */}
          <Card>
            <CardHeader>
              <CardTitle>Patient Report Form</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="text-sm font-medium">Patient Source:</div>
                  <Button 
                    type="button" 
                    variant={patientSource === "new" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPatientSource("new")}
                    className="flex items-center gap-2"
                  >
                    <User className="h-4 w-4" />
                    New Patient
                  </Button>
                  <Button 
                    type="button" 
                    variant={patientSource === "existing" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPatientSource("existing")}
                    className="flex items-center gap-2"
                  >
                    <Database className="h-4 w-4" />
                    From EHR
                  </Button>
                </div>
                
                {patientSource === "existing" && (
                  <div className="space-y-4 p-4 border rounded-md">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search patients by name or MRN..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>
                    
                    <div className="h-48 overflow-y-auto border rounded-md p-2">
                      {loadingPatients ? (
                        <div className="flex justify-center items-center h-full text-muted-foreground">
                          Loading patients...
                        </div>
                      ) : ehrPatients?.length > 0 ? (
                        <div className="space-y-2">
                          {ehrPatients.map((patient: any) => (
                            <div 
                              key={patient.id}
                              className={`p-2 cursor-pointer rounded-md ${selectedPatientId === patient.id ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted'}`}
                              onClick={() => setSelectedPatientId(patient.id)}
                            >
                              <div className="font-medium">{patient.name}</div>
                              <div className="text-sm text-muted-foreground">
                                MRN: {patient.medicalRecordNumber} • {patient.age} y/o {patient.gender}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex justify-center items-center h-full text-muted-foreground">
                          {searchQuery ? "No matching patients found" : "No patients available"}
                        </div>
                      )}
                    </div>
                    
                    {selectedPatient && (
                      <div className="bg-muted/50 p-3 rounded-md">
                        <h4 className="font-medium mb-2">Selected Patient Information</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><span className="font-medium">Name:</span> {selectedPatient.name}</div>
                          <div><span className="font-medium">MRN:</span> {selectedPatient.medicalRecordNumber}</div>
                          <div><span className="font-medium">Age:</span> {selectedPatient.age}</div>
                          <div><span className="font-medium">Gender:</span> {selectedPatient.gender}</div>
                          <div><span className="font-medium">Blood Type:</span> {selectedPatient.bloodType}</div>
                          <div className="col-span-2">
                            <span className="font-medium">Allergies:</span> {selectedPatient.allergies}
                          </div>
                          <div className="col-span-2">
                            <span className="font-medium">Medical History:</span> {selectedPatient.medicalHistory}
                          </div>
                          <div className="col-span-2">
                            <span className="font-medium">Medications:</span> {selectedPatient.medications}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(data => submitMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="patientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Patient Name</FormLabel>
                        <FormControl>
                          <Input {...field} readOnly={patientSource === "existing" && !!selectedPatient} />
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
                          <Textarea {...field} readOnly={patientSource === "existing" && !!selectedPatient} />
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
                          <Input {...field} readOnly={patientSource === "existing" && !!selectedPatient} />
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
                          <Input {...field} readOnly={patientSource === "existing" && !!selectedPatient} />
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