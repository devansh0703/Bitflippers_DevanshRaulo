import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  const [role, setRole] = useState<"paramedic" | "doctor">("paramedic");

  if (user) {
    setLocation(user.role === "paramedic" ? "/paramedic" : "/doctor");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex">
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Emergency Medical Response System
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    loginMutation.mutate({
                      username: formData.get("username") as string,
                      password: formData.get("password") as string,
                    });
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" name="username" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "Logging in..." : "Login"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    registerMutation.mutate({
                      username: formData.get("username") as string,
                      password: formData.get("password") as string,
                      name: formData.get("name") as string,
                      role,
                    });
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Full Name</Label>
                    <Input id="register-name" name="name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-username">Username</Label>
                    <Input id="register-username" name="username" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                      id="register-password"
                      name="password"
                      type="password"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select
                      value={role}
                      onValueChange={(value) =>
                        setRole(value as "paramedic" | "doctor")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paramedic">Paramedic</SelectItem>
                        <SelectItem value="doctor">Doctor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? "Registering..." : "Register"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 p-12">
        <div className="max-w-lg text-white">
          <h1 className="text-4xl font-bold mb-6">
            AI-Powered Emergency Response
          </h1>
          <p className="text-lg opacity-90 mb-8">
            Join our platform to revolutionize emergency medical response with
            AI-assisted triage, real-time collaboration, and smart resource
            allocation.
          </p>
          <div className="grid grid-cols-2 gap-6">
            <div className="border border-white/20 rounded-lg p-4">
              <h3 className="font-semibold mb-2">For Paramedics</h3>
              <p className="text-sm opacity-75">
                Get AI-powered triage assistance and real-time communication with
                doctors.
              </p>
            </div>
            <div className="border border-white/20 rounded-lg p-4">
              <h3 className="font-semibold mb-2">For Doctors</h3>
              <p className="text-sm opacity-75">
                Monitor cases in real-time and provide rapid treatment
                recommendations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
