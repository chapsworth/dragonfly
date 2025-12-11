import React from 'react';
import { Card } from '@/components/ui/card';
import { Wind, AlertTriangle } from 'lucide-react';

export default function AirQualityWidget({ airQuality }) {
  if (!airQuality) {
    return (
      <Card className="p-4 bg-white">
        <p className="text-sm text-gray-400">Loading air quality...</p>
      </Card>
    );
  }

  const getAQIColor = (level) => {
    const colors = {
      'Good': 'from-green-500 to-emerald-500',
      'Fair': 'from-yellow-500 to-amber-500',
      'Moderate': 'from-orange-500 to-red-400',
      'Poor': 'from-red-500 to-red-600',
      'Very Poor': 'from-purple-600 to-pink-600'
    };
    return colors[level] || 'from-gray-500 to-gray-600';
  };

  const getAQITextColor = (level) => {
    const colors = {
      'Good': 'text-green-600',
      'Fair': 'text-yellow-600',
      'Moderate': 'text-orange-600',
      'Poor': 'text-red-600',
      'Very Poor': 'text-purple-600'
    };
    return colors[level] || 'text-gray-600';
  };

  const showWarning = airQuality.level !== 'Good' && airQuality.level !== 'Fair';

  return (
    <Card className={`p-4 bg-gradient-to-br ${getAQIColor(airQuality.level)} text-white`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Wind className="w-6 h-6" />
          <div>
            <h3 className="font-bold text-lg">Air Quality</h3>
            <p className="text-sm opacity-90">{airQuality.level}</p>
          </div>
        </div>
        {showWarning && <AlertTriangle className="w-6 h-6" />}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm">
          <p className="text-xs opacity-90 mb-1">AQI Index</p>
          <p className="text-2xl font-bold">{airQuality.aqi}</p>
        </div>

        <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm">
          <p className="text-xs opacity-90 mb-1">PM2.5</p>
          <p className="text-2xl font-bold">{airQuality.pm25.toFixed(1)}</p>
        </div>

        <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm">
          <p className="text-xs opacity-90 mb-1">PM10</p>
          <p className="text-2xl font-bold">{airQuality.pm10.toFixed(1)}</p>
        </div>

        <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm">
          <p className="text-xs opacity-90 mb-1">O₃ (Ozone)</p>
          <p className="text-2xl font-bold">{airQuality.o3.toFixed(1)}</p>
        </div>
      </div>

      {showWarning && (
        <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm">
          <p className="text-xs font-semibold">
            Air quality may affect sensitive individuals. Consider shorter outdoor exposure.
          </p>
        </div>
      )}
    </Card>
  );
}