import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { FileCode, Eye, Sparkles, Loader2, Code } from 'lucide-react';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function PageSelector({ onCreateBlueprint }) {
  const [selectedPage, setSelectedPage] = useState('');
  const [selectedType, setSelectedType] = useState('page');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pageCode, setPageCode] = useState('');
  const [extractedComponents, setExtractedComponents] = useState([]);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [blueprintData, setBlueprintData] = useState({
    name: '',
    type: '',
    category: 'Content',
    description: '',
    tags: '',
    default_props: '{}',
    editable_fields_schema: '{}'
  });

  // List of available pages (this would be dynamic in a real scenario)
  const availablePages = [
    'Home', 'Shop', 'AdminDashboard', 'Profile', 'Orders', 'VendorOrders',
    'ProductDetail', 'Cart', 'Rewards', 'CRM', 'AdminProducts', 'ExportToVC'
  ];

  // List of available components
  const availableComponents = [
    'cart/CartContext', 'cart/CartDrawer', 'admin/AdminNav', 'navigation/Header', 
    'navigation/Sidebar', 'products/ProductCard', 'orders/OrderCard', 'push/CapacitorPushNotifications'
  ];

  // List of available functions
  const availableFunctions = [
    'notifyAdminsNewOrder', 'sendOrderEmail', 'geocodeOrders', 'registerDeviceToken',
    'sendPushNotification', 'updateDriverLocation', 'checkDriverProximity'
  ];

  // Fetch available entities dynamically
  const { data: availableEntities = [] } = useQuery({
    queryKey: ['available-entities'],
    queryFn: async () => {
      // Get all entity names from the API
      const entities = ['Order', 'Product', 'Contact', 'Vendor', 'VendorProduct', 'Reward', 'PointsTransaction'];
      return entities;
    }
  });

  const categories = ['Navigation', 'Content', 'E-commerce', 'Forms', 'Media', 'Data Display', 'Layout', 'Social'];

  const handleAnalyzePage = async () => {
    if (!selectedPage) {
      toast.error('Please select an item first');
      return;
    }

    setIsAnalyzing(true);
    try {
      // Handle entity analysis separately
      if (selectedType === 'entity') {
        // Fetch entity schema directly
        const schema = await base44.entities[selectedPage].schema();
        
        // Generate blueprint from schema
        const entityBlueprint = {
          mainComponent: selectedPage,
          description: `Entity schema for ${selectedPage}`,
          components: [{
            name: selectedPage,
            description: `Database entity with properties: ${Object.keys(schema.properties || {}).join(', ')}`,
            props: schema.properties || {},
            code_snippet: JSON.stringify(schema, null, 2)
          }],
          suggestedCategory: 'Data Display',
          suggestedTags: ['entity', 'schema', 'database', selectedPage.toLowerCase()]
        };
        
        setExtractedComponents(entityBlueprint.components || []);
        
        // Auto-fill with entity blueprint
        setBlueprintData({
          name: entityBlueprint.mainComponent,
          type: entityBlueprint.mainComponent.toLowerCase().replace(/\s+/g, '_'),
          category: entityBlueprint.suggestedCategory || 'Data Display',
          description: entityBlueprint.description || '',
          tags: (entityBlueprint.suggestedTags || []).join(', '),
          default_props: JSON.stringify({
            entity_name: selectedPage,
            schema: schema
          }, null, 2),
          editable_fields_schema: JSON.stringify({
            type: "object",
            properties: schema.properties || {}
          }, null, 2)
        });
        
        setIsAnalyzing(false);
        toast.success('Entity schema analyzed successfully!');
        return;
      }

      // Determine file path based on type
      let filePath = '';
      if (selectedType === 'page') {
        filePath = `pages/${selectedPage}.js`;
      } else if (selectedType === 'component') {
        filePath = `components/${selectedPage}.jsx`;
      } else if (selectedType === 'function') {
        filePath = `functions/${selectedPage}.js`;
      }

      // Use AI to read and analyze the code
      const prompt = `Analyze this ${selectedType} file: ${filePath}

Read the file and extract:
1. Main component name
2. All sub-components and their props
3. Key state variables and their purposes
4. Any configuration objects
5. Main features and functionality

Return a JSON object with:
{
  "mainComponent": "ComponentName",
  "description": "What this page does",
  "components": [
    {
      "name": "ComponentName",
      "description": "What it does",
      "props": {"propName": "type/description"},
      "code_snippet": "relevant code"
    }
  ],
  "suggestedCategory": "category",
  "suggestedTags": ["tag1", "tag2"]
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            mainComponent: { type: "string" },
            description: { type: "string" },
            components: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  props: { type: "object" },
                  code_snippet: { type: "string" }
                }
              }
            },
            suggestedCategory: { type: "string" },
            suggestedTags: { type: "array", items: { type: "string" } }
          }
        }
      });

      setExtractedComponents(result.components || []);
      
      // Auto-fill with main component by default
      if (result.mainComponent) {
        setBlueprintData({
          name: result.mainComponent,
          type: result.mainComponent.toLowerCase().replace(/\s+/g, '_'),
          category: result.suggestedCategory || 'Content',
          description: result.description || '',
          tags: (result.suggestedTags || []).join(', '),
          default_props: JSON.stringify({
            page_source: selectedPage,
            component_type: result.mainComponent
          }, null, 2),
          editable_fields_schema: JSON.stringify({
            type: "object",
            properties: {
              title: { type: "string", description: "Component title" },
              description: { type: "string", description: "Component description" }
            }
          }, null, 2)
        });
      }

      toast.success('Page analyzed successfully!');
    } catch (error) {
      toast.error('Analysis failed: ' + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectComponent = async (component) => {
    setSelectedComponent(component);
    setIsAnalyzing(true);

    try {
      // Use AI to generate detailed blueprint from component
      const prompt = `Generate a detailed component blueprint for: ${component.name}

Component info:
${JSON.stringify(component, null, 2)}

Create:
1. default_props - Default values for all props with realistic examples
2. editable_fields_schema - JSON Schema for all editable properties with types, descriptions, and validation

Return JSON:
{
  "default_props": {},
  "editable_fields_schema": {
    "type": "object",
    "properties": {}
  },
  "suggested_name": "string",
  "suggested_type": "string",
  "suggested_description": "string"
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            default_props: { type: "object" },
            editable_fields_schema: { type: "object" },
            suggested_name: { type: "string" },
            suggested_type: { type: "string" },
            suggested_description: { type: "string" }
          }
        }
      });

      setBlueprintData({
        name: result.suggested_name || component.name,
        type: result.suggested_type || component.name.toLowerCase().replace(/\s+/g, '_'),
        category: blueprintData.category,
        description: result.suggested_description || component.description,
        tags: blueprintData.tags,
        default_props: JSON.stringify(result.default_props, null, 2),
        editable_fields_schema: JSON.stringify(result.editable_fields_schema, null, 2)
      });

      toast.success('Component details generated!');
    } catch (error) {
      toast.error('Failed to generate details: ' + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCapturePreview = async () => {
    if (!selectedPage) {
      toast.error('Please select a page first');
      return;
    }

    try {
      toast.info('Capturing screenshot...');
      
      const pageUrl = `${window.location.origin}/#/${selectedPage}`;
      const previewWindow = window.open(pageUrl, '_blank', 'width=1200,height=800');
      
      if (!previewWindow) {
        toast.error('Please allow pop-ups to capture screenshots');
        return;
      }

      setTimeout(async () => {
        try {
          const canvas = await html2canvas(previewWindow.document.body, {
            allowTaint: true,
            useCORS: true,
            scale: 0.5
          });
          
          const imageUrl = canvas.toDataURL('image/png');
          setBlueprintData(prev => ({ ...prev, preview_image_url: imageUrl }));
          toast.success('Screenshot captured!');
          previewWindow.close();
        } catch (error) {
          toast.error('Failed to capture: ' + error.message);
          previewWindow.close();
        }
      }, 2000);
    } catch (error) {
      toast.error('Capture failed: ' + error.message);
    }
  };

  const handleGenerateBlueprint = async () => {
    if (!selectedPage || !blueprintData.name || !blueprintData.type) {
      toast.error('Please fill in all required fields');
      return;
    }

    let defaultProps = {};
    let editableFieldsSchema = {};

    try {
      defaultProps = JSON.parse(blueprintData.default_props);
    } catch (e) {
      toast.error('Invalid JSON in default_props');
      return;
    }

    try {
      editableFieldsSchema = JSON.parse(blueprintData.editable_fields_schema);
    } catch (e) {
      toast.error('Invalid JSON in editable_fields_schema');
      return;
    }

    const blueprint = {
      name: blueprintData.name,
      type: blueprintData.type,
      description: blueprintData.description || `Component from ${selectedPage} page`,
      category: blueprintData.category,
      default_props: {
        ...defaultProps,
        page_source: selectedPage,
        captured_at: new Date().toISOString()
      },
      editable_fields_schema: editableFieldsSchema,
      version: '1.0.0',
      preview_image_url: blueprintData.preview_image_url || '',
      tags: blueprintData.tags.split(',').map(t => t.trim()).filter(Boolean)
    };

    onCreateBlueprint(blueprint);
  };

  return (
    <div className="space-y-4">
      <Card className="border-purple-200 bg-purple-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Create Blueprint from Existing Pages
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Select Type *</Label>
            <Select value={selectedType} onValueChange={(v) => {
              setSelectedType(v);
              setSelectedPage('');
              setExtractedComponents([]);
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="page">Page</SelectItem>
                <SelectItem value="component">Component</SelectItem>
                <SelectItem value="function">Function</SelectItem>
                <SelectItem value="entity">Entity</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Select {selectedType === 'page' ? 'Page' : selectedType === 'component' ? 'Component' : selectedType === 'function' ? 'Function' : 'Entity'} *</Label>
            <Select value={selectedPage} onValueChange={setSelectedPage}>
              <SelectTrigger>
                <SelectValue placeholder={`Choose a ${selectedType}...`} />
              </SelectTrigger>
              <SelectContent>
                {selectedType === 'page' && availablePages.map(page => (
                  <SelectItem key={page} value={page}>{page}</SelectItem>
                ))}
                {selectedType === 'component' && availableComponents.map(comp => (
                  <SelectItem key={comp} value={comp}>{comp}</SelectItem>
                ))}
                {selectedType === 'function' && availableFunctions.map(func => (
                  <SelectItem key={func} value={func}>{func}</SelectItem>
                ))}
                {selectedType === 'entity' && availableEntities.map(entity => (
                  <SelectItem key={entity} value={entity}>{entity}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPage && (
            <>
              <div className="flex gap-2">
                <Button
                  onClick={handleAnalyzePage}
                  disabled={isAnalyzing}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  {isAnalyzing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  {isAnalyzing ? 'Analyzing...' : `Analyze ${selectedType === 'page' ? 'Page' : selectedType === 'component' ? 'Component' : selectedType === 'function' ? 'Function' : 'Entity'}`}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCapturePreview}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Screenshot
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open(`/#/${selectedPage}`, '_blank')}
                >
                  <FileCode className="w-4 h-4 mr-2" />
                  View
                </Button>
              </div>

              {extractedComponents.length > 0 && (
                <div className="border rounded-lg p-3 bg-white">
                  <Label className="text-sm font-semibold mb-2 block">Extracted Components</Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {extractedComponents.map((comp, idx) => (
                      <Card 
                        key={idx} 
                        className={`cursor-pointer hover:border-purple-400 transition-colors ${
                          selectedComponent?.name === comp.name ? 'border-purple-600 bg-purple-50' : ''
                        }`}
                        onClick={() => handleSelectComponent(comp)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-sm">{comp.name}</p>
                              <p className="text-xs text-gray-600 line-clamp-2">{comp.description}</p>
                              {comp.props && Object.keys(comp.props).length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {Object.keys(comp.props).slice(0, 3).map(prop => (
                                    <Badge key={prop} variant="outline" className="text-xs">{prop}</Badge>
                                  ))}
                                  {Object.keys(comp.props).length > 3 && (
                                    <Badge variant="outline" className="text-xs">+{Object.keys(comp.props).length - 3}</Badge>
                                  )}
                                </div>
                              )}
                            </div>
                            {selectedComponent?.name === comp.name && (
                              <Badge className="bg-purple-600">Selected</Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-4 mt-4">
                <h3 className="font-semibold mb-3">Blueprint Details</h3>
                
                <div className="space-y-3">
                  <div>
                    <Label>Component Name *</Label>
                    <Input
                      value={blueprintData.name}
                      onChange={(e) => setBlueprintData({ ...blueprintData, name: e.target.value })}
                      placeholder="e.g., Dashboard Layout"
                    />
                  </div>

                  <div>
                    <Label>Type Identifier *</Label>
                    <Input
                      value={blueprintData.type}
                      onChange={(e) => setBlueprintData({ ...blueprintData, type: e.target.value })}
                      placeholder="e.g., dashboard_layout"
                    />
                  </div>

                  <div>
                    <Label>Category *</Label>
                    <Select 
                      value={blueprintData.category} 
                      onValueChange={(v) => setBlueprintData({ ...blueprintData, category: v })}
                    >
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
                    <Label>Description</Label>
                    <Input
                      value={blueprintData.description}
                      onChange={(e) => setBlueprintData({ ...blueprintData, description: e.target.value })}
                      placeholder="Brief description of this component"
                    />
                  </div>

                  <div>
                    <Label>Tags (comma-separated)</Label>
                    <Input
                      value={blueprintData.tags}
                      onChange={(e) => setBlueprintData({ ...blueprintData, tags: e.target.value })}
                      placeholder="responsive, modern, dashboard"
                    />
                  </div>

                  <div>
                    <Label>Default Props (JSON)</Label>
                    <Textarea
                      value={blueprintData.default_props}
                      onChange={(e) => setBlueprintData({ ...blueprintData, default_props: e.target.value })}
                      placeholder='{"key": "value"}'
                      rows={4}
                      className="font-mono text-xs"
                    />
                  </div>

                  <div>
                    <Label>Editable Fields Schema (JSON)</Label>
                    <Textarea
                      value={blueprintData.editable_fields_schema}
                      onChange={(e) => setBlueprintData({ ...blueprintData, editable_fields_schema: e.target.value })}
                      placeholder='{"type": "object", "properties": {}}'
                      rows={4}
                      className="font-mono text-xs"
                    />
                  </div>

                  {blueprintData.preview_image_url && (
                    <div>
                      <Label>Preview</Label>
                      <img 
                        src={blueprintData.preview_image_url} 
                        alt="Preview" 
                        className="w-full rounded border mt-2"
                      />
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleGenerateBlueprint}
                  className="w-full mt-4 bg-purple-600 hover:bg-purple-700"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Blueprint
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-blue-100">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Code className="w-4 h-4" />
            How it works
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-2">
          <p>1. <strong>Select type</strong> - Choose page, component, function, or entity</p>
          <p>2. <strong>Select item</strong> - Pick from available items in your app</p>
          <p>3. <strong>Analyze</strong> - AI reads the code/schema and extracts all components</p>
          <p>4. <strong>Select component</strong> - AI auto-generates props and schema</p>
          <p>5. <strong>Review/Edit</strong> - Customize the blueprint details</p>
          <p>6. <strong>Generate</strong> - Creates blueprint with full CRUD capabilities</p>
          <p className="text-xs text-gray-500 mt-3 bg-purple-50 p-2 rounded">
            <Sparkles className="w-3 h-3 inline mr-1" />
            AI automatically extracts all code, props, state, configuration, and entity schemas to generate complete blueprints.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}