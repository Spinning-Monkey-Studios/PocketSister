import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Lock, Mail, Shield, AlertCircle } from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useLocation } from "wouter";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  totpCode: z.string().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function AdminNewLogin() {
  const [, setLocation] = useLocation();
  const [showTwoFA, setShowTwoFA] = useState(false);
  const { loginMutation, requestResetMutation } = useAdminAuth();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      totpCode: "",
    },
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      const result = await loginMutation.mutateAsync(data);
      
      if (result.requires2FA && !data.totpCode) {
        setShowTwoFA(true);
        return;
      }
      
      if (result.success) {
        setLocation("/admin-dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleForgotPassword = async () => {
    const email = form.getValues("email");
    if (!email) {
      form.setError("email", { message: "Please enter your email first" });
      return;
    }
    
    await requestResetMutation.mutateAsync({ email });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-purple-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Admin Portal</CardTitle>
          <CardDescription>
            Sign in to access the My Pocket Sister admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          {...field}
                          type="email"
                          placeholder="Enter your email address"
                          className="pl-10"
                          disabled={loginMutation.isPending}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          {...field}
                          type="password"
                          placeholder="Enter your password"
                          className="pl-10"
                          disabled={loginMutation.isPending}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {showTwoFA && (
                <FormField
                  control={form.control}
                  name="totpCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Two-Factor Authentication Code</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter 6-digit code"
                          maxLength={6}
                          disabled={loginMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
                data-testid="button-admin-login"
              >
                {loginMutation.isPending ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </Form>

          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={handleForgotPassword}
              disabled={requestResetMutation.isPending}
              className="text-sm"
              data-testid="button-forgot-password"
            >
              {requestResetMutation.isPending ? "Sending..." : "Forgot password?"}
            </Button>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start space-x-2">
              <Shield className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-700 font-medium mb-1">Secure Access</p>
                <p className="text-sm text-gray-600">
                  Enterprise-grade authentication with multi-factor security.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700 font-medium mb-2">Security Features:</p>
            <ul className="text-xs text-blue-600 space-y-1">
              <li>• Email-based authentication</li>
              <li>• Password reset functionality</li>
              <li>• Two-factor authentication support</li>
              <li>• Secure session management</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}