import { AlertTriangle, AlertCircle, Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface TriageResultProps {
  severity: "IMMEDIATE" | "URGENT" | "DELAYED";
  explanation: string;
}

export default function TriageResult({ severity, explanation }: TriageResultProps) {
  const getSeverityColor = () => {
    switch (severity) {
      case "IMMEDIATE":
        return "bg-red-100 text-red-700 border-red-200";
      case "URGENT":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "DELAYED":
        return "bg-green-100 text-green-700 border-green-200";
    }
  };

  const getSeverityIcon = () => {
    switch (severity) {
      case "IMMEDIATE":
        return <AlertCircle className="h-6 w-6" />;
      case "URGENT":
        return <AlertTriangle className="h-6 w-6" />;
      case "DELAYED":
        return <Clock className="h-6 w-6" />;
    }
  };

  return (
    <Card className={`border-2 ${getSeverityColor()}`}>
      <CardHeader className="flex flex-row items-center gap-4">
        {getSeverityIcon()}
        <div>
          <CardTitle>{severity}</CardTitle>
          <CardDescription>AI Triage Assessment</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700">{explanation}</p>
      </CardContent>
    </Card>
  );
}
