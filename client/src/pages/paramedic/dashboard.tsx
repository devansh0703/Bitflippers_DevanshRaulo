import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PatientForm from "@/components/patient-form";
import LocationMap from "@/components/location-map";
import TriageResult from "@/components/triage-result";
import TreatmentRecommendation from "@/components/treatment-recommendation";
import { apiRequest } from "@/lib/queryClient";
import { Location, Vitals } from "@shared/schema";
import { Loader2 } from "lucide-react";

export default function ParamedicDashboard() {
  const { user } = useAuth();
  const [currentLocation, setCurrentLocation] = useState<Location>();
  const [currentCaseId, setCurrentCaseId] = useState<number>();

  const { data: currentCase, isLoading: isCaseLoading } = useQuery({
    queryKey: ["/api/cases", currentCaseId],
    enabled: !!currentCaseId,
  });

  const createCaseMutation = useMutation({
    mutationFn: async (data: {
      patientData: any;
      vitals: Vitals;
      location: Location;
      symptoms: string;
    }) => {
      const patientRes = await apiRequest("POST", "/api/patients", data.patientData);
      const patient = await patientRes.json();

      const caseRes = await apiRequest("POST", "/api/cases", {
        patientId: patient.id,
        paramedicId: user!.id,
        location: data.location,
        vitals: data.vitals,
        symptoms: data.symptoms,
      });

      return await caseRes.json();
    },
    onSuccess: (data) => {
      setCurrentCaseId(data.id);
    },
  });

  const handleSubmit = async (formData: any) => {
    if (!currentLocation) return;

    createCaseMutation.mutate({
      patientData: {
        name: formData.name,
        age: formData.age,
        gender: formData.gender,
        medicalHistory: formData.medicalHistory,
        allergies: formData.allergies,
        medications: formData.medications,
      },
      vitals: formData.vitals,
      location: currentLocation,
      symptoms: formData.symptoms,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Paramedic Dashboard</h1>
            <p className="text-gray-600">Welcome, {user?.name}</p>
          </div>
          <Button variant="outline" onClick={() => setCurrentCaseId(undefined)}>
            New Case
          </Button>
        </div>

        {!currentCaseId ? (
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Current Location</CardTitle>
                </CardHeader>
                <CardContent>
                  <LocationMap
                    location={currentLocation}
                    onLocationUpdate={setCurrentLocation}
                  />
                </CardContent>
              </Card>

              <PatientForm
                onSubmit={handleSubmit}
                isLoading={createCaseMutation.isPending}
              />
            </div>

            <div className="space-y-6">
              {createCaseMutation.isPending && (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Processing triage...</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {isCaseLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <>
                <div className="space-y-6">
                  <LocationMap location={currentCase?.location} isInteractive={false} />
                  {currentCase?.triageResult && (
                    <TriageResult
                      severity={currentCase.triageResult.severity}
                      explanation={currentCase.triageResult.explanation}
                    />
                  )}
                </div>
                <div>
                  <TreatmentRecommendation
                    recommendation={currentCase?.treatmentRecommendation}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
