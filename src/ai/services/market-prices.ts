/**
 * Real Market Prices Service using AgMarkNet API
 * API: data.gov.in - Current Daily Price of Various Commodities from Various Markets (Mandi)
 * 
 * Smart fallback: Karnataka → Neighboring States → National → Estimated prices
 * 
 * This file is imported by server actions, not called directly from client
 */

export interface MarketPrice {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  arrivalDate: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
}

export interface MarketPriceResponse {
  success: boolean;
  prices: MarketPrice[];
  total: number;
  message?: string;
  dataSource?: 'karnataka' | 'neighboring' | 'national' | 'estimated';
}

// Commodity name mapping (common names to API names)
const COMMODITY_MAPPING: Record<string, string> = {
  'rice': 'Rice',
  'paddy': 'Paddy(Dhan)(Common)',
  'wheat': 'Wheat',
  'tomato': 'Tomato',
  'onion': 'Onion',
  'potato': 'Potato',
  'cotton': 'Cotton',
  'sugarcane': 'Sugarcane',
  'maize': 'Maize',
  'groundnut': 'Groundnut',
  'soybean': 'Soyabean',
  'chilli': 'Chilly(Green)',
  'turmeric': 'Turmeric',
  'ginger': 'Ginger(Green)',
  'garlic': 'Garlic',
  'brinjal': 'Brinjal',
  'cabbage': 'Cabbage',
  'cauliflower': 'Cauliflower',
  'carrot': 'Carrot',
  'banana': 'Banana',
  'mango': 'Mango',
  'apple': 'Apple',
  'grapes': 'Grapes',
  'orange': 'Orange',
  'coconut': 'Coconut',
  'arecanut': 'Arecanut(Betelnut/Supari)',
  'pepper': 'Pepper ungarbled',
  'cardamom': 'Cardamom',
  'jowar': 'Jowar(Sorghum)',
  'bajra': 'Bajra(Pearl Millet)',
  'ragi': 'Ragi (Finger Millet)',
  'moong': 'Green Gram (Moong)(Whole)',
  'urad': 'Black Gram (Urd Beans)(Whole)',
  'chana': 'Bengal Gram(Gram)(Whole)',
  'toor': 'Arhar (Tur/Red Gram)(Whole)',
  'mustard': 'Mustard',
  'sunflower': 'Sunflower',
  'castor': 'Castor Seed',
  'copra': 'Copra',
  'jute': 'Jute',
  'coffee': 'Coffee',
  'tea': 'Tea',
  'rubber': 'Rubber',
};

// State name mapping
const STATE_MAPPING: Record<string, string> = {
  'karnataka': 'Karnataka',
  'maharashtra': 'Maharashtra',
  'tamil nadu': 'Tamil Nadu',
  'andhra pradesh': 'Andhra Pradesh',
  'telangana': 'Telangana',
  'kerala': 'Kerala',
  'gujarat': 'Gujarat',
  'rajasthan': 'Rajasthan',
  'madhya pradesh': 'Madhya Pradesh',
  'uttar pradesh': 'Uttar Pradesh',
  'punjab': 'Punjab',
  'haryana': 'Haryana',
  'bihar': 'Bihar',
  'west bengal': 'West Bengal',
  'odisha': 'Odisha',
  'assam': 'Assam',
};

// Neighboring states to Karnataka for fallback
const KARNATAKA_NEIGHBORS = ['Maharashtra', 'Andhra Pradesh', 'Tamil Nadu', 'Telangana', 'Kerala', 'Goa'];

// Estimated MSP/market prices for common commodities (₹ per quintal) - Updated Jan 2026
const ESTIMATED_PRICES: Record<string, { min: number; max: number; modal: number }> = {
  'rice': { min: 2200, max: 2800, modal: 2500 },
  'wheat': { min: 2275, max: 2600, modal: 2400 },
  'paddy': { min: 2183, max: 2500, modal: 2300 },
  'tomato': { min: 1500, max: 4000, modal: 2500 },
  'onion': { min: 1200, max: 3500, modal: 2000 },
  'potato': { min: 800, max: 2000, modal: 1200 },
  'cotton': { min: 6620, max: 7500, modal: 7000 },
  'maize': { min: 2090, max: 2400, modal: 2200 },
  'groundnut': { min: 6377, max: 7500, modal: 6800 },
  'soybean': { min: 4600, max: 5200, modal: 4892 },
  'jowar': { min: 3180, max: 3600, modal: 3371 },
  'bajra': { min: 2500, max: 3000, modal: 2738 },
  'ragi': { min: 3846, max: 4500, modal: 4100 },
  'turmeric': { min: 8000, max: 15000, modal: 12000 },
  'chilli': { min: 12000, max: 25000, modal: 18000 },
  'coconut': { min: 2500, max: 4000, modal: 3200 },
  'arecanut': { min: 45000, max: 55000, modal: 50000 },
  'coffee': { min: 8500, max: 12000, modal: 10000 },
  'banana': { min: 1500, max: 3000, modal: 2200 },
  'mango': { min: 3000, max: 8000, modal: 5000 },
  'grapes': { min: 4000, max: 8000, modal: 6000 },
  'cabbage': { min: 800, max: 2000, modal: 1200 },
  'cauliflower': { min: 1000, max: 2500, modal: 1500 },
  'carrot': { min: 1500, max: 3000, modal: 2000 },
  'brinjal': { min: 1200, max: 2500, modal: 1800 },
  'garlic': { min: 8000, max: 15000, modal: 12000 },
  'ginger': { min: 5000, max: 10000, modal: 7500 },
  'pepper': { min: 40000, max: 55000, modal: 48000 },
  'cardamom': { min: 100000, max: 150000, modal: 125000 },
  'moong': { min: 8558, max: 9500, modal: 9000 },
  'urad': { min: 6950, max: 8000, modal: 7500 },
  'chana': { min: 5440, max: 6500, modal: 6000 },
  'toor': { min: 7000, max: 8500, modal: 7750 },
  'mustard': { min: 5650, max: 6500, modal: 6000 },
  'sunflower': { min: 6760, max: 7500, modal: 7100 },
  'sugarcane': { min: 315, max: 400, modal: 350 },
};

/**
 * Fetch prices from AgMarkNet API for a specific state
 */
async function fetchPricesFromAPI(
  apiKey: string,
  commodity: string,
  state?: string,
  limit: number = 10
): Promise<{ records: any[]; total: number } | null> {
  // Use Karnataka-specific AgMarkNet resource as per user request
  const baseUrl = 'https://api.data.gov.in/resource/35985678-0d79-46b4-9ed6-6f13308a1d24';
  const params = new URLSearchParams({
    'api-key': apiKey,
    'format': 'json',
    'limit': limit.toString(),
    'offset': '0',
    'filters[commodity]': commodity,
  });
  if (state) {
    params.append('filters[state]', state);
  }
  const fullUrl = `${baseUrl}?${params.toString()}`;
  console.log('DEBUG: AgMarkNet API URL:', fullUrl);
  try {
    const response = await fetch(fullUrl, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 3600 },
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (data.records && data.records.length > 0) {
      return { records: data.records, total: data.total || data.records.length };
    }
    return null;
  } catch (error) {
    console.error(`API fetch error for ${state || 'national'}:`, error);
    return null;
  }
}

/**
 * Fetch real market prices with smart fallback
 */
export async function getMarketPrices(
  commodity: string,
  state?: string,
  district?: string,
  limit: number = 10
): Promise<MarketPriceResponse> {
  const apiKey = process.env.AGMARKNET_API_KEY;
  console.log('DEBUG: AGMARKNET_API_KEY =', apiKey ? '[set]' : '[NOT SET]');
  
  if (!apiKey) {
    console.error('AGMARKNET_API_KEY not found');
    return getEstimatedPrices(commodity, state);
  }

  // Normalize commodity name
  let normalizedCommodity = commodity.toLowerCase().trim();
  // If no commodity specified, use 'Tomato' as default to ensure data
  if (!normalizedCommodity) {
    normalizedCommodity = 'tomato';
    console.log('DEBUG: No commodity specified, using default: Tomato');
  }
  const apiCommodity = COMMODITY_MAPPING[normalizedCommodity] || normalizedCommodity;
  console.log('DEBUG: Fetching prices for', apiCommodity, 'state:', state, 'limit:', limit);
  
  // Normalize state if provided
  const targetState = state ? (STATE_MAPPING[state.toLowerCase().trim()] || state) : undefined;
  
  // Strategy 1: Try requested state (default Karnataka)
  const requestedState = targetState || 'Karnataka';
  console.log(`Trying market prices for ${apiCommodity} in ${requestedState}...`);
  
  let result = await fetchPricesFromAPI(apiKey, apiCommodity, requestedState, limit);
  if (result) {
    return formatPriceResponse(result.records, commodity, result.total, 'karnataka');
  }

  // Strategy 2: Try neighboring states
  console.log(`No data for ${requestedState}, trying neighboring states...`);
  for (const neighborState of KARNATAKA_NEIGHBORS) {
    result = await fetchPricesFromAPI(apiKey, apiCommodity, neighborState, limit);
    if (result) {
      return formatPriceResponse(
        result.records, 
        commodity, 
        result.total, 
        'neighboring',
        `Prices from ${neighborState} (nearest available data)`
      );
    }
  }

  // Strategy 3: Try national (no state filter)
  console.log(`No neighboring state data, trying national...`);
  result = await fetchPricesFromAPI(apiKey, apiCommodity, undefined, limit);
  if (result) {
    return formatPriceResponse(
      result.records, 
      commodity, 
      result.total, 
      'national',
      'National average prices (Karnataka data not available today)'
    );
  }

  // Strategy 4: Return estimated prices
  console.log(`No API data available, using estimated prices for ${commodity}`);
  return getEstimatedPrices(commodity, state);
}

/**
 * Format API response to our MarketPrice format
 */
function formatPriceResponse(
  records: any[],
  commodity: string,
  total: number,
  dataSource: 'karnataka' | 'neighboring' | 'national' | 'estimated',
  message?: string
): MarketPriceResponse {

  // Debug: Log raw records for inspection
  if (records && records.length > 0) {
    console.log('AgMarkNet raw records:', JSON.stringify(records.slice(0, 5), null, 2));
  }

  // Use correct field names/case from AgMarkNet API
  // No filtering: return all records as MarketPrice objects
  const prices: MarketPrice[] = records.map((record: any) => ({
    state: record.State || '',
    district: record.District || '',
    market: record.Market || '',
    commodity: record.Commodity || commodity,
    variety: record.Variety || 'Common',
    arrivalDate: record.Arrival_Date || new Date().toLocaleDateString('en-IN'),
    minPrice: parseFloat(record.Min_Price) || 0,
    maxPrice: parseFloat(record.Max_Price) || 0,
    modalPrice: parseFloat(record.Modal_Price) || 0,
  }));

  return {
    success: true,
    prices,
    total,
    dataSource,
    message,
  };
}

/**
 * Get estimated prices when API has no data
 */
function getEstimatedPrices(commodity: string, state?: string): MarketPriceResponse {
  const normalizedCommodity = commodity.toLowerCase().trim();
  const estimates = ESTIMATED_PRICES[normalizedCommodity];
  
  if (!estimates) {
    return {
      success: false,
      prices: [],
      total: 0,
      dataSource: 'estimated',
      message: `No price data available for ${commodity}. Please check the commodity name or try a different crop.`,
    };
  }

  // Create estimated prices for major Karnataka markets
  const karnatakaMarkets = [
    { district: 'Bangalore Rural', market: 'Yeshwanthpur' },
    { district: 'Hubli', market: 'Hubli (Amaragol)' },
    { district: 'Mysore', market: 'Mysore' },
    { district: 'Belgaum', market: 'Belgaum' },
    { district: 'Davangere', market: 'Davangere' },
  ];

  // Add some realistic variation to prices
  const prices: MarketPrice[] = karnatakaMarkets.map((mkt, idx) => {
    const variation = 1 + (Math.random() * 0.1 - 0.05); // ±5% variation
    return {
      state: state || 'Karnataka',
      district: mkt.district,
      market: mkt.market,
      commodity: commodity.charAt(0).toUpperCase() + commodity.slice(1),
      variety: 'Common',
      arrivalDate: new Date().toLocaleDateString('en-IN'),
      minPrice: Math.round(estimates.min * variation),
      maxPrice: Math.round(estimates.max * variation),
      modalPrice: Math.round(estimates.modal * variation),
    };
  });

  return {
    success: true,
    prices,
    total: prices.length,
    dataSource: 'estimated',
    message: `Estimated prices based on MSP and recent market trends (Live API data not available for ${state || 'Karnataka'} today)`,
  };
}

/**
 * Get price trend analysis
 */
export function analyzePriceTrend(prices: MarketPrice[]): {
  avgMinPrice: number;
  avgMaxPrice: number;
  avgModalPrice: number;
  priceRange: string;
  recommendation: string;
} {
  if (prices.length === 0) {
    return {
      avgMinPrice: 0,
      avgMaxPrice: 0,
      avgModalPrice: 0,
      priceRange: 'No data',
      recommendation: 'No price data available for analysis',
    };
  }

  const avgMinPrice = Math.round(prices.reduce((sum, p) => sum + p.minPrice, 0) / prices.length);
  const avgMaxPrice = Math.round(prices.reduce((sum, p) => sum + p.maxPrice, 0) / prices.length);
  const avgModalPrice = Math.round(prices.reduce((sum, p) => sum + p.modalPrice, 0) / prices.length);
  
  const priceVariation = ((avgMaxPrice - avgMinPrice) / avgModalPrice) * 100;
  
  let priceRange: string;
  let recommendation: string;
  
  if (priceVariation < 10) {
    priceRange = 'Stable';
    recommendation = 'Prices are stable across markets. Good time for planned selling.';
  } else if (priceVariation < 25) {
    priceRange = 'Moderate';
    recommendation = 'Moderate price variation. Compare multiple markets before selling.';
  } else {
    priceRange = 'Volatile';
    recommendation = 'High price variation across markets. Research thoroughly and consider holding if possible.';
  }

  return {
    avgMinPrice,
    avgMaxPrice,
    avgModalPrice,
    priceRange,
    recommendation,
  };
}

/**
 * Get list of available commodities
 */
export function getAvailableCommodities(): string[] {
  return Object.keys(COMMODITY_MAPPING);
}

/**
 * Get list of available states
 */
export function getAvailableStates(): string[] {
  return Object.values(STATE_MAPPING);
}
