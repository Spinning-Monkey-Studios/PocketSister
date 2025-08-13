import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface AdminUser {
  id: string;
  email: string;
  isTotpEnabled: boolean;
  lastLogin?: string;
}

interface AdminAuthResponse {
  success: boolean;
  admin?: AdminUser;
  token?: string;
  message?: string;
  requires2FA?: boolean;
}

export function useAdminAuth() {
  const { toast } = useToast();

  // Check current admin authentication status
  const { data: admin, isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/auth/me'],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ email, password, totpCode }: { 
      email: string; 
      password: string; 
      totpCode?: string; 
    }): Promise<AdminAuthResponse> => {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, totpCode }),
      });
      return await response.json();
    },
    onSuccess: (data: any) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/auth/me'] });
        toast({
          title: "Login successful",
          description: "Welcome to the admin portal",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/auth/logout', {
        method: 'POST',
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.clear();
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    },
  });

  // Password reset request mutation
  const requestResetMutation = useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      const response = await fetch('/api/admin/auth/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Reset link sent",
        description: "Check your email for password reset instructions",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Reset failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Password reset mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ token, newPassword }: { token: string; newPassword: string }) => {
      const response = await fetch('/api/admin/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password reset",
        description: "Your password has been reset successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Reset failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 2FA setup mutation
  const setup2FAMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/auth/setup-2fa', {
        method: 'POST',
      });
      return await response.json();
    },
    onError: (error: Error) => {
      toast({
        title: "2FA setup failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 2FA enable mutation
  const enable2FAMutation = useMutation({
    mutationFn: async ({ totpCode }: { totpCode: string }) => {
      const response = await fetch('/api/admin/auth/enable-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totpCode }),
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/auth/me'] });
      toast({
        title: "2FA enabled",
        description: "Two-factor authentication has been enabled",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "2FA enable failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    admin,
    isLoading,
    isAuthenticated: !!admin,
    loginMutation,
    logoutMutation,
    requestResetMutation,
    resetPasswordMutation,
    setup2FAMutation,
    enable2FAMutation,
    refetch,
  };
}