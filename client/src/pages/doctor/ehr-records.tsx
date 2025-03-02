import { useQuery, useMutation } from "@tanstack/react-query";
import { EhrRecord } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import PatientDetails from "@/components/patient-details";

export default function EhrRecords() {
  const { toast } = useToast();
  const [selectedRecord, setSelectedRecord] = useState<EhrRecord | null>(null);
  const [editedRecord, setEditedRecord] = useState<Partial<EhrRecord>>({});

  const { data: records = [], isLoading } = useQuery<EhrRecord[]>({
    queryKey: ["/api/ehr/all"],
  });

  const updateEhrMutation = useMutation({
    mutationFn: async ({ id, update }: { id: number; update: Partial<EhrRecord> }) => {
      const res = await apiRequest("PATCH", `/api/ehr/${id}`, update);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ehr/all"] });
      toast({
        title: "EHR Record Updated",
        description: "The medical record has been successfully updated.",
      });
      setSelectedRecord(null);
      setEditedRecord({});
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
      <h1 className="text-2xl font-bold mb-6">Electronic Health Records</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          {records.map((record) => (
            <Card
              key={record.id}
              className={`cursor-pointer transition-colors hover:bg-accent ${
                selectedRecord?.id === record.id ? "border-primary" : ""
              }`}
              onClick={() => {
                setSelectedRecord(record);
                setEditedRecord({});
              }}
            >
              <CardHeader>
                <CardTitle className="text-lg font-medium">
                  Medical Record #{record.id}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PatientDetails patientId={record.patientId} />

                <div className="mt-4 space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Diagnosis:</span>{" "}
                    {record.diagnosis}
                  </div>
                  <div>
                    <span className="font-medium">Treatment Plan:</span>{" "}
                    {record.treatmentPlan}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div>
          {selectedRecord ? (
            <Card>
              <CardHeader>
                <CardTitle>Edit Medical Record</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-medium">Diagnosis</h3>
                  <Input
                    value={editedRecord.diagnosis ?? selectedRecord.diagnosis ?? ""}
                    onChange={(e) =>
                      setEditedRecord({ ...editedRecord, diagnosis: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">Treatment Plan</h3>
                  <Textarea
                    value={editedRecord.treatmentPlan ?? selectedRecord.treatmentPlan ?? ""}
                    onChange={(e) =>
                      setEditedRecord({ ...editedRecord, treatmentPlan: e.target.value })
                    }
                    className="h-32"
                  />
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">Notes</h3>
                  <Textarea
                    value={editedRecord.notes ?? selectedRecord.notes ?? ""}
                    onChange={(e) =>
                      setEditedRecord({ ...editedRecord, notes: e.target.value })
                    }
                    className="h-32"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedRecord(null);
                      setEditedRecord({});
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() =>
                      updateEhrMutation.mutate({
                        id: selectedRecord.id,
                        update: editedRecord,
                      })
                    }
                    disabled={updateEhrMutation.isPending}
                  >
                    {updateEhrMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-40">
                <p className="text-muted-foreground">
                  Select a record to edit
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
