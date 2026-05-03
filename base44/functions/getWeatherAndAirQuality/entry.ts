import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = Deno.env.get('OPENWEATHERMAP_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'OpenWeatherMap API key not set' }, { status: 500 });
    }

    const { lat, lng } = await req.json();
    
    if (!lat || !lng) {
      return Response.json({ error: 'Missing lat/lng' }, { status: 400 });
    }

    // Fetch weather data
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=imperial`;
    const weatherResponse = await fetch(weatherUrl);
    const weatherData = await weatherResponse.json();
    
    if (weatherData.cod !== 200) {
      return Response.json({ error: 'Weather API error' }, { status: 400 });
    }

    // Fetch air quality data
    const airQualityUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lng}&appid=${apiKey}`;
    const airQualityResponse = await fetch(airQualityUrl);
    const airQualityData = await airQualityResponse.json();

    const aqiLevels = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
    const aqi = airQualityData.list?.[0]?.main?.aqi || 1;

    return Response.json({
      status: 'success',
      weather: {
        temp: Math.round(weatherData.main.temp),
        feelsLike: Math.round(weatherData.main.feels_like),
        condition: weatherData.weather[0].main,
        description: weatherData.weather[0].description,
        icon: weatherData.weather[0].icon,
        humidity: weatherData.main.humidity,
        windSpeed: Math.round(weatherData.wind.speed),
        visibility: Math.round(weatherData.visibility / 1609.34) // Convert meters to miles
      },
      airQuality: {
        aqi,
        level: aqiLevels[aqi - 1],
        pm25: airQualityData.list?.[0]?.components?.pm2_5 || 0,
        pm10: airQualityData.list?.[0]?.components?.pm10 || 0,
        o3: airQualityData.list?.[0]?.components?.o3 || 0
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});