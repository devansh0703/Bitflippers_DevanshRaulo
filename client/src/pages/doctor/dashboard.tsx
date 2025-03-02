import { useQuery, useMutation } from "@tanstack/react-query";
import { Report } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MapPin } from "lucide-react";
import { useState } from "react";
import PatientDetails from "@/components/patient-details";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function DoctorDashboard() {
  const { toast } = useToast();
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [recommendation, setRecommendation] = useState("");

  const { data: reports, isLoading } = useQuery<Report[]>({
    queryKey: ["/api/reports"],
  });

  const updateReportMutation = useMutation({
    mutationFn: async ({ id, recommendation }: { id: number; recommendation: string }) => {
      const res = await apiRequest("PATCH", `/api/reports/${id}`, { doctorRecommendation: recommendation });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({
        title: "Recommendation sent",
        description: "The paramedic will be notified of your recommendation.",
      });
      setSelectedReport(null);
      setRecommendation("");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Patient Reports</h1>
          
          {reports?.map((report) => (
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
          ))}

          {reports?.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-40">
                <p className="text-muted-foreground">No reports to review</p>
              </CardContent>
            </Card>
          )}
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
                  <p className="text-sm bg-accent p-3 rounded-md">
                    {selectedReport.triageResult?.explanation}
                  </p>
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
                  <h3 className="font-medium">Your Recommendation</h3>
                  <Textarea
                    value={recommendation}
                    onChange={(e) => setRecommendation(e.target.value)}
                    placeholder="Enter your treatment recommendations..."
                    className="h-32"
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
