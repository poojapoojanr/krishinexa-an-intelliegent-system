'use server';

/**
 * @fileOverview Fetches weather data from the OpenWeatherMap API.
 *
 * - getWeather - A function that returns current weather and a 7-day forecast.
 * - GetWeatherInput - The input type for the getWeather function.
 * - GetWeatherOutput - The return type for the getWeather function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GetWeatherInputSchema = z.object({
  city: z.string().default('Anand'),
  state: z.string().optional(),
  country: z.string().default('IN'),
});
export type GetWeatherInput = z.infer<typeof GetWeatherInputSchema>;

const CurrentWeatherSchema = z.object({
  temp: z.number(),
  feels_like: z.number(),
  humidity: z.number(),
  pressure: z.number(),
  visibility: z.number().optional(),
  wind_speed: z.number(),
  wind_deg: z.number().optional(),
  clouds: z.number(),
  main: z.string(),
  description: z.string(),
  icon: z.string(),
  uvIndex: z.string(),
  sunrise: z.string(),
  sunset: z.string(),
});

const DailyForecastSchema = z.object({
  day: z.string(),
  temp: z.number(),
  icon: z.string(),
});

const WeatherAlertSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  severity: z.enum(['High', 'Medium', 'Low']),
});


const GetWeatherOutputSchema = z.object({
  current: CurrentWeatherSchema,
  forecast: z.array(DailyForecastSchema),
  alerts: z.array(WeatherAlertSchema),
  location: z.string(),
});
export type GetWeatherOutput = z.infer<typeof GetWeatherOutputSchema>;


function getMockWeatherData(location: string): GetWeatherOutput {
    console.warn("OPENWEATHERMAP_API_KEY or LOCATIONIQ_API_KEY is not defined or invalid. Falling back to mock weather data.");
    return {
        current: {
            temp: 28,
            feels_like: 30,
            humidity: 75,
            pressure: 1013,
            visibility: 10000,
            wind_speed: 12,
            wind_deg: 180,
            clouds: 40,
            main: 'Haze',
            description: 'Light haze',
            icon: '50d',
            uvIndex: 'High',
            sunrise: '06:30 AM',
            sunset: '06:45 PM',
        },
        forecast: [
            { day: 'Mon', temp: 30, icon: '02d' },
            { day: 'Tue', temp: 31, icon: '01d' },
            { day: 'Wed', temp: 29, icon: '10d' },
            { day: 'Thu', temp: 32, icon: '01d' },
            { day: 'Fri', temp: 30, icon: '03d' },
            { day: 'Sat', temp: 28, icon: '09d' },
            { day: 'Sun', temp: 29, icon: '04d' },
        ],
        alerts: [
            {
                id: 'alert-mock-1',
                title: 'High Humidity Expected',
                description: 'Humidity levels may be higher than average. Monitor crops for fungal risks.',
                severity: 'Medium',
            },
        ],
        location: location || 'Mock Location, IN',
    };
}


// This is not a flow, but an exported function that can be called from the client
export async function getWeather(input: GetWeatherInput): Promise<GetWeatherOutput> {
  const openWeatherApiKey = process.env.OPENWEATHER_API_KEY;
  const locationIqApiKey = process.env.LOCATIONIQ_API_KEY;
  const locationQuery = [input.city, input.state, input.country].filter(Boolean).join(',');
  
  console.log('🔍 Weather API Debug:', {
    hasOpenWeatherKey: !!openWeatherApiKey,
    hasLocationIqKey: !!locationIqApiKey,
    locationQuery,
    openWeatherKeyPreview: openWeatherApiKey ? `${openWeatherApiKey.substring(0, 8)}...` : 'missing'
  });
  
  if (!openWeatherApiKey || !locationIqApiKey) {
    console.warn("⚠️ API Keys missing - OPENWEATHER_API_KEY or LOCATIONIQ_API_KEY. Using mock data.");
    return getMockWeatherData(locationQuery);
  }

  try {
    // 1. Get Lat/Lon from city name using LocationIQ
    const geoUrl = `https://us1.locationiq.com/v1/search.php?key=${locationIqApiKey}&q=${encodeURIComponent(locationQuery)}&format=json`;
    console.log('🌍 Fetching location data for:', locationQuery);
    
    const geoResponse = await fetch(geoUrl);
    if (!geoResponse.ok) {
        console.error(`❌ LocationIQ API failed: ${geoResponse.status}`);
        throw new Error(`Failed to fetch location data for ${input.city}: ${geoResponse.status} ${await geoResponse.text()}`);
    }
    const geoData = await geoResponse.json();
    if (!geoData || geoData.length === 0) {
        console.error(`❌ No location data found for: ${input.city}`);
        throw new Error(`Could not find location data for ${input.city}`);
    }
    const { lat, lon, display_name } = geoData[0];
    console.log(`✅ Location found: ${display_name} (${lat}, ${lon})`);
    
    // 2. Get Weather data using One Call API 2.5
    const weatherUrl = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly&appid=${openWeatherApiKey}&units=metric`;
    console.log('🌤️ Fetching weather data...');
    
    const weatherResponse = await fetch(weatherUrl);
     if (!weatherResponse.ok) {
        const errorText = await weatherResponse.text();
        console.error(`❌ OpenWeatherMap API failed: ${weatherResponse.status} ${errorText}`);
        return getMockWeatherData(display_name.split(',').slice(0, 2).join(','));
    }
    const weatherData = await weatherResponse.json();
    console.log('✅ Real weather data fetched successfully!');

    const getUviDescription = (uvi: number) => {
        if (uvi < 3) return 'Low';
        if (uvi < 6) return 'Moderate';
        if (uvi < 8) return 'High';
        if (uvi < 11) return 'Very High';
        return 'Extreme';
    }

    // 3. Transform data into our schema
    const current = {
        temp: Math.round(weatherData.current.temp),
        feels_like: Math.round(weatherData.current.feels_like),
        humidity: weatherData.current.humidity,
        pressure: weatherData.current.pressure,
        visibility: weatherData.current.visibility ? Math.round(weatherData.current.visibility / 1000) : undefined, // m to km
        wind_speed: Math.round(weatherData.current.wind_speed * 3.6), // m/s to km/h
        wind_deg: weatherData.current.wind_deg,
        clouds: weatherData.current.clouds,
        main: weatherData.current.weather[0].main,
        description: weatherData.current.weather[0].description,
        icon: weatherData.current.weather[0].icon,
        uvIndex: getUviDescription(weatherData.current.uvi),
        sunrise: new Date(weatherData.current.sunrise * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
        sunset: new Date(weatherData.current.sunset * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    };

    const forecast = weatherData.daily.slice(0, 7).map((day: any) => ({
        day: new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
        temp: Math.round(day.temp.day),
        icon: day.weather[0].icon,
    }));

    const alerts = weatherData.alerts?.map((alert: any, index: number) => ({
        id: `alert-${index}`,
        title: alert.event,
        description: alert.description,
        severity: 'Medium' as const, // API doesn't provide severity, so we use a default
    })) || [];


    return {
        current,
        forecast,
        alerts,
        location: display_name.split(',').slice(0, 2).join(','),
    };
  } catch (error) {
      console.error("An error occurred in getWeather:", error);
      return getMockWeatherData(locationQuery);
  }
}
