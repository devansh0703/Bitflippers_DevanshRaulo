import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import ParamedicForm from "@/pages/paramedic-form";
import DoctorDashboard from "@/pages/doctor-dashboard";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/paramedic" component={ParamedicForm} />
      <ProtectedRoute path="/doctor" component={DoctorDashboard} />
      <Route path="/" component={() => {
        const { user } = useAuth();
        return user?.role === "paramedic" ? <ParamedicForm /> : <DoctorDashboard />;
      }} />
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
