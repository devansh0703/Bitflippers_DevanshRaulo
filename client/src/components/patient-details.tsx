import { useQuery } from "@tanstack/react-query";
import { Patient } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function PatientDetails({ patientId }: { patientId: number }) {
  const { data: patient, isLoading } = useQuery<Patient>({
    queryKey: [`/api/patients/${patientId}`],
  });

  if (isLoading) {
    return <Skeleton className="h-20" />;
  }

  if (!patient) {
    return <div>Patient not found</div>;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-2">
        <h3 className="font-medium">{patient.name}</h3>
        <span className="text-sm text-muted-foreground">
          {patient.age} years • {patient.gender}
        </span>
      </div>

      {patient.medicalHistory?.length > 0 && (
        <div className="text-sm">
          <span className="font-medium">History:</span>{" "}
          {patient.medicalHistory.join(", ")}
        </div>
      )}

      {patient.allergies?.length > 0 && (
        <div className="text-sm">
          <span className="font-medium">Allergies:</span>{" "}
          {patient.allergies.join(", ")}
        </div>
      )}

      {patient.medications?.length > 0 && (
        <div className="text-sm">
          <span className="font-medium">Medications:</span>{" "}
          {patient.medications.join(", ")}
        </div>
      )}
    </div>
  );
}
