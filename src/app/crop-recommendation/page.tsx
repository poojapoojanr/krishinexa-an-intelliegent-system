'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Sprout, Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/use-translation';
import LocationSelector from '@/components/location-selector';
import { useLocation } from '@/hooks/use-location';

/* ---------------- Types ---------------- */
type Recommendation = {
  crop: string;
  confidence: number;
  reason: string;
};

/* ---------------- Emoji Map ---------------- */
const cropEmojiMap: Record<string, string> = {
  rice: '🌾',
  wheat: '🌾',
  maize: '🌽',
  cotton: '🧵',
  sugarcane: '🎋',
  coffee: '☕',
  jute: '🧶',
  apple: '🍎',
  grapes: '🍇',
  banana: '🍌',
  coconut: '🥥',
  watermelon: '🍉',
  default: '🌱',
};

export default function CropRecommendationPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { selectedDistrict } = useLocation();

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Recommendation[] | null>(null);

  const [formData, setFormData] = useState({
    N: '',
    P: '',
    K: '',
    temperature: '',
    humidity: '',
    ph: '',
    rainfall: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDistrict) {
      toast({
        variant: 'destructive',
        title: 'District required',
        description: 'Please select a district before prediction',
      });
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      const res = await fetch('http://localhost:8000/crop-recommendation/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          N: Number(formData.N),
          P: Number(formData.P),
          K: Number(formData.K),
          temperature: Number(formData.temperature),
          humidity: Number(formData.humidity),
          ph: Number(formData.ph),
          rainfall: Number(formData.rainfall),
        }),
      });

      const data = await res.json();
      // Support new API: recommendations array
      if (data.recommendations && Array.isArray(data.recommendations)) {
        setResults(
          data.recommendations.map((rec: any) => ({
            crop: rec.crop,
            confidence: rec.confidence,
            reason: rec.why || 'Recommended by ML model',
          }))
        );
      } else {
        // Fallback for old API
        setResults([
          {
            crop: data.recommended_crop,
            confidence: 99,
            reason: 'Recommended by ML model',
          },
        ]);
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to get crop recommendation',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      {/* Header */}
      <div className="text-center mb-8">
        <Sprout className="mx-auto h-12 w-12 text-primary" />
        <h1 className="text-3xl font-bold mt-2">
          {t('Crop Recommendation', 'Crop Recommendation')}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t('ML-based crop prediction using soil & climate parameters', 'ML-based crop prediction using soil & climate parameters')}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Input Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t('Input Parameters', 'Input Parameters')}</CardTitle>
            <CardDescription>
              {t('Enter soil nutrient and weather details', 'Enter soil nutrient and weather details')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <LocationSelector />

              <InputField label={t('Nitrogen (kg/ha)', 'Nitrogen (kg/ha)')} name="N" value={formData.N} min={0} max={140} step="1" onChange={handleChange} />
              <InputField label={t('Phosphorus (kg/ha)', 'Phosphorus (kg/ha)')} name="P" value={formData.P} min={5} max={145} step="1" onChange={handleChange} />
              <InputField label={t('Potassium (kg/ha)', 'Potassium (kg/ha)')} name="K" value={formData.K} min={5} max={205} step="1" onChange={handleChange} />
              <InputField label={t('Temperature (°C)', 'Temperature (°C)')} name="temperature" value={formData.temperature} min={8} max={45} step="0.1" onChange={handleChange} />
              <InputField label={t('Humidity (%)', 'Humidity (%)')} name="humidity" value={formData.humidity} min={14} max={100} step="1" onChange={handleChange} />
              <InputField label={t('Soil pH', 'Soil pH')} name="ph" value={formData.ph} min={3.5} max={9.5} step="0.1" onChange={handleChange} />
              <InputField label={t('Rainfall (mm)', 'Rainfall (mm)')} name="rainfall" value={formData.rainfall} min={20} max={300} step="1" onChange={handleChange} />

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('Predicting...', 'Predicting...')}
                  </>
                ) : (
                  t('Get Recommendation', 'Get Recommendation')
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Result Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t('Recommendation Result', 'Recommendation Result')}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {t('Recommendations ranked using ML probability scores', 'Recommendations ranked using ML probability scores')}
            </p>
            {selectedDistrict && (
              <span className="mt-2 inline-block text-xs bg-muted px-2 py-1 rounded">
                {t('District', 'District')}: {selectedDistrict.district}
              </span>
            )}

          </CardHeader>

          <CardContent>
            {!results && !loading && (
              <p className="text-muted-foreground text-center">
                {t('Prediction result will appear here', 'Prediction result will appear here')}
              </p>
            )}

            {loading && (
              <Loader2 className="h-10 w-10 mx-auto animate-spin" />
            )}

            {results && (
              <div className="space-y-4 transition-opacity duration-500">
                {results.map((item, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border transition-all duration-500
                      animate-in fade-in slide-in-from-bottom-4
                      ${index === 0
                        ? 'bg-green-50 border-green-400 shadow-md'
                        : 'bg-muted'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {cropEmojiMap[item.crop.toLowerCase()] || cropEmojiMap.default}
                      </span>

                      <h3 className="text-xl font-bold capitalize text-primary">
                        #{index + 1} {item.crop}
                      </h3>

                      {index === 0 && (
                        <span className="ml-auto text-xs bg-green-600 text-white px-2 py-1 rounded-full">
                          {t('Best Match', 'Best Match')} ⭐
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground mt-1">
                      {t('Confidence', 'Confidence')}: <strong>{item.confidence}%</strong>
                    </p>

                    {/* Confidence Bar */}
                    <div className="mt-2 h-2 w-full bg-gray-200 rounded-full">
                      <div
                        className="h-2 bg-green-500 rounded-full transition-all duration-700"
                        style={{ width: `${item.confidence}%` }}
                      />
                    </div>

                    <p className="mt-3 text-sm">
                      <strong>{t('Why it suits', 'Why it suits')}:</strong> {item.reason}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* -------- Reusable Input Field -------- */
function InputField({
  label,
  name,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  min: number;
  max: number;
  step: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input
        type="number"
        name={name}
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        required
      />
      <p className="text-xs text-muted-foreground">
        Allowed range: {min} – {max}
      </p>
    </div>
  );
}
