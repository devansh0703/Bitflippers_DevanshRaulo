import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Case } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import LocationMap from "@/components/location-map";
import TriageResult from "@/components/triage-result";
import TreatmentRecommendation from "@/components/treatment-recommendation";
import { Loader2, Search, Filter } from "lucide-react";

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [selectedCaseId, setSelectedCaseId] = useState<number>();
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const { data: cases = [], isLoading } = useQuery<Case[]>({
    queryKey: ["/api/cases"],
  });

  const treatmentMutation = useMutation({
    mutationFn: async ({
      caseId,
      recommendation,
    }: {
      caseId: number;
      recommendation: string;
    }) => {
      const res = await apiRequest("POST", `/api/cases/${caseId}/treatment`, {
        recommendation,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
    },
  });

  const filteredCases = cases.filter((case_) => {
    const matchesSearch =
      case_.patient?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.symptoms.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity =
      severityFilter === "all" ||
      case_.triageResult?.severity.toLowerCase() === severityFilter.toLowerCase();

    return matchesSearch && matchesSeverity;
  });

  const selectedCase = cases.find((case_) => case_.id === selectedCaseId);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
          <p className="text-gray-600">Welcome, Dr. {user?.name}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cases List */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Emergency Cases</CardTitle>
                <CardDescription>Active cases requiring attention</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search cases..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select
                    value={severityFilter}
                    onValueChange={setSeverityFilter}
                  >
                    <SelectTrigger className="w-[140px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severities</SelectItem>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="delayed">Delayed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredCases.map((case_) => (
                      <Card
                        key={case_.id}
                        className={`cursor-pointer transition-colors ${
                          selectedCaseId === case_.id
                            ? "border-primary"
                            : "hover:border-primary/50"
                        }`}
                        onClick={() => setSelectedCaseId(case_.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold">
                                {case_.patient?.name}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {new Date(case_.createdAt).toLocaleTimeString()}
                              </p>
                            </div>
                            {case_.triageResult && (
                              <div
                                className={`px-2 py-1 rounded text-xs font-semibold ${
                                  case_.triageResult.severity === "IMMEDIATE"
                                    ? "bg-red-100 text-red-700"
                                    : case_.triageResult.severity === "URGENT"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {case_.triageResult.severity}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Case Details */}
          <div className="lg:col-span-2">
            {selectedCase ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Patient Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-semibold">Basic Information</h3>
                        <p>Name: {selectedCase.patient?.name}</p>
                        <p>Age: {selectedCase.patient?.age}</p>
                        <p>Gender: {selectedCase.patient?.gender}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold">Medical Information</h3>
                        <p>History: {selectedCase.patient?.medicalHistory}</p>
                        <p>Allergies: {selectedCase.patient?.allergies}</p>
                        <p>Medications: {selectedCase.patient?.medications}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-6">
                  <LocationMap
                    location={selectedCase.location}
                    isInteractive={false}
                  />
                  {selectedCase.triageResult && (
                    <TriageResult
                      severity={selectedCase.triageResult.severity}
                      explanation={selectedCase.triageResult.explanation}
                    />
                  )}
                </div>

                <TreatmentRecommendation
                  isDoctor={true}
                  recommendation={selectedCase.treatmentRecommendation}
                  onSubmit={(recommendation) =>
                    treatmentMutation.mutate({
                      caseId: selectedCase.id,
                      recommendation,
                    })
                  }
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-[400px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <p className="text-gray-500">Select a case to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
