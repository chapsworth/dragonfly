import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wind, AlertCircle } from 'lucide-react';

const getAQIColor = (aqi) => {
  const colors = {
    1: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
    2: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
    3: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
    4: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
    5: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  };
  return colors[aqi] || colors[1];
};

export default function AirQualityWidget({ airQuality, isLoading }) {
  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-6 bg-gray-200 rounded w-16"></div>
        </div>
      </Card>
    );
  }

  if (!airQuality) return null;

  const colors = getAQIColor(airQuality.aqi);

  return (
    <Card className={`p-4 ${colors.bg} border-2 ${colors.border}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Wind className={`w-5 h-5 ${colors.text}`} />
            <p className="text-xs font-medium">Air Quality Index</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-3xl font-bold ${colors.text}`}>{airQuality.aqi}</span>
            <Badge className={`${colors.bg} ${colors.text}`}>
              {airQuality.label}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-current/20">
        <div>
          <p className="text-xs opacity-70">PM2.5</p>
          <p className="text-sm font-semibold">{airQuality.pm25.toFixed(1)}</p>
        </div>
        <div>
          <p className="text-xs opacity-70">PM10</p>
          <p className="text-sm font-semibold">{airQuality.pm10.toFixed(1)}</p>
        </div>
      </div>

      {airQuality.aqi >= 3 && (
        <div className={`mt-3 p-2 rounded-lg ${colors.bg} border ${colors.border} flex items-start gap-2`}>
          <AlertCircle className="w-4 h-4 mt-0.5" />
          <p className="text-xs">
            {airQuality.aqi >= 4 
              ? 'Poor air quality. Consider limiting outdoor exposure.' 
              : 'Moderate air quality. Sensitive individuals should take precautions.'}
          </p>
        </div>
      )}
    </Card>
  );
}