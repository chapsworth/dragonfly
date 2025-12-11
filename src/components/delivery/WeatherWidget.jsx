import React from 'react';
import { Card } from '@/components/ui/card';
import { Cloud, CloudRain, CloudSnow, Sun, Wind, Droplets, Eye } from 'lucide-react';

const getWeatherIcon = (condition) => {
  const icons = {
    Clear: Sun,
    Clouds: Cloud,
    Rain: CloudRain,
    Snow: CloudSnow,
    Drizzle: CloudRain,
  };
  return icons[condition] || Cloud;
};

export default function WeatherWidget({ weather, isLoading }) {
  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-8 bg-gray-200 rounded w-16"></div>
        </div>
      </Card>
    );
  }

  if (!weather) return null;

  const WeatherIcon = getWeatherIcon(weather.condition);

  return (
    <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-blue-600 font-medium mb-1">Current Weather</p>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-blue-900">{weather.temp}°F</span>
            <WeatherIcon className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-sm text-blue-700 capitalize">{weather.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-blue-200">
        <div className="text-center">
          <Wind className="w-4 h-4 text-blue-600 mx-auto mb-1" />
          <p className="text-xs text-blue-600">Wind</p>
          <p className="text-sm font-semibold text-blue-900">{weather.windSpeed} mph</p>
        </div>
        <div className="text-center">
          <Droplets className="w-4 h-4 text-blue-600 mx-auto mb-1" />
          <p className="text-xs text-blue-600">Humidity</p>
          <p className="text-sm font-semibold text-blue-900">{weather.humidity}%</p>
        </div>
        <div className="text-center">
          <Eye className="w-4 h-4 text-blue-600 mx-auto mb-1" />
          <p className="text-xs text-blue-600">Visibility</p>
          <p className="text-sm font-semibold text-blue-900">{weather.visibility} mi</p>
        </div>
      </div>
    </Card>
  );
}