import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Smartphone, Bell, CheckCircle, AlertTriangle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PushNotificationSetup() {
  const { toast } = useToast();
  const [notificationStatus, setNotificationStatus] = useState<"checking" | "granted" | "denied" | "unsupported">("checking");
  const [deviceToken, setDeviceToken] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  // Register device token mutation
  const registerTokenMutation = useMutation({
    mutationFn: async ({ token, platform }: { token: string; platform: string }) => {
      await apiRequest("POST", "/api/notifications/register-device", { token, platform });
    },
    onSuccess: () => {
      setIsRegistered(true);
      toast({
        title: "Notifications Enabled",
        description: "You'll now receive push notifications for usage alerts.",
      });
    },
    onError: () => {
      toast({
        title: "Registration Failed",
        description: "Failed to register for push notifications. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    checkNotificationSupport();
  }, []);

  const checkNotificationSupport = async () => {
    if (!("Notification" in window)) {
      setNotificationStatus("unsupported");
      return;
    }

    const permission = Notification.permission;
    if (permission === "granted") {
      setNotificationStatus("granted");
      await registerForNotifications();
    } else if (permission === "denied") {
      setNotificationStatus("denied");
    } else {
      setNotificationStatus("checking");
    }
  };

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported in this browser.",
        variant: "destructive",
      });
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setNotificationStatus("granted");
        await registerForNotifications();
      } else {
        setNotificationStatus("denied");
        toast({
          title: "Permission Denied",
          description: "Push notifications were blocked. Enable them in your browser settings.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      toast({
        title: "Error",
        description: "Failed to request notification permission.",
        variant: "destructive",
      });
    }
  };

  const registerForNotifications = async () => {
    try {
      // For web, we'll use a simple token based on user agent and timestamp
      // In production, you'd use Firebase Web SDK or similar for proper FCM tokens
      const webToken = `web_${navigator.userAgent.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '')}_${Date.now()}`;
      
      setDeviceToken(webToken);
      
      // Register with server
      await registerTokenMutation.mutateAsync({
        token: webToken,
        platform: "web"
      });
      
    } catch (error) {
      console.error("Error registering for notifications:", error);
    }
  };

  const getStatusBadge = () => {
    switch (notificationStatus) {
      case "granted":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Enabled</Badge>;
      case "denied":
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Blocked</Badge>;
      case "unsupported":
        return <Badge variant="secondary">Not Supported</Badge>;
      default:
        return <Badge variant="outline">Checking...</Badge>;
    }
  };

  const getInstructions = () => {
    switch (notificationStatus) {
      case "granted":
        return isRegistered ? 
          "Push notifications are active! You'll receive alerts about your children's usage." :
          "Setting up your device for notifications...";
      case "denied":
        return "To receive push notifications, please enable them in your browser settings and refresh the page.";
      case "unsupported":
        return "Your browser doesn't support push notifications. Try using Chrome, Firefox, or Safari.";
      default:
        return "Checking notification support...";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Push Notifications
          {getStatusBadge()}
        </CardTitle>
        <CardDescription>
          Get instant alerts when your children approach their usage limits
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {getInstructions()}
          </AlertDescription>
        </Alert>

        {notificationStatus === "checking" && (
          <Button 
            onClick={requestNotificationPermission}
            className="w-full"
            disabled={registerTokenMutation.isPending}
          >
            <Bell className="mr-2 h-4 w-4" />
            Enable Push Notifications
          </Button>
        )}

        {notificationStatus === "denied" && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              To enable notifications manually:
            </p>
            <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1">
              <li>Click the lock or notification icon in your browser's address bar</li>
              <li>Select "Allow" for notifications</li>
              <li>Refresh this page</li>
            </ol>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Check Again
            </Button>
          </div>
        )}

        {isRegistered && deviceToken && (
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Successfully Registered</span>
            </div>
            <p className="text-xs text-green-700">
              Device token: {deviceToken.substring(0, 20)}...
            </p>
          </div>
        )}

        <div className="bg-blue-50 p-3 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">What you'll receive:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Usage warnings when children reach 80% of their limits</li>
            <li>• Limit exceeded alerts for immediate action</li>
            <li>• System announcements about important updates</li>
            <li>• Emergency alerts for safety concerns</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}