import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Lock, Shield } from "lucide-react";

export default function AdminLogin() {
  const { toast } = useToast();
  const [adminSecret, setAdminSecret] = useState("");

  const loginMutation = useMutation({
    mutationFn: async (secret: string) => {
      return apiRequest('POST', '/api/admin/login', { secret });
    },
    onSuccess: (data: any) => {
      // Store admin token in localStorage
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminSecret', adminSecret);
      
      toast({
        title: "Admin Access Granted",
        description: "Welcome to the admin portal!",
      });
      
      // Redirect to admin portal
      window.location.href = '/admin-portal';
    },
    onError: (error: any) => {
      toast({
        title: "Access Denied",
        description: error.message || "Invalid admin credentials",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminSecret.trim()) {
      toast({
        title: "Secret Required",
        description: "Please enter the admin secret",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate(adminSecret);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Admin Portal Access</CardTitle>
          <CardDescription>
            Enter your admin secret to access the management portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="secret">Admin Secret</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="secret"
                  type="password"
                  value={adminSecret}
                  onChange={(e) => setAdminSecret(e.target.value)}
                  placeholder="Enter admin secret"
                  className="pl-10"
                  disabled={loginMutation.isPending}
                />
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending || !adminSecret.trim()}
            >
              {loginMutation.isPending ? "Authenticating..." : "Access Admin Portal"}
            </Button>
          </form>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">
              <strong>Security Notice:</strong> Admin access is protected by secure authentication.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Contact your system administrator for access credentials.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}