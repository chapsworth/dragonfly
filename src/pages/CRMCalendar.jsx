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
import { Calendar as CalendarIcon, Plus, Edit2, Trash2, Clock, MapPin, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import BiometricGuard from '@/components/auth/BiometricGuard';

export default function CRMCalendar() {
  return (
    <BiometricGuard>
      <CRMCalendarContent />
    </BiometricGuard>
  );
}

function CRMCalendarContent() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();

  const { data: events = [] } = useQuery({
    queryKey: ['calendar-events'],
    queryFn: () => base44.entities.CalendarEvent.list()
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
    mutationFn: (data) => base44.entities.CalendarEvent.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      toast.success('Event created');
      setIsCreating(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CalendarEvent.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      toast.success('Event updated');
      setEditingEvent(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CalendarEvent.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      toast.success('Event deleted');
    }
  });

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getEventsForDate = (date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_date);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);
  
  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white pt-24 pb-32 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-purple-900 mb-2 flex items-center gap-3">
              <CalendarIcon className="w-10 h-10" />
              Calendar
            </h1>
            <p className="text-purple-600">Schedule and track your events</p>
          </div>
          <Button onClick={() => setIsCreating(true)} className="bg-gradient-to-r from-purple-500 to-pink-500">
            <Plus className="w-4 h-4 mr-2" />
            Add Event
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="bg-white border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <Button variant="ghost" size="icon" onClick={previousMonth}>
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <h2 className="text-2xl font-bold text-purple-900">
                    {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h2>
                  <Button variant="ghost" size="icon" onClick={nextMonth}>
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>

                <div className="grid grid-cols-7 gap-2 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center font-bold text-purple-600 text-sm py-2">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const date = new Date(year, month, day);
                    const dayEvents = getEventsForDate(date);
                    const isToday = date.toDateString() === new Date().toDateString();
                    const isSelected = selectedDate?.toDateString() === date.toDateString();
                    
                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDate(date)}
                        className={`aspect-square p-2 rounded-lg border-2 transition-all hover:shadow-md ${
                          isToday ? 'border-purple-500 bg-purple-50' :
                          isSelected ? 'border-purple-400 bg-purple-100' :
                          'border-purple-100 hover:border-purple-300'
                        }`}
                      >
                        <div className="text-sm font-semibold text-purple-900">{day}</div>
                        {dayEvents.length > 0 && (
                          <div className="mt-1 space-y-1">
                            {dayEvents.slice(0, 2).map((event, idx) => (
                              <div 
                                key={idx}
                                className="text-xs px-1 py-0.5 rounded truncate"
                                style={{ backgroundColor: event.color || '#10b981', color: 'white' }}
                              >
                                {event.title}
                              </div>
                            ))}
                            {dayEvents.length > 2 && (
                              <div className="text-xs text-purple-600 font-semibold">
                                +{dayEvents.length - 2} more
                              </div>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="bg-white border-purple-200">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-purple-900 mb-4">
                  {selectedDate ? selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Select a date'}
                </h3>
                
                {selectedDateEvents.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No events</p>
                ) : (
                  <div className="space-y-3">
                    {selectedDateEvents.map(event => (
                      <div 
                        key={event.id}
                        className="p-4 border-l-4 rounded-lg bg-gray-50"
                        style={{ borderLeftColor: event.color || '#10b981' }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-bold text-gray-900">{event.title}</h4>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingEvent(event)}>
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => {
                                if (confirm('Delete this event?')) {
                                  deleteMutation.mutate(event.id);
                                }
                              }}
                            >
                              <Trash2 className="w-3 h-3 text-red-600" />
                            </Button>
                          </div>
                        </div>
                        {event.description && (
                          <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                        )}
                        <div className="space-y-1 text-xs text-gray-600">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            {new Date(event.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {event.end_date && ` - ${new Date(event.end_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3 h-3" />
                              {event.location}
                            </div>
                          )}
                          {event.attendees?.length > 0 && (
                            <div className="flex items-center gap-2">
                              <Users className="w-3 h-3" />
                              {event.attendees.length} attendees
                            </div>
                          )}
                          <Badge className="mt-2" variant="outline">
                            {event.event_type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <EventDialog
        event={editingEvent}
        isOpen={isCreating || !!editingEvent}
        onClose={() => {
          setIsCreating(false);
          setEditingEvent(null);
        }}
        onSave={(data) => {
          if (editingEvent) {
            updateMutation.mutate({ id: editingEvent.id, data });
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

function EventDialog({ event, isOpen, onClose, onSave, contacts, vendors }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    event_type: 'meeting',
    location: '',
    attendees: [],
    related_contact_id: '',
    related_vendor_id: '',
    reminder_minutes: 30,
    status: 'scheduled',
    color: '#10b981'
  });

  React.useEffect(() => {
    if (event) {
      setFormData({ ...event, attendees: event.attendees || [] });
    } else if (!isOpen) {
      setFormData({
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        event_type: 'meeting',
        location: '',
        attendees: [],
        related_contact_id: '',
        related_vendor_id: '',
        reminder_minutes: 30,
        status: 'scheduled',
        color: '#10b981'
      });
    }
  }, [event, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{event ? 'Edit Event' : 'New Event'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div>
            <Label>Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="border-purple-200"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="border-purple-200 h-24"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date & Time *</Label>
              <Input
                type="datetime-local"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="border-purple-200"
              />
            </div>
            <div>
              <Label>End Date & Time</Label>
              <Input
                type="datetime-local"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="border-purple-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Event Type</Label>
              <Select value={formData.event_type} onValueChange={(val) => setFormData({ ...formData, event_type: val })}>
                <SelectTrigger className="border-purple-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
                <SelectTrigger className="border-purple-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Location</Label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="border-purple-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Related Contact</Label>
              <Select value={formData.related_contact_id} onValueChange={(val) => setFormData({ ...formData, related_contact_id: val })}>
                <SelectTrigger className="border-purple-200">
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
                <SelectTrigger className="border-purple-200">
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Reminder (minutes before)</Label>
              <Input
                type="number"
                value={formData.reminder_minutes}
                onChange={(e) => setFormData({ ...formData, reminder_minutes: parseInt(e.target.value) || 0 })}
                className="border-purple-200"
              />
            </div>
            <div>
              <Label>Color</Label>
              <Input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="border-purple-200 h-10"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-purple-200">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button 
              onClick={() => onSave(formData)}
              className="bg-gradient-to-r from-purple-500 to-pink-500"
            >
              {event ? 'Update' : 'Create'} Event
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}