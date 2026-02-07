'use client';

import dynamic from 'next/dynamic';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import LocationSelector from '@/components/location-selector';
import { useLocation } from '@/hooks/use-location';
import { useTranslation } from '@/hooks/use-translation';
import { Thermometer, Droplets, Leaf, AlertCircle, CheckCircle2, Loader2, MapPin, Info } from 'lucide-react';

const SatelliteMap = dynamic(() => import('@/components/SatelliteMap'), {
  ssr: false,
});

interface SoilData {
  district: string;
  ndvi?: number;
  soil_health_status?: string;
  advisory?: string;
  source?: string;
  last_updated?: string;
}

export default function SoilHealthPage() {
  const { t } = useTranslation();
  const { selectedDistrict } = useLocation();

  const [rgb, setRgb] = useState('');
  const [ndviTile, setNdviTile] = useState('');
  const [boundary, setBoundary] = useState('');
  const [soilData, setSoilData] = useState<SoilData | null>(null);
  const [weatherData, setWeatherData] = useState<any | null>(null);
  const [processing, setProcessing] = useState(false);
  const [view, setView] = useState<'rgb' | 'ndvi'>('rgb');


  // Fetch cached soil and weather data in parallel when district changes
  React.useEffect(() => {
    if (!selectedDistrict) return;
    const district = encodeURIComponent(selectedDistrict.district);
    setProcessing(true);
    setSoilData(null);
    setWeatherData(null);
    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/soil-health/${district}`).then(res => {
        if (!res.ok) throw new Error('Failed');
        return res.json();
      }),
      fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/weather/${district}`).then(res => {
        if (!res.ok) throw new Error('Failed');
        return res.json();
      })
    ])
      .then(([soil, weather]) => {
        setSoilData(soil);
        setWeatherData(weather);
        setProcessing(false);
      })
      .catch(() => {
        setProcessing(false);
      });
  }, [selectedDistrict]);

  // Satellite tiles load independently (optional, can be removed if not needed)
  React.useEffect(() => {
    if (!selectedDistrict) return;
    const district = encodeURIComponent(selectedDistrict.district);
    fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/satellite/${district}`)
      .then(res => res.json())
      .then(satData => {
        setRgb(satData.rgb_tile);
        setNdviTile(satData.ndvi_tile);
        setBoundary(satData.boundary_tile);
      })
      .catch(() => {});
  }, [selectedDistrict]);

  const getStatusColor = (status: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    switch (status.toLowerCase()) {
      case 'good':
      case 'optimal':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'moderate':
      case 'warm':
      case 'low':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'poor':
      case 'hot':
      case 'cold':
      case 'dry':
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string | null) => {
    if (!status) return <AlertCircle className="h-5 w-5 text-gray-500" />;
    switch (status.toLowerCase()) {
      case 'good':
      case 'optimal':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'moderate':
      case 'warm':
      case 'low':
        return <AlertCircle className="h-5 w-5 text-amber-600" />;
      case 'poor':
      case 'hot':
      case 'cold':
      case 'dry':
      case 'high':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTempProgress = (temp: number | null) => {
    if (temp === null) return 0;
    // Scale: 0°C = 0%, 50°C = 100%
    return Math.min(Math.max((temp / 50) * 100, 0), 100);
  };

  const getMoistureProgress = (moisture: number | null) => {
    if (moisture === null) return 0;
    // Moisture is already in percentage
    return Math.min(Math.max(moisture, 0), 100);
  };

  const getNdviProgress = (ndvi: number | null) => {
    if (ndvi === null) return 0;
    // NDVI ranges from -1 to 1, but typically 0 to 1 for vegetation
    return Math.min(Math.max(ndvi * 100, 0), 100);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-green-800">{t('Soil Health Analysis')}</h1>
          <p className="text-muted-foreground">{t('Satellite-based soil monitoring using NASA & ESA data')}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {t('Select Location')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <LocationSelector />
        </CardContent>
      </Card>

      {processing && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-green-600 mb-4" />
          <p className="text-lg font-semibold text-green-800">{t('Soil health analysis is being prepared for this district. Please check back soon!')}</p>
        </div>
      )}

      {soilData && weatherData && !processing && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Vegetation Health Card */}
          <Card className={`border-2 ${getStatusColor(soilData.soil_health_status ?? null)}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Leaf className="h-5 w-5 text-green-600" />
                  {t('Vegetation Health')}
                </CardTitle>
                <Badge variant="outline" className={getStatusColor(soilData.soil_health_status ?? null)}>
                  {soilData.soil_health_status}
                </Badge>
              </div>
              <CardDescription>{t('NDVI - Normalized Difference Vegetation Index')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-4xl font-bold text-green-700">{soilData.ndvi}</span>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">{t('Range')}: 0 - 1</div>
                </div>
              </div>
              <Progress value={getNdviProgress(soilData.ndvi ?? 0)} className="h-3" />
              <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                {getStatusIcon(soilData.soil_health_status ?? null)}
                <p className="text-sm">{soilData.advisory}</p>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" />
                {soilData.source}
              </p>
              {soilData.last_updated && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  {t('Last updated')}: {soilData.last_updated}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Soil Temperature Card (from weatherData) */}
          <Card className={`border-2 ${getStatusColor(weatherData.soil_temperature?.status ?? null)}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Thermometer className="h-5 w-5 text-orange-600" />
                  {t('Soil Temperature')}
                </CardTitle>
                {weatherData.soil_temperature?.status && (
                  <Badge variant="outline" className={getStatusColor(weatherData.soil_temperature.status)}>
                    {weatherData.soil_temperature.status}
                  </Badge>
                )}
              </div>
              <CardDescription>{t('Land Surface Temperature from MODIS')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {weatherData.soil_temperature && weatherData.soil_temperature.value !== null ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-4xl font-bold text-orange-600">
                      {weatherData.soil_temperature.value}{weatherData.soil_temperature.unit}
                    </span>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">{t('Optimal')}: 15-25°C</div>
                    </div>
                  </div>
                  <Progress value={getTempProgress(weatherData.soil_temperature.value)} className="h-3" />
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                    {getStatusIcon(weatherData.soil_temperature.status)}
                    <p className="text-sm">{weatherData.soil_temperature.advisory}</p>
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>{t('Temperature data unavailable')}</p>
                </div>
              )}
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" />
                {weatherData.soil_temperature?.source}
              </p>
            </CardContent>
          </Card>

          {/* Soil Moisture Card (from weatherData) */}
          <Card className={`border-2 ${getStatusColor(weatherData.soil_moisture?.status ?? null)}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Droplets className="h-5 w-5 text-blue-600" />
                  {t('Soil Moisture')}
                </CardTitle>
                {weatherData.soil_moisture?.status && (
                  <Badge variant="outline" className={getStatusColor(weatherData.soil_moisture.status)}>
                    {weatherData.soil_moisture.status}
                  </Badge>
                )}
              </div>
              <CardDescription>{t('Surface Soil Moisture from NASA SMAP')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {weatherData.soil_moisture && weatherData.soil_moisture.value !== null ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-4xl font-bold text-blue-600">
                      {weatherData.soil_moisture.value}{weatherData.soil_moisture.unit}
                    </span>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">{t('Optimal')}: 20-35%</div>
                    </div>
                  </div>
                  <Progress value={getMoistureProgress(weatherData.soil_moisture.value)} className="h-3" />
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                    {getStatusIcon(weatherData.soil_moisture.status)}
                    <p className="text-sm">{weatherData.soil_moisture.advisory}</p>
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>{t('Moisture data unavailable')}</p>
                </div>
              )}
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" />
                {weatherData.soil_moisture?.source}
              </p>
            </CardContent>
          </Card>

        </div>
      )}

      {(rgb || ndviTile) && (
        <Card>
          <CardHeader>
            <CardTitle>{t('Satellite Imagery')}</CardTitle>
            <CardDescription>{t('View RGB or NDVI satellite imagery for your region')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={view === 'rgb' ? 'default' : 'outline'}
                onClick={() => setView('rgb')}
              >
                {t('RGB View')}
              </Button>
              <Button
                variant={view === 'ndvi' ? 'default' : 'outline'}
                onClick={() => setView('ndvi')}
              >
                {t('NDVI View')}
              </Button>
            </div>
            <div className="rounded-lg overflow-hidden border min-h-[300px]">
              <SatelliteMap
                baseLayer={view === 'rgb' ? rgb : ndviTile}
                boundaryLayer={boundary}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
