import React from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Navigation, ArrowRight, ArrowLeft, ArrowUp, Clock, MapPin, MoveRight } from 'lucide-react';

const getManeuverIcon = (maneuver) => {
  if (maneuver.includes('left')) return ArrowLeft;
  if (maneuver.includes('right')) return MoveRight;
  return ArrowUp;
};

export default function DirectionsPanel({ directions, currentLegIndex = 0, currentStepIndex = 0 }) {
  if (!directions || directions.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-gray-500 text-center">No directions available</p>
      </Card>
    );
  }

  const currentLeg = directions[currentLegIndex];
  const currentStep = currentLeg?.steps[currentStepIndex];

  return (
    <Card className="overflow-hidden">
      {/* Current Step - Large Display */}
      {currentStep && (
        <div className="bg-gradient-to-r from-emerald-500 to-green-500 text-white p-6">
          <div className="flex items-start gap-4">
            <div className="bg-white/20 p-3 rounded-xl">
              {React.createElement(getManeuverIcon(currentStep.maneuver), { className: "w-8 h-8" })}
            </div>
            <div className="flex-1">
              <p className="text-2xl font-bold mb-2">{currentStep.instruction}</p>
              <div className="flex gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {currentStep.distance}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {currentStep.duration}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Steps */}
      <ScrollArea className="h-[300px]">
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-emerald-900">Upcoming Steps</h3>
            <Badge variant="outline">
              Leg {currentLegIndex + 1} of {directions.length}
            </Badge>
          </div>

          {currentLeg?.steps.map((step, index) => {
            if (index <= currentStepIndex) return null;
            const Icon = getManeuverIcon(step.maneuver);
            
            return (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="bg-emerald-100 p-2 rounded-lg">
                  <Icon className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{step.instruction}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {step.distance} • {step.duration}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Next Leg Preview */}
          {currentLegIndex < directions.length - 1 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <ArrowRight className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-900">Next Delivery</span>
              </div>
              <p className="text-sm text-blue-700">
                {directions[currentLegIndex + 1].endAddress}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {directions[currentLegIndex + 1].distance} • {directions[currentLegIndex + 1].duration}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}