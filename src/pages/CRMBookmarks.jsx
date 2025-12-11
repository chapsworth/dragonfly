import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Bookmark, Plus, Search, ExternalLink, Edit2, Trash2, Filter, Star, Globe } from 'lucide-react';
import { toast } from 'sonner';
import BiometricGuard from '@/components/auth/BiometricGuard';

export default function CRMBookmarks() {
  return (
    <BiometricGuard>
      <CRMBookmarksContent />
    </BiometricGuard>
  );
}

function CRMBookmarksContent() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [favoriteFilter, setFavoriteFilter] = useState('all');
  const [editingBookmark, setEditingBookmark] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();

  const { data: bookmarks = [] } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: () => base44.entities.Bookmark.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Bookmark.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      toast.success('Bookmark created');
      setIsCreating(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Bookmark.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      toast.success('Bookmark updated');
      setEditingBookmark(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Bookmark.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      toast.success('Bookmark deleted');
    }
  });

  const toggleFavorite = (bookmark) => {
    updateMutation.mutate({
      id: bookmark.id,
      data: { ...bookmark, favorite: !bookmark.favorite }
    });
  };

  const filteredBookmarks = bookmarks.filter(b => {
    const matchesSearch = b.title?.toLowerCase().includes(search.toLowerCase()) ||
                         b.url?.toLowerCase().includes(search.toLowerCase()) ||
                         b.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || b.category === categoryFilter;
    const matchesFavorite = favoriteFilter === 'all' || 
                           (favoriteFilter === 'favorites' && b.favorite);
    return matchesSearch && matchesCategory && matchesFavorite;
  });

  const categoryColors = {
    compliance: 'bg-red-500',
    industry_news: 'bg-blue-500',
    vendors: 'bg-green-500',
    tools: 'bg-purple-500',
    marketing: 'bg-orange-500',
    other: 'bg-gray-500'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white pt-24 pb-32 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-pink-900 mb-2 flex items-center gap-3">
              <Bookmark className="w-10 h-10" />
              Bookmarks
            </h1>
            <p className="text-pink-600">Quick access to important resources</p>
          </div>
          <Button onClick={() => setIsCreating(true)} className="bg-gradient-to-r from-pink-500 to-rose-500">
            <Plus className="w-4 h-4 mr-2" />
            Add Bookmark
          </Button>
        </div>

        <Card className="mb-6 bg-white border-pink-200">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-400" />
                <Input
                  placeholder="Search bookmarks..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 border-pink-200"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="border-pink-200">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="industry_news">Industry News</SelectItem>
                  <SelectItem value="vendors">Vendors</SelectItem>
                  <SelectItem value="tools">Tools</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Select value={favoriteFilter} onValueChange={setFavoriteFilter}>
                <SelectTrigger className="border-pink-200">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Bookmarks</SelectItem>
                  <SelectItem value="favorites">Favorites Only</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-sm text-pink-600 flex items-center justify-end">
                <Filter className="w-4 h-4 mr-2" />
                {filteredBookmarks.length} bookmarks
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBookmarks.map(bookmark => (
            <Card key={bookmark.id} className="bg-white border-pink-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {bookmark.icon_url ? (
                        <img src={bookmark.icon_url} alt="" className="w-5 h-5 rounded" />
                      ) : (
                        <Globe className="w-5 h-5 text-pink-500" />
                      )}
                      <h3 className="font-bold text-pink-900 text-lg">{bookmark.title}</h3>
                    </div>
                    {bookmark.description && (
                      <p className="text-sm text-gray-600 mb-3">{bookmark.description}</p>
                    )}
                    <a 
                      href={bookmark.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-pink-600 hover:text-pink-700 flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Visit site
                    </a>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button 
                      size="icon" 
                      variant="ghost"
                      onClick={() => toggleFavorite(bookmark)}
                    >
                      <Star className={`w-4 h-4 ${bookmark.favorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditingBookmark(bookmark)}>
                      <Edit2 className="w-4 h-4 text-pink-600" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost"
                      onClick={() => {
                        if (confirm('Delete this bookmark?')) {
                          deleteMutation.mutate(bookmark.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge className={`${categoryColors[bookmark.category]} text-white text-xs`}>
                    {bookmark.category.replace('_', ' ')}
                  </Badge>
                  {bookmark.tags?.map((tag, i) => (
                    <Badge key={i} variant="outline" className="border-pink-300 text-pink-700 text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredBookmarks.length === 0 && (
          <Card className="bg-white border-pink-200">
            <CardContent className="p-12 text-center">
              <Bookmark className="w-12 h-12 text-pink-300 mx-auto mb-4" />
              <p className="text-pink-600">No bookmarks found</p>
            </CardContent>
          </Card>
        )}
      </div>

      <BookmarkDialog
        bookmark={editingBookmark}
        isOpen={isCreating || !!editingBookmark}
        onClose={() => {
          setIsCreating(false);
          setEditingBookmark(null);
        }}
        onSave={(data) => {
          if (editingBookmark) {
            updateMutation.mutate({ id: editingBookmark.id, data });
          } else {
            createMutation.mutate(data);
          }
        }}
      />
    </div>
  );
}

function BookmarkDialog({ bookmark, isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    description: '',
    category: 'other',
    tags: [],
    favorite: false,
    icon_url: ''
  });

  React.useEffect(() => {
    if (bookmark) {
      setFormData({ ...bookmark, tags: bookmark.tags || [] });
    } else if (!isOpen) {
      setFormData({
        title: '',
        url: '',
        description: '',
        category: 'other',
        tags: [],
        favorite: false,
        icon_url: ''
      });
    }
  }, [bookmark, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{bookmark ? 'Edit Bookmark' : 'New Bookmark'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div>
            <Label>Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="border-pink-200"
            />
          </div>

          <div>
            <Label>URL *</Label>
            <Input
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://"
              className="border-pink-200"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="border-pink-200 h-24"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                <SelectTrigger className="border-pink-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="industry_news">Industry News</SelectItem>
                  <SelectItem value="vendors">Vendors</SelectItem>
                  <SelectItem value="tools">Tools</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Icon URL</Label>
              <Input
                value={formData.icon_url}
                onChange={(e) => setFormData({ ...formData, icon_url: e.target.value })}
                placeholder="https://"
                className="border-pink-200"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="favorite"
              checked={formData.favorite}
              onChange={(e) => setFormData({ ...formData, favorite: e.target.checked })}
              className="w-4 h-4 text-pink-600 border-pink-300 rounded"
            />
            <Label htmlFor="favorite" className="cursor-pointer">Add to favorites</Label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-pink-200">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button 
              onClick={() => onSave(formData)}
              className="bg-gradient-to-r from-pink-500 to-rose-500"
            >
              {bookmark ? 'Update' : 'Create'} Bookmark
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}