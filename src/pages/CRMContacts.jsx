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
import { Users, Plus, Search, Phone, Mail, MapPin, Edit2, Trash2, Filter, Calendar, DollarSign, Tag, ChevronDown, ChevronUp, MessageSquare, Package, Upload, Target, Send } from 'lucide-react';
import { toast } from 'sonner';

import AddressAutocomplete from '@/components/ui/AddressAutocomplete';
import CallLogger from '@/components/crm/CallLogger';
import EmailComposer from '@/components/crm/EmailComposer';
import TextMessageDialog from '@/components/crm/TextMessageDialog';
import BulkTextDialog from '@/components/crm/BulkTextDialog';
import TextGroupManager from '@/components/crm/TextGroupManager';
import EmailGroupManager from '@/components/crm/EmailGroupManager';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function CRMContacts() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [editingContact, setEditingContact] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [expandedContacts, setExpandedContacts] = useState({});
  const [editingNotes, setEditingNotes] = useState({});
  const [editingProducts, setEditingProducts] = useState({});
  const [importPreview, setImportPreview] = useState([]);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [importProgress, setImportProgress] = useState({ imported: 0, skipped: 0, total: 0 });
  const [skippedContacts, setSkippedContacts] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [contactStatus, setContactStatus] = useState({});
  const [importComplete, setImportComplete] = useState(false);
  const [duplicates, setDuplicates] = useState([]);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [selectedDuplicates, setSelectedDuplicates] = useState({});
  const [isScanning, setIsScanning] = useState(false);
  const [activeCallContact, setActiveCallContact] = useState(null);
  const [isEmailComposerOpen, setIsEmailComposerOpen] = useState(false);
  const [selectedForEmail, setSelectedForEmail] = useState([]);
  const [isTextDialogOpen, setIsTextDialogOpen] = useState(false);
  const [selectedContactForText, setSelectedContactForText] = useState(null);
  const [isBulkTextOpen, setIsBulkTextOpen] = useState(false);
  const [isTextGroupManagerOpen, setIsTextGroupManagerOpen] = useState(false);
  const [isEmailGroupManagerOpen, setIsEmailGroupManagerOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list()
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => base44.entities.Vendor.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Contact.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact created');
      setIsCreating(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Contact.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact updated');
      setEditingContact(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Contact.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact deleted');
    }
  });

  const updateNotesMutation = useMutation({
    mutationFn: ({ id, notes }) => base44.entities.Contact.update(id, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Notes saved');
    }
  });

  const updateProductsMutation = useMutation({
    mutationFn: ({ id, products }) => base44.entities.Contact.update(id, { vendor_products: products }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Products updated');
    }
  });

  const filteredContacts = contacts.filter(c => {
    const matchesSearch = c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
                         c.email?.toLowerCase().includes(search.toLowerCase()) ||
                         c.phone?.includes(search);
    const matchesType = typeFilter === 'all' || c.type === typeFilter;
    const matchesStage = stageFilter === 'all' || c.stage === stageFilter;
    return matchesSearch && matchesType && matchesStage;
  });

  // Group by first letter
  const groupedContacts = filteredContacts.reduce((acc, contact) => {
    const firstLetter = (contact.full_name?.[0] || '?').toUpperCase();
    if (!acc[firstLetter]) acc[firstLetter] = [];
    acc[firstLetter].push(contact);
    return acc;
  }, {});

  const availableLetters = Object.keys(groupedContacts).sort();

  const toggleExpand = (id) => {
    setExpandedContacts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCall = (phone, contact) => {
    if (phone) {
      setActiveCallContact(contact);
      window.location.href = `tel:${phone}`;
    }
  };

  const handleCallLogSave = async (callLog) => {
    try {
      // Create call note
      await base44.entities.CRMNote.create({
        title: `Call with ${callLog.contactName} - ${callLog.outcome}`,
        content: callLog.notes,
        note_type: 'call',
        related_contact_id: callLog.contactId
      });

      // Update contact stage if changed
      if (callLog.stage) {
        await base44.entities.Contact.update(callLog.contactId, {
          stage: callLog.stage
        });
      }

      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Call logged successfully');
      setActiveCallContact(null);
    } catch (error) {
      console.error('Failed to log call:', error);
      toast.error('Failed to log call');
    }
  };

  const handleText = (contact) => {
    if (contact.phone) {
      window.location.href = `sms:${contact.phone}`;
    }
  };

  const handleEmail = (email) => {
    if (email) window.location.href = `mailto:${email}`;
  };

  const handleBulkEmail = (contacts) => {
    setSelectedForEmail(contacts);
    setIsEmailComposerOpen(true);
  };

  const saveNotes = (id) => {
    const notes = editingNotes[id];
    if (notes !== undefined) {
      updateNotesMutation.mutate({ id, notes });
      setEditingNotes(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    }
  };

  const saveProducts = (id) => {
    const products = editingProducts[id];
    if (products !== undefined) {
      updateProductsMutation.mutate({ id, products });
      setEditingProducts(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    }
  };

  const scanForDuplicates = () => {
    setIsScanning(true);
    const duplicateGroups = [];
    const processedIds = new Set();

    contacts.forEach((contact, index) => {
      if (processedIds.has(contact.id)) return;

      const dupes = contacts.filter((c, idx) => {
        if (idx <= index || processedIds.has(c.id)) return false;
        
        const emailMatch = contact.email && c.email && contact.email === c.email;
        const nameMatch = contact.full_name && c.full_name && contact.full_name === c.full_name;
        
        return emailMatch || nameMatch;
      });

      if (dupes.length > 0) {
        duplicateGroups.push({
          original: contact,
          duplicates: dupes
        });
        processedIds.add(contact.id);
        dupes.forEach(d => processedIds.add(d.id));
      }
    });

    setDuplicates(duplicateGroups);
    setShowDuplicates(true);
    setIsScanning(false);
    
    const totalDupes = duplicateGroups.reduce((sum, g) => sum + g.duplicates.length, 0);
    if (totalDupes === 0) {
      toast.success('No duplicates found!');
    } else {
      toast.info(`Found ${totalDupes} duplicate contact(s) in ${duplicateGroups.length} group(s)`);
    }
  };

  const toggleDuplicateSelection = (groupIndex, dupeIndex) => {
    const key = `${groupIndex}-${dupeIndex}`;
    setSelectedDuplicates(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const selectAllDuplicates = () => {
    const allSelected = {};
    duplicates.forEach((group, gIdx) => {
      group.duplicates.forEach((_, dIdx) => {
        allSelected[`${gIdx}-${dIdx}`] = true;
      });
    });
    setSelectedDuplicates(allSelected);
  };

  const removeDuplicates = async () => {
    const toDelete = [];
    duplicates.forEach((group, gIdx) => {
      group.duplicates.forEach((dupe, dIdx) => {
        if (selectedDuplicates[`${gIdx}-${dIdx}`]) {
          toDelete.push(dupe.id);
        }
      });
    });

    if (toDelete.length === 0) {
      toast.error('No duplicates selected');
      return;
    }

    try {
      toast.loading(`Deleting ${toDelete.length} duplicate(s)...`);
      
      for (const id of toDelete) {
        await base44.entities.Contact.delete(id);
      }
      
      await queryClient.invalidateQueries({ queryKey: ['contacts'] });
      
      toast.dismiss();
      toast.success(`Successfully removed ${toDelete.length} duplicate(s)`);
      
      setShowDuplicates(false);
      setDuplicates([]);
      setSelectedDuplicates({});
    } catch (error) {
      console.error('Delete error:', error);
      toast.dismiss();
      toast.error('Failed to remove duplicates: ' + error.message);
    }
  };

  const stageColors = {
    new: 'bg-gray-500',
    contacted: 'bg-blue-500',
    no_answer: 'bg-slate-500',
    sent_message: 'bg-cyan-500',
    qualified: 'bg-yellow-500',
    negotiation: 'bg-orange-500',
    no_response: 'bg-amber-600',
    not_interested: 'bg-red-400',
    dead: 'bg-gray-700',
    won: 'bg-green-500',
    lost: 'bg-red-500'
  };

  const parseCSV = (csvText) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const contacts = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const contact = {
        first_name: '',
        last_name: '',
        full_name: '',
        email: '',
        phone: '',
        mobile_phone: '',
        home_phone: '',
        company: '',
        role: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        notes: '',
        type: 'customer',
        stage: 'new'
      };
      
      headers.forEach((header, index) => {
        const value = values[index] || '';
        if (!value) return;
        
        if (header.includes('first') && header.includes('name')) contact.first_name = value;
        else if (header.includes('last') && header.includes('name')) contact.last_name = value;
        else if (header.includes('full') && header.includes('name')) contact.full_name = value;
        else if (header === 'name' && !header.includes('company')) contact.full_name = value;
        else if (header.includes('email')) contact.email = value;
        else if (header.includes('mobile') || header.includes('cell')) contact.mobile_phone = value;
        else if (header.includes('home') && header.includes('phone')) contact.home_phone = value;
        else if (header.includes('phone') || header.includes('tel')) {
          if (!contact.phone) contact.phone = value;
        }
        else if (header.includes('company') || header.includes('organization') || header.includes('business')) contact.company = value;
        else if (header.includes('role') || header.includes('title') || header.includes('position') || header.includes('job')) contact.role = value;
        else if (header.includes('street') || (header.includes('address') && !header.includes('email'))) contact.address = value;
        else if (header.includes('city')) contact.city = value;
        else if (header.includes('state') || header.includes('province') || header.includes('region')) contact.state = value;
        else if (header.includes('zip') || header.includes('postal')) contact.zip = value;
        else if (header.includes('note') || header.includes('comment') || header.includes('description')) {
          contact.notes = contact.notes ? `${contact.notes}\n${value}` : value;
        }
      });
      
      // Combine first and last name if full name is not provided
      if (!contact.full_name && (contact.first_name || contact.last_name)) {
        contact.full_name = `${contact.first_name} ${contact.last_name}`.trim();
      }
      
      // Prioritize phone numbers: mobile > home > generic phone
      if (!contact.phone) {
        contact.phone = contact.mobile_phone || contact.home_phone;
      }
      
      // Remove temporary fields
      delete contact.first_name;
      delete contact.last_name;
      delete contact.mobile_phone;
      delete contact.home_phone;
      
      if (contact.full_name || contact.email || contact.phone) {
        contacts.push(contact);
      }
    }
    
    return contacts;
  };

  const parseVCard = (vcardText) => {
    const contacts = [];
    const vcards = vcardText.split('BEGIN:VCARD');
    
    vcards.forEach(vcard => {
      if (!vcard.trim()) return;
      
      const lines = vcard.split('\n');
      const contact = {
        full_name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        type: 'lead',
        stage: 'new'
      };
      
      lines.forEach(line => {
        if (line.startsWith('FN:')) {
          contact.full_name = line.replace('FN:', '').trim();
        } else if (line.includes('EMAIL')) {
          const email = line.split(':')[1];
          if (email) contact.email = email.trim();
        } else if (line.includes('TEL')) {
          const tel = line.split(':')[1];
          if (tel) contact.phone = tel.trim();
        } else if (line.startsWith('ADR')) {
          const parts = line.split(':')[1]?.split(';') || [];
          contact.address = parts[2] || '';
          contact.city = parts[3] || '';
          contact.state = parts[4] || '';
          contact.zip = parts[5] || '';
        }
      });
      
      if (contact.full_name) {
        contacts.push(contact);
      }
    });
    
    return contacts;
  };

  const importFromPhone = async () => {
    // Detect iOS
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    
    if (isIOS) {
      // Show iOS instructions
      toast.info('On iOS: Open Contacts app → Select contact(s) → Share → Export vCard → Then upload here', {
        duration: 6000
      });
    }
    
    // Try Contact Picker API first (Android Chrome/Edge)
    if ('contacts' in navigator && 'ContactsManager' in window) {
      try {
        const props = ['name', 'email', 'tel', 'address'];
        const opts = { multiple: true };
        const contacts = await navigator.contacts.select(props, opts);
        
        if (contacts.length === 0) {
          toast.info('No contacts selected');
          return;
        }

        const parsedContacts = contacts.map(contact => ({
          full_name: contact.name?.[0] || 'Unknown',
          email: contact.email?.[0] || '',
          phone: contact.tel?.[0] || '',
          address: contact.address?.[0]?.addressLine || '',
          city: contact.address?.[0]?.city || '',
          state: contact.address?.[0]?.region || '',
          zip: contact.address?.[0]?.postalCode || '',
          type: 'lead',
          stage: 'new'
        }));

        setImportPreview(parsedContacts);
        setShowImportPreview(true);
        return;
      } catch (error) {
        if (error.name === 'AbortError') return;
        console.error('Contact Picker failed:', error);
      }
    }

    // Fallback to file upload (iOS and other browsers)
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.vcf,.vcard,text/vcard,text/x-vcard';
    input.multiple = false;
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const parsedContacts = parseVCard(text);
        
        if (parsedContacts.length === 0) {
          toast.error('No valid contacts found in file');
          return;
        }
        
        setImportPreview(parsedContacts);
        setShowImportPreview(true);
        toast.success(`Found ${parsedContacts.length} contact(s)`);
      } catch (error) {
        console.error('vCard parse error:', error);
        toast.error('Failed to parse contact file');
      }
    };
    
    input.click();
  };

  const saveImportedContacts = async () => {
    setIsImporting(true);
    setImportComplete(false);
    setImportProgress({ imported: 0, skipped: 0, total: importPreview.length });
    setSkippedContacts([]);
    setContactStatus({});
    
    try {
      const existingContacts = await base44.entities.Contact.list();
      const contactsToCreate = [];
      const skipped = [];
      const statusMap = {};

      // Check for duplicates and mark status
      for (let idx = 0; idx < importPreview.length; idx++) {
        const contact = importPreview[idx];
        const isDuplicate = existingContacts.some(
          (existing) =>
            (contact.email && existing.email === contact.email && contact.email.length > 0) ||
            (contact.full_name && existing.full_name === contact.full_name && contact.full_name.length > 0)
        );

        if (isDuplicate) {
          skipped.push(contact);
          statusMap[idx] = 'skipped';
          setContactStatus(prev => ({ ...prev, [idx]: 'skipped' }));
          setSkippedContacts(prev => [...prev, contact]);
          setImportProgress(prev => ({ ...prev, skipped: prev.skipped + 1 }));
        } else {
          contactsToCreate.push({ ...contact, _originalIndex: idx });
        }
      }

      const BATCH_SIZE = 50;
      let importedCount = 0;

      // Import in batches and update status
      for (let i = 0; i < contactsToCreate.length; i += BATCH_SIZE) {
        const batch = contactsToCreate.slice(i, i + BATCH_SIZE);
        await base44.entities.Contact.bulkCreate(batch.map(c => {
          const { _originalIndex, ...contact } = c;
          return contact;
        }));
        
        // Mark each contact in batch as imported
        batch.forEach(contact => {
          statusMap[contact._originalIndex] = 'imported';
          setContactStatus(prev => ({ ...prev, [contact._originalIndex]: 'imported' }));
        });
        
        importedCount += batch.length;
        setImportProgress(prev => ({ ...prev, imported: importedCount }));
      }

      setImportComplete(true);

      if (importedCount > 0) {
        toast.success(`Successfully imported ${importedCount} new contact(s)`);
      }

      if (skipped.length > 0) {
        toast.info(`Skipped ${skipped.length} duplicate(s)`);
      }

      if (importedCount === 0 && skipped.length === 0) {
        toast.info('No new contacts to import');
      }

      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      
      setTimeout(() => {
        setShowImportPreview(false);
        setImportPreview([]);
        setIsImporting(false);
        setImportComplete(false);
        setImportProgress({ imported: 0, skipped: 0, total: 0 });
        setSkippedContacts([]);
        setContactStatus({});
      }, 3000);

    } catch (error) {
      console.error('Bulk import failed:', error);
      toast.error('Failed to import contacts');
      setIsImporting(false);
      setImportComplete(false);
    }
  };

  const updateImportContactType = (index, type) => {
    setImportPreview(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], type };
      return updated;
    });
  };

  const removeImportContact = (index) => {
    setImportPreview(prev => prev.filter((_, i) => i !== index));
  };

  const importFromCSV = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,text/csv';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const parsedContacts = parseCSV(text);
        
        if (parsedContacts.length === 0) {
          toast.error('No valid contacts found in CSV');
          return;
        }
        
        setImportPreview(parsedContacts);
        setShowImportPreview(true);
        toast.success(`Found ${parsedContacts.length} contact(s)`);
      } catch (error) {
        console.error('CSV parse error:', error);
        toast.error('Failed to parse CSV file');
      }
    };
    
    input.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white pt-24 pb-32 px-4 overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-emerald-900 mb-2 flex items-center gap-3">
              <Users className="w-8 h-8 sm:w-10 sm:h-10" />
              Contacts & Leads
            </h1>
            <p className="text-emerald-600">Manage customer relationships</p>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button 
              onClick={() => handleBulkEmail(filteredContacts.filter(c => c.email))} 
              variant="outline" 
              className="gap-2 flex-1 sm:flex-initial whitespace-nowrap bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200"
              disabled={filteredContacts.filter(c => c.email).length === 0}
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Email All</span>
              <span className="sm:hidden">Email</span>
            </Button>
            <Button 
              onClick={() => setIsBulkTextOpen(true)} 
              variant="outline" 
              className="gap-2 flex-1 sm:flex-initial whitespace-nowrap bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
              disabled={filteredContacts.filter(c => c.phone).length === 0}
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Text All</span>
              <span className="sm:hidden">Text</span>
            </Button>
            <Button 
              onClick={() => setIsTextGroupManagerOpen(true)} 
              variant="outline" 
              className="gap-2 flex-1 sm:flex-initial whitespace-nowrap"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Text Groups</span>
              <span className="sm:hidden">Groups</span>
            </Button>
            <Button 
              onClick={() => setIsEmailGroupManagerOpen(true)} 
              variant="outline" 
              className="gap-2 flex-1 sm:flex-initial whitespace-nowrap bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200"
            >
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">Email Groups</span>
              <span className="sm:hidden">Groups</span>
            </Button>
            <Button 
              onClick={scanForDuplicates} 
              variant="outline" 
              className="gap-2 flex-1 sm:flex-initial whitespace-nowrap"
              disabled={isScanning}
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">{isScanning ? 'Scanning...' : 'Scan Duplicates'}</span>
              <span className="sm:hidden">Scan</span>
            </Button>
            <Button 
              onClick={importFromPhone} 
              variant="outline" 
              className="gap-2 flex-1 sm:flex-initial whitespace-nowrap"
            >
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">Import from Phone</span>
              <span className="sm:hidden">Phone</span>
            </Button>
            <Button 
              onClick={importFromCSV} 
              variant="outline" 
              className="gap-2 flex-1 sm:flex-initial whitespace-nowrap"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Import CSV</span>
              <span className="sm:hidden">CSV</span>
            </Button>
            <Button 
              onClick={() => setIsCreating(true)} 
              className="bg-gradient-to-r from-emerald-500 to-green-500 flex-1 sm:flex-initial whitespace-nowrap"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6 bg-white border-emerald-200">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                <Input
                  placeholder="Search contacts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 border-emerald-200"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="border-emerald-200">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="customer">Customers</SelectItem>
                  <SelectItem value="lead">Leads</SelectItem>
                  <SelectItem value="vendor_contact">Vendor Contacts</SelectItem>
                </SelectContent>
              </Select>
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="border-emerald-200">
                  <SelectValue placeholder="Stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="no_answer">No Answer</SelectItem>
                  <SelectItem value="sent_message">Sent Message</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="negotiation">Negotiation</SelectItem>
                  <SelectItem value="no_response">Haven't Heard Back</SelectItem>
                  <SelectItem value="not_interested">Not Interested</SelectItem>
                  <SelectItem value="dead">Dead Contact</SelectItem>
                  <SelectItem value="won">Won</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-sm text-emerald-600 flex items-center justify-end">
                <Filter className="w-4 h-4 mr-2" />
                {filteredContacts.length} contacts
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact List */}
        <div>
          <div>
            {availableLetters.map(letter => (
              <div key={letter} id={`letter-${letter}`} className="mb-6">
                <div className="sticky top-20 bg-gradient-to-r from-emerald-50 to-white py-2 px-4 rounded-lg mb-3 z-10">
                  <h2 className="text-2xl font-bold text-emerald-900">{letter}</h2>
                </div>
                <div className="space-y-2">
                  {groupedContacts[letter].map(contact => {
                    const isExpanded = expandedContacts[contact.id];
                    return (
                      <Card key={contact.id} className="bg-white border-emerald-200">
                        <CardContent className="p-0">
                          {/* Collapsed View */}
                          <button
                            onClick={() => toggleExpand(contact.id)}
                            className="w-full p-4 flex items-center justify-between hover:bg-emerald-50 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-white font-bold">
                                {contact.full_name?.[0]?.toUpperCase()}
                              </div>
                              <div className="text-left flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-bold text-emerald-900">{contact.full_name}</h3>
                                  <Badge className={`${stageColors[contact.stage]} text-white text-xs`}>
                                    {contact.stage}
                                  </Badge>
                                  <Badge variant="outline" className="border-emerald-300 text-emerald-700 text-xs">
                                    {contact.type}
                                  </Badge>
                                </div>
                                <p className="text-sm text-emerald-600">
                                  {contact.company && `${contact.company} • `}
                                  {contact.phone || contact.email}
                                </p>
                              </div>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-emerald-600" />
                            )}
                          </button>

                          {/* Expanded View */}
                          {isExpanded && (
                            <div className="px-4 pb-4 space-y-4 border-t border-emerald-100">
                              {/* Action Buttons */}
                              <div className="flex gap-2 pt-4 flex-wrap">
                                {contact.phone && (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => handleCall(contact.phone, contact)}
                                      className="bg-gradient-to-r from-blue-500 to-cyan-500 gap-2"
                                    >
                                      <Phone className="w-4 h-4" />
                                      Call
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => handleText(contact)}
                                      className="bg-gradient-to-r from-green-500 to-emerald-500 gap-2"
                                    >
                                      <MessageSquare className="w-4 h-4" />
                                      Text
                                    </Button>
                                  </>
                                )}
                                {contact.email && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleBulkEmail([contact])}
                                    className="bg-gradient-to-r from-purple-500 to-pink-500 gap-2"
                                  >
                                    <Mail className="w-4 h-4" />
                                    Email
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingContact(contact)}
                                  className="gap-2 ml-auto"
                                >
                                  <Edit2 className="w-4 h-4" />
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    if (confirm('Delete this contact?')) {
                                      deleteMutation.mutate(contact.id);
                                    }
                                  }}
                                  className="gap-2 text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </Button>
                              </div>

                              {/* Quick Stage Update & Deals */}
                              <div className="pt-4 border-t border-emerald-100 space-y-4">
                                <div>
                                  <Label className="text-xs font-semibold text-gray-600 mb-2 block">UPDATE DEAL STAGE</Label>
                                  <Select 
                                    value={contact.stage} 
                                    onValueChange={(val) => updateMutation.mutate({ id: contact.id, data: { stage: val } })}
                                  >
                                    <SelectTrigger className="border-emerald-200">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="new">New</SelectItem>
                                      <SelectItem value="contacted">Contacted</SelectItem>
                                      <SelectItem value="no_answer">No Answer</SelectItem>
                                      <SelectItem value="sent_message">Sent Message</SelectItem>
                                      <SelectItem value="qualified">Qualified</SelectItem>
                                      <SelectItem value="negotiation">Negotiation</SelectItem>
                                      <SelectItem value="no_response">Haven't Heard Back</SelectItem>
                                      <SelectItem value="not_interested">Not Interested</SelectItem>
                                      <SelectItem value="dead">Dead Contact</SelectItem>
                                      <SelectItem value="won">Won</SelectItem>
                                      <SelectItem value="lost">Lost</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <ContactDeals contactId={contact.id} contactName={contact.full_name} />
                              </div>

                              {/* Contact Details */}
                              <div className="grid grid-cols-2 gap-4">
                                {contact.email && (
                                  <div>
                                    <p className="text-xs text-gray-600 mb-1">Email</p>
                                    <p className="text-sm font-medium text-emerald-900">{contact.email}</p>
                                  </div>
                                )}
                                {contact.phone && (
                                  <div>
                                    <p className="text-xs text-gray-600 mb-1">Phone</p>
                                    <p className="text-sm font-medium text-emerald-900">{contact.phone}</p>
                                  </div>
                                )}
                                {contact.company && (
                                  <div>
                                    <p className="text-xs text-gray-600 mb-1">Company</p>
                                    <p className="text-sm font-medium text-emerald-900">{contact.company}</p>
                                  </div>
                                )}
                                {contact.role && (
                                  <div>
                                    <p className="text-xs text-gray-600 mb-1">Role</p>
                                    <p className="text-sm font-medium text-emerald-900">{contact.role}</p>
                                  </div>
                                )}
                              </div>

                              {(contact.address || contact.city) && (
                                <div>
                                  <p className="text-xs text-gray-600 mb-1">Address</p>
                                  <p className="text-sm font-medium text-emerald-900">
                                    {contact.address && `${contact.address}, `}
                                    {contact.city && `${contact.city}, `}
                                    {contact.state} {contact.zip}
                                  </p>
                                </div>
                              )}

                              {contact.preferred_strain_type && contact.preferred_strain_type !== 'no_preference' && (
                                <div>
                                  <p className="text-xs text-gray-600 mb-1">Preferred Strain</p>
                                  <Badge className="bg-purple-500 text-white">{contact.preferred_strain_type}</Badge>
                                </div>
                              )}

                              {contact.type === 'customer' && (
                                <div className="pt-3 border-t border-emerald-100 grid grid-cols-3 gap-4">
                                  <div>
                                    <p className="text-xs text-gray-600 mb-1">Total Orders</p>
                                    <p className="text-lg font-bold text-emerald-900">{contact.total_orders || 0}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-600 mb-1">Total Spent</p>
                                    <p className="text-lg font-bold text-green-700">${(contact.total_spent || 0).toFixed(0)}</p>
                                  </div>
                                  {contact.last_order_date && (
                                    <div>
                                      <p className="text-xs text-gray-600 mb-1">Last Order</p>
                                      <p className="text-sm font-medium text-emerald-900">
                                        {new Date(contact.last_order_date).toLocaleDateString()}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Notes Section */}
                              <div className="pt-3 border-t border-emerald-100">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-xs font-semibold text-gray-600 uppercase">Notes</p>
                                  {editingNotes[contact.id] !== undefined && (
                                    <Button size="sm" onClick={() => saveNotes(contact.id)} className="h-7">
                                      Save
                                    </Button>
                                  )}
                                </div>
                                <Textarea
                                  value={editingNotes[contact.id] !== undefined ? editingNotes[contact.id] : contact.notes || ''}
                                  onChange={(e) => setEditingNotes({ ...editingNotes, [contact.id]: e.target.value })}
                                  placeholder="Add notes about this contact..."
                                  className="border-emerald-200 text-sm"
                                  rows={3}
                                />
                              </div>

                              {/* Vendor Products Section */}
                              {contact.type === 'vendor_contact' && (
                                <div className="pt-3 border-t border-emerald-100">
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-semibold text-gray-600 uppercase flex items-center gap-2">
                                      <Package className="w-4 h-4" />
                                      Vendor Products
                                    </p>
                                    {editingProducts[contact.id] !== undefined && (
                                      <Button size="sm" onClick={() => saveProducts(contact.id)} className="h-7">
                                        Save
                                      </Button>
                                    )}
                                  </div>
                                  <Textarea
                                    value={editingProducts[contact.id] !== undefined ? editingProducts[contact.id] : contact.vendor_products || ''}
                                    onChange={(e) => setEditingProducts({ ...editingProducts, [contact.id]: e.target.value })}
                                    placeholder="List products this vendor supplies..."
                                    className="border-emerald-200 text-sm"
                                    rows={3}
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {filteredContacts.length === 0 && (
          <Card className="bg-white border-emerald-200">
            <CardContent className="p-12 text-center">
              <Users className="w-12 h-12 text-emerald-300 mx-auto mb-4" />
              <p className="text-emerald-600">No contacts found</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <ContactDialog
        contact={editingContact}
        isOpen={isCreating || !!editingContact}
        onClose={() => {
          setIsCreating(false);
          setEditingContact(null);
        }}
        onSave={(data) => {
          if (editingContact) {
            updateMutation.mutate({ id: editingContact.id, data });
          } else {
            createMutation.mutate(data);
          }
        }}
      />

      {/* Import Preview Dialog */}
      <Dialog open={showImportPreview} onOpenChange={setShowImportPreview}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Imported Contacts ({importPreview.length})</DialogTitle>
          </DialogHeader>

          {/* Action Buttons at Top */}
          <div className="flex justify-end gap-3 pt-2 pb-4 border-b border-emerald-200">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowImportPreview(false);
                setImportPreview([]);
                setImportProgress({ imported: 0, skipped: 0, total: 0 });
                setSkippedContacts([]);
              }}
              disabled={isImporting}
            >
              Cancel
            </Button>
            <Button 
              onClick={saveImportedContacts}
              disabled={importPreview.length === 0 || isImporting}
              className="bg-gradient-to-r from-emerald-500 to-green-500"
            >
              {isImporting ? 'Importing...' : `Import ${importPreview.length} Contact${importPreview.length !== 1 ? 's' : ''}`}
            </Button>
          </div>

          {/* Live Progress Display */}
          {isImporting && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white border-0">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold">{importProgress.total}</p>
                    <p className="text-xs text-blue-100">Total</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500 to-emerald-500 text-white border-0">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold">{importProgress.imported}</p>
                    <p className="text-xs text-green-100">Imported</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white border-0">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold">{importProgress.skipped}</p>
                    <p className="text-xs text-orange-100">Skipped</p>
                  </CardContent>
                </Card>
              </div>
              
              {importComplete && (
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 rounded-lg text-center animate-pulse">
                  <p className="text-lg font-bold flex items-center justify-center gap-2">
                    ✅ Import Complete! All contacts have been processed.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Skipped Contacts Display */}
          {skippedContacts.length > 0 && (
            <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                Skipped Duplicates ({skippedContacts.length})
              </h4>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {skippedContacts.map((contact, idx) => (
                  <p key={idx} className="text-sm text-orange-700">
                    • {contact.full_name || contact.email || 'Unknown'}
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3 pb-6">
            {/* Bulk Type Selector */}
            <div className="bg-gradient-to-r from-emerald-500 to-green-500 p-4 rounded-lg">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-white">
                  <Tag className="w-5 h-5" />
                  <span className="font-semibold">Change Type for All Contacts:</span>
                </div>
                <Select 
                  onValueChange={(val) => {
                    setImportPreview(prev => prev.map(c => ({ ...c, type: val })));
                  }}
                  disabled={isImporting}
                >
                  <SelectTrigger className="w-56 bg-white border-0">
                    <SelectValue placeholder="Customer (Current)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="vendor_contact">Vendor Contact</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {importPreview.map((contact, index) => (
              <Card key={index} className={`border-emerald-200 ${
                contactStatus[index] === 'imported' ? 'bg-green-50' : 
                contactStatus[index] === 'skipped' ? 'bg-orange-50' : 
                'bg-white'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {contact.full_name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-emerald-900">{contact.full_name}</h3>
                        {contactStatus[index] === 'imported' && (
                          <Badge className="bg-green-600 text-white">✅ Imported</Badge>
                        )}
                        {contactStatus[index] === 'skipped' && (
                          <Badge className="bg-orange-600 text-white">⏭️ Skipped (Duplicate)</Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                        {contact.email && (
                          <div>
                            <span className="text-gray-500">Email:</span>
                            <span className="ml-2 text-emerald-900">{contact.email}</span>
                          </div>
                        )}
                        {contact.phone && (
                          <div>
                            <span className="text-gray-500">Phone:</span>
                            <span className="ml-2 text-emerald-900">{contact.phone}</span>
                          </div>
                        )}
                        {contact.address && (
                          <div className="col-span-2">
                            <span className="text-gray-500">Address:</span>
                            <span className="ml-2 text-emerald-900">
                              {contact.address}, {contact.city} {contact.state} {contact.zip}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Select 
                          value={contact.type} 
                          onValueChange={(val) => updateImportContactType(index, val)}
                        >
                          <SelectTrigger className="w-40 h-8 text-xs border-emerald-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="customer">Customer</SelectItem>
                            <SelectItem value="lead">Lead</SelectItem>
                            <SelectItem value="vendor_contact">Vendor Contact</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeImportContact(index)}
                          className="h-8 text-red-600"
                          disabled={isImporting}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Call Logger */}
      {activeCallContact && (
        <CallLogger
          contactId={activeCallContact.id}
          contactName={activeCallContact.full_name}
          contactType="contact"
          onSave={handleCallLogSave}
        />
      )}

      {/* Email Composer */}
      <EmailComposer
        isOpen={isEmailComposerOpen}
        onClose={() => {
          setIsEmailComposerOpen(false);
          setSelectedForEmail([]);
        }}
        contacts={contacts}
        preSelectedContacts={selectedForEmail}
      />

      {/* Text Message Dialog */}
      <TextMessageDialog
        contact={selectedContactForText}
        isOpen={isTextDialogOpen}
        onClose={() => {
          setIsTextDialogOpen(false);
          setSelectedContactForText(null);
        }}
      />

      {/* Bulk Text Dialog */}
      <BulkTextDialog
        contacts={filteredContacts}
        isOpen={isBulkTextOpen}
        onClose={() => setIsBulkTextOpen(false)}
      />

      {/* Text Group Manager */}
      <TextGroupManager
        isOpen={isTextGroupManagerOpen}
        onClose={() => setIsTextGroupManagerOpen(false)}
        allContacts={contacts}
      />

      {/* Email Group Manager */}
      <EmailGroupManager
        isOpen={isEmailGroupManagerOpen}
        onClose={() => setIsEmailGroupManagerOpen(false)}
        allContacts={contacts}
        allVendors={vendors}
        onSelectGroup={(contacts) => {
          setSelectedForEmail(contacts);
          setIsEmailComposerOpen(true);
        }}
      />

      {/* Duplicates Dialog */}
      <Dialog open={showDuplicates} onOpenChange={setShowDuplicates}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Duplicate Contacts Found</DialogTitle>
          </DialogHeader>

          <div className="flex justify-between items-center gap-3 pt-2 pb-4 border-b border-emerald-200">
            <p className="text-sm text-emerald-600">
              {duplicates.reduce((sum, g) => sum + g.duplicates.length, 0)} duplicate(s) in {duplicates.length} group(s)
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={selectAllDuplicates}
                size="sm"
              >
                Select All
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setSelectedDuplicates({})}
                size="sm"
              >
                Deselect All
              </Button>
              <Button 
                onClick={removeDuplicates}
                disabled={Object.keys(selectedDuplicates).filter(k => selectedDuplicates[k]).length === 0}
                className="bg-gradient-to-r from-red-500 to-orange-500"
                size="sm"
              >
                Remove Selected
              </Button>
            </div>
          </div>

          <div className="space-y-6 pb-6">
            {duplicates.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-emerald-300 mx-auto mb-4" />
                <p className="text-emerald-600">No duplicates found</p>
              </div>
            ) : (
              duplicates.map((group, groupIndex) => (
                <div key={groupIndex} className="border border-emerald-200 rounded-lg p-4 bg-emerald-50">
                  <div className="mb-4">
                    <h4 className="font-semibold text-emerald-900 mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                      Original Contact (Keep)
                    </h4>
                    <Card className="bg-white border-emerald-300">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-white font-bold">
                            {group.original.full_name?.[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-emerald-900 mb-2">{group.original.full_name}</h3>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              {group.original.email && (
                                <div>
                                  <span className="text-gray-500">Email:</span>
                                  <span className="ml-2 text-emerald-900">{group.original.email}</span>
                                </div>
                              )}
                              {group.original.phone && (
                                <div>
                                  <span className="text-gray-500">Phone:</span>
                                  <span className="ml-2 text-emerald-900">{group.original.phone}</span>
                                </div>
                              )}
                              {group.original.company && (
                                <div>
                                  <span className="text-gray-500">Company:</span>
                                  <span className="ml-2 text-emerald-900">{group.original.company}</span>
                                </div>
                              )}
                              <div>
                                <span className="text-gray-500">Type:</span>
                                <Badge className="ml-2 bg-emerald-600 text-white">{group.original.type}</Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      Duplicates ({group.duplicates.length}) - Select to Remove
                    </h4>
                    <div className="space-y-2">
                      {group.duplicates.map((dupe, dupeIndex) => {
                        const isSelected = selectedDuplicates[`${groupIndex}-${dupeIndex}`];
                        return (
                          <Card key={dupeIndex} className={`border-2 transition-all ${isSelected ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white'}`}>
                            <CardContent className="p-4">
                              <div className="flex items-start gap-4">
                                <input
                                  type="checkbox"
                                  checked={isSelected || false}
                                  onChange={() => toggleDuplicateSelection(groupIndex, dupeIndex)}
                                  className="mt-1 w-5 h-5 text-red-600"
                                />
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center text-white font-bold">
                                  {dupe.full_name?.[0]?.toUpperCase()}
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-bold text-gray-900 mb-2">{dupe.full_name}</h3>
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    {dupe.email && (
                                      <div>
                                        <span className="text-gray-500">Email:</span>
                                        <span className="ml-2 text-gray-900">{dupe.email}</span>
                                      </div>
                                    )}
                                    {dupe.phone && (
                                      <div>
                                        <span className="text-gray-500">Phone:</span>
                                        <span className="ml-2 text-gray-900">{dupe.phone}</span>
                                      </div>
                                    )}
                                    {dupe.company && (
                                      <div>
                                        <span className="text-gray-500">Company:</span>
                                        <span className="ml-2 text-gray-900">{dupe.company}</span>
                                      </div>
                                    )}
                                    <div>
                                      <span className="text-gray-500">Type:</span>
                                      <Badge className="ml-2 bg-gray-600 text-white">{dupe.type}</Badge>
                                    </div>
                                    {dupe.address && (
                                      <div className="col-span-2">
                                        <span className="text-gray-500">Address:</span>
                                        <span className="ml-2 text-gray-900">{dupe.address}</span>
                                      </div>
                                    )}
                                    {dupe.notes && (
                                      <div className="col-span-2">
                                        <span className="text-gray-500">Notes:</span>
                                        <span className="ml-2 text-gray-900">{dupe.notes}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ContactDialog({ contact, isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    company: '',
    role: '',
    type: 'lead',
    stage: 'new',
    preferred_strain_type: 'no_preference',
    address: '',
    city: '',
    state: '',
    zip: '',
    birthday: '',
    medical_card_number: '',
    medical_card_expiry: '',
    notes: '',
    source: '',
    tags: [],
    vendor_products: ''
  });

  React.useEffect(() => {
    if (contact) {
      setFormData({ ...contact, tags: contact.tags || [] });
    } else if (!isOpen) {
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        company: '',
        role: '',
        type: 'lead',
        stage: 'new',
        preferred_strain_type: 'no_preference',
        address: '',
        city: '',
        state: '',
        zip: '',
        birthday: '',
        medical_card_number: '',
        medical_card_expiry: '',
        notes: '',
        source: '',
        tags: [],
        vendor_products: ''
      });
    }
  }, [contact, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{contact ? 'Edit Contact' : 'New Contact'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4 pb-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Full Name *</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="border-emerald-200"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="border-emerald-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="border-emerald-200"
              />
            </div>
            <div>
              <Label>Company</Label>
              <Input
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="border-emerald-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Type</Label>
              <Select value={formData.type} onValueChange={(val) => setFormData({ ...formData, type: val })}>
                <SelectTrigger className="border-emerald-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="vendor_contact">Vendor Contact</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Stage</Label>
              <Select value={formData.stage} onValueChange={(val) => setFormData({ ...formData, stage: val })}>
                <SelectTrigger className="border-emerald-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="no_answer">No Answer</SelectItem>
                  <SelectItem value="sent_message">Sent Message</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="negotiation">Negotiation</SelectItem>
                  <SelectItem value="no_response">Haven't Heard Back</SelectItem>
                  <SelectItem value="not_interested">Not Interested</SelectItem>
                  <SelectItem value="dead">Dead Contact</SelectItem>
                  <SelectItem value="won">Won</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Preferred Strain</Label>
              <Select value={formData.preferred_strain_type} onValueChange={(val) => setFormData({ ...formData, preferred_strain_type: val })}>
                <SelectTrigger className="border-emerald-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_preference">No Preference</SelectItem>
                  <SelectItem value="indica">Indica</SelectItem>
                  <SelectItem value="sativa">Sativa</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="cbd">CBD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Address */}
          <div>
            <Label>Address</Label>
            <AddressAutocomplete
              value={formData.address}
              onChange={(val) => setFormData({ ...formData, address: val })}
              className="border-emerald-200"
              onPlaceSelect={(details) => {
                setFormData({
                  ...formData,
                  address: details.address,
                  city: details.city,
                  state: details.state,
                  zip: details.zip
                });
              }}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>City</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="border-emerald-200"
              />
            </div>
            <div>
              <Label>State</Label>
              <Input
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="border-emerald-200"
              />
            </div>
            <div>
              <Label>ZIP</Label>
              <Input
                value={formData.zip}
                onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                className="border-emerald-200"
              />
            </div>
          </div>

          {/* Medical Card Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Medical Card #</Label>
              <Input
                value={formData.medical_card_number}
                onChange={(e) => setFormData({ ...formData, medical_card_number: e.target.value })}
                className="border-emerald-200"
              />
            </div>
            <div>
              <Label>Card Expiry</Label>
              <Input
                type="date"
                value={formData.medical_card_expiry}
                onChange={(e) => setFormData({ ...formData, medical_card_expiry: e.target.value })}
                className="border-emerald-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Birthday</Label>
              <Input
                type="date"
                value={formData.birthday}
                onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                className="border-emerald-200"
              />
            </div>
            <div>
              <Label>Source</Label>
              <Input
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                placeholder="How they found us"
                className="border-emerald-200"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="border-emerald-200 h-24"
            />
          </div>

          {/* Vendor Products */}
          {formData.type === 'vendor_contact' && (
            <div>
              <Label>Vendor Products</Label>
              <Textarea
                value={formData.vendor_products}
                onChange={(e) => setFormData({ ...formData, vendor_products: e.target.value })}
                placeholder="List products this vendor supplies..."
                className="border-emerald-200 h-24"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-emerald-200">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button 
              onClick={() => onSave(formData)}
              className="bg-gradient-to-r from-emerald-500 to-green-500"
            >
              {contact ? 'Update' : 'Create'} Contact
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ContactDeals({ contactId, contactName }) {
  const [showCreateDeal, setShowCreateDeal] = useState(false);
  const [dealTitle, setDealTitle] = useState('');
  const [dealValue, setDealValue] = useState('');
  const queryClient = useQueryClient();

  const { data: deals = [] } = useQuery({
    queryKey: ['contact-deals', contactId],
    queryFn: () => base44.entities.Deal.filter({ contact_id: contactId })
  });

  const createDealMutation = useMutation({
    mutationFn: (data) => base44.entities.Deal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-deals'] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast.success('Deal created');
      setShowCreateDeal(false);
      setDealTitle('');
      setDealValue('');
    }
  });

  const handleQuickCreateDeal = () => {
    if (!dealTitle || !dealValue) {
      toast.error('Please enter deal title and value');
      return;
    }
    createDealMutation.mutate({
      title: dealTitle,
      contact_id: contactId,
      contact_name: contactName,
      value: parseFloat(dealValue),
      stage: 'lead',
      probability: 50,
      last_activity: new Date().toISOString()
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label className="text-xs font-semibold text-gray-600">DEALS</Label>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 text-xs"
          onClick={() => setShowCreateDeal(!showCreateDeal)}
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Deal
        </Button>
      </div>

      {showCreateDeal && (
        <div className="space-y-2 mb-3 p-3 bg-indigo-50 rounded-lg">
          <Input
            placeholder="Deal title"
            value={dealTitle}
            onChange={(e) => setDealTitle(e.target.value)}
            className="h-8 text-sm"
          />
          <Input
            type="number"
            placeholder="Deal value ($)"
            value={dealValue}
            onChange={(e) => setDealValue(e.target.value)}
            className="h-8 text-sm"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleQuickCreateDeal} className="flex-1 bg-indigo-600 h-7">
              Create
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowCreateDeal(false)} className="h-7">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {deals.length > 0 ? (
        <div className="space-y-2">
          {deals.map(deal => (
            <Link key={deal.id} to={createPageUrl('CRMDeals')}>
              <div className="p-2 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-indigo-900">{deal.title}</p>
                    <p className="text-xs text-indigo-600">{deal.stage}</p>
                  </div>
                  <p className="text-sm font-bold text-green-700">${(deal.value || 0).toLocaleString()}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-500 text-center py-2">No deals yet</p>
      )}
    </div>
  );
}