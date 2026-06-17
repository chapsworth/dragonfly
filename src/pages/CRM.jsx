import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Building2, Calendar, CheckSquare, Bookmark, FileText, TrendingUp, DollarSign, Phone, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
export default function CRM() {
  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list(),
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => base44.entities.Vendor.list(),
    staleTime: 60000,
    refetchOnWindowFocus: false
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['crm-tasks'],
    queryFn: () => base44.entities.CRMTask.list(),
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  const { data: events = [] } = useQuery({
    queryKey: ['calendar-events'],
    queryFn: () => base44.entities.CalendarEvent.list(),
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  const customers = contacts.filter(c => c.type === 'customer');
  const leads = contacts.filter(c => c.type === 'lead');
  const totalRevenue = customers.reduce((sum, c) => sum + (c.total_spent || 0), 0);
  const pendingTasks = tasks.filter(t => t.status === 'todo' || t.status === 'in_progress');
  const upcomingEvents = events.filter(e => new Date(e.start_date) > new Date()).slice(0, 5);

  const { data: deals = [] } = useQuery({
    queryKey: ['deals'],
    queryFn: () => base44.entities.Deal.list(),
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  const quickLinks = [
    { name: 'Contacts', icon: Users, page: 'CRMContacts', count: contacts.length, color: 'emerald' },
    { name: 'Deals', icon: TrendingUp, page: 'CRMDeals', count: deals.length, color: 'indigo' },
    { name: 'Vendors', icon: Building2, page: 'CRMVendors', count: vendors.length, color: 'blue' },
    { name: 'Calendar', icon: Calendar, page: 'CRMCalendar', count: upcomingEvents.length, color: 'purple' },
    { name: 'Tasks', icon: CheckSquare, page: 'CRMTasks', count: pendingTasks.length, color: 'orange' },
    { name: 'Bookmarks', icon: Bookmark, page: 'CRMBookmarks', count: 0, color: 'pink' },
  ];

  const pipelineStages = [
    { stage: 'new', label: 'New Leads', color: 'gray' },
    { stage: 'contacted', label: 'Contacted', color: 'blue' },
    { stage: 'qualified', label: 'Qualified', color: 'yellow' },
    { stage: 'negotiation', label: 'Negotiation', color: 'orange' },
    { stage: 'won', label: 'Won', color: 'green' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 pt-24 pb-32 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-emerald-900 mb-2">CRM Dashboard</h1>
          <p className="text-emerald-600">Manage your cannabis delivery business relationships</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border-emerald-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-600 mb-1">Total Customers</p>
                  <p className="text-3xl font-bold text-emerald-900">{customers.length}</p>
                </div>
                <Users className="w-10 h-10 text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 mb-1">Active Leads</p>
                  <p className="text-3xl font-bold text-blue-900">{leads.length}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 mb-1">Total Revenue</p>
                  <p className="text-3xl font-bold text-green-900">${totalRevenue.toFixed(0)}</p>
                </div>
                <DollarSign className="w-10 h-10 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 mb-1">Pending Tasks</p>
                  <p className="text-3xl font-bold text-orange-900">{pendingTasks.length}</p>
                </div>
                <CheckSquare className="w-10 h-10 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {quickLinks.map(link => {
            const Icon = link.icon;
            return (
              <Link key={link.page} to={createPageUrl(link.page)}>
                <Card className={`bg-white border-${link.color}-200 hover:shadow-lg transition-all cursor-pointer`}>
                  <CardContent className="p-6 text-center">
                    <Icon className={`w-8 h-8 text-${link.color}-500 mx-auto mb-3`} />
                    <h3 className="font-bold text-gray-900 mb-1">{link.name}</h3>
                    <p className={`text-2xl font-bold text-${link.color}-600`}>{link.count}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Pipeline */}
        <Card className="bg-white border-emerald-200 mb-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-emerald-900 mb-4">Sales Pipeline</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {pipelineStages.map(({ stage, label, color }) => {
                const stageCount = leads.filter(l => l.stage === stage).length;
                return (
                  <div key={stage} className={`p-4 bg-${color}-50 border-2 border-${color}-200 rounded-lg`}>
                    <p className="text-sm text-gray-600 mb-1">{label}</p>
                    <p className={`text-3xl font-bold text-${color}-700`}>{stageCount}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Contacts */}
          <Card className="bg-white border-emerald-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-emerald-900">Recent Contacts</h2>
                <Link to={createPageUrl('CRMContacts')}>
                  <Button size="sm" variant="outline" className="border-emerald-300">View All</Button>
                </Link>
              </div>
              <div className="space-y-3">
                {contacts.slice(0, 5).map(contact => (
                  <div key={contact.id} className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-bold text-emerald-900">{contact.full_name}</p>
                      <p className="text-sm text-emerald-600">{contact.email}</p>
                    </div>
                    <div className="flex gap-2">
                      {contact.phone && (
                        <a href={`tel:${contact.phone}`}>
                          <Button size="icon" variant="ghost" className="h-8 w-8">
                            <Phone className="w-4 h-4 text-emerald-600" />
                          </Button>
                        </a>
                      )}
                      {contact.email && (
                        <a href={`mailto:${contact.email}`}>
                          <Button size="icon" variant="ghost" className="h-8 w-8">
                            <Mail className="w-4 h-4 text-emerald-600" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card className="bg-white border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-purple-900">Upcoming Events</h2>
                <Link to={createPageUrl('CRMCalendar')}>
                  <Button size="sm" variant="outline" className="border-purple-300">View Calendar</Button>
                </Link>
              </div>
              <div className="space-y-3">
                {upcomingEvents.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No upcoming events</p>
                ) : (
                  upcomingEvents.map(event => (
                    <div key={event.id} className="p-3 bg-purple-50 border-l-4 border-purple-500 rounded">
                      <p className="font-bold text-purple-900">{event.title}</p>
                      <p className="text-sm text-purple-600">
                        {new Date(event.start_date).toLocaleDateString()} at{' '}
                        {new Date(event.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}