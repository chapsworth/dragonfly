import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { FileCode, Eye, Sparkles } from 'lucide-react';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

export default function PageSelector({ onCreateBlueprint }) {
  const [selectedPage, setSelectedPage] = useState('');
  const [captureMode, setCaptureMode] = useState('manual');
  const [blueprintData, setBlueprintData] = useState({
    name: '',
    type: '',
    category: 'Content',
    description: '',
    tags: ''
  });

  // List of available pages (this would be dynamic in a real scenario)
  const availablePages = [
    'Home', 'Shop', 'AdminDashboard', 'Profile', 'Orders', 'VendorOrders',
    'ProductDetail', 'Cart', 'Rewards', 'CRM', 'AdminProducts', 'ExportToVC'
  ];

  const categories = ['Navigation', 'Content', 'E-commerce', 'Forms', 'Media', 'Data Display', 'Layout', 'Social'];

  const handleCapturePreview = async () => {
    if (!selectedPage) {
      toast.error('Please select a page first');
      return;
    }

    try {
      toast.info('Capturing screenshot...');
      
      // Open the page in a new window temporarily
      const pageUrl = `${window.location.origin}/#/${selectedPage}`;
      const previewWindow = window.open(pageUrl, '_blank', 'width=1200,height=800');
      
      if (!previewWindow) {
        toast.error('Please allow pop-ups to capture screenshots');
        return;
      }

      // Wait for page to load
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

    const blueprint = {
      name: blueprintData.name,
      type: blueprintData.type,
      description: blueprintData.description || `Component from ${selectedPage} page`,
      category: blueprintData.category,
      default_props: {
        page_source: selectedPage,
        captured_at: new Date().toISOString()
      },
      editable_fields_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          backgroundColor: { type: "string" }
        }
      },
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
            <Label>Select Page *</Label>
            <Select value={selectedPage} onValueChange={setSelectedPage}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a page..." />
              </SelectTrigger>
              <SelectContent>
                {availablePages.map(page => (
                  <SelectItem key={page} value={page}>{page}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPage && (
            <>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleCapturePreview}
                  className="flex-1"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Capture Preview
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open(`/#/${selectedPage}`, '_blank')}
                  className="flex-1"
                >
                  <FileCode className="w-4 h-4 mr-2" />
                  View Page
                </Button>
              </div>

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
          <CardTitle className="text-sm">How it works</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-2">
          <p>1. Select a page from your app</p>
          <p>2. Capture a preview screenshot (optional)</p>
          <p>3. Fill in the blueprint details</p>
          <p>4. Click "Generate Blueprint" to create</p>
          <p className="text-xs text-gray-500 mt-3">
            Note: The blueprint will reference the source page and can be customized with editable properties.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}