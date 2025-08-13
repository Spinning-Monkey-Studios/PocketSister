import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageSquare, Edit, Plus, Trash2, Eye, 
  WifiOff, AlertTriangle, Settings, TestTube 
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface MessageTemplate {
  id: string;
  templateKey: string;
  title: string;
  message: string;
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminOfflineMessages() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    templateKey: '',
    title: '',
    message: '',
    priority: 10
  });
  const [testMessage, setTestMessage] = useState({
    templateKey: 'offline',
    pocketSisterName: 'Emma'
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Fetch all message templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ['/api/admin/metrics/message-templates'],
    queryFn: () => fetch('/api/admin/metrics/message-templates').then(res => res.json())
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ templateKey, updates }: { templateKey: string; updates: any }) => {
      return await apiRequest(`/api/admin/metrics/message-templates/${templateKey}`, 'PUT', updates);
    },
    onSuccess: () => {
      toast({
        title: "Template Updated",
        description: "Message template has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/metrics/message-templates'] });
      setIsEditDialogOpen(false);
      setEditingTemplate(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update template",
        variant: "destructive",
      });
    }
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (template: typeof newTemplate) => {
      return await apiRequest('/api/admin/metrics/message-templates', 'POST', template);
    },
    onSuccess: () => {
      toast({
        title: "Template Created",
        description: "New message template has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/metrics/message-templates'] });
      setIsCreateDialogOpen(false);
      setNewTemplate({ templateKey: '', title: '', message: '', priority: 10 });
    },
    onError: (error: Error) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create template",
        variant: "destructive",
      });
    }
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateKey: string) => {
      return await apiRequest(`/api/admin/metrics/message-templates/${templateKey}`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: "Template Deleted",
        description: "Message template has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/metrics/message-templates'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete template",
        variant: "destructive",
      });
    }
  });

  // Test message mutation
  const testMessageMutation = useMutation({
    mutationFn: async (test: typeof testMessage) => {
      return await apiRequest('/api/admin/metrics/test-offline-message', 'POST', test);
    },
    onSuccess: (result) => {
      toast({
        title: "Test Message Generated",
        description: "Check the preview below to see how the message will appear.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Test Failed",
        description: error.message || "Failed to test message",
        variant: "destructive",
      });
    }
  });

  const handleEditTemplate = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setIsEditDialogOpen(true);
  };

  const handleUpdateTemplate = () => {
    if (!editingTemplate) return;
    updateTemplateMutation.mutate({
      templateKey: editingTemplate.templateKey,
      updates: {
        title: editingTemplate.title,
        message: editingTemplate.message,
        isActive: editingTemplate.isActive,
        priority: editingTemplate.priority
      }
    });
  };

  const handleCreateTemplate = () => {
    if (!newTemplate.templateKey || !newTemplate.title || !newTemplate.message) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    createTemplateMutation.mutate(newTemplate);
  };

  const getPriorityBadge = (priority: number) => {
    if (priority <= 3) return <Badge variant="destructive">High</Badge>;
    if (priority <= 6) return <Badge variant="default">Medium</Badge>;
    return <Badge variant="secondary">Low</Badge>;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="admin-offline-messages">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Offline Message Templates</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-template">
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Message Template</DialogTitle>
              <DialogDescription>
                Create a new template for offline/unreachable AI messages. Use {"{pocketSisterName}"} for dynamic name insertion.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template-key">Template Key</Label>
                <Input
                  id="template-key"
                  value={newTemplate.templateKey}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, templateKey: e.target.value }))}
                  placeholder="e.g., offline, maintenance, server_error"
                  data-testid="input-template-key"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newTemplate.title}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Message title"
                  data-testid="input-title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={newTemplate.message}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Use {pocketSisterName} for dynamic names..."
                  rows={4}
                  data-testid="input-message"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority (1-10)</Label>
                <Input
                  id="priority"
                  type="number"
                  min="1"
                  max="10"
                  value={newTemplate.priority}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                  data-testid="input-priority"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateTemplate}
                disabled={createTemplateMutation.isPending}
                data-testid="button-save-template"
              >
                {createTemplateMutation.isPending ? 'Creating...' : 'Create Template'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">Message Templates</TabsTrigger>
          <TabsTrigger value="test">Test Messages</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {templates?.map((template: MessageTemplate) => (
              <Card key={template.id} className={template.isActive ? '' : 'opacity-60'}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg">
                    {template.title}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    {getPriorityBadge(template.priority)}
                    {template.isActive ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Template Key:</p>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded" data-testid={`text-template-key-${template.templateKey}`}>
                      {template.templateKey}
                    </code>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700">Message Preview:</p>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded border-l-4 border-purple-500" data-testid={`text-message-preview-${template.templateKey}`}>
                      {template.message.replace(/{pocketSisterName}/g, 'Emma')}
                    </p>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditTemplate(template)}
                      data-testid={`button-edit-${template.templateKey}`}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => deleteTemplateMutation.mutate(template.templateKey)}
                      disabled={deleteTemplateMutation.isPending}
                      data-testid={`button-delete-${template.templateKey}`}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Message Templates</CardTitle>
              <CardDescription>
                Test how your templates will appear with different pocket sister names
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="test-template">Template to Test</Label>
                  <select
                    id="test-template"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={testMessage.templateKey}
                    onChange={(e) => setTestMessage(prev => ({ ...prev, templateKey: e.target.value }))}
                    data-testid="select-test-template"
                  >
                    {templates?.map((template: MessageTemplate) => (
                      <option key={template.templateKey} value={template.templateKey}>
                        {template.title} ({template.templateKey})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pocket-sister-name">Pocket Sister Name</Label>
                  <Input
                    id="pocket-sister-name"
                    value={testMessage.pocketSisterName}
                    onChange={(e) => setTestMessage(prev => ({ ...prev, pocketSisterName: e.target.value }))}
                    placeholder="Enter name to test with"
                    data-testid="input-pocket-sister-name"
                  />
                </div>
              </div>

              <Button 
                onClick={() => testMessageMutation.mutate(testMessage)}
                disabled={testMessageMutation.isPending}
                data-testid="button-test-message"
              >
                <TestTube className="w-4 h-4 mr-2" />
                {testMessageMutation.isPending ? 'Testing...' : 'Test Message'}
              </Button>

              {testMessageMutation.data && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Eye className="w-4 h-4 mr-2" />
                      Message Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="font-medium text-gray-700" data-testid="text-test-title">
                        {(testMessageMutation.data as any)?.title || 'Test Title'}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg border">
                      <p className="text-gray-800" data-testid="text-test-message">
                        {(testMessageMutation.data as any)?.message || 'Test message'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Message Template</DialogTitle>
            <DialogDescription>
              Update the template. Use {"{pocketSisterName}"} for dynamic name insertion.
            </DialogDescription>
          </DialogHeader>
          {editingTemplate && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editingTemplate.title}
                  onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, title: e.target.value } : null)}
                  data-testid="input-edit-title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-message">Message</Label>
                <Textarea
                  id="edit-message"
                  value={editingTemplate.message}
                  onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, message: e.target.value } : null)}
                  rows={4}
                  data-testid="input-edit-message"
                />
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-active"
                    checked={editingTemplate.isActive}
                    onCheckedChange={(checked) => setEditingTemplate(prev => prev ? { ...prev, isActive: checked } : null)}
                    data-testid="switch-edit-active"
                  />
                  <Label htmlFor="edit-active">Active</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-priority">Priority</Label>
                  <Input
                    id="edit-priority"
                    type="number"
                    min="1"
                    max="10"
                    value={editingTemplate.priority}
                    onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, priority: parseInt(e.target.value) } : null)}
                    className="w-20"
                    data-testid="input-edit-priority"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateTemplate}
              disabled={updateTemplateMutation.isPending}
              data-testid="button-update-template"
            >
              {updateTemplateMutation.isPending ? 'Updating...' : 'Update Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}