import { useQuery, useMutation } from "@tanstack/react-query";
import { Report } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MapPin, LogOut, Wand2, Filter, FileText } from "lucide-react";
import { useState } from "react";
import PatientDetails from "@/components/patient-details";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useDoctorRecommendation } from "@/hooks/use-doctor-recommendation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";

export default function DoctorDashboard() {
  const { toast } = useToast();
  const { user, logoutMutation } = useAuth();
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [recommendation, setRecommendation] = useState("");
  const { generateRecommendation, isGenerating } = useDoctorRecommendation();
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const { data: reports = [], isLoading } = useQuery<Report[]>({
    queryKey: ["/api/reports"],
  });

  const filteredReports = reports.filter(report => {
    if (severityFilter === "all") return true;
    return report.triageResult?.severity === severityFilter;
  });

  const hasReports = filteredReports.length > 0;

  const updateReportMutation = useMutation({
    mutationFn: async ({ id, recommendation }: { id: number; recommendation: string }) => {
      const reportRes = await apiRequest("PATCH", `/api/reports/${id}`, { 
        doctorRecommendation: recommendation,
        completed: true
      });
      const updatedReport = await reportRes.json();

      const ehrRes = await apiRequest("POST", "/api/ehr", {
        patientId: updatedReport.patientId,
        doctorId: user?.id,
        diagnosis: `Emergency Response - ${updatedReport.triageResult?.severity.toUpperCase()}`,
        treatmentPlan: recommendation,
        medications: [], 
        labResults: [], 
        notes: updatedReport.triageResult?.explanation
      });

      return updatedReport;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({
        title: "Recommendation sent",
        description: "The paramedic will be notified of your recommendation and an EHR record has been created.",
      });
      setSelectedReport(null);
      setRecommendation("");
    },
  });

  const handleGenerateRecommendation = async () => {
    if (!selectedReport) return;

    const aiRecommendation = await generateRecommendation({
      vitals: selectedReport.vitals,
      symptoms: selectedReport.symptoms,
      triageResult: selectedReport.triageResult!,
    });

    if (aiRecommendation) {
      setRecommendation(aiRecommendation);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Welcome, Dr. {user?.name}</h1>
          <p className="text-muted-foreground">Doctor Dashboard</p>
        </div>
        <div className="flex gap-4">
          <Link href="/doctor/ehr">
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              EHR Records
            </Button>
          </Link>
          <Button variant="outline" onClick={() => logoutMutation.mutate()}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
              <div className="bg-blue-100 p-2 rounded-lg mr-3">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              Patient Reports
            </h2>
            <div className="flex items-center bg-white rounded-lg shadow-sm p-1 border border-gray-100">
              <Filter className="h-4 w-4 text-blue-500 ml-2" />
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-[180px] border-0 focus:ring-0">
                  <SelectValue placeholder="Filter by Severity" />
                </SelectTrigger>
                <SelectContent className="border border-gray-100 shadow-lg">
                  <SelectItem value="all">All Reports</SelectItem>
                  <SelectItem value="immediate" className="text-red-600">Immediate</SelectItem>
                  <SelectItem value="urgent" className="text-amber-600">Urgent</SelectItem>
                  <SelectItem value="delayed" className="text-green-600">Delayed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-6">
        {hasReports ? (
          filteredReports.map((report) => (
            <Card
              key={report.id}
              className={`cursor-pointer transition-colors hover:bg-accent ${
                selectedReport?.id === report.id ? "border-primary" : ""
              }`}
              onClick={() => setSelectedReport(report)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">
                  Patient Report #{report.id}
                </CardTitle>
                <Badge
                  variant={
                    report.triageResult?.severity === "immediate"
                      ? "destructive"
                      : report.triageResult?.severity === "urgent"
                      ? "default"
                      : "secondary"
                  }
                >
                  {report.triageResult?.severity || "Pending"}
                </Badge>
              </CardHeader>
              <CardContent>
                <PatientDetails patientId={report.patientId} />

                <div className="mt-4 space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="font-medium">Heart Rate:</span>{" "}
                      {report.vitals.heartRate} bpm
                    </div>
                    <div>
                      <span className="font-medium">Blood Pressure:</span>{" "}
                      {report.vitals.bloodPressure}
                    </div>
                    <div>
                      <span className="font-medium">O2 Saturation:</span>{" "}
                      {report.vitals.oxygenSaturation}%
                    </div>
                    <div>
                      <span className="font-medium">Respiration:</span>{" "}
                      {report.vitals.respirationRate} /min
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>
                      Location: {report.location.lat.toFixed(6)},{" "}
                      {report.location.lng.toFixed(6)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <p className="text-center text-muted-foreground py-8">
                No active patients requiring attention. All patients have been treated and moved to EHR records.
              </p>
              <Button asChild>
                <Link href="/doctor/ehr-records">View EHR Records</Link>
              </Button>
            </CardContent>
          </Card>
        )}
          </div>

        </div>

        <div>
          {selectedReport ? (
            <Card>
              <CardHeader>
                <CardTitle>Medical Recommendation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-medium">AI Triage Assessment</h3>
                  <pre className="text-sm bg-accent p-3 rounded-md whitespace-pre-wrap font-mono text-xs">
                    {selectedReport.triageResult?.explanation}
                  </pre>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">Symptoms</h3>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {selectedReport.symptoms.map((symptom, i) => (
                      <li key={i}>{symptom}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Your Recommendation</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateRecommendation}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Wand2 className="mr-2 h-4 w-4" />
                      )}
                      Generate AI Recommendation
                    </Button>
                  </div>
                  <Textarea
                    value={recommendation}
                    onChange={(e) => setRecommendation(e.target.value)}
                    placeholder="Enter your treatment recommendations..."
                    className="h-64 font-mono"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedReport(null);
                      setRecommendation("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() =>
                      updateReportMutation.mutate({
                        id: selectedReport.id,
                        recommendation,
                      })
                    }
                    disabled={!recommendation || updateReportMutation.isPending}
                  >
                    {updateReportMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Recommendation"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-40">
                <p className="text-muted-foreground">
                  Select a report to provide recommendations
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}