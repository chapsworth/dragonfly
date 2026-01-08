import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, Wand2, Loader2, ZoomIn, ZoomOut, RotateCw, 
  Crop, Filter, Trash2, Download, Sparkles, Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';

export default function DesignEditor({ printAreas, onDesignComplete }) {
  const [designs, setDesigns] = useState({});
  const [selectedArea, setSelectedArea] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [removingBg, setRemovingBg] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  
  const canvasRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Current design state for selected area
  const [currentDesign, setCurrentDesign] = useState({
    imageUrl: null,
    x: 0.5,
    y: 0.5,
    scale: 1,
    rotation: 0,
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0
  });

  useEffect(() => {
    if (selectedArea && designs[selectedArea]) {
      setCurrentDesign(designs[selectedArea]);
    } else if (selectedArea) {
      setCurrentDesign({
        imageUrl: null,
        x: 0.5,
        y: 0.5,
        scale: 1,
        rotation: 0,
        brightness: 100,
        contrast: 100,
        saturation: 100,
        blur: 0
      });
    }
  }, [selectedArea, designs]);

  useEffect(() => {
    drawCanvas();
  }, [currentDesign, selectedArea]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setCurrentDesign({ ...currentDesign, imageUrl: file_url });
      toast.success('Image uploaded');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt) {
      toast.error('Please enter a prompt');
      return;
    }

    setGeneratingImage(true);
    try {
      const result = await base44.integrations.Core.GenerateImage({
        prompt: imagePrompt
      });
      setCurrentDesign({ ...currentDesign, imageUrl: result.url });
      toast.success('Image generated');
    } catch (error) {
      toast.error('Failed to generate image');
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleRemoveBackground = async () => {
    if (!currentDesign.imageUrl) {
      toast.error('Please upload an image first');
      return;
    }

    setRemovingBg(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Remove the background from this image and return a transparent PNG.`,
        file_urls: [currentDesign.imageUrl],
        response_json_schema: {
          type: "object",
          properties: {
            image_url: { type: "string" }
          }
        }
      });
      
      // For now, use the original image with a note
      // In production, you'd integrate with a proper background removal API
      toast.info('Background removal requires external API integration');
      
    } catch (error) {
      toast.error('Failed to remove background');
    } finally {
      setRemovingBg(false);
    }
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !currentDesign.imageUrl) return;

    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Apply filters
      ctx.filter = `brightness(${currentDesign.brightness}%) contrast(${currentDesign.contrast}%) saturate(${currentDesign.saturation}%) blur(${currentDesign.blur}px)`;
      
      ctx.save();
      ctx.translate(currentDesign.x * canvas.width, currentDesign.y * canvas.height);
      ctx.rotate((currentDesign.rotation * Math.PI) / 180);
      ctx.scale(currentDesign.scale, currentDesign.scale);
      
      const drawWidth = img.width;
      const drawHeight = img.height;
      ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      
      ctx.restore();
    };
    
    img.src = currentDesign.imageUrl;
  };

  const handleCanvasMouseDown = (e) => {
    if (!currentDesign.imageUrl) return;
    setIsDragging(true);
    const rect = canvasRef.current.getBoundingClientRect();
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleCanvasMouseMove = (e) => {
    if (!isDragging) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setCurrentDesign({ ...currentDesign, x, y });
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  const saveDesignToArea = () => {
    if (!selectedArea || !currentDesign.imageUrl) {
      toast.error('Please select an area and upload an image');
      return;
    }
    
    setDesigns({ ...designs, [selectedArea]: currentDesign });
    toast.success(`Design saved to ${selectedArea}`);
  };

  const handleComplete = () => {
    const printAreasData = Object.entries(designs).map(([area, design]) => ({
      variant_ids: printAreas.find(p => p.position === area)?.variant_ids || [],
      placeholders: [
        {
          position: area,
          images: [
            {
              id: design.imageUrl,
              x: design.x,
              y: design.y,
              scale: design.scale,
              angle: design.rotation
            }
          ]
        }
      ]
    }));
    
    onDesignComplete(printAreasData);
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="areas" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="areas">Print Areas</TabsTrigger>
          <TabsTrigger value="edit">Edit Design</TabsTrigger>
          <TabsTrigger value="ai">AI Tools</TabsTrigger>
        </TabsList>

        {/* Print Areas Selection */}
        <TabsContent value="areas" className="space-y-3">
          <Label>Select Print Area</Label>
          <div className="grid grid-cols-2 gap-2">
            {printAreas?.map((area) => (
              <Card
                key={area.position}
                className={`cursor-pointer transition-all ${
                  selectedArea === area.position
                    ? 'ring-2 ring-emerald-500 bg-emerald-50'
                    : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedArea(area.position)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm capitalize">{area.position}</p>
                      {designs[area.position] && (
                        <p className="text-xs text-emerald-600">✓ Design added</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedArea && (
            <div className="space-y-3 pt-3 border-t">
              <Label>Upload Design for {selectedArea}</Label>
              <label className="flex flex-col items-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploadingImage}
                />
                {uploadingImage ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Upload className="w-6 h-6 text-gray-400" />
                )}
                <span className="text-sm">{uploadingImage ? 'Uploading...' : 'Upload Image'}</span>
              </label>
            </div>
          )}
        </TabsContent>

        {/* Design Editor */}
        <TabsContent value="edit" className="space-y-3">
          {currentDesign.imageUrl ? (
            <>
              <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={400}
                  className="w-full cursor-move touch-none"
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                  onTouchStart={(e) => {
                    const touch = e.touches[0];
                    handleCanvasMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
                  }}
                  onTouchMove={(e) => {
                    const touch = e.touches[0];
                    handleCanvasMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
                  }}
                  onTouchEnd={handleCanvasMouseUp}
                />
              </div>

              <div className="space-y-3">
                <div>
                  <Label>Scale: {currentDesign.scale.toFixed(2)}</Label>
                  <Slider
                    value={[currentDesign.scale]}
                    onValueChange={([v]) => setCurrentDesign({ ...currentDesign, scale: v })}
                    min={0.1}
                    max={3}
                    step={0.1}
                  />
                </div>

                <div>
                  <Label>Rotation: {currentDesign.rotation}°</Label>
                  <Slider
                    value={[currentDesign.rotation]}
                    onValueChange={([v]) => setCurrentDesign({ ...currentDesign, rotation: v })}
                    min={0}
                    max={360}
                    step={1}
                  />
                </div>

                <div>
                  <Label>Brightness: {currentDesign.brightness}%</Label>
                  <Slider
                    value={[currentDesign.brightness]}
                    onValueChange={([v]) => setCurrentDesign({ ...currentDesign, brightness: v })}
                    min={0}
                    max={200}
                    step={1}
                  />
                </div>

                <div>
                  <Label>Contrast: {currentDesign.contrast}%</Label>
                  <Slider
                    value={[currentDesign.contrast]}
                    onValueChange={([v]) => setCurrentDesign({ ...currentDesign, contrast: v })}
                    min={0}
                    max={200}
                    step={1}
                  />
                </div>

                <div>
                  <Label>Saturation: {currentDesign.saturation}%</Label>
                  <Slider
                    value={[currentDesign.saturation]}
                    onValueChange={([v]) => setCurrentDesign({ ...currentDesign, saturation: v })}
                    min={0}
                    max={200}
                    step={1}
                  />
                </div>

                <div>
                  <Label>Blur: {currentDesign.blur}px</Label>
                  <Slider
                    value={[currentDesign.blur]}
                    onValueChange={([v]) => setCurrentDesign({ ...currentDesign, blur: v })}
                    min={0}
                    max={20}
                    step={1}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentDesign({ ...currentDesign, imageUrl: null })}
                    className="flex-1"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                  <Button
                    onClick={saveDesignToArea}
                    className="flex-1 bg-emerald-600"
                  >
                    Save to {selectedArea}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ImageIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Upload an image to start editing</p>
            </div>
          )}
        </TabsContent>

        {/* AI Tools */}
        <TabsContent value="ai" className="space-y-3">
          <div className="space-y-3">
            <Label>AI Image Generator</Label>
            <Textarea
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              placeholder="Describe the image you want to generate..."
              rows={3}
            />
            <Button
              onClick={handleGenerateImage}
              disabled={generatingImage || !imagePrompt}
              className="w-full bg-purple-600"
            >
              {generatingImage ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Image
                </>
              )}
            </Button>
          </div>

          <div className="border-t pt-3">
            <Label>AI Background Remover</Label>
            <Button
              onClick={handleRemoveBackground}
              disabled={removingBg || !currentDesign.imageUrl}
              variant="outline"
              className="w-full mt-2"
            >
              {removingBg ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Remove Background
                </>
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <Button
        onClick={handleComplete}
        disabled={Object.keys(designs).length === 0}
        className="w-full bg-emerald-600"
      >
        Complete Design ({Object.keys(designs).length} areas)
      </Button>
    </div>
  );
}