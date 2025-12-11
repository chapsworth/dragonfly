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
import { FileText, Plus, Search, Download, Edit2, Trash2, Filter, Upload, Calendar, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import BiometricGuard from '@/components/auth/BiometricGuard';

export default function CRMDocuments() {
  return (
    <BiometricGuard>
      <CRMDocumentsContent />
    </BiometricGuard>
  );
}

function CRMDocumentsContent() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [editingDocument, setEditingDocument] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const queryClient = useQueryClient();

  const { data: documents = [] } = useQuery({
    queryKey: ['crm-documents'],
    queryFn: () => base44.entities.CRMDocument.list()
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list()
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => base44.entities.Vendor.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CRMDocument.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-documents'] });
      toast.success('Document created');
      setIsCreating(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CRMDocument.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-documents'] });
      toast.success('Document updated');
      setEditingDocument(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CRMDocument.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-documents'] });
      toast.success('Document deleted');
    }
  });

  const filteredDocuments = documents.filter(d => {
    const matchesSearch = d.title?.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || d.document_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const typeColors = {
    license: 'bg-green-500',
    contract: 'bg-blue-500',
    invoice: 'bg-purple-500',
    medical_card: 'bg-red-500',
    compliance: 'bg-orange-500',
    report: 'bg-cyan-500',
    other: 'bg-gray-500'
  };

  const isExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  };

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white pt-24 pb-32 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-indigo-900 mb-2 flex items-center gap-3">
              <FileText className="w-10 h-10" />
              Documents
            </h1>
            <p className="text-indigo-600">Store and manage important files</p>
          </div>
          <Button onClick={() => setIsCreating(true)} className="bg-gradient-to-r from-indigo-500 to-purple-500">
            <Plus className="w-4 h-4 mr-2" />
            Add Document
          </Button>
        </div>

        <Card className="mb-6 bg-white border-indigo-200">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
                <Input
                  placeholder="Search documents..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 border-indigo-200"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="border-indigo-200">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="license">License</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="invoice">Invoice</SelectItem>
                  <SelectItem value="medical_card">Medical Card</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="report">Report</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-sm text-indigo-600 flex items-center justify-end">
                <Filter className="w-4 h-4 mr-2" />
                {filteredDocuments.length} documents
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map(doc => (
            <Card key={doc.id} className="bg-white border-indigo-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-indigo-900 text-lg mb-1">{doc.title}</h3>
                    {doc.notes && (
                      <p className="text-sm text-gray-600 mb-3">{doc.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setEditingDocument(doc)}>
                      <Edit2 className="w-4 h-4 text-indigo-600" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost"
                      onClick={() => {
                        if (confirm('Delete this document?')) {
                          deleteMutation.mutate(doc.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <Badge className={`${typeColors[doc.document_type]} text-white`}>
                    {doc.document_type.replace('_', ' ')}
                  </Badge>
                  
                  {doc.expiry_date && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span className={
                        isExpired(doc.expiry_date) ? 'text-red-600 font-bold' :
                        isExpiringSoon(doc.expiry_date) ? 'text-orange-600 font-bold' :
                        'text-gray-600'
                      }>
                        {isExpired(doc.expiry_date) ? 'Expired: ' : 'Expires: '}
                        {new Date(doc.expiry_date).toLocaleDateString()}
                      </span>
                      {(isExpired(doc.expiry_date) || isExpiringSoon(doc.expiry_date)) && (
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                      )}
                    </div>
                  )}

                  {doc.file_size && (
                    <p className="text-sm text-gray-600">
                      Size: {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  )}

                  {doc.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {doc.tags.map((tag, i) => (
                        <Badge key={i} variant="outline" className="border-indigo-300 text-indigo-700 text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <a 
                  href={doc.file_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredDocuments.length === 0 && (
          <Card className="bg-white border-indigo-200">
            <CardContent className="p-12 text-center">
              <FileText className="w-12 h-12 text-indigo-300 mx-auto mb-4" />
              <p className="text-indigo-600">No documents found</p>
            </CardContent>
          </Card>
        )}
      </div>

      <DocumentDialog
        document={editingDocument}
        isOpen={isCreating || !!editingDocument}
        onClose={() => {
          setIsCreating(false);
          setEditingDocument(null);
        }}
        onSave={(data) => {
          if (editingDocument) {
            updateMutation.mutate({ id: editingDocument.id, data });
          } else {
            createMutation.mutate(data);
          }
        }}
        contacts={contacts}
        vendors={vendors}
      />
    </div>
  );
}

function DocumentDialog({ document, isOpen, onClose, onSave, contacts, vendors }) {
  const [formData, setFormData] = useState({
    title: '',
    file_url: '',
    document_type: 'other',
    related_contact_id: '',
    related_vendor_id: '',
    expiry_date: '',
    file_size: 0,
    file_type: '',
    tags: [],
    notes: ''
  });
  const [uploading, setUploading] = useState(false);

  React.useEffect(() => {
    if (document) {
      setFormData({ ...document, tags: document.tags || [] });
    } else if (!isOpen) {
      setFormData({
        title: '',
        file_url: '',
        document_type: 'other',
        related_contact_id: '',
        related_vendor_id: '',
        expiry_date: '',
        file_size: 0,
        file_type: '',
        tags: [],
        notes: ''
      });
    }
  }, [document, isOpen]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { data } = await base44.integrations.Core.UploadFile({ file });
      setFormData({
        ...formData,
        file_url: data.file_url,
        file_size: file.size,
        file_type: file.type,
        title: formData.title || file.name
      });
      toast.success('File uploaded');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{document ? 'Edit Document' : 'New Document'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div>
            <Label>Upload File</Label>
            <div className="flex gap-2">
              <Input
                type="file"
                onChange={handleFileUpload}
                disabled={uploading}
                className="border-indigo-200"
              />
              {uploading && <span className="text-sm text-indigo-600">Uploading...</span>}
            </div>
          </div>

          <div>
            <Label>Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="border-indigo-200"
            />
          </div>

          <div>
            <Label>File URL *</Label>
            <Input
              value={formData.file_url}
              onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
              placeholder="https://"
              className="border-indigo-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Document Type</Label>
              <Select value={formData.document_type} onValueChange={(val) => setFormData({ ...formData, document_type: val })}>
                <SelectTrigger className="border-indigo-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="license">License</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="invoice">Invoice</SelectItem>
                  <SelectItem value="medical_card">Medical Card</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="report">Report</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Expiry Date</Label>
              <Input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                className="border-indigo-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Related Contact</Label>
              <Select value={formData.related_contact_id} onValueChange={(val) => setFormData({ ...formData, related_contact_id: val })}>
                <SelectTrigger className="border-indigo-200">
                  <SelectValue placeholder="Select contact" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>None</SelectItem>
                  {contacts.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Related Vendor</Label>
              <Select value={formData.related_vendor_id} onValueChange={(val) => setFormData({ ...formData, related_vendor_id: val })}>
                <SelectTrigger className="border-indigo-200">
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>None</SelectItem>
                  {vendors.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.company_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="border-indigo-200 h-24"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-indigo-200">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button 
              onClick={() => onSave(formData)}
              className="bg-gradient-to-r from-indigo-500 to-purple-500"
            >
              {document ? 'Update' : 'Create'} Document
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}