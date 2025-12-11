import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Navigation, MapPin, Apple, Globe } from 'lucide-react';

export default function NavigationModal({ isOpen, onClose, order }) {
  if (!order) return null;

  const address = encodeURIComponent(order.delivery_address);
  const lat = order.delivery_lat;
  const lng = order.delivery_lng;

  const handleAppleMaps = () => {
    if (lat && lng) {
      window.open(`http://maps.apple.com/?daddr=${lat},${lng}`, '_blank');
    } else {
      window.open(`http://maps.apple.com/?address=${address}`, '_blank');
    }
  };

  const handleGoogleMaps = () => {
    if (lat && lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${address}`, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Navigation className="w-6 h-6 text-emerald-600" />
            Choose Navigation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          <Link to={createPageUrl('DeliveryNavigation') + `?orderId=${order.id}`}>
            <Button 
              onClick={onClose}
              className="w-full h-20 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
            >
              <div className="text-center">
                <MapPin className="w-8 h-8 mx-auto mb-1" />
                <p className="font-bold">In-App Navigation</p>
                <p className="text-xs opacity-90">DoorDash-style delivery</p>
              </div>
            </Button>
          </Link>

          <Button 
            onClick={handleAppleMaps}
            variant="outline"
            className="w-full h-16 border-2"
          >
            <div className="flex items-center gap-3">
              <Apple className="w-6 h-6" />
              <div className="text-left">
                <p className="font-bold">Apple Maps</p>
                <p className="text-xs text-gray-600">Open in Apple Maps</p>
              </div>
            </div>
          </Button>

          <Button 
            onClick={handleGoogleMaps}
            variant="outline"
            className="w-full h-16 border-2"
          >
            <div className="flex items-center gap-3">
              <Globe className="w-6 h-6" />
              <div className="text-left">
                <p className="font-bold">Google Maps</p>
                <p className="text-xs text-gray-600">Open in Google Maps</p>
              </div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}