import { useQuery } from "@tanstack/react-query";
import { Report } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useRef, useState } from "react";
import { initializeMap } from "@/lib/tomtom";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search, MapPin } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
      // Initialize with a default center
      const newMap = initializeMap(mapRef.current, [-73.935242, 40.730610]);
      setMap(newMap);
    }
  }, [mapRef, map]);

  useEffect(() => {
    if (map && reports) {
      // Clear existing markers
      const markers = document.getElementsByClassName('marker');
      while(markers[0]) {
        markers[0].parentNode?.removeChild(markers[0]);
      }

      // Add markers for each report
      reports.forEach(report => {
        const el = document.createElement('div');
        el.className = 'marker';
        el.innerHTML = `<div class="bg-primary text-white p-2 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>`;
        
        new tt.Marker({element: el})
          .setLngLat([report.location.lon, report.location.lat])
          .addTo(map);
      });
    }
  }, [map, reports]);

  const filteredReports = reports?.filter(report => {
    const matchesSearch = report.patientName.toLowerCase().includes(search.toLowerCase()) ||
      report.complaints.toLowerCase().includes(search.toLowerCase());
    
    const matchesSeverity = severityFilter === "all" || 
      (report.triageAssessment?.severity.toLowerCase() === severityFilter);

    return matchesSearch && matchesSeverity;
  });

  const sortedReports = filteredReports?.sort((a, b) => {
    if (sortBy === "time") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else {
      const severityOrder = { "immediate": 0, "urgent": 1, "delayed": 2 };
      const aOrder = severityOrder[a.triageAssessment?.severity.toLowerCase() ?? "delayed"];
      const bOrder = severityOrder[b.triageAssessment?.severity.toLowerCase() ?? "delayed"];
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Map Section */}
          <Card>
            <CardHeader>
              <CardTitle>Paramedic Locations</CardTitle>
            </CardHeader>
            <CardContent>
              <div ref={mapRef} className="h-[500px] rounded-lg overflow-hidden" />
            </CardContent>
          </Card>

          {/* Reports Section */}
          <Card>
            <CardHeader>
              <CardTitle>Patient Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Filters */}
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

                {/* Reports List */}
                <ScrollArea className="h-[400px] rounded-md border">
                  <div className="space-y-4 p-4">
                    {sortedReports?.map((report) => (
                      <Card key={report.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold">{report.patientName}</h3>
                              <p className="text-sm text-muted-foreground">
                                {new Date(report.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <Badge className={getSeverityColor(report.triageAssessment?.severity)}>
                              {report.triageAssessment?.severity || "Pending"}
                            </Badge>
                          </div>
                          
                          <Tabs defaultValue="vitals">
                            <TabsList>
                              <TabsTrigger value="vitals">Vitals</TabsTrigger>
                              <TabsTrigger value="assessment">AI Assessment</TabsTrigger>
                            </TabsList>
                            <TabsContent value="vitals">
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>Heart Rate: {report.heartRate} bpm</div>
                                <div>BP: {report.bloodPressure}</div>
                                <div>Resp: {report.respiratoryRate}/min</div>
                                <div>O2: {report.oxygenSaturation}%</div>
                                <div>Temp: {report.temperature}°C</div>
                              </div>
                              <p className="mt-2 text-sm">
                                <strong>Complaints:</strong> {report.complaints}
                              </p>
                            </TabsContent>
                            <TabsContent value="assessment">
                              <p className="text-sm">
                                {report.triageAssessment?.explanation || "Assessment pending..."}
                              </p>
                            </TabsContent>
                          </Tabs>

                          <div className="mt-2 flex items-center text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>
                              {report.location.lat.toFixed(4)}, {report.location.lon.toFixed(4)}
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
  );
}
