import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Link2, Trash2, Download, Copy, Check, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function MediaLibrary() {
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [copiedUrl, setCopiedUrl] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: images = [], isLoading } = useQuery({
    queryKey: ['media-library'],
    queryFn: async () => {
      const all = await base44.entities.VendorProduct.list();
      // Extract unique image URLs
      const imageUrls = new Set();
      all.forEach(product => {
        if (product.image_url) {
          imageUrls.add(product.image_url);
        }
      });
      return Array.from(imageUrls).map(url => ({ url, id: url }));
    }
  });

  const handleScrapeImages = async () => {
    if (!scrapeUrl) {
      toast.error('Please enter a URL');
      return;
    }

    setIsScraping(true);
    try {
      const response = await base44.functions.invoke('scrapeImages', { url: scrapeUrl });
      
      if (response.data.success) {
        queryClient.invalidateQueries({ queryKey: ['media-library'] });
        toast.success(`Scraped ${response.data.images.length} images`);
        setScrapeUrl('');
      } else {
        toast.error('Failed to scrape images');
      }
    } catch (error) {
      toast.error('Error: ' + error.message);
    } finally {
      setIsScraping(false);
    }
  };

  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    toast.success('URL copied!');
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const downloadImage = (url) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = url.split('/').pop();
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Download started');
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-gray-600">This page is only accessible to administrators.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Media Library</h1>
          <p className="text-gray-600">Manage and scrape images for your products</p>
        </div>

        {/* Scraper Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5" />
              Image Scraper
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="Enter URL to scrape images from..."
                value={scrapeUrl}
                onChange={(e) => setScrapeUrl(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handleScrapeImages} 
                disabled={isScraping}
                className="bg-blue-600"
              >
                {isScraping ? 'Scraping...' : 'Scrape Images'}
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Enter a URL and we'll extract all images from that page
            </p>
          </CardContent>
        </Card>

        {/* Image Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto" />
          </div>
        ) : images.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ImageIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600">No images found. Scrape a URL or add products with images.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {images.map((image) => (
              <Card key={image.id} className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow">
                <div 
                  className="relative aspect-square bg-gray-100"
                  onClick={() => setSelectedImage(image)}
                >
                  <img 
                    src={image.url} 
                    alt="Media" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3EError%3C/text%3E%3C/svg%3E';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(image.url);
                      }}
                      className="h-8 w-8"
                    >
                      {copiedUrl === image.url ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadImage(image.url);
                      }}
                      className="h-8 w-8"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Image Preview Modal */}
        <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Image Preview</DialogTitle>
            </DialogHeader>
            {selectedImage && (
              <div className="space-y-4">
                <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                  <img 
                    src={selectedImage.url} 
                    alt="Preview" 
                    className="w-full max-h-[60vh] object-contain"
                  />
                </div>
                <div className="flex gap-2">
                  <Input value={selectedImage.url} readOnly className="flex-1" />
                  <Button onClick={() => copyToClipboard(selectedImage.url)}>
                    {copiedUrl === selectedImage.url ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    Copy URL
                  </Button>
                  <Button onClick={() => downloadImage(selectedImage.url)} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}