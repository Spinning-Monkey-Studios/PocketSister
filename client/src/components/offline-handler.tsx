import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Wifi, WifiOff, RotateCcw } from "lucide-react";

interface OfflineHandlerProps {
  isOnline: boolean;
  pocketSisterName?: string;
  customMessage?: {
    title: string;
    message: string;
  };
}

export default function OfflineHandler({ 
  isOnline, 
  pocketSisterName = 'friend',
  customMessage 
}: OfflineHandlerProps) {
  const [showRetryButton, setShowRetryButton] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      // Show retry button after 5 seconds
      const timer = setTimeout(() => setShowRetryButton(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  const defaultMessage = {
    title: "Connection Issue",
    message: `Hi ${pocketSisterName}! I'm having trouble connecting to the internet right now. Don't worry - I'll be back as soon as the connection is restored! In the meantime, you can still browse your saved conversations.`
  };

  const displayMessage = customMessage || defaultMessage;

  if (isOnline) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-md w-full shadow-xl">
        <CardHeader className="text-center">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <WifiOff className="w-10 h-10 text-purple-500" />
          </div>
          <CardTitle className="text-xl text-gray-800">
            {displayMessage.title}
          </CardTitle>
          <CardDescription className="text-gray-600 text-center">
            {displayMessage.message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {showRetryButton && (
            <Button 
              onClick={() => window.location.reload()}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              data-testid="button-retry-connection"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
          
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Checking connection status...
            </p>
            <div className="flex items-center justify-center mt-2 space-x-2">
              <div className="animate-pulse h-2 w-2 bg-purple-400 rounded-full"></div>
              <div className="animate-pulse h-2 w-2 bg-purple-400 rounded-full" style={{animationDelay: '0.2s'}}></div>
              <div className="animate-pulse h-2 w-2 bg-purple-400 rounded-full" style={{animationDelay: '0.4s'}}></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Hook for detecting online/offline status
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Additional check by trying to fetch from the server
    const checkConnection = async () => {
      try {
        const response = await fetch('/api/health', { 
          method: 'GET',
          cache: 'no-cache'
        });
        setIsOnline(response.ok);
      } catch {
        setIsOnline(false);
      }
    };

    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return isOnline;
}

// Error boundary for handling API errors gracefully
interface ApiErrorHandlerProps {
  children: React.ReactNode;
  fallbackComponent?: React.ComponentType<{ error: Error; retry: () => void }>;
}

export function ApiErrorHandler({ children, fallbackComponent: FallbackComponent }: ApiErrorHandlerProps) {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason && event.reason.message?.includes('Failed to fetch')) {
        setError(new Error('Network connection lost'));
        event.preventDefault();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, []);

  const retry = () => {
    setError(null);
    window.location.reload();
  };

  if (error) {
    if (FallbackComponent) {
      return <FallbackComponent error={error} retry={retry} />;
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-xl">
          <CardHeader className="text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <CardTitle className="text-xl text-gray-800">Connection Error</CardTitle>
            <CardDescription className="text-gray-600">
              {error.message}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={retry} className="w-full" data-testid="button-retry-error">
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}