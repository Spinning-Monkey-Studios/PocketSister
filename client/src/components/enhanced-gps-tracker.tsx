import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  MapPin, 
  Shield, 
  Clock, 
  Battery, 
  Navigation, 
  Plus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Smartphone,
  Home,
  School
} from 'lucide-react';

interface LocationData {
  id: string;
  latitude: number;
  longitude: number;
  address?: string;
  accuracy: number;
  speed?: number;
  heading?: number;
  battery_level?: number;
  activity_type?: string;
  geofence_status?: string;
  location_source: string;
  timestamp: string;
}

interface GeofenceZone {
  id: string;
  zone_name: string;
  zone_type: string;
  center_latitude: number;
  center_longitude: number;
  radius_meters: number;
  is_active: boolean;
  time_restrictions?: any;
  alert_settings?: any;
}

interface EnhancedGpsTrackerProps {
  childId: string;
  childName: string;
}

export function EnhancedGpsTracker({ childId, childName }: EnhancedGpsTrackerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedHours, setSelectedHours] = useState('24');
  const [showCreateZone, setShowCreateZone] = useState(false);
  const [newZone, setNewZone] = useState({
    zone_name: '',
    zone_type: 'safe',
    center_latitude: '',
    center_longitude: '',
    radius_meters: '100',
    time_restrictions: {},
    alert_settings: { notify_enter: true, notify_exit: true }
  });

  // Fetch current location
  const { data: currentLocation, isLoading: locationLoading } = useQuery<LocationData>({
    queryKey: [`/api/enhanced-parent/child/${childId}/location/current`],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch location history
  const { data: locationHistory, isLoading: historyLoading } = useQuery<LocationData[]>({
    queryKey: [`/api/enhanced-parent/child/${childId}/location/history`, selectedHours],
    queryFn: async () => {
      const response = await fetch(`/api/enhanced-parent/child/${childId}/location/history?hours=${selectedHours}`);
      const data = await response.json();
      return data.locations || [];
    },
  });

  // Fetch geofence zones
  const { data: geofenceZones = [], isLoading: zonesLoading } = useQuery<GeofenceZone[]>({
    queryKey: [`/api/enhanced-parent/child/${childId}/geofence`],
  });

  // Create geofence zone mutation
  const createZoneMutation = useMutation({
    mutationFn: async (zoneData: any) => {
      await apiRequest('POST', `/api/enhanced-parent/child/${childId}/geofence`, zoneData);
    },
    onSuccess: () => {
      toast({
        title: 'Geofence Created',
        description: 'New safe zone has been created successfully.',
      });
      setShowCreateZone(false);
      setNewZone({
        zone_name: '',
        zone_type: 'safe',
        center_latitude: '',
        center_longitude: '',
        radius_meters: '100',
        time_restrictions: {},
        alert_settings: { notify_enter: true, notify_exit: true }
      });
      queryClient.invalidateQueries([`/api/enhanced-parent/child/${childId}/geofence`]);
    },
    onError: () => {
      toast({
        title: 'Failed to Create Zone',
        description: 'Could not create geofence zone. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const getLocationStatusColor = (status?: string) => {
    switch (status) {
      case 'inside': return 'bg-green-100 text-green-800';
      case 'outside': return 'bg-red-100 text-red-800';
      case 'approaching': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getZoneTypeIcon = (type: string) => {
    switch (type) {
      case 'safe': return <Home className="h-4 w-4 text-green-600" />;
      case 'school': return <School className="h-4 w-4 text-blue-600" />;
      case 'alert': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default: return <MapPin className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6" data-testid="enhanced-gps-tracker">
      {/* Current Location Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Current Location - {childName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {locationLoading ? (
            <div className="animate-pulse">
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          ) : currentLocation ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Location:</span>
                  <span>{currentLocation.address || 'Resolving address...'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Last Update:</span>
                  <span>{formatTime(currentLocation.timestamp)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">Accuracy:</span>
                  <span>{formatDistance(currentLocation.accuracy)}</span>
                </div>
              </div>
              <div className="space-y-3">
                {currentLocation.battery_level && (
                  <div className="flex items-center gap-2">
                    <Battery className="h-4 w-4 text-orange-600" />
                    <span className="font-medium">Battery:</span>
                    <span>{currentLocation.battery_level}%</span>
                  </div>
                )}
                {currentLocation.activity_type && (
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-indigo-600" />
                    <span className="font-medium">Activity:</span>
                    <Badge variant="outline">{currentLocation.activity_type}</Badge>
                  </div>
                )}
                {currentLocation.geofence_status && (
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Zone Status:</span>
                    <Badge className={getLocationStatusColor(currentLocation.geofence_status)}>
                      {currentLocation.geofence_status}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No location data available</p>
              <p className="text-sm">Location sharing may be disabled</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Geofence Zones */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Safe Zones & Alerts
            </CardTitle>
            <Dialog open={showCreateZone} onOpenChange={setShowCreateZone}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-create-zone">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Zone
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Geofence Zone</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="zone-name">Zone Name</Label>
                    <Input
                      id="zone-name"
                      value={newZone.zone_name}
                      onChange={(e) => setNewZone({ ...newZone, zone_name: e.target.value })}
                      placeholder="e.g., Home, School, Grandma's House"
                      data-testid="input-zone-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="zone-type">Zone Type</Label>
                    <Select 
                      value={newZone.zone_type} 
                      onValueChange={(value) => setNewZone({ ...newZone, zone_type: value })}
                    >
                      <SelectTrigger data-testid="select-zone-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="safe">Safe Zone</SelectItem>
                        <SelectItem value="school">School</SelectItem>
                        <SelectItem value="alert">Alert Zone</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="latitude">Latitude</Label>
                      <Input
                        id="latitude"
                        value={newZone.center_latitude}
                        onChange={(e) => setNewZone({ ...newZone, center_latitude: e.target.value })}
                        placeholder="37.7749"
                        data-testid="input-latitude"
                      />
                    </div>
                    <div>
                      <Label htmlFor="longitude">Longitude</Label>
                      <Input
                        id="longitude"
                        value={newZone.center_longitude}
                        onChange={(e) => setNewZone({ ...newZone, center_longitude: e.target.value })}
                        placeholder="-122.4194"
                        data-testid="input-longitude"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="radius">Radius (meters)</Label>
                    <Input
                      id="radius"
                      value={newZone.radius_meters}
                      onChange={(e) => setNewZone({ ...newZone, radius_meters: e.target.value })}
                      placeholder="100"
                      data-testid="input-radius"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowCreateZone(false)}
                      data-testid="button-cancel-zone"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => createZoneMutation.mutate(newZone)}
                      disabled={createZoneMutation.isPending || !newZone.zone_name || !newZone.center_latitude || !newZone.center_longitude}
                      data-testid="button-save-zone"
                    >
                      {createZoneMutation.isPending ? 'Creating...' : 'Create Zone'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {zonesLoading ? (
            <div className="animate-pulse space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : geofenceZones.length > 0 ? (
            <div className="space-y-3">
              {geofenceZones.map((zone) => (
                <div key={zone.id} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`zone-${zone.id}`}>
                  <div className="flex items-center gap-3">
                    {getZoneTypeIcon(zone.zone_type)}
                    <div>
                      <div className="font-medium">{zone.zone_name}</div>
                      <div className="text-sm text-gray-500">
                        {formatDistance(zone.radius_meters)} radius • {zone.zone_type}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={zone.is_active ? 'default' : 'secondary'}>
                      {zone.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    {zone.is_active ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No geofence zones configured</p>
              <p className="text-sm">Create safe zones to monitor your child's location</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Location History
            </CardTitle>
            <Select value={selectedHours} onValueChange={setSelectedHours}>
              <SelectTrigger className="w-32" data-testid="select-history-hours">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6 hours</SelectItem>
                <SelectItem value="24">24 hours</SelectItem>
                <SelectItem value="72">3 days</SelectItem>
                <SelectItem value="168">1 week</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="animate-pulse space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : locationHistory && locationHistory.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {locationHistory.map((location) => (
                <div key={location.id} className="flex items-center justify-between p-3 border-l-4 border-blue-200 bg-gray-50 rounded" data-testid={`location-${location.id}`}>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="font-medium text-sm">
                        {location.address || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatTime(location.timestamp)} • {formatDistance(location.accuracy)} accuracy
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {location.geofence_status && (
                      <Badge className={getLocationStatusColor(location.geofence_status)}>
                        {location.geofence_status}
                      </Badge>
                    )}
                    {location.battery_level && (
                      <div className="text-xs text-gray-500">
                        {location.battery_level}%
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No location history available</p>
              <p className="text-sm">History will appear when location tracking is active</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}