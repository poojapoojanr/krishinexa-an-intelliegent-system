'use client';

import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Microscope, Sprout, Cloud, TrendingUp, TestTube, Calendar, HandCoins, Home, Mic, MessageSquare, Settings, User } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useTranslation();

  const searchableFeatures = [
    {
      title: t('Dashboard', 'Dashboard'),
      description: t('Overview of your farming activities and quick access to all features', 'Overview of your farming activities and quick access to all features'),
      icon: Home,
      path: '/',
      keywords: ['dashboard', 'home', 'overview', 'main'],
    },
    {
      title: t('Voice Assistant', 'Voice Assistant'),
      description: t('AI-powered multilingual voice assistant for farming queries', 'AI-powered multilingual voice assistant for farming queries'),
      icon: Mic,
      path: '/chatbot',
      keywords: ['voice', 'assistant', 'chatbot', 'ai', 'speak', 'talk', 'kannada', 'hindi'],
    },
    {
      title: t('Disease Detection', 'Disease Detection'),
      description: t('AI-powered crop disease identification', 'AI-powered crop disease identification'),
      icon: Microscope,
      path: '/disease-detection',
      keywords: ['disease', 'detection', 'crop', 'health', 'pest'],
    },
    {
      title: t('Crop Recommendation', 'Crop Recommendation'),
      description: t('Smart crop suggestions based on conditions', 'Smart crop suggestions based on conditions'),
      icon: Sprout,
      path: '/crop-recommendation',
      keywords: ['crop', 'recommendation', 'suggest', 'plant', 'soil'],
    },
    {
      title: t('Soil Health', 'Soil Health'),
      description: t('Soil monitoring and sensor data', 'Soil monitoring and sensor data'),
      icon: TestTube,
      path: '/sensors',
      keywords: ['soil', 'health', 'sensors', 'moisture', 'nutrients', 'npk'],
    },
    {
      title: t('Seasonal Planner', 'Seasonal Planner'),
      description: t('Crop planning calendar and scheduling', 'Crop planning calendar and scheduling'),
      icon: Calendar,
      path: '/seasonal-planner',
      keywords: ['seasonal', 'planner', 'calendar', 'schedule', 'plan'],
    },
    {
      title: t('Weather', 'Weather'),
      description: t('Real-time weather monitoring and alerts', 'Real-time weather monitoring and alerts'),
      icon: Cloud,
      path: '/weather',
      keywords: ['weather', 'rain', 'temperature', 'forecast', 'wind'],
    },
    {
      title: 'Market Prices',
      description: 'Live commodity pricing and market insights',
      icon: TrendingUp,
      path: '/market-prices',
      keywords: ['market', 'prices', 'commodity', 'trading', 'rates', 'mandi'],
    },
    {
      title: 'Loans & Subsidies',
      description: 'Agricultural financing and government schemes',
      icon: HandCoins,
      path: '/loans-subsidies',
      keywords: ['loans', 'subsidies', 'finance', 'government', 'schemes'],
    },
    {
      title: 'Community',
      description: 'Submit feedback, queries, and connect with other farmers',
      icon: MessageSquare,
      path: '/community',
      keywords: ['community', 'feedback', 'query', 'help', 'support', 'contact'],
    },
    {
      title: 'Settings',
      description: 'Manage your preferences and app settings',
      icon: Settings,
      path: '/settings',
      keywords: ['settings', 'preferences', 'configure', 'options'],
    },
    {
      title: 'Profile',
      description: 'View and manage your account information',
      icon: User,
      path: '/profile',
      keywords: ['profile', 'account', 'user', 'info', 'my account'],
    },
  ];

  const query = searchParams.get('q') || '';

  const results = query.trim()
    ? searchableFeatures.filter((feature) => {
        const searchLower = query.toLowerCase();
        return (
          feature.title.toLowerCase().includes(searchLower) ||
          feature.description.toLowerCase().includes(searchLower) ||
          feature.keywords.some((keyword) =>
            keyword.toLowerCase().includes(searchLower)
          )
        );
      })
    : searchableFeatures;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('Back', 'Back')}
          </Button>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {t('Search Results', 'Search Results')}
          </h1>
          <p className="text-lg text-gray-600">
            {query ? (
              <>
                {t('Found', 'Found')} <span className="font-semibold">{results.length}</span> {t('results for', 'results for')} "<span className="font-semibold text-green-700">{query}</span>"
              </>
            ) : (
              t('All Features', 'All Features')
            )}
          </p>
        </div>

        {/* Results Grid */}
        {results.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {results.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.path}
                  className="border-green-200 hover:border-green-400 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => router.push(feature.path)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-green-800">
                          {feature.title}
                        </CardTitle>
                        <CardDescription>
                          {feature.description}
                        </CardDescription>
                      </div>
                      <Icon className="h-8 w-8 text-green-600 flex-shrink-0" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      className="w-full border-green-300 text-green-700 hover:bg-green-50"
                    >
                      {t('Open', 'Open')} →
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-yellow-800">
                {t('No results found', 'No results found')}
              </CardTitle>
              <CardDescription className="text-yellow-700">
                {t('Try searching for different keywords or browse all features', 'Try searching for different keywords or browse all features')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => router.push('/')}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                {t('Go to Dashboard', 'Go to Dashboard')}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
