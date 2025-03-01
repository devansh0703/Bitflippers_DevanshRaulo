import { useQuery } from "@tanstack/react-query";
import { Report, Patient } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// EHR Patient History Component
function EhrPatientHistory({ patientId }: { patientId: number }) {
  const { data: patient, isLoading } = useQuery<Patient>({
    queryKey: ["/api/ehr/patients", patientId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/ehr/patients/${patientId}`);
      return res.json();
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-border" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Could not retrieve patient record</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-md p-4 bg-muted/30">
        <h3 className="font-semibold mb-2">Patient Demographics</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="font-medium">Name:</span> {patient.name}</div>
          <div><span className="font-medium">Medical Record #:</span> {patient.medicalRecordNumber}</div>
          <div><span className="font-medium">Age:</span> {patient.age}</div>
          <div><span className="font-medium">Gender:</span> {patient.gender}</div>
          <div><span className="font-medium">Blood Type:</span> {patient.bloodType}</div>
          <div className="col-span-2">
            <span className="font-medium">Allergies:</span> {patient.allergies || "None documented"}
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="font-semibold mb-2">Medical History</h3>
        <p className="text-sm mb-4">{patient.medicalHistory}</p>
        
        <h3 className="font-semibold mb-2">Current Medications</h3>
        <p className="text-sm mb-4">{patient.medications}</p>
      </div>
      
      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Visit History
        </h3>
        
        {patient.recentVisits.length > 0 ? (
          <div className="space-y-4">
            {patient.recentVisits.map((visit, index) => (
              <Card key={index} className="border">
                <CardContent className="p-4">
                  <div className="flex justify-between mb-2">
                    <div className="font-medium">{visit.date}</div>
                    <Badge variant="outline">{visit.diagnosis.includes("Immediate") || visit.diagnosis.includes("Urgent") ? "Urgent" : "Routine"}</Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Reason:</span> {visit.reason}</div>
                    <div><span className="font-medium">Diagnosis:</span> {visit.diagnosis}</div>
                    <div><span className="font-medium">Treatment:</span> {visit.treatment}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <p>No previous visits recorded</p>
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { initializeMap } from "@/lib/tomtom";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search, MapPin, AlertTriangle, Clock, ThumbsUp, Database, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NavBar } from "@/components/nav-bar";
import { vitalSignThresholds, analyzeVitalSigns } from "@/lib/vital-signs";
import { ResourceDashboard } from "@/components/resource-dashboard";
import { apiRequest } from "@/lib/queryClient";

export default function DoctorDashboard() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"time" | "severity">("time");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const { data: reports, isLoading } = useQuery<Report[]>({
    queryKey: ["/api/reports"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  useEffect(() => {
    if (mapRef.current && !map) {
      // Set a fixed ID for the map container
      const mapContainerId = 'map-container';
      mapRef.current.id = mapContainerId;
      
      // Make sure the container has dimensions
      mapRef.current.style.width = '100%';
      mapRef.current.style.height = '500px';
      
      // Create a script tag manually to ensure TomTom is loaded
      const ttScript = document.createElement('script');
      ttScript.src = 'https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.23.0/maps/maps-web.min.js';
      ttScript.async = true;
      
      // Set up the onload handler
      ttScript.onload = () => {
        console.log('TomTom script loaded');
        setTimeout(() => {
          try {
            // Direct access with API key
            const apiKey = '77JkMkCLVXYqkGQ1TKnYHtjMDX0gkz2p';
            
            const newMap = tt.map({
              key: apiKey,
              container: mapContainerId,
              center: [-73.935242, 40.730610], // New York coordinates
              zoom: 13,
              stylesVisibility: {
                map: true,
                poi: true,
                trafficFlow: true,
                trafficIncidents: true
              }
            });
            
            // Add markers once map is loaded
            newMap.on('load', () => {
              console.log('Map initialization successful');
              
              // Add some hardcoded markers
              const paramedic1 = document.createElement('div');
              paramedic1.className = 'marker';
              paramedic1.innerHTML = `<div class="bg-destructive text-white p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>`;
              
              new tt.Marker({element: paramedic1})
                .setLngLat([-73.935242, 40.730610])
                .addTo(newMap);
                
              const paramedic2 = document.createElement('div');
              paramedic2.className = 'marker';
              paramedic2.innerHTML = `<div class="bg-orange-500 text-white p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>`;
              
              new tt.Marker({element: paramedic2})
                .setLngLat([-73.945, 40.735])
                .addTo(newMap);
            });
            
            setMap(newMap);
          } catch (error) {
            console.error('Error initializing map:', error);
          }
        }, 200);
      };
      
      // Append the script to head
      document.head.appendChild(ttScript);
    }

    // Cleanup
    return () => {
      if (map) {
        try {
          map.remove();
        } catch (e) {
          console.error('Error removing map:', e);
        }
      }
    };
  }, [mapRef, map]);

  // We're using hardcoded markers now, so we don't need this effect
  // The map initialization useEffect above now handles adding the markers

  const filteredReports = reports?.filter(report => {
    const matchesSearch = report.patientName.toLowerCase().includes(search.toLowerCase()) ||
      report.complaints.toLowerCase().includes(search.toLowerCase());

    const matchesSeverity = severityFilter === "all" || 
      (report.triageAssessment?.severity?.toLowerCase() === severityFilter);

    return matchesSearch && matchesSeverity;
  });

  const sortedReports = filteredReports?.sort((a, b) => {
    if (sortBy === "time") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else {
      const severityOrder = { "immediate": 0, "urgent": 1, "delayed": 2 };
      const aOrder = severityOrder[a.triageAssessment?.severity?.toLowerCase() ?? "delayed"] ?? 2;
      const bOrder = severityOrder[b.triageAssessment?.severity?.toLowerCase() ?? "delayed"] ?? 2;
      return aOrder - bOrder;
    }
  });

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

  const renderVitalSignWarnings = (report: Report) => {
    const warnings = analyzeVitalSigns(report);
    if (warnings.length === 0) return null;

    return (
      <div className="mt-4 space-y-2">
        <h4 className="font-medium text-sm text-destructive">Critical Conditions Detected:</h4>
        <div className="space-y-1">
          {warnings.map((warning, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span>{warning.message}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">Resource Management</h2>
            <ResourceDashboard />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Paramedic Locations</CardTitle>
              </CardHeader>
              <CardContent>
                <div ref={mapRef} className="h-[500px] rounded-lg overflow-hidden" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Patient Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search reports..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>
                    <Select value={sortBy} onValueChange={(value: "time" | "severity") => setSortBy(value)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="time">Most Recent</SelectItem>
                        <SelectItem value="severity">Severity</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={severityFilter} onValueChange={setSeverityFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by severity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Severities</SelectItem>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="delayed">Delayed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <ScrollArea className="h-[400px] rounded-md border">
                    <div className="space-y-4 p-4">
                      {sortedReports?.map((report) => (
                        <Card key={report.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-4">
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
                                {report.triageAssessment?.severity || "Pending"}
                              </Badge>
                            </div>

                            {renderVitalSignWarnings(report)}

                            <Tabs defaultValue="assessment">
                              <TabsList className="w-full">
                                <TabsTrigger value="assessment">AI Assessment</TabsTrigger>
                                <TabsTrigger value="vitals">Vitals</TabsTrigger>
                                <TabsTrigger value="details">Patient Details</TabsTrigger>
                                <TabsTrigger value="treatment">Treatment</TabsTrigger>
                                {report.ehrPatientId && <TabsTrigger value="ehr">EHR History</TabsTrigger>}
                              </TabsList>

                              <TabsContent value="assessment" className="mt-4">
                                {report.triageAssessment ? (
                                  <div className="space-y-2">
                                    <div className="font-medium">Assessment Explanation:</div>
                                    <p className="text-sm whitespace-pre-wrap">
                                      {report.triageAssessment.explanation}
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">
                                    AI assessment pending...
                                  </p>
                                )}
                              </TabsContent>
                              
                              <TabsContent value="treatment" className="mt-4">
                                {report.treatment ? (
                                  <div className="space-y-4">
                                    <div className="rounded-md bg-muted p-3">
                                      <h4 className="font-medium mb-2">Recommended Medications:</h4>
                                      <p className="text-sm whitespace-pre-wrap">
                                        {report.treatment.medications}
                                      </p>
                                    </div>
                                    
                                    <div className="rounded-md bg-muted p-3">
                                      <h4 className="font-medium mb-2">Suggested Interventions:</h4>
                                      <p className="text-sm whitespace-pre-wrap">
                                        {report.treatment.interventions}
                                      </p>
                                    </div>
                                    
                                    {report.treatment.approved ? (
                                      <div className="flex items-center gap-2 text-sm text-green-500">
                                        <ThumbsUp className="h-4 w-4" />
                                        <span>Treatment approved and sent to paramedic</span>
                                      </div>
                                    ) : (
                                      <Button 
                                        onClick={() => {
                                          fetch(`/api/reports/${report.id}/treatment/approve`, {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json' }
                                          })
                                          .then(res => res.json())
                                          .then(() => {
                                            // Refetch reports to update UI
                                            window.location.reload();
                                          });
                                        }}
                                        className="w-full"
                                      >
                                        Approve and Send to Paramedic
                                      </Button>
                                    )}
                                  </div>
                                ) : (
                                  <div className="space-y-4">
                                    <p className="text-sm text-muted-foreground">
                                      No treatment recommendations generated yet.
                                    </p>
                                    <Button
                                      onClick={() => {
                                        fetch(`/api/reports/${report.id}/treatment`, {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' }
                                        })
                                        .then(res => res.json())
                                        .then(() => {
                                          // Refetch reports to update UI
                                          window.location.reload();
                                        });
                                      }}
                                      className="w-full"
                                    >
                                      Generate Treatment Recommendations
                                    </Button>
                                  </div>
                                )}
                              </TabsContent>

                              <TabsContent value="vitals" className="mt-4">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>Heart Rate: {report.heartRate} bpm</div>
                                  <div>BP: {report.bloodPressure}</div>
                                  <div>Resp: {report.respiratoryRate}/min</div>
                                  <div>O2: {report.oxygenSaturation}%</div>
                                  <div>Temp: {report.temperature}°C</div>
                                </div>
                              </TabsContent>

                              <TabsContent value="details" className="mt-4">
                                <div className="space-y-2 text-sm">
                                  <p><strong>Complaints:</strong> {report.complaints}</p>
                                  {report.medicalHistory && (
                                    <p><strong>Medical History:</strong> {report.medicalHistory}</p>
                                  )}
                                  {report.allergies && (
                                    <p><strong>Allergies:</strong> {report.allergies}</p>
                                  )}
                                  {report.currentMedications && (
                                    <p><strong>Current Medications:</strong> {report.currentMedications}</p>
                                  )}
                                  {report.ehrPatientId && (
                                    <div className="pt-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          const tab = document.querySelector('[data-value="ehr"]') as HTMLElement;
                                          if (tab) tab.click();
                                        }}
                                        className="flex items-center gap-2"
                                      >
                                        <Database className="h-4 w-4" />
                                        View complete EHR history
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </TabsContent>
                              
                              {report.ehrPatientId && (
                                <TabsContent value="ehr" className="mt-4">
                                  <EhrPatientHistory patientId={report.ehrPatientId} />
                                </TabsContent>
                              )}
                            </Tabs>

                            <div className="mt-4 flex items-center text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4 mr-1" />
                              <span>
                                {(report.location as { lat: number; lon: number }).lat.toFixed(4)}, 
                                {(report.location as { lat: number; lon: number }).lon.toFixed(4)}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}