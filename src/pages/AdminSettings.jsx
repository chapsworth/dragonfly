import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Save, Leaf, Image as ImageIcon } from 'lucide-react';
import AdminNav from '@/components/admin/AdminNav';
import { motion } from 'framer-motion';

export default function AdminSettings() {
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: appSettings, isLoading } = useQuery({
    queryKey: ['appSettings'],
    queryFn: async () => {
      const settings = await base44.entities.AppSettings.list();
      return settings[0] || null;
    }
  });

  const [formData, setFormData] = useState({
    site_name: '',
    header_icon_url: ''
  });

  React.useEffect(() => {
    if (appSettings) {
      setFormData({
        site_name: appSettings.site_name || 'Dragonfly',
        header_icon_url: appSettings.header_icon_url || ''
      });
    }
  }, [appSettings]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (appSettings?.id) {
        return base44.entities.AppSettings.update(appSettings.id, data);
      } else {
        return base44.entities.AppSettings.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appSettings'] });
      alert('Settings saved successfully!');
    }
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, header_icon_url: file_url });
    } catch (error) {
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 pt-28 px-4">
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 pt-28 px-4 pb-12">
      <div className="max-w-7xl mx-auto">
        <AdminNav />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8"
        >
          <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-8">
            <h2 className="text-2xl font-bold text-emerald-900 mb-6">App Settings</h2>

            <div className="space-y-6">
              {/* Site Name */}
              <div>
                <Label htmlFor="site_name" className="text-emerald-800 mb-2">Site Name</Label>
                <Input
                  id="site_name"
                  value={formData.site_name}
                  onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
                  placeholder="Dragonfly"
                  className="border-emerald-200 focus:border-emerald-400"
                />
              </div>

              {/* Header Icon Upload */}
              <div>
                <Label className="text-emerald-800 mb-2">Header Icon / Logo</Label>
                <div className="flex items-start gap-4">
                  {/* Preview */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg flex-shrink-0">
                    {formData.header_icon_url ? (
                      <img 
                        src={formData.header_icon_url} 
                        alt="Header Icon Preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Leaf className="w-10 h-10 text-white" />
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1 space-y-3">
                    <Input
                      value={formData.header_icon_url}
                      onChange={(e) => setFormData({ ...formData, header_icon_url: e.target.value })}
                      placeholder="Image URL or upload below"
                      className="border-emerald-200 focus:border-emerald-400"
                    />
                    
                    <div className="flex gap-2">
                      <label className="flex-1">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          disabled={uploading}
                          asChild
                        >
                          <span>
                            {uploading ? (
                              <>
                                <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mr-2" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                Upload Image
                              </>
                            )}
                          </span>
                        </Button>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                          disabled={uploading}
                        />
                      </label>

                      {formData.header_icon_url && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setFormData({ ...formData, header_icon_url: '' })}
                          className="border-red-200 text-red-700 hover:bg-red-50"
                        >
                          Reset to Default
                        </Button>
                      )}
                    </div>

                    <p className="text-xs text-emerald-600">
                      Recommended: Square image, 512x512px or larger. Will be displayed as 40x40px with rounded corners.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-8 pt-6 border-t border-emerald-100">
              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white px-8"
              >
                {saveMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}