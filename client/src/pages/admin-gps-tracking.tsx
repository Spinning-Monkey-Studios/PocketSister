import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  MapPin, Navigation, AlertTriangle, Clock, 
  Users, TrendingUp, Send, History 
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function AdminGpsTracking() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [gpsRequest, setGpsRequest] = useState({
    childId: '',
    parentId: '',
    requestType: 'location_check' as 'location_check' | 'emergency' | 'tracking',
    reason: '',
    isEmergency: false
  });

  const [historyFilters, setHistoryFilters] = useState({
    childId: '',
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Fetch GPS statistics
  const { data: gpsStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/metrics/gps-statistics'],
    queryFn: () => fetch('/api/admin/metrics/gps-statistics').then(res => res.json())
  });

  // Fetch GPS history
  const { data: gpsHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['/api/admin/metrics/gps-history', historyFilters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (historyFilters.childId) params.append('childId', historyFilters.childId);
      if (historyFilters.startDate) params.append('startDate', historyFilters.startDate);
      if (historyFilters.endDate) params.append('endDate', historyFilters.endDate);
      return fetch(`/api/admin/metrics/gps-history?${params.toString()}`).then(res => res.json());
    }
  });

  // Send GPS request mutation
  const sendGpsRequestMutation = useMutation({
    mutationFn: async (request: typeof gpsRequest) => {
      return await apiRequest('/api/admin/metrics/gps-request', 'POST', request);
    },
    onSuccess: () => {
      toast({
        title: "GPS Request Sent",
        description: "Location request has been sent to the child's device.",
      });
      setGpsRequest({
        childId: '',
        parentId: '',
        requestType: 'location_check',
        reason: '',
        isEmergency: false
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/metrics/gps-history'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Request Failed",
        description: error.message || "Failed to send GPS request",
        variant: "destructive",
      });
    }
  });

  const handleSendGpsRequest = () => {
    if (!gpsRequest.childId || !gpsRequest.parentId) {
      toast({
        title: "Missing Information",
        description: "Please provide both Child ID and Parent ID",
        variant: "destructive",
      });
      return;
    }
    sendGpsRequestMutation.mutate(gpsRequest);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'default',
      completed: 'default',
      denied: 'destructive',
      approved: 'default'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const formatLocation = (locationData: any) => {
    if (!locationData) return 'N/A';
    try {
      const data = typeof locationData === 'string' ? JSON.parse(locationData) : locationData;
      return `${data.latitude?.toFixed(6)}, ${data.longitude?.toFixed(6)}`;
    } catch {
      return 'Invalid location data';
    }
  };

  if (statsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="admin-gps-tracking">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">GPS Tracking Dashboard</h1>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-requests">
              {gpsStats?.totalRequests || 0}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emergency Requests</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="text-emergency-requests">
              {gpsStats?.emergencyRequests || 0}
            </div>
            <p className="text-xs text-muted-foreground">High priority</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Requests</CardTitle>
            <Navigation className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-completed-requests">
              {gpsStats?.completedRequests || 0}
            </div>
            <p className="text-xs text-muted-foreground">Successful responses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-response-rate">
              {gpsStats?.responseRate || 0}%
            </div>
            <p className="text-xs text-muted-foreground">Success rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="send-request" className="space-y-4">
        <TabsList>
          <TabsTrigger value="send-request">Send GPS Request</TabsTrigger>
          <TabsTrigger value="location-history">Location History</TabsTrigger>
        </TabsList>

        <TabsContent value="send-request" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Send Location Request</CardTitle>
              <CardDescription>
                Request location data from a child's device
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="child-id">Child ID</Label>
                  <Input
                    id="child-id"
                    value={gpsRequest.childId}
                    onChange={(e) => setGpsRequest(prev => ({ ...prev, childId: e.target.value }))}
                    placeholder="Enter child ID"
                    data-testid="input-child-id"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parent-id">Parent ID</Label>
                  <Input
                    id="parent-id"
                    value={gpsRequest.parentId}
                    onChange={(e) => setGpsRequest(prev => ({ ...prev, parentId: e.target.value }))}
                    placeholder="Enter parent ID"
                    data-testid="input-parent-id"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="request-type">Request Type</Label>
                  <Select 
                    value={gpsRequest.requestType}
                    onValueChange={(value) => setGpsRequest(prev => ({ 
                      ...prev, 
                      requestType: value as typeof gpsRequest.requestType,
                      isEmergency: value === 'emergency'
                    }))}
                  >
                    <SelectTrigger data-testid="select-request-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="location_check">Location Check</SelectItem>
                      <SelectItem value="tracking">Continuous Tracking</SelectItem>
                      <SelectItem value="emergency">Emergency Request</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="reason">Reason (Optional)</Label>
                  <Textarea
                    id="reason"
                    value={gpsRequest.reason}
                    onChange={(e) => setGpsRequest(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Explain why location is needed..."
                    data-testid="input-reason"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handleSendGpsRequest}
                  disabled={sendGpsRequestMutation.isPending}
                  data-testid="button-send-request"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {sendGpsRequestMutation.isPending ? 'Sending...' : 'Send Request'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="location-history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Location Request History</CardTitle>
              <CardDescription>
                View and manage location requests and responses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="filter-child">Filter by Child:</Label>
                  <Input
                    id="filter-child"
                    value={historyFilters.childId}
                    onChange={(e) => setHistoryFilters(prev => ({ ...prev, childId: e.target.value }))}
                    placeholder="Child ID"
                    className="w-32"
                    data-testid="input-filter-child"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="filter-start">From:</Label>
                  <Input
                    id="filter-start"
                    type="date"
                    value={historyFilters.startDate}
                    onChange={(e) => setHistoryFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-40"
                    data-testid="input-filter-start"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="filter-end">To:</Label>
                  <Input
                    id="filter-end"
                    type="date"
                    value={historyFilters.endDate}
                    onChange={(e) => setHistoryFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-40"
                    data-testid="input-filter-end"
                  />
                </div>
              </div>

              {/* History Table */}
              <div className="overflow-x-auto">
                {historyLoading ? (
                  <div className="animate-pulse space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-12 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : (
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-2 text-left">Date</th>
                        <th className="border border-gray-300 p-2 text-left">Child</th>
                        <th className="border border-gray-300 p-2 text-left">Parent</th>
                        <th className="border border-gray-300 p-2 text-left">Type</th>
                        <th className="border border-gray-300 p-2 text-left">Status</th>
                        <th className="border border-gray-300 p-2 text-left">Location</th>
                        <th className="border border-gray-300 p-2 text-left">Emergency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gpsHistory?.map((request: any, index: number) => (
                        <tr key={request.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border border-gray-300 p-2" data-testid={`text-request-date-${index}`}>
                            {new Date(request.requestedAt).toLocaleDateString()}
                          </td>
                          <td className="border border-gray-300 p-2" data-testid={`text-child-name-${index}`}>
                            {request.childName || request.childId}
                          </td>
                          <td className="border border-gray-300 p-2" data-testid={`text-parent-name-${index}`}>
                            {request.parentName || request.parentId}
                          </td>
                          <td className="border border-gray-300 p-2" data-testid={`text-request-type-${index}`}>
                            {request.requestType?.replace('_', ' ')}
                          </td>
                          <td className="border border-gray-300 p-2">
                            {getStatusBadge(request.status)}
                          </td>
                          <td className="border border-gray-300 p-2 font-mono text-sm" data-testid={`text-location-${index}`}>
                            {formatLocation(request.locationData)}
                          </td>
                          <td className="border border-gray-300 p-2">
                            {request.isEmergency && (
                              <Badge variant="destructive">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                EMERGENCY
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}