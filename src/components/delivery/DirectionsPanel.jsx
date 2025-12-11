import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navigation, ChevronRight, MapPin } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function DirectionsPanel({ steps, currentStepIndex, onStepChange, destination }) {
  if (!steps || steps.length === 0) {
    return (
      <Card className="p-4 bg-white">
        <div className="text-center text-gray-400">
          <Navigation className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No directions available</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-white">
      <div className="flex items-center gap-2 mb-4">
        <Navigation className="w-5 h-5 text-emerald-600" />
        <h3 className="font-bold text-lg">Turn-by-Turn Directions</h3>
      </div>

      <div className="mb-3 p-3 bg-blue-50 rounded-lg flex items-center gap-2">
        <MapPin className="w-4 h-4 text-blue-600" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-600">Destination</p>
          <p className="text-sm font-semibold truncate">{destination}</p>
        </div>
      </div>

      <ScrollArea className="h-[300px]">
        <div className="space-y-2">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border-2 transition-all ${
                idx === currentStepIndex
                  ? 'bg-emerald-100 border-emerald-500 shadow-md'
                  : idx < currentStepIndex
                  ? 'bg-gray-50 border-gray-200 opacity-60'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    idx === currentStepIndex
                      ? 'bg-emerald-500 text-white'
                      : idx < currentStepIndex
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {idx < currentStepIndex ? '✓' : idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-semibold mb-1"
                    dangerouslySetInnerHTML={{ __html: step.instruction }}
                  />
                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    <span>{step.distance}</span>
                    <span>•</span>
                    <span>{step.duration}</span>
                  </div>
                </div>
                {idx === currentStepIndex && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onStepChange(idx + 1)}
                    disabled={idx >= steps.length - 1}
                    className="flex-shrink-0"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="mt-4 flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
        <div>
          <p className="text-xs text-gray-600">Current Step</p>
          <p className="font-bold text-emerald-900">
            {currentStepIndex + 1} of {steps.length}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-600">Progress</p>
          <p className="font-bold text-emerald-900">
            {Math.round(((currentStepIndex + 1) / steps.length) * 100)}%
          </p>
        </div>
      </div>
    </Card>
  );
}