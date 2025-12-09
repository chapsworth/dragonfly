import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Phone, Mail, MapPin, Clock, Send, MessageCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setFormData({ name: '', email: '', phone: '', message: '' });
      setSubmitted(false);
    }, 3000);
  };

  const contactInfo = [
    { icon: Phone, label: 'Phone', value: '(555) 420-1234', href: 'tel:+15554201234' },
    { icon: Mail, label: 'Email', value: 'hello@greenleaf.com', href: 'mailto:hello@greenleaf.com' },
    { icon: MapPin, label: 'Address', value: '123 Cannabis Lane, Green City, CA 90210' },
    { icon: Clock, label: 'Hours', value: 'Mon-Sat: 9AM-9PM, Sun: 10AM-6PM' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 pt-28 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl sm:text-5xl font-bold text-emerald-900 mb-4">Get in Touch</h1>
          <p className="text-lg text-emerald-600 max-w-2xl mx-auto">
            Have questions about our products or delivery? We're here to help. 
            Reach out and our friendly team will get back to you.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-xl shadow-emerald-500/30">
              <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
              <div className="space-y-6">
                {contactInfo.map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-emerald-100 text-sm">{item.label}</p>
                      {item.href ? (
                        <a href={item.href} className="font-medium hover:underline">
                          {item.value}
                        </a>
                      ) : (
                        <p className="font-medium">{item.value}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-white/20">
                <p className="text-emerald-100 text-sm mb-3">Follow us</p>
                <div className="flex gap-3">
                  {['Instagram', 'Twitter', 'Facebook'].map(social => (
                    <button
                      key={social}
                      className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors text-sm font-medium"
                    >
                      {social}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* FAQ Quick Links */}
            <div className="p-6 rounded-3xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-lg">
              <h3 className="font-bold text-emerald-900 mb-4 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-500" />
                Common Questions
              </h3>
              <div className="space-y-3">
                {[
                  'What are your delivery areas?',
                  'Do you verify age on delivery?',
                  'What payment methods do you accept?',
                  'How do I track my order?'
                ].map((q, i) => (
                  <p key={i} className="text-sm text-emerald-600 hover:text-emerald-800 cursor-pointer transition-colors">
                    → {q}
                  </p>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3"
          >
            <div className="p-6 sm:p-8 rounded-3xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-lg">
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center mb-4">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-emerald-900 mb-2">Message Sent!</h3>
                  <p className="text-emerald-600">We'll get back to you within 24 hours.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <h2 className="text-2xl font-bold text-emerald-900 mb-6">Send us a Message</h2>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-emerald-800">Full Name *</Label>
                      <Input
                        required
                        value={formData.name}
                        onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                        placeholder="John Doe"
                        className="h-12 rounded-xl bg-white/60 border-emerald-200 focus:border-emerald-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-emerald-800">Email *</Label>
                      <Input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                        placeholder="john@example.com"
                        className="h-12 rounded-xl bg-white/60 border-emerald-200 focus:border-emerald-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-emerald-800">Phone Number</Label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                      placeholder="(555) 123-4567"
                      className="h-12 rounded-xl bg-white/60 border-emerald-200 focus:border-emerald-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-emerald-800">Message *</Label>
                    <Textarea
                      required
                      value={formData.message}
                      onChange={(e) => setFormData(p => ({ ...p, message: e.target.value }))}
                      placeholder="How can we help you?"
                      rows={5}
                      className="rounded-xl bg-white/60 border-emerald-200 focus:border-emerald-400"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-semibold text-lg shadow-lg shadow-emerald-500/30"
                  >
                    Send Message
                    <Send className="w-5 h-5 ml-2" />
                  </Button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}