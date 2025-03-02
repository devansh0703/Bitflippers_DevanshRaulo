import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Report } from "@shared/schema";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, AlertTriangle, FileText } from "lucide-react";
import PatientDetails from "@/components/patient-details";

export default function ParamedicDashboard() {
  const { user } = useAuth();
  const { data: reports, isLoading } = useQuery<Report[]>({
    queryKey: ["/api/reports"],
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {user?.name}</h1>
          <p className="text-muted-foreground">Paramedic Dashboard</p>
        </div>
        <Link href="/paramedic/create-report">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Report
          </Button>
        </Link>
      </div>

      <div className="grid gap-6">
        {reports?.map((report) => (
          <Card key={report.id}>
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
              
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Vitals:</span>
                  <span>
                    HR: {report.vitals.heartRate}, BP: {report.vitals.bloodPressure}
                  </span>
                </div>

                {report.doctorRecommendation && (
                  <div className="flex items-start gap-2 text-sm bg-blue-50 p-3 rounded-md">
                    <AlertTriangle className="h-4 w-4 text-blue-500 mt-0.5" />
                    <div>
                      <span className="font-medium block">Doctor's Recommendation:</span>
                      {report.doctorRecommendation}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {reports?.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-40">
              <FileText className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No reports yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
