'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { seasonalPlans } from '@/lib/seasonal-plans';
import { Sprout, Calendar, Cloud, Droplets, Leaf, Bug, TrendingUp } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

const ALL_CROPS = [
  'Rice',
  'Wheat',
  'Maize',
  'Cotton',
  'Sugarcane',
  'Millet',
  'Pulses',
  'Groundnut',
  'Soybean',
  'Coffee',
];

export default function SeasonalPlannerPage() {
  const { t } = useTranslation();
  const [cropOptions, setCropOptions] = useState<string[]>([]);
  const [selectedCrop, setSelectedCrop] = useState<string>('');
  const [generatedCrop, setGeneratedCrop] = useState<string>('');

  useEffect(() => {
    const stored = localStorage.getItem('recommendedCrops');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setCropOptions(parsed);
        return;
      }
    }
    setCropOptions(ALL_CROPS);
  }, []);

  const handleGenerate = () => {
    setGeneratedCrop(selectedCrop);
  };

  const plan = generatedCrop && seasonalPlans[generatedCrop.toLowerCase()];

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      {/* Header */}
      <div className="text-center">
        <Sprout className="mx-auto h-10 w-10 text-primary" />
        <h1 className="text-3xl font-bold mt-2">{t('Seasonal Planner', 'Seasonal Planner')}</h1>
        <p className="text-muted-foreground">
          {t('Complete crop-wise seasonal guidance for optimal yield', 'Complete crop-wise seasonal guidance for optimal yield')}
        </p>
      </div>

      {/* Crop Selection */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('Select a crop and generate a detailed seasonal plan', 'Select a crop and generate a detailed seasonal plan')}
          </p>

          <Select value={selectedCrop} onValueChange={setSelectedCrop}>
            <SelectTrigger>
              <SelectValue placeholder={t('Select Crop', 'Select Crop')} />
            </SelectTrigger>
            <SelectContent>
              {cropOptions.map(crop => (
                <SelectItem key={crop} value={crop}>
                  {crop}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            className="w-full"
            disabled={!selectedCrop}
            onClick={handleGenerate}
          >
            {t('Generate Plan', 'Generate Plan')}
          </Button>
        </CardContent>
      </Card>

      {/* Seasonal Plan Output */}
      {plan && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold flex items-center gap-2 mb-6">
              <Calendar className="h-6 w-6 text-primary" />
              {t('Seasonal Plan for', 'Seasonal Plan for')} {generatedCrop}
            </h2>

            <div className="grid gap-6">
              {plan.map((phase, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{phase.month}</CardTitle>
                        <p className="text-sm text-muted-foreground font-semibold mt-1">
                          {phase.stage}
                        </p>
                      </div>
                      {phase.yield && (
                        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {phase.yield}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    {/* Main Activity */}
                    <div className="border-l-4 border-blue-500 pl-4 py-2">
                      <p className="font-semibold text-blue-900">📋 Activity</p>
                      <p className="text-gray-700">{phase.activity}</p>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Temperature */}
                      {phase.temperature && (
                        <div className="bg-orange-50 p-3 rounded-lg">
                          <p className="flex items-center gap-2 font-semibold text-orange-900 mb-1">
                            🌡️ Temperature
                          </p>
                          <p className="text-sm text-orange-800">{phase.temperature}</p>
                        </div>
                      )}

                      {/* Rainfall */}
                      {phase.rainfall && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="flex items-center gap-2 font-semibold text-blue-900 mb-1">
                            <Cloud className="h-4 w-4" /> Rainfall
                          </p>
                          <p className="text-sm text-blue-800">{phase.rainfall}</p>
                        </div>
                      )}

                      {/* Irrigation */}
                      {phase.irrigation && (
                        <div className="bg-cyan-50 p-3 rounded-lg">
                          <p className="flex items-center gap-2 font-semibold text-cyan-900 mb-1">
                            <Droplets className="h-4 w-4" /> Irrigation
                          </p>
                          <p className="text-sm text-cyan-800">{phase.irrigation}</p>
                        </div>
                      )}

                      {/* Fertilizer */}
                      {phase.fertilizer && (
                        <div className="bg-yellow-50 p-3 rounded-lg">
                          <p className="flex items-center gap-2 font-semibold text-yellow-900 mb-1">
                            🌾 Fertilizer
                          </p>
                          <p className="text-sm text-yellow-800">{phase.fertilizer}</p>
                        </div>
                      )}

                      {/* Pest Control */}
                      {phase.pestControl && (
                        <div className="bg-red-50 p-3 rounded-lg">
                          <p className="flex items-center gap-2 font-semibold text-red-900 mb-1">
                            <Bug className="h-4 w-4" /> Pest Control
                          </p>
                          <p className="text-sm text-red-800">{phase.pestControl}</p>
                        </div>
                      )}

                      {/* Soil Prep */}
                      {phase.soilPrep && (
                        <div className="bg-amber-50 p-3 rounded-lg">
                          <p className="flex items-center gap-2 font-semibold text-amber-900 mb-1">
                            ⛏️ Soil Prep
                          </p>
                          <p className="text-sm text-amber-800">{phase.soilPrep}</p>
                        </div>
                      )}

                      {/* Seed Variety */}
                      {phase.seedVariety && (
                        <div className="bg-green-50 p-3 rounded-lg md:col-span-2">
                          <p className="flex items-center gap-2 font-semibold text-green-900 mb-1">
                            <Leaf className="h-4 w-4" /> Seed Variety & Rate
                          </p>
                          <p className="text-sm text-green-800">{phase.seedVariety}</p>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    {phase.notes && (
                      <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg">
                        <p className="font-semibold text-purple-900 mb-1">💡 Important Notes</p>
                        <p className="text-sm text-purple-800">{phase.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
