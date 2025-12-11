import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const apiKey = Deno.env.get('OPENWEATHER_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'OpenWeather API key not set' }, { status: 500 });
    }

    const { lat, lng } = await req.json();
    
    if (!lat || !lng) {
      return Response.json({ error: 'Missing coordinates' }, { status: 400 });
    }

    // Fetch weather data
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=imperial`;
    const weatherResponse = await fetch(weatherUrl);
    const weatherData = await weatherResponse.json();

    // Fetch air quality data
    const airUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lng}&appid=${apiKey}`;
    const airResponse = await fetch(airUrl);
    const airData = await airResponse.json();

    if (weatherData.cod !== 200) {
      return Response.json({ error: 'Failed to fetch weather data' }, { status: 400 });
    }

    const aqiLevel = airData.list?.[0]?.main?.aqi || 0;
    const aqiLabels = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];

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
        visibility: Math.round(weatherData.visibility / 1609.34) // meters to miles
      },
      airQuality: {
        aqi: aqiLevel,
        label: aqiLabels[aqiLevel - 1] || 'Unknown',
        pm25: airData.list?.[0]?.components?.pm2_5 || 0,
        pm10: airData.list?.[0]?.components?.pm10 || 0,
        no2: airData.list?.[0]?.components?.no2 || 0,
        o3: airData.list?.[0]?.components?.o3 || 0
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});