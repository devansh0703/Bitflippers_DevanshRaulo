import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import ParamedicDashboard from "@/pages/paramedic/dashboard";
import CreateReport from "@/pages/paramedic/create-report";
import DoctorDashboard from "@/pages/doctor/dashboard";
import EhrRecords from "@/pages/doctor/ehr-records";
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => {
        window.location.href = "/auth";
        return null;
      }} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/paramedic" component={ParamedicDashboard} />
      <ProtectedRoute path="/paramedic/create-report" component={CreateReport} />
      <ProtectedRoute path="/doctor" component={DoctorDashboard} />
      <ProtectedRoute path="/doctor/ehr" component={EhrRecords} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;