import React, { useState } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import AppIcon from './AppIcon';
import { X } from 'lucide-react';

export default function AppFolder({ label, color, icons, apps }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="flex flex-col items-center gap-1.5 w-full">
        <div 
          className={`w-[60px] h-[60px] rounded-[13px] shadow-lg flex items-center justify-center ${color} relative overflow-hidden`}
          style={{
            boxShadow: '0 2px 8px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(255,255,255,0.1)'
          }}
        >
          <div className="grid grid-cols-3 gap-[2px] w-[50px] h-[50px]">
            {icons.slice(0, 9).map((Icon, i) => (
              <div key={i} className="bg-white/20 backdrop-blur-sm rounded-[4px] flex items-center justify-center">
                <Icon className="w-3 h-3 text-white" strokeWidth={2.5} />
              </div>
            ))}
          </div>
        </div>
        <span 
          className="text-white text-[11px] font-medium text-center leading-tight max-w-[70px] truncate"
          style={{
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif'
          }}
        >
          {label}
        </span>
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[90vw] max-h-[85vh] bg-black/40 backdrop-blur-3xl border-0 p-0 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 
                className="text-white text-2xl font-semibold"
                style={{
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif'
                }}
              >
                {label}
              </h2>
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-x-4 gap-y-6 max-h-[60vh] overflow-y-auto">
              {apps.map((app, i) => (
                <AppIcon key={i} {...app} />
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}