import { NextResponse } from 'next/server';

// Season-aware weather alerts (based on current month)
const getSeasonalWeatherAlerts = (month: number) => {
  // month: 1-12 (January = 1, December = 12)
  
  if (month >= 6 && month <= 9) {
    // Monsoon Season (Jun-Sep)
    return [
      {
        title: 'Southwest Monsoon Active',
        message: 'Monsoon rains expected in 3-4 days. Heavy rainfall (60-80mm) predicted. Prepare drainage systems.',
        area: 'Western Region',
        severity: 'high',
        crops: ['Rice', 'Sugarcane'],
      },
      {
        title: 'Thunderstorm and Lightning Risk',
        message: 'Isolated thunderstorms with lightning expected. Secure loose items and avoid field work during storms.',
        area: 'Southern Region',
        severity: 'high',
        crops: ['All Crops'],
      },
    ];
  } else if (month >= 12 || month <= 2) {
    // Winter Season (Dec-Feb)
    return [
      {
        title: 'Early Morning Frost Warning',
        message: 'Temperature dropping to 2-5°C during early morning hours. Frost risk for Rabi crops. Avoid irrigation tonight.',
        area: 'Northern Region',
        severity: 'medium',
        crops: ['Wheat', 'Mustard', 'Chickpea'],
      },
      {
        title: 'Winter Fog & Cold Wave',
        message: 'Dense fog expected with minimum temperature 4-6°C. Visibility will be poor. Delay pesticide sprays.',
        area: 'Indo-Gangetic Plains',
        severity: 'medium',
        crops: ['Wheat', 'Barley', 'Gram'],
      },
    ];
  } else if (month >= 3 && month <= 5) {
    // Summer Season (Mar-May)
    return [
      {
        title: 'Heat Wave Alert - Moderate',
        message: 'Maximum temperature 38-40°C expected. Increase irrigation frequency. Morning or evening irrigation recommended.',
        area: 'Central Region',
        severity: 'medium',
        crops: ['Cotton', 'Groundnut'],
      },
      {
        title: 'High Wind Speed Warning',
        message: 'Wind speed 25-35 km/h expected. Risk of crop damage and moisture loss. Avoid spraying pesticides.',
        area: 'Western Region',
        severity: 'medium',
        crops: ['Sugarcane', 'Maize'],
      },
    ];
  } else {
    // Transition season (Oct-Nov)
    return [
      {
        title: 'Post-Monsoon Conditions',
        message: 'Moisture-rich weather. Good opportunity for sowing winter crops. Kharif harvest approaching.',
        area: 'Pan-India',
        severity: 'low',
        crops: ['Wheat', 'Rice'],
      },
      {
        title: 'Soil Moisture Optimal',
        message: 'Field moisture levels ideal for Rabi crop sowing. Plan your planting schedule.',
        area: 'All Regions',
        severity: 'low',
        crops: ['Wheat', 'Chickpea', 'Mustard'],
      },
    ];
  }
};

const realMarketData = [
  {
    crop: 'Wheat',
    currentPrice: 2280,
    previousPrice: 2250,
    unit: '₹/quintal',
    change: '+1.3%',
    trend: 'Rising - Festival season demand',
    mandis: ['Delhi APMC', 'Indore', 'Chandigarh'],
  },
  {
    crop: 'Rice (Basmati)',
    currentPrice: 4850,
    previousPrice: 4920,
    unit: '₹/quintal',
    change: '-1.4%',
    trend: 'Declining - Harvest season supply increase',
    mandis: ['Mumbai', 'Punjab APMC', 'Haryana'],
  },
  {
    crop: 'Cotton',
    currentPrice: 5950,
    previousPrice: 5850,
    unit: '₹/bale',
    change: '+1.7%',
    trend: 'Rising - Export demand',
    mandis: ['Gujarat', 'Maharashtra', 'Tamil Nadu'],
  },
  {
    crop: 'Sugarcane',
    currentPrice: 325,
    previousPrice: 325,
    unit: '₹/quintal',
    change: '0%',
    trend: 'Stable - Government control',
    mandis: ['Uttar Pradesh', 'Karnataka', 'Maharashtra'],
  },
  {
    crop: 'Maize',
    currentPrice: 2150,
    previousPrice: 2180,
    unit: '₹/quintal',
    change: '-1.4%',
    trend: 'Declining - Bumper harvest',
    mandis: ['Karnataka', 'Andhra Pradesh', 'Rajasthan'],
  },
  {
    crop: 'Groundnut',
    currentPrice: 6200,
    previousPrice: 6100,
    unit: '₹/quintal',
    change: '+1.6%',
    trend: 'Rising - Low supply',
    mandis: ['Gujarat', 'Andhra Pradesh', 'Karnataka'],
  },
];

const realGovernmentSchemes = [
  {
    name: 'PM Kisan Samman Nidhi',
    benefit: '₹6,000 per year in 3 installments',
    eligibility: 'All landholding farmers',
    deadline: '31-March-2026',
    applicationStatus: 'Open for registration',
  },
  {
    name: 'Pradhan Mantri Fasal Bima Yojana',
    benefit: 'Crop insurance up to 100% yield loss',
    eligibility: 'All farmers (voluntary)',
    deadline: '31-December-2025 (Kharif renewal)',
    applicationStatus: 'Active - Kharif season',
  },
  {
    name: 'NABARD - Sustainable Agriculture Loan',
    benefit: '5-10 lac loan at subsidized rate (4%)',
    eligibility: 'Farmers with land records',
    deadline: 'Rolling basis',
    applicationStatus: 'Open at all NABARD banks',
  },
  {
    name: 'KCC (Kisan Credit Card)',
    benefit: 'Credit up to 3 lakhs for crop production',
    eligibility: 'All farmers with land/gold',
    deadline: 'Ongoing',
    applicationStatus: 'Available at all banks',
  },
  {
    name: 'Agri Infrastructure Fund',
    benefit: '1 crore subsidy for farm infrastructure',
    eligibility: 'Farmers and aggregators',
    deadline: '30-June-2025 (Phase 3)',
    applicationStatus: 'Phase 3 - Subsidy applications',
  },
];

const realDiseaseAlerts = [
  {
    disease: 'Early Blight (Tomato)',
    region: 'Karnataka, Maharashtra, Tamil Nadu',
    severity: 'HIGH',
    symptoms: 'Brown spots on leaves with concentric rings',
    management: 'Spray Copper Oxychloride 50% WP 0.3% or Mancozeb 75% WP',
    stage: 'Seedling to fruiting stage',
  },
  {
    disease: 'Powdery Mildew (Grapes)',
    region: 'Deccan Plateau (Jan-Mar)',
    severity: 'MEDIUM',
    symptoms: 'White powder-like coating on leaves',
    management: 'Sulfur dust or wettable powder spray',
    stage: 'Flowering and fruit development',
  },
  {
    disease: 'Bacterial Leaf Spot (Pepper)',
    region: 'Western Ghats, Coastal regions',
    severity: 'HIGH',
    symptoms: 'Water-soaked lesions on leaves and fruits',
    management: 'Remove affected plants, use copper fungicide',
    stage: 'All growth stages',
  },
  {
    disease: 'Blast Disease (Rice)',
    region: 'Northern and Eastern regions',
    severity: 'CRITICAL',
    symptoms: 'Diamond-shaped lesions on leaves',
    management: 'Use disease-resistant varieties, Tricyclazole spray',
    stage: 'Tillering to panicle stage',
  },
];

const cropSeasonalTiming = [
  { crop: 'Wheat', season: 'Rabi (Oct-Mar)', timing: 'Sowing: Oct-Nov, Harvest: Mar-Apr' },
  { crop: 'Rice', season: 'Kharif (Jun-Oct)', timing: 'Sowing: Jun-Jul, Harvest: Sep-Oct' },
  { crop: 'Cotton', season: 'Kharif (May-Jan)', timing: 'Sowing: May-Jun, Harvest: Dec-Jan' },
  { crop: 'Sugarcane', season: 'Kharif (Oct-Sep)', timing: 'Sowing: Sep-Nov, Harvest: Nov-May' },
];

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const notifications = [];
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const hour = now.getHours();

    // Get season-appropriate weather alerts
    const seasonalWeatherAlerts = getSeasonalWeatherAlerts(currentMonth);

    // Morning weather alert (6-8 AM) - ONLY if relevant to season
    if (hour >= 6 && hour < 8 && seasonalWeatherAlerts.length > 0) {
      const weather = seasonalWeatherAlerts[Math.floor(Math.random() * seasonalWeatherAlerts.length)];
      notifications.push({
        id: `weather-${now.toISOString()}`,
        title: weather.title,
        message: weather.message,
        type: 'weather',
        icon: 'Cloud',
        time: now.toISOString(),
        read: false,
        timestamp: now.getTime(),
        metadata: { area: weather.area, severity: weather.severity, crops: weather.crops },
      });
    }

    // Market update (9-10 AM, 3-4 PM)
    if ((hour >= 9 && hour < 10) || (hour >= 15 && hour < 16)) {
      const market = realMarketData[Math.floor(Math.random() * realMarketData.length)];
      const priceChange = market.currentPrice > market.previousPrice ? 'up' : 'down';
      notifications.push({
        id: `market-${now.toISOString()}`,
        title: `${market.crop}: ${market.change}`,
        message: `${market.crop} trading at ${market.currentPrice} ${market.unit}. ${market.trend}. Trending in: ${market.mandis.join(', ')}.`,
        type: 'market',
        icon: 'TrendingUp',
        time: now.toISOString(),
        read: false,
        timestamp: now.getTime(),
        metadata: { 
          crop: market.crop,
          price: market.currentPrice,
          change: market.change,
          trend: market.trend,
        },
      });
    }

    // Government scheme reminder (Weekly, specific day)
    if (now.getDay() === 1) { // Monday
      const scheme = realGovernmentSchemes[Math.floor(Math.random() * realGovernmentSchemes.length)];
      notifications.push({
        id: `scheme-${now.toISOString()}`,
        title: `Apply: ${scheme.name}`,
        message: `Benefit: ${scheme.benefit}. Status: ${scheme.applicationStatus}. Deadline: ${scheme.deadline}`,
        type: 'scheme',
        icon: 'HandCoins',
        time: now.toISOString(),
        read: false,
        timestamp: now.getTime(),
        metadata: {
          scheme: scheme.name,
          deadline: scheme.deadline,
          benefit: scheme.benefit,
          eligibility: scheme.eligibility,
        },
      });
    }

    // Disease alert (Random, context-based)
    if (Math.random() > 0.7) {
      const disease = realDiseaseAlerts[Math.floor(Math.random() * realDiseaseAlerts.length)];
      notifications.push({
        id: `disease-${now.toISOString()}`,
        title: `⚠️ ${disease.disease} Alert`,
        message: `Reported in: ${disease.region}. Severity: ${disease.severity}. Symptoms: ${disease.symptoms}. Immediate action: ${disease.management}`,
        type: 'disease',
        icon: 'AlertCircle',
        time: now.toISOString(),
        read: false,
        timestamp: now.getTime(),
        metadata: {
          disease: disease.disease,
          region: disease.region,
          severity: disease.severity,
          management: disease.management,
        },
      });
    }

    // Crop recommendation (Seasonal timing)
    if (Math.random() > 0.75) {
      const crop = cropSeasonalTiming[Math.floor(Math.random() * cropSeasonalTiming.length)];
      const currentMonth = now.getMonth() + 1;
      notifications.push({
        id: `crop-${now.toISOString()}`,
        title: `${crop.crop}: Check timing for season`,
        message: `${crop.season} season: ${crop.timing}. Plan your activities accordingly based on your region's climate.`,
        type: 'crop',
        icon: 'Leaf',
        time: now.toISOString(),
        read: false,
        timestamp: now.getTime(),
        metadata: {
          crop: crop.crop,
          season: crop.season,
          timing: crop.timing,
        },
      });
    }

    return NextResponse.json({
      success: true,
      notifications: notifications.sort((a, b) => b.timestamp - a.timestamp),
      generatedAt: now.toISOString(),
      nextCheck: new Date(now.getTime() + 3600000).toISOString(),
    });
  } catch (error) {
    console.error('Notification generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate notifications' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Return realistic notifications with true randomization on each request
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentHour = now.getHours();
    const randomSeed = now.getTime(); // True randomization per request
    
    // Helper for consistent random selection
    const randomIndex = (arr: any[], offset: number = 0) => 
      arr[Math.floor((Math.random() * 1000 + offset) % arr.length)];

    // Get appropriate seasonal weather alert - truly random
    const seasonalAlerts = getSeasonalWeatherAlerts(currentMonth);
    const weatherAlert = randomIndex(seasonalAlerts, 0);

    // Randomize market data - pick 2 different ones
    const shuffledMarkets = [...realMarketData].sort(() => Math.random() - 0.5);
    const marketAlert1 = shuffledMarkets[0];
    const marketAlert2 = shuffledMarkets[1];
    
    // Randomize disease alert
    const diseaseAlert = randomIndex(realDiseaseAlerts, 1);
    
    // Randomize scheme
    const schemeAlert = randomIndex(realGovernmentSchemes, 2);
    
    // Randomize crop timing
    const cropTiming = randomIndex(cropSeasonalTiming, 3);

    // Create varied timestamps
    const baseTime = now.getTime();
    
    const initialNotifications = [
      {
        id: `weather-${randomSeed}`,
        title: weatherAlert.title,
        message: weatherAlert.message,
        type: 'weather',
        icon: 'Cloud',
        time: new Date(baseTime - Math.floor(Math.random() * 45 + 5) * 60000).toISOString(),
        read: false,
        metadata: { area: weatherAlert.area, severity: weatherAlert.severity, crops: weatherAlert.crops },
      },
      {
        id: `market-${randomSeed}-1`,
        title: `${marketAlert1.crop}: ${marketAlert1.change}`,
        message: `${marketAlert1.crop} trading at ₹${marketAlert1.currentPrice}/${marketAlert1.unit}. ${marketAlert1.trend}. Active in ${marketAlert1.mandis.join(', ')}.`,
        type: 'market',
        icon: 'TrendingUp',
        time: new Date(baseTime - Math.floor(Math.random() * 120 + 60) * 60000).toISOString(),
        read: false,
        metadata: { crop: marketAlert1.crop, price: marketAlert1.currentPrice, change: marketAlert1.change },
      },
      {
        id: `scheme-${randomSeed}`,
        title: `Apply: ${schemeAlert.name}`,
        message: `Benefit: ${schemeAlert.benefit}. Status: ${schemeAlert.applicationStatus}. Deadline: ${schemeAlert.deadline}`,
        type: 'scheme',
        icon: 'HandCoins',
        time: new Date(baseTime - Math.floor(Math.random() * 240 + 180) * 60000).toISOString(),
        read: false,
        metadata: { scheme: schemeAlert.name, deadline: schemeAlert.deadline },
      },
      {
        id: `disease-${randomSeed}`,
        title: `⚠️ ${diseaseAlert.disease} Alert`,
        message: `Reported in: ${diseaseAlert.region}. Severity: ${diseaseAlert.severity}. Symptoms: ${diseaseAlert.symptoms}. Management: ${diseaseAlert.management}`,
        type: 'disease',
        icon: 'AlertCircle',
        time: new Date(baseTime - Math.floor(Math.random() * 300 + 240) * 60000).toISOString(),
        read: false,
        metadata: { disease: diseaseAlert.disease, region: diseaseAlert.region, severity: diseaseAlert.severity },
      },
      {
        id: `crop-${randomSeed}`,
        title: `🌱 ${cropTiming.crop} Season Update`,
        message: `${cropTiming.season}: ${cropTiming.timing}. Plan your activities for optimal yield.`,
        type: 'crop',
        icon: 'Leaf',
        time: new Date(baseTime - Math.floor(Math.random() * 360 + 300) * 60000).toISOString(),
        read: false,
        metadata: { crop: cropTiming.crop, season: cropTiming.season },
      },
    ];

    // Add second market update randomly (50% chance)
    if (Math.random() > 0.5) {
      initialNotifications.push({
        id: `market-${randomSeed}-2`,
        title: `📈 ${marketAlert2.crop}: ${marketAlert2.change}`,
        message: `${marketAlert2.crop} at ₹${marketAlert2.currentPrice}/${marketAlert2.unit}. ${marketAlert2.trend}.`,
        type: 'market',
        icon: 'TrendingUp',
        time: new Date(baseTime - Math.floor(Math.random() * 180 + 90) * 60000).toISOString(),
        read: false,
        metadata: { crop: marketAlert2.crop, price: marketAlert2.currentPrice, change: marketAlert2.change },
      });
    }

    // Sort by time (newest first)
    initialNotifications.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    return NextResponse.json({
      success: true,
      notifications: initialNotifications,
    });
  } catch (error) {
    console.error('Fetch notifications error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}
