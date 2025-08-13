import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Navigation, AlertTriangle, Check, X } from "lucide-react";

export interface GpsPermissionState {
  status: 'unknown' | 'granted' | 'denied' | 'prompt';
  position?: GeolocationPosition;
  error?: GeolocationPositionError;
}

interface GpsPermissionHandlerProps {
  onPermissionChange?: (state: GpsPermissionState) => void;
  showUI?: boolean;
}

export default function GpsPermissionHandler({ 
  onPermissionChange, 
  showUI = true 
}: GpsPermissionHandlerProps) {
  const [permissionState, setPermissionState] = useState<GpsPermissionState>({
    status: 'unknown'
  });
  const [isRequesting, setIsRequesting] = useState(false);

  // Check initial permission status
  useEffect(() => {
    checkPermissionStatus();
  }, []);

  const checkPermissionStatus = async () => {
    if (!navigator.geolocation) {
      const state: GpsPermissionState = {
        status: 'denied',
        error: { 
          code: 2, 
          message: 'Geolocation not supported',
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3
        } as GeolocationPositionError
      };
      setPermissionState(state);
      onPermissionChange?.(state);
      return;
    }

    // Check permission API if available
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        const state: GpsPermissionState = { status: permission.state as any };
        setPermissionState(state);
        onPermissionChange?.(state);
        
        // Listen for permission changes
        permission.addEventListener('change', () => {
          const newState: GpsPermissionState = { status: permission.state as any };
          setPermissionState(newState);
          onPermissionChange?.(newState);
        });
      } catch (error) {
        // Fallback: try to get current position to determine status
        getCurrentLocationSilently();
      }
    } else {
      getCurrentLocationSilently();
    }
  };

  const getCurrentLocationSilently = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const state: GpsPermissionState = {
          status: 'granted',
          position
        };
        setPermissionState(state);
        onPermissionChange?.(state);
      },
      (error) => {
        const status = error.code === 1 ? 'denied' : 'unknown';
        const state: GpsPermissionState = {
          status,
          error
        };
        setPermissionState(state);
        onPermissionChange?.(state);
      },
      { 
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
        enableHighAccuracy: false
      }
    );
  };

  const requestPermission = async () => {
    if (!navigator.geolocation) return;

    setIsRequesting(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const state: GpsPermissionState = {
          status: 'granted',
          position
        };
        setPermissionState(state);
        onPermissionChange?.(state);
        setIsRequesting(false);
      },
      (error) => {
        const status = error.code === 1 ? 'denied' : 'unknown';
        const state: GpsPermissionState = {
          status,
          error
        };
        setPermissionState(state);
        onPermissionChange?.(state);
        setIsRequesting(false);
      },
      {
        timeout: 15000,
        maximumAge: 60000, // 1 minute
        enableHighAccuracy: true
      }
    );
  };

  const getStatusIcon = () => {
    switch (permissionState.status) {
      case 'granted':
        return <Check className="w-5 h-5 text-green-600" />;
      case 'denied':
        return <X className="w-5 h-5 text-red-600" />;
      case 'prompt':
      case 'unknown':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      default:
        return <MapPin className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusMessage = () => {
    switch (permissionState.status) {
      case 'granted':
        return 'Location access granted. Your location can be shared with parents when requested.';
      case 'denied':
        return 'Location access denied. Parents won\'t be able to request your location for safety purposes.';
      case 'prompt':
        return 'Location permission required. This helps parents keep you safe by knowing your location when needed.';
      case 'unknown':
        return 'Unable to determine location permission status.';
      default:
        return 'Checking location permissions...';
    }
  };

  const getStatusVariant = () => {
    switch (permissionState.status) {
      case 'granted':
        return 'default';
      case 'denied':
        return 'destructive';
      default:
        return 'default';
    }
  };

  if (!showUI) return null;

  return (
    <Card className="w-full max-w-md" data-testid="gps-permission-handler">
      <CardHeader className="flex flex-row items-center space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <CardTitle className="text-lg">Location Permissions</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant={getStatusVariant()}>
          <Navigation className="h-4 w-4" />
          <AlertDescription data-testid="permission-status-message">
            {getStatusMessage()}
          </AlertDescription>
        </Alert>

        {permissionState.status === 'denied' && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              To enable location sharing:
            </p>
            <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1">
              <li>Click the location icon in your browser's address bar</li>
              <li>Select "Allow" for location permissions</li>
              <li>Refresh this page</li>
            </ol>
          </div>
        )}

        {(permissionState.status === 'prompt' || permissionState.status === 'unknown') && (
          <Button 
            onClick={requestPermission}
            disabled={isRequesting}
            className="w-full"
            data-testid="button-request-permission"
          >
            <MapPin className="w-4 h-4 mr-2" />
            {isRequesting ? 'Requesting Permission...' : 'Grant Location Permission'}
          </Button>
        )}

        {permissionState.status === 'granted' && permissionState.position && (
          <div className="bg-green-50 p-3 rounded border-l-4 border-green-400">
            <p className="text-sm text-green-700 font-medium">Location Available</p>
            <p className="text-xs text-green-600 mt-1">
              Accuracy: ±{Math.round(permissionState.position.coords.accuracy)}m
            </p>
          </div>
        )}

        {permissionState.error && (
          <div className="bg-red-50 p-3 rounded border-l-4 border-red-400">
            <p className="text-sm text-red-700 font-medium">Location Error</p>
            <p className="text-xs text-red-600 mt-1" data-testid="error-message">
              {permissionState.error.message}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Hook for using GPS permissions in components
export function useGpsPermission() {
  const [permissionState, setPermissionState] = useState<GpsPermissionState>({
    status: 'unknown'
  });

  const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          timeout: 15000,
          maximumAge: 60000,
          enableHighAccuracy: true
        }
      );
    });
  };

  const requestLocationIfNeeded = async (): Promise<GeolocationPosition | null> => {
    if (permissionState.status === 'granted' && permissionState.position) {
      return permissionState.position;
    }

    try {
      const position = await getCurrentPosition();
      setPermissionState({
        status: 'granted',
        position
      });
      return position;
    } catch (error) {
      const geoError = error as GeolocationPositionError;
      setPermissionState({
        status: geoError.code === 1 ? 'denied' : 'unknown',
        error: geoError
      });
      return null;
    }
  };

  return {
    permissionState,
    setPermissionState,
    getCurrentPosition,
    requestLocationIfNeeded,
    isLocationAvailable: permissionState.status === 'granted'
  };
}