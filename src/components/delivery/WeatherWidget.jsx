import React from 'react';
import { Card } from '@/components/ui/card';
import { Cloud, Wind, Droplets, Eye, Thermometer } from 'lucide-react';

export default function WeatherWidget({ weather }) {
  if (!weather) {
    return (
      <Card className="p-4 bg-white">
        <p className="text-sm text-gray-400">Loading weather...</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="flex items-center gap-3 mb-4">
        <Cloud className="w-6 h-6 text-blue-500" />
        <div>
          <h3 className="font-bold text-lg">Current Weather</h3>
          <p className="text-sm text-gray-600">{weather.condition}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/60 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Thermometer className="w-4 h-4 text-red-500" />
            <p className="text-xs text-gray-600">Temperature</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{weather.temp}°F</p>
          <p className="text-xs text-gray-500">Feels like {weather.feelsLike}°F</p>
        </div>

        <div className="bg-white/60 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Wind className="w-4 h-4 text-cyan-500" />
            <p className="text-xs text-gray-600">Wind</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{weather.windSpeed}</p>
          <p className="text-xs text-gray-500">mph</p>
        </div>

        <div className="bg-white/60 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Droplets className="w-4 h-4 text-blue-500" />
            <p className="text-xs text-gray-600">Humidity</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{weather.humidity}%</p>
        </div>

        <div className="bg-white/60 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Eye className="w-4 h-4 text-purple-500" />
            <p className="text-xs text-gray-600">Visibility</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{weather.visibility}</p>
          <p className="text-xs text-gray-500">miles</p>
        </div>
      </div>
    </Card>
  );
}