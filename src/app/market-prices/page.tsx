'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Tractor, Package } from 'lucide-react';
import { machineryPrices, fertilizerPrices } from '@/lib/placeholder-data';
import { useEffect, useState } from 'react';
import { getAvailableCommodities } from '@/ai/services/market-prices';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useTranslation } from '@/hooks/use-translation';

export default function MarketPricesPage() {
  const { t } = useTranslation();

  const [cropPrices, setCropPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commodity, setCommodity] = useState('tomato');
  const [commodities, setCommodities] = useState<string[]>([]);

  useEffect(() => {
    // Get available commodities from backend util (static list)
    setCommodities([
      'tomato','onion','potato','rice','wheat','paddy','cotton','maize','groundnut','soybean','chilli','turmeric','banana','mango','apple','grapes','orange','coconut','arecanut','pepper','cardamom','jowar','bajra','ragi','moong','urad','chana','toor','mustard','sunflower','castor','copra','jute','coffee','tea','rubber','brinjal','cabbage','cauliflower','carrot','ginger','garlic'
    ]);
  }, []);

  const fetchPrices = async (selectedCommodity: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/market-prices?commodity=${encodeURIComponent(selectedCommodity)}`);
      const data = await res.json();
      if (data && data.prices) {
        setCropPrices(data.prices);
      } else {
        setError('No price data available.');
      }
    } catch (e) {
      setError('Failed to fetch market prices.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPrices(commodity);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-headline">{t('Market Prices', 'Market Prices')}</h1>
        <p className="text-muted-foreground mt-1">{t('Latest prices for crops, machinery, and fertilizers.', 'Latest prices for crops, machinery, and fertilizers.')}</p>
      </div>

      <Tabs defaultValue="crops" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
          <TabsTrigger value="crops">
            <TrendingUp className="mr-2 h-4 w-4" /> {t('Crops', 'Crops')}
          </TabsTrigger>
          <TabsTrigger value="machinery">
            <Tractor className="mr-2 h-4 w-4" /> {t('Machinery', 'Machinery')}
          </TabsTrigger>
          <TabsTrigger value="fertilizers">
            <Package className="mr-2 h-4 w-4" /> {t('Fertilizers', 'Fertilizers')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="crops">
          <div className="flex flex-col md:flex-row md:items-end gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('Select Crop', 'Select Crop')}</label>
              <select
                className="border rounded px-3 py-2 min-w-[180px]"
                value={commodity}
                onChange={e => setCommodity(e.target.value)}
              >
                {commodities.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
            <button
              className="bg-primary text-white px-4 py-2 rounded shadow hover:bg-primary/90"
              onClick={() => fetchPrices(commodity)}
              disabled={loading}
              >
                {t('Search', 'Search')}
            </button>
          </div>
          <Card>
            <CardHeader>
                <CardTitle>{t('Crop Prices', 'Crop Prices')}</CardTitle>
                <CardDescription>{t('Mandarin prices for today in your local region.', 'Mandarin prices for today in your local region.')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('Crop', 'Crop')}</TableHead>
                    <TableHead>{t('Variety', 'Variety')}</TableHead>
                    <TableHead>{t('Market', 'Market')}</TableHead>
                    <TableHead className="text-right">{t('Price (per quintal)', 'Price (per quintal)')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={4}>{t('Loading...', 'Loading...')}</TableCell></TableRow>
                  ) : error ? (
                    <TableRow><TableCell colSpan={4}>{t(error, error)}</TableCell></TableRow>
                  ) : cropPrices.length === 0 ? (
                    <TableRow><TableCell colSpan={4}>{t('No price data available.', 'No price data available.')}</TableCell></TableRow>
                  ) : (
                    cropPrices.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{item.commodity}</TableCell>
                        <TableCell>{item.variety || '-'}</TableCell>
                        <TableCell>{item.market || '-'}</TableCell>
                        <TableCell className="text-right font-semibold">₹ {item.modalPrice?.toLocaleString('en-IN') || '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="machinery">
          <Card>
            <CardHeader>
                <CardTitle>{t('Agri-Machinery Prices', 'Agri-Machinery Prices')}</CardTitle>
                <CardDescription>{t('Rental and purchase prices for agricultural equipment.', 'Rental and purchase prices for agricultural equipment.')}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {machineryPrices.map((item) => {
                      const machineryImage = PlaceHolderImages.find(p => p.id === item.imageId);
                      return (
                        <Card key={item.id} className="overflow-hidden">
                          {machineryImage && machineryImage.imageUrl ? (
                            <Image src={machineryImage.imageUrl} alt={item.name} width={400} height={200} className="w-full h-40 object-cover" data-ai-hint={machineryImage.imageHint} />
                          ) : (
                            <div className="w-full h-40 bg-gray-200 flex items-center justify-center text-gray-500 text-sm">{t('Image coming soon', 'Image coming soon')}</div>
                          )}
                          <div className='p-4'>
                            <h3 className="font-bold text-lg">{item.name}</h3>
                            <div className='mt-2 space-y-2'>
                              <p className="text-sm">
                                <span className='font-semibold'>{t('Purchase Price:', 'Purchase Price:')} </span>
                                <span className='font-mono'>₹{item.purchasePrice.toLocaleString('en-IN')}</span>
                              </p>
                              <p className="text-sm">
                                <span className='font-semibold'>{t('Rental Price:', 'Rental Price:')} </span>
                                <span className='font-mono'>₹{item.rentalPrice.toLocaleString('en-IN')} / {t('day', 'day')}</span>
                              </p>
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fertilizers">
          <Card>
            <CardHeader>
                <CardTitle>{t('Fertilizer Prices', 'Fertilizer Prices')}</CardTitle>
                <CardDescription>{t('Prices for common fertilizers.', 'Prices for common fertilizers.')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('Name', 'Name')}</TableHead>
                    <TableHead>{t('Type', 'Type')}</TableHead>
                    <TableHead className="text-right">{t('Price (per 50kg bag)', 'Price (per 50kg bag)')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fertilizerPrices.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell><Badge variant="outline">{item.type}</Badge></TableCell>
                      <TableCell className="text-right font-semibold">₹ {item.price.toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
