'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CloudSun, Clock } from 'lucide-react';
import LocationSelector from '@/components/location-selector';
import { useLocation } from '@/hooks/use-location';
import { useTranslation } from '@/hooks/use-translation';

/* ================= TYPES ================= */

interface CurrentWeather {
  temperature: number;
  humidity: number;
  weather: string;
  wind_speed: number;
}

interface ForecastItem {
  time: string;
  temperature: number;
  humidity: number;
  weather: string;
  rainfall: number;
}

interface WeatherResponse {
  district: string;
  latitude: number;
  longitude: number;
  current_weather: CurrentWeather;
  forecast_24h: ForecastItem[];
}

/* ================= PAGE ================= */

export default function WeatherPage() {
  const { t } = useTranslation();
  const { selectedDistrict } = useLocation();

  const [data, setData] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedDistrict) return;

    setLoading(true);
    setError(null);
    setData(null);

    const district = encodeURIComponent(selectedDistrict.district);

    fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/weather/${district}`)
      .then(async res => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || err.error || 'Weather service error');
        }
        return res.json();
      })
      .then((res: WeatherResponse) => {
        setData(res);
      })
      .catch(err => {
        setError(err.message || 'Failed to fetch weather data');
      })
      .finally(() => setLoading(false));
  }, [selectedDistrict]);

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t('Weather Center', 'Weather Center')}</h1>
        <p className="text-muted-foreground">
          {t('Detailed forecast for your selected location', 'Detailed forecast for your selected location')}
        </p>
      </div>

      {/* Location Selector */}
      <Card>
        <CardContent className="pt-6">
          <LocationSelector />
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-10">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      )}

      {/* Error */}
      {error && (
        <Card>
          <CardContent className="py-8 text-center text-red-600">
            {error}
          </CardContent>
        </Card>
      )}

      {/* Weather Data */}
      {data && (
        <>
          {/* Current Weather */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CloudSun className="text-primary" />
                {t('Current Weather', 'Current Weather')} — {data.district}
              </CardTitle>
            </CardHeader>

            <CardContent className="grid sm:grid-cols-4 gap-4">
              <WeatherStat label={t('Temperature', 'Temperature')} value={`${data.current_weather.temperature} °C`} />
              <WeatherStat label={t('Humidity', 'Humidity')} value={`${data.current_weather.humidity} %`} />
              <WeatherStat label={t('Wind Speed', 'Wind Speed')} value={`${data.current_weather.wind_speed} m/s`} />
              <WeatherStat label={t('Condition', 'Condition')} value={data.current_weather.weather} />
            </CardContent>
          </Card>

          {/* 24 Hour Forecast */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="text-primary" />
                {t('Next 24 Hours Forecast', 'Next 24 Hours Forecast')}
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="grid md:grid-cols-4 sm:grid-cols-2 gap-4">
                {data.forecast_24h.map((f, i) => (
                  <div key={i} className="border rounded-lg p-4 text-sm space-y-1">
                    <p className="font-medium">{formatTime(f.time)}</p>
                    <p>🌡 {f.temperature} °C</p>
                    <p>💧 {f.humidity} %</p>
                    <p>☁ {f.weather}</p>
                    {f.rainfall > 0 && <p>🌧 {f.rainfall} mm</p>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

/* ================= SMALL COMPONENTS ================= */

function WeatherStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border rounded-lg p-4 text-center">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

function formatTime(dt: string) {
  return new Date(dt).toLocaleString('en-IN', {
    hour: 'numeric',
    minute: 'numeric',
    day: 'numeric',
    month: 'short',
  });
}
