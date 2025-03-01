import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function NavBar() {
  const { user, logoutMutation } = useAuth();

  return (
    <Card className="border-b rounded-none">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold">Medical Triage System</span>
          <span className="text-sm text-muted-foreground">
            Logged in as {user?.role}
          </span>
        </div>
        <Button
          variant="outline"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          {logoutMutation.isPending ? "Signing out..." : "Sign out"}
        </Button>
      </div>
    </Card>
  );
}
