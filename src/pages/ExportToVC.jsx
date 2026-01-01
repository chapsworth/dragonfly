import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Search, Package, Upload, Download, Eye, Copy, RefreshCw, Link as LinkIcon, Code } from 'lucide-react';
import { toast } from 'sonner';

export default function ExportToVC() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBlueprint, setEditingBlueprint] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewingBlueprint, setViewingBlueprint] = useState(null);
  const [apiResponse, setApiResponse] = useState(null);
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: '',
    category: 'Content',
    default_props: '{}',
    editable_fields_schema: '{}',
    version: '1.0.0',
    preview_image_url: '',
    tags: ''
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setLoading(false);
      if (u?.role !== 'admin') {
        toast.error('Admin access required');
      }
    }).catch(() => {
      setLoading(false);
      toast.error('Please log in');
    });
  }, []);

  const { data: blueprints = [], isLoading: loadingBlueprints } = useQuery({
    queryKey: ['component-blueprints'],
    queryFn: () => base44.entities.ComponentBlueprint.list('-created_date'),
    enabled: user?.role === 'admin'
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ComponentBlueprint.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['component-blueprints'] });
      setIsCreateOpen(false);
      resetForm();
      toast.success('Component blueprint created');
    },
    onError: (error) => toast.error('Failed to create: ' + error.message)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ComponentBlueprint.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['component-blueprints'] });
      setEditingBlueprint(null);
      resetForm();
      toast.success('Component blueprint updated');
    },
    onError: (error) => toast.error('Failed to update: ' + error.message)
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ComponentBlueprint.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['component-blueprints'] });
      toast.success('Component blueprint deleted');
    },
    onError: (error) => toast.error('Failed to delete: ' + error.message)
  });

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      description: '',
      category: 'Content',
      default_props: '{}',
      editable_fields_schema: '{}',
      version: '1.0.0',
      preview_image_url: '',
      tags: ''
    });
  };

  const handleEdit = (blueprint) => {
    setEditingBlueprint(blueprint);
    setFormData({
      name: blueprint.name || '',
      type: blueprint.type || '',
      description: blueprint.description || '',
      category: blueprint.category || 'Content',
      default_props: typeof blueprint.default_props === 'object' ? JSON.stringify(blueprint.default_props, null, 2) : (blueprint.default_props || '{}'),
      editable_fields_schema: typeof blueprint.editable_fields_schema === 'object' ? JSON.stringify(blueprint.editable_fields_schema, null, 2) : (blueprint.editable_fields_schema || '{}'),
      version: blueprint.version || '1.0.0',
      preview_image_url: blueprint.preview_image_url || '',
      tags: Array.isArray(blueprint.tags) ? blueprint.tags.join(', ') : ''
    });
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.type || !formData.category) {
      toast.error('Please fill required fields');
      return;
    }

    let defaultProps = {};
    let editableFieldsSchema = {};

    try {
      defaultProps = JSON.parse(formData.default_props);
    } catch (e) {
      toast.error('Invalid JSON in default_props');
      return;
    }

    try {
      editableFieldsSchema = JSON.parse(formData.editable_fields_schema);
    } catch (e) {
      toast.error('Invalid JSON in editable_fields_schema');
      return;
    }

    const data = {
      name: formData.name,
      type: formData.type,
      description: formData.description,
      category: formData.category,
      default_props: defaultProps,
      editable_fields_schema: editableFieldsSchema,
      version: formData.version,
      preview_image_url: formData.preview_image_url,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
    };

    if (editingBlueprint) {
      updateMutation.mutate({ id: editingBlueprint.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleExport = (blueprint) => {
    const exportData = {
      name: blueprint.name,
      type: blueprint.type,
      description: blueprint.description,
      category: blueprint.category,
      default_props: blueprint.default_props,
      editable_fields_schema: blueprint.editable_fields_schema,
      version: blueprint.version,
      preview_image_url: blueprint.preview_image_url,
      tags: blueprint.tags
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${blueprint.type}-blueprint.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Blueprint exported');
  };

  const handleBulkExport = () => {
    const exportData = filteredBlueprints.map(bp => ({
      name: bp.name,
      type: bp.type,
      description: bp.description,
      category: bp.category,
      default_props: bp.default_props,
      editable_fields_schema: bp.editable_fields_schema,
      version: bp.version,
      preview_image_url: bp.preview_image_url,
      tags: bp.tags
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all-blueprints-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${exportData.length} blueprints`);
  };

  const handleTestApi = async () => {
    setIsTestingApi(true);
    try {
      const response = await base44.functions.invoke('exportToVC');
      setApiResponse(response.data);
      toast.success('API test successful');
    } catch (error) {
      setApiResponse({ error: error.message });
      toast.error('API test failed: ' + error.message);
    } finally {
      setIsTestingApi(false);
    }
  };

  const getApiEndpoint = () => {
    const currentUrl = window.location.origin;
    return `${currentUrl}/api/functions/exportToVC`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const categories = ['Navigation', 'Content', 'E-commerce', 'Forms', 'Media', 'Data Display', 'Layout', 'Social'];

  const filteredBlueprints = blueprints.filter(bp => {
    const matchesSearch = searchQuery === '' || 
      bp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bp.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bp.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || bp.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8">
          <p className="text-red-600 font-semibold">Admin access required</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Export to VisionCraft</h1>
              <p className="text-gray-600">Manage and export component blueprints</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setIsCreateOpen(true)} className="bg-blue-600">
                <Plus className="w-4 h-4 mr-2" />
                New Blueprint
              </Button>
              {filteredBlueprints.length > 0 && (
                <Button onClick={handleBulkExport} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export All ({filteredBlueprints.length})
                </Button>
              )}
            </div>
          </div>

          {/* API Endpoint Card */}
          <Card className="mb-4 border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <LinkIcon className="w-5 h-5" />
                API Endpoint
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-gray-600 mb-2 block">Export API Endpoint</Label>
                <div className="flex gap-2">
                  <Input
                    value={getApiEndpoint()}
                    readOnly
                    className="font-mono text-sm bg-white"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(getApiEndpoint())}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleTestApi}
                    disabled={isTestingApi}
                    className="bg-blue-600"
                  >
                    {isTestingApi ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Test API'}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-600 mb-1 block">Authentication</Label>
                  <p className="text-sm">User session OR Bearer token with <code className="bg-white px-1 py-0.5 rounded text-xs">INCOMING_API_SECRET</code></p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600 mb-1 block">Total Blueprints</Label>
                  <Badge className="bg-blue-600 text-white">{blueprints.length}</Badge>
                </div>
              </div>

              {apiResponse && (
                <div>
                  <Label className="text-xs text-gray-600 mb-2 block">API Response</Label>
                  <pre className="bg-white p-4 rounded border text-xs overflow-x-auto max-h-64 overflow-y-auto">
                    {JSON.stringify(apiResponse, null, 2)}
                  </pre>
                </div>
              )}

              <details className="text-sm">
                <summary className="cursor-pointer text-blue-600 font-semibold mb-2">Usage Instructions</summary>
                <div className="bg-white p-4 rounded border space-y-2 mt-2">
                  <p className="font-semibold">cURL Example:</p>
                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
{`curl -X POST ${getApiEndpoint()} \\
  -H "Authorization: Bearer YOUR_SECRET_KEY"`}
                  </pre>
                  <p className="font-semibold mt-3">JavaScript Example:</p>
                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
{`const response = await fetch('${getApiEndpoint()}', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_SECRET_KEY'
  }
});
const data = await response.json();`}
                  </pre>
                </div>
              </details>
            </CardContent>
          </Card>

          {/* Tabs for Blueprints and Raw Data */}
          <Tabs defaultValue="blueprints" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="blueprints">Blueprints ({filteredBlueprints.length})</TabsTrigger>
              <TabsTrigger value="raw">Raw Export Data</TabsTrigger>
            </TabsList>

            <TabsContent value="blueprints" className="space-y-4 mt-4">
              {/* Search and Filter */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Search blueprints..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Blueprints Grid */}
              {loadingBlueprints ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto" />
                </div>
              ) : filteredBlueprints.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-600">No component blueprints found</p>
                    <Button onClick={() => setIsCreateOpen(true)} className="mt-4">
                      Create your first blueprint
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredBlueprints.map(blueprint => (
              <Card key={blueprint.id} className="hover:shadow-lg transition-shadow">
                {blueprint.preview_image_url && (
                  <img 
                    src={blueprint.preview_image_url} 
                    alt={blueprint.name}
                    className="w-full h-40 object-cover rounded-t-lg"
                  />
                )}
                <CardHeader>
                  <CardTitle className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-lg font-bold text-gray-900">{blueprint.name}</p>
                      <p className="text-xs text-gray-500 font-mono mt-1">{blueprint.type}</p>
                    </div>
                    <Badge>{blueprint.category}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {blueprint.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{blueprint.description}</p>
                  )}
                  {blueprint.tags && blueprint.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {blueprint.tags.slice(0, 3).map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                      {blueprint.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">+{blueprint.tags.length - 3}</Badge>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span>v{blueprint.version}</span>
                    <span>{new Date(blueprint.created_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setViewingBlueprint(blueprint);
                        setIsViewOpen(true);
                      }}
                      className="flex-1"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(blueprint)}
                      className="flex-1"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleExport(blueprint)}
                      className="bg-blue-600"
                    >
                      <Upload className="w-3 h-3 mr-1" />
                      Export
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        if (confirm('Delete this blueprint?')) {
                          deleteMutation.mutate(blueprint.id);
                        }
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="raw" className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Code className="w-5 h-5" />
                      Raw Export Data
                    </CardTitle>
                    <Button
                      size="sm"
                      onClick={() => copyToClipboard(JSON.stringify(blueprints.map(bp => ({
                        name: bp.name,
                        type: bp.type,
                        description: bp.description,
                        category: bp.category,
                        default_props: bp.default_props,
                        editable_fields_schema: bp.editable_fields_schema,
                        version: bp.version,
                        preview_image_url: bp.preview_image_url,
                        tags: bp.tags
                      })), null, 2))}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy JSON
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto max-h-[600px] overflow-y-auto">
                    {JSON.stringify(blueprints.map(bp => ({
                      name: bp.name,
                      type: bp.type,
                      description: bp.description,
                      category: bp.category,
                      default_props: bp.default_props,
                      editable_fields_schema: bp.editable_fields_schema,
                      version: bp.version,
                      preview_image_url: bp.preview_image_url,
                      tags: bp.tags
                    })), null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen || !!editingBlueprint} onOpenChange={(open) => {
        if (!open) {
          setIsCreateOpen(false);
          setEditingBlueprint(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBlueprint ? 'Edit Blueprint' : 'Create Blueprint'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Hero Section"
                />
              </div>
              <div>
                <Label>Type *</Label>
                <Input
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  placeholder="e.g., hero_section"
                />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this component"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category *</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Version</Label>
                <Input
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  placeholder="1.0.0"
                />
              </div>
            </div>

            <div>
              <Label>Default Props (JSON)</Label>
              <Textarea
                value={formData.default_props}
                onChange={(e) => setFormData({ ...formData, default_props: e.target.value })}
                placeholder='{"title": "Default Title", "subtitle": "Default Subtitle"}'
                rows={4}
                className="font-mono text-sm"
              />
            </div>

            <div>
              <Label>Editable Fields Schema (JSON)</Label>
              <Textarea
                value={formData.editable_fields_schema}
                onChange={(e) => setFormData({ ...formData, editable_fields_schema: e.target.value })}
                placeholder='{"properties": {"title": {"type": "string"}}}'
                rows={4}
                className="font-mono text-sm"
              />
            </div>

            <div>
              <Label>Preview Image URL</Label>
              <Input
                value={formData.preview_image_url}
                onChange={(e) => setFormData({ ...formData, preview_image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div>
              <Label>Tags (comma-separated)</Label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="responsive, modern, clean"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditingBlueprint(null);
                  resetForm();
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1 bg-blue-600"
              >
                {editingBlueprint ? 'Update' : 'Create'} Blueprint
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Blueprint Details</DialogTitle>
          </DialogHeader>
          {viewingBlueprint && (
            <div className="space-y-4 mt-4">
              {viewingBlueprint.preview_image_url && (
                <img 
                  src={viewingBlueprint.preview_image_url} 
                  alt={viewingBlueprint.name}
                  className="w-full rounded-lg"
                />
              )}
              <div>
                <Label className="text-xs text-gray-500">Name</Label>
                <p className="font-semibold">{viewingBlueprint.name}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Type</Label>
                <p className="font-mono text-sm">{viewingBlueprint.type}</p>
              </div>
              {viewingBlueprint.description && (
                <div>
                  <Label className="text-xs text-gray-500">Description</Label>
                  <p className="text-sm">{viewingBlueprint.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Category</Label>
                  <Badge>{viewingBlueprint.category}</Badge>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Version</Label>
                  <p className="text-sm">{viewingBlueprint.version}</p>
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Default Props</Label>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                  {JSON.stringify(viewingBlueprint.default_props, null, 2)}
                </pre>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Editable Fields Schema</Label>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                  {JSON.stringify(viewingBlueprint.editable_fields_schema, null, 2)}
                </pre>
              </div>
              {viewingBlueprint.tags && viewingBlueprint.tags.length > 0 && (
                <div>
                  <Label className="text-xs text-gray-500">Tags</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {viewingBlueprint.tags.map((tag, idx) => (
                      <Badge key={idx} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsViewOpen(false)} className="flex-1">
                  Close
                </Button>
                <Button onClick={() => handleExport(viewingBlueprint)} className="flex-1 bg-blue-600">
                  <Upload className="w-4 h-4 mr-2" />
                  Export Blueprint
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}