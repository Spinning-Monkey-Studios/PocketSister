import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, MapPin, Smartphone } from "lucide-react";

// Mock device info interface for testing mobile features
interface DeviceInfo {
  platform: string;
  deviceId: string;
  appVersion: string;
}

export default function MobileDeviceTest() {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [activationRequested, setActivationRequested] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [lastLocation, setLastLocation] = useState<{
    latitude: number;
    longitude: number;
    timestamp: string;
  } | null>(null);

  useEffect(() => {
    // Check if running in mobile app context
    const checkDeviceReady = () => {
      if ((window as any).deviceInfo) {
        setDeviceInfo((window as any).deviceInfo);
      }
    };

    // Listen for device ready event
    window.addEventListener('deviceready', checkDeviceReady);
    
    // Also check immediately in case already loaded
    checkDeviceReady();

    return () => {
      window.removeEventListener('deviceready', checkDeviceReady);
    };
  }, []);

  const requestActivation = () => {
    if ((window as any).AndroidInterface?.requestActivation) {
      (window as any).AndroidInterface.requestActivation("test-child-id");
    } else if ((window as any).webkit?.messageHandlers?.requestActivation) {
      (window as any).webkit.messageHandlers.requestActivation.postMessage("test-child-id");
    }
    setActivationRequested(true);
  };

  const toggleLocationTracking = () => {
    const enable = !locationEnabled;
    const intervalMinutes = 5; // Test with 5 minute intervals
    
    if ((window as any).AndroidInterface?.enableLocationTracking) {
      (window as any).AndroidInterface.enableLocationTracking(enable, intervalMinutes);
    } else if ((window as any).webkit?.messageHandlers?.enableLocationTracking) {
      (window as any).webkit.messageHandlers.enableLocationTracking.postMessage({
        enable,
        intervalMinutes
      });
    }
    
    setLocationEnabled(enable);
    
    if (enable) {
      // Simulate location updates for testing
      const interval = setInterval(() => {
        setLastLocation({
          latitude: 37.7749 + (Math.random() - 0.5) * 0.01,
          longitude: -122.4194 + (Math.random() - 0.5) * 0.01,
          timestamp: new Date().toISOString()
        });
      }, 30000);
      
      return () => clearInterval(interval);
    }
  };

  const triggerEmergencyLocation = () => {
    if ((window as any).AndroidInterface?.emergencyLocationRequest) {
      (window as any).AndroidInterface.emergencyLocationRequest();
    } else if ((window as any).webkit?.messageHandlers?.emergencyLocationRequest) {
      (window as any).webkit.messageHandlers.emergencyLocationRequest.postMessage(null);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Mobile Device Testing</h1>
        <Badge variant={deviceInfo ? "default" : "secondary"}>
          {deviceInfo ? `${deviceInfo.platform} Device` : "Web Browser"}
        </Badge>
      </div>

      {/* Device Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Device Information
          </CardTitle>
          <CardDescription>
            Information about the current device and app environment
          </CardDescription>
        </CardHeader>
        <CardContent>
          {deviceInfo ? (
            <div className="space-y-2">
              <div><strong>Platform:</strong> {deviceInfo.platform}</div>
              <div><strong>Device ID:</strong> {deviceInfo.deviceId.substring(0, 8)}...</div>
              <div><strong>App Version:</strong> {deviceInfo.appVersion}</div>
            </div>
          ) : (
            <div className="text-gray-500">
              Running in web browser. Mobile features require the native app.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Device Activation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Device Activation
          </CardTitle>
          <CardDescription>
            Test the parent approval workflow for device activation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Activation Status</p>
              <p className="text-sm text-gray-600">
                {activationRequested ? "Activation requested - waiting for parent approval" : "Not activated"}
              </p>
            </div>
            <Button 
              onClick={requestActivation}
              disabled={!deviceInfo || activationRequested}
            >
              {activationRequested ? "Request Sent" : "Request Activation"}
            </Button>
          </div>

          {activationRequested && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  Activation request sent to parent. Check the parent dashboard to approve this device.
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Tracking
          </CardTitle>
          <CardDescription>
            Test GPS location tracking and emergency location features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Location Sharing</p>
              <p className="text-sm text-gray-600">
                {locationEnabled ? "Actively sharing location" : "Location sharing disabled"}
              </p>
            </div>
            <Button 
              onClick={toggleLocationTracking}
              disabled={!deviceInfo}
              variant={locationEnabled ? "destructive" : "default"}
            >
              {locationEnabled ? "Stop Tracking" : "Start Tracking"}
            </Button>
          </div>

          {lastLocation && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="space-y-1">
                <p className="text-sm font-medium text-green-800">Latest Location:</p>
                <p className="text-sm text-green-700">
                  {lastLocation.latitude.toFixed(6)}, {lastLocation.longitude.toFixed(6)}
                </p>
                <p className="text-xs text-green-600">
                  {new Date(lastLocation.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          <div className="pt-4 border-t">
            <Button 
              onClick={triggerEmergencyLocation}
              disabled={!deviceInfo}
              variant="outline"
              className="w-full"
            >
              🚨 Send Emergency Location
            </Button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              This will immediately send your current location to your parent
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">For Mobile App Testing:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
              <li>Build the mobile app using the provided Visual Studio solution files</li>
              <li>Install the app on an Android or iOS device</li>
              <li>Navigate to this test page within the app</li>
              <li>Test device activation and location features</li>
              <li>Check the parent dashboard for activation requests and location data</li>
            </ol>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">For Parent Dashboard Testing:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
              <li>Open the parent dashboard in a separate browser tab</li>
              <li>Log in as a parent user</li>
              <li>Check for activation requests after using the mobile app</li>
              <li>Approve or reject device activations</li>
              <li>Monitor location data when location sharing is enabled</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}