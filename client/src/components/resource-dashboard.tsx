import { useQuery } from "@tanstack/react-query";
import { Resource } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Ambulance, 
  Bed, 
  UserCog,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";

export function ResourceDashboard() {
  const { data: resources } = useQuery<Resource[]>({
    queryKey: ["/api/resources"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "available": return "bg-green-500 text-white";
      case "occupied": return "bg-orange-500 text-white";
      case "maintenance": return "bg-destructive text-destructive-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "ambulance": return <Ambulance className="h-4 w-4" />;
      case "bed": return <Bed className="h-4 w-4" />;
      case "staff": return <UserCog className="h-4 w-4" />;
      case "supplies": return <Package className="h-4 w-4" />;
      default: return null;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "available": return <CheckCircle className="h-4 w-4" />;
      case "occupied": return <Clock className="h-4 w-4" />;
      case "maintenance": return <AlertTriangle className="h-4 w-4" />;
      default: return null;
    }
  };

  const calculateUtilization = (type: string) => {
    if (!resources) return { total: 0, available: 0, utilization: 0 };
    
    const typeResources = resources.filter(r => r.type === type);
    const total = typeResources.length;
    const available = typeResources.filter(r => r.status === "available").length;
    const utilization = total ? ((total - available) / total) * 100 : 0;
    
    return { total, available, utilization };
  };

  const resourceTypes = ["ambulance", "bed", "staff", "supplies"];
  
  return (
    <div className="space-y-6">
      {/* Resource Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {resourceTypes.map(type => {
          const stats = calculateUtilization(type);
          return (
            <Card key={type}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {getResourceIcon(type)}
                  {type.charAt(0).toUpperCase() + type.slice(1)}s
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.available}/{stats.total}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.utilization.toFixed(1)}% Utilization
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Resource List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resource Status</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-4">
              {resourceTypes.map(type => (
                <div key={type} className="space-y-2">
                  <h3 className="font-medium">{type.charAt(0).toUpperCase() + type.slice(1)}s</h3>
                  <div className="grid gap-2">
                    {resources?.filter(r => r.type === type).map(resource => (
                      <div
                        key={resource.id}
                        className="flex items-center justify-between p-2 rounded-lg border"
                      >
                        <div className="flex items-center gap-2">
                          {getResourceIcon(resource.type)}
                          <span className="text-sm">
                            {resource.details.name || `#${resource.id}`}
                          </span>
                        </div>
                        <Badge 
                          className={`flex items-center gap-1 ${getStatusColor(resource.status)}`}
                        >
                          {getStatusIcon(resource.status)}
                          {resource.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resource Optimization Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {resources && calculateUtilization("ambulance").utilization > 80 && (
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span>High ambulance utilization - Consider mobilizing additional units</span>
              </div>
            )}
            {resources && calculateUtilization("bed").utilization > 90 && (
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span>Critical bed capacity - Prepare overflow facilities</span>
              </div>
            )}
            {resources && calculateUtilization("staff").utilization > 85 && (
              <div className="flex items-center gap-2 text-orange-500">
                <Clock className="h-4 w-4" />
                <span>Staff approaching maximum capacity - Alert backup personnel</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
