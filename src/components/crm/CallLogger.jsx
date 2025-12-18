import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone } from 'lucide-react';

export default function CallLogger({ contactId, contactName, contactType, onSave }) {
  const [isOpen, setIsOpen] = useState(false);
  const [callData, setCallData] = useState({
    notes: '',
    stage: '',
    outcome: 'completed'
  });
  const [wasInCall, setWasInCall] = useState(false);

  useEffect(() => {
    // Detect when page becomes hidden (user switched to phone app)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden - user might be on a call
        setWasInCall(true);
      } else if (wasInCall) {
        // Page is visible again after being hidden - call might have ended
        // Wait a moment to ensure user finished the call
        setTimeout(() => {
          setIsOpen(true);
        }, 500);
        setWasInCall(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [wasInCall]);

  const handleSave = () => {
    onSave({
      ...callData,
      contactId,
      contactName,
      contactType
    });
    setCallData({ notes: '', stage: '', outcome: 'completed' });
    setIsOpen(false);
  };

  const handleSkip = () => {
    setCallData({ notes: '', stage: '', outcome: 'completed' });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-blue-600" />
            Log Call with {contactName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label>How did the call go?</Label>
            <Textarea
              value={callData.notes}
              onChange={(e) => setCallData({ ...callData, notes: e.target.value })}
              placeholder="Call notes, discussion points, next steps..."
              className="h-32 mt-2"
              autoFocus
            />
          </div>

          <div>
            <Label>Call Outcome</Label>
            <Select 
              value={callData.outcome} 
              onValueChange={(val) => setCallData({ ...callData, outcome: val })}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="no_answer">No Answer</SelectItem>
                <SelectItem value="voicemail">Left Voicemail</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
                <SelectItem value="wrong_number">Wrong Number</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {contactType === 'contact' && (
            <div>
              <Label>Update Deal Stage</Label>
              <Select 
                value={callData.stage} 
                onValueChange={(val) => setCallData({ ...callData, stage: val })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Keep current stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Keep current stage</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="negotiation">Negotiation</SelectItem>
                  <SelectItem value="won">Won</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleSkip}>
              Skip
            </Button>
            <Button 
              onClick={handleSave}
              className="bg-gradient-to-r from-blue-500 to-cyan-500"
            >
              Save Call Log
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}