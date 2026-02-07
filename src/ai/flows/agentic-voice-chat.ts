'use server';
/**
 * @fileOverview Agentic RAG Voice Chatbot for KrishiNexa
 * 
 * A sophisticated voice-enabled AI agent that uses tools (RAG) to provide
 * accurate, real-time information to farmers in 3 languages (English, Hindi, Kannada).
 * 
 * USING FREE PROVIDERS (Ollama → Groq → Gemini fallback)
 * - Main chat: Ollama (FREE, UNLIMITED) or Groq (FREE, high limits)
 * - STT: Web Speech API (browser-side, FREE)
 * - TTS: Web Speech API (browser-side, FREE) or Gemini fallback
 * 
 * Features:
 * - Agentic tool calling (weather, crop recommendation, disease diagnosis, etc.)
 * - Text-to-Speech (TTS) with multi-language support
 * - Conversation memory and context
 * - Multi-provider fallback for 100% uptime
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import wav from 'wav';
import { translateText, detectLanguage as googleDetectLanguage } from '../services/translation';
import { groqChat, isGroqAvailable, GROQ_MODELS, type GroqMessage } from '../groq-client';
import { ollamaChat, isOllamaAvailable, OLLAMA_MODELS } from '../ollama-client';
import { unifiedChat, type AIMessage } from '../unified-ai';
import { 
  LANGUAGE_CONFIG,
  type SupportedLanguage, 
  type AgentMessage
} from '../types/chat-types';

// ==================== SCHEMAS ====================
// Types are now imported from '../types/chat-types'

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  toolCalls: z.array(z.object({
    tool: z.string(),
    args: z.record(z.any()),
    result: z.any().optional(),
  })).optional(),
  timestamp: z.string().optional(),
});

const AgentChatInputSchema = z.object({
  audioDataUri: z.string().optional().describe(
    "Voice input as data URI: data:<mime>;base64,<data>"
  ),
  textInput: z.string().optional().describe(
    "Text input from user (if not using voice)"
  ),
  language: z.enum(['en', 'hi', 'kn']).default('en').describe(
    "User's preferred language: en (English), hi (Hindi), kn (Kannada)"
  ),
  history: z.array(MessageSchema).describe("Conversation history"),
  userContext: z.object({
    location: z.string().optional(),
    district: z.string().optional(),
    state: z.string().optional(),
    crops: z.array(z.string()).optional(),
  }).optional().describe("User's context for personalized responses"),
});
export type AgentChatInput = z.infer<typeof AgentChatInputSchema>;

const AgentChatOutputSchema = z.object({
  history: z.array(MessageSchema).describe("Updated conversation history"),
  responseAudioUri: z.string().optional().describe("TTS audio response"),
  detectedLanguage: z.enum(['en', 'hi', 'kn']).optional(),
  toolsUsed: z.array(z.string()).optional(),
});
export type AgentChatOutput = z.infer<typeof AgentChatOutputSchema>;

// ==================== TOOL DEFINITIONS ====================

// Weather Tool
const weatherTool = ai.defineTool(
  {
    name: 'getWeatherInfo',
    description: 'Get current weather and 7-day forecast for a location. Use this when user asks about weather, rain, temperature, humidity, or farming conditions.',
    inputSchema: z.object({
      city: z.string().describe('City name'),
      state: z.string().optional().describe('State name'),
      country: z.string().default('IN').describe('Country code'),
    }),
    outputSchema: z.object({
      current: z.object({
        temp: z.number(),
        humidity: z.number(),
        windSpeed: z.number(),
        condition: z.string(),
        uvIndex: z.string(),
      }),
      forecast: z.array(z.object({
        day: z.string(),
        temp: z.number(),
        condition: z.string(),
      })),
      alerts: z.array(z.string()),
      location: z.string(),
    }),
  },
  async (input) => {
    const { getWeather } = await import('./weather-service');
    try {
      const weather = await getWeather({
        city: input.city,
        state: input.state,
        country: input.country,
      });
      return {
        current: {
          temp: weather.current.temp,
          humidity: weather.current.humidity,
          windSpeed: weather.current.wind_speed,
          condition: weather.current.main,
          uvIndex: weather.current.uvIndex,
        },
        forecast: weather.forecast.map(f => ({
          day: f.day,
          temp: f.temp,
          condition: f.icon,
        })),
        alerts: weather.alerts.map(a => a.title),
        location: weather.location,
      };
    } catch (error) {
      return {
        current: { temp: 28, humidity: 75, windSpeed: 12, condition: 'Unknown', uvIndex: 'Moderate' },
        forecast: [],
        alerts: ['Unable to fetch weather data'],
        location: input.city,
      };
    }
  }
);

// Crop Recommendation Tool
const cropRecommendationTool = ai.defineTool(
  {
    name: 'recommendCrop',
    description: 'Recommend the best crop to grow based on location, soil type, season, rainfall, and temperature. Use when user asks what to plant or grow.',
    inputSchema: z.object({
      district: z.string().describe('District name in Karnataka'),
      season: z.enum(['Kharif', 'Rabi', 'Summer']).describe('Growing season'),
      soilType: z.string().describe('Soil type like Red Soil, Black Soil, Alluvial'),
      rainfall: z.number().describe('Annual rainfall in mm'),
      temperature: z.number().describe('Average temperature in Celsius'),
    }),
    outputSchema: z.object({
      recommendedCrop: z.string(),
      confidence: z.number(),
      reasoning: z.string(),
    }),
  },
  async (input) => {
    const { recommendCrop } = await import('./karnataka-crop-recommendation');
    try {
      const result = await recommendCrop({
        district: input.district,
        season: input.season,
        soil_type: input.soilType,
        rainfall_mm: input.rainfall,
        temperature_celsius: input.temperature,
      });
      return {
        recommendedCrop: result.recommended_crop,
        confidence: result.confidence_score,
        reasoning: result.reasoning,
      };
    } catch (error) {
      return {
        recommendedCrop: 'Unable to determine',
        confidence: 0,
        reasoning: 'Could not process recommendation',
      };
    }
  }
);

// Disease Diagnosis Tool
const diseaseDiagnosisTool = ai.defineTool(
  {
    name: 'diagnosePlantDisease',
    description: 'Diagnose plant disease from symptoms described by user. Use when user describes plant problems, yellow leaves, spots, wilting, etc.',
    inputSchema: z.object({
      cropName: z.string().describe('Name of the crop with issues'),
      symptoms: z.string().describe('Detailed symptoms described by user'),
    }),
    outputSchema: z.object({
      possibleDiseases: z.array(z.object({
        name: z.string(),
        probability: z.string(),
        treatment: z.string(),
      })),
      immediateActions: z.array(z.string()),
    }),
  },
  async (input) => {
    // Use AI to diagnose based on symptoms
    const { output } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: `You are an expert plant pathologist. Based on the symptoms described, diagnose possible diseases.

Crop: ${input.cropName}
Symptoms: ${input.symptoms}

Provide your response in this exact JSON format:
{
  "possibleDiseases": [
    {"name": "Disease Name", "probability": "High/Medium/Low", "treatment": "Treatment steps"}
  ],
  "immediateActions": ["Action 1", "Action 2"]
}`,
      output: { format: 'json' },
    });
    return output as any || {
      possibleDiseases: [{ name: 'Unknown', probability: 'Low', treatment: 'Consult local agriculture expert' }],
      immediateActions: ['Monitor the plant closely', 'Take photos for expert consultation'],
    };
  }
);

// Seasonal Planner Tool
const seasonalPlannerTool = ai.defineTool(
  {
    name: 'getSeasonalPlan',
    description: 'Get detailed seasonal farming plan including sowing time, tasks, and advice. Use when user asks about farming schedule, when to plant, or seasonal activities.',
    inputSchema: z.object({
      location: z.string().describe('Location (district, state)'),
      cropPreference: z.string().optional().describe('Preferred crop if any'),
    }),
    outputSchema: z.object({
      currentSeason: z.string(),
      recommendedCrop: z.string(),
      sowingWindow: z.string(),
      tasks: z.array(z.object({
        task: z.string(),
        timing: z.string(),
      })),
      advice: z.array(z.string()),
    }),
  },
  async (input) => {
    const { getSeasonalPlan } = await import('./seasonal-planner');
    try {
      const plan = await getSeasonalPlan({
        location: input.location,
        cropPreference: input.cropPreference,
      });
      return {
        currentSeason: plan.currentSeason,
        recommendedCrop: plan.recommendedCrop.cropName,
        sowingWindow: plan.recommendedCrop.sowingWindow,
        tasks: plan.seasonalTasks.map(t => ({ task: t.taskName, timing: t.idealTiming })),
        advice: plan.generalAdvice,
      };
    } catch (error) {
      return {
        currentSeason: 'Unknown',
        recommendedCrop: 'Unable to determine',
        sowingWindow: 'N/A',
        tasks: [],
        advice: ['Please try again later'],
      };
    }
  }
);

// Soil Health Tool
const soilHealthTool = ai.defineTool(
  {
    name: 'getSoilHealthAdvice',
    description: 'Get soil health assessment and nutrient advice based on location. Use when user asks about soil, fertilizers, nutrients, or soil conditions.',
    inputSchema: z.object({
      location: z.string().describe('Location for soil analysis'),
      soilMoisture: z.number().optional().describe('Soil moisture percentage if known'),
      soilTemperature: z.number().optional().describe('Soil temperature in Celsius if known'),
    }),
    outputSchema: z.object({
      moistureStatus: z.string(),
      nutrientAvailability: z.object({
        nitrogen: z.string(),
        phosphorus: z.string(),
        potassium: z.string(),
      }),
      recommendations: z.array(z.string()),
    }),
  },
  async (input) => {
    const { getSoilHealthAdvice } = await import('./soil-health-advisor');
    try {
      const advice = await getSoilHealthAdvice({
        location: input.location,
        soil_moisture: input.soilMoisture || 25,
        soil_temperature: input.soilTemperature || 28,
        cumulative_rainfall_7d: 50,
      });
      return {
        moistureStatus: advice.observed_conditions.soil_moisture_status,
        nutrientAvailability: {
          nitrogen: advice.estimated_nutrients.nitrogen.availability,
          phosphorus: advice.estimated_nutrients.phosphorus.availability,
          potassium: advice.estimated_nutrients.potassium.availability,
        },
        recommendations: [
          advice.estimated_nutrients.nitrogen.action_hint,
          advice.estimated_nutrients.phosphorus.action_hint,
          advice.estimated_nutrients.potassium.action_hint,
        ],
      };
    } catch (error) {
      return {
        moistureStatus: 'Unknown',
        nutrientAvailability: { nitrogen: 'Unknown', phosphorus: 'Unknown', potassium: 'Unknown' },
        recommendations: ['Unable to assess soil health at this time'],
      };
    }
  }
);

// Market Prices Tool - Using Real AgMarkNet API
const marketPricesTool = ai.defineTool(
  {
    name: 'getMarketPrices',
    description: 'Get REAL current market prices for agricultural commodities from AgMarkNet (Government of India). Use when user asks about prices, market rates, selling crops, mandi prices, or commodity rates. Returns live data from various mandis across India.',
    inputSchema: z.object({
      commodity: z.string().describe('Crop/commodity name (e.g., rice, wheat, tomato, onion, cotton)'),
      state: z.string().optional().describe('State name to filter results (e.g., Karnataka, Maharashtra)'),
      district: z.string().optional().describe('District name for more specific results'),
    }),
    outputSchema: z.object({
      commodity: z.string(),
      prices: z.array(z.object({
        state: z.string(),
        district: z.string(),
        market: z.string(),
        variety: z.string(),
        minPrice: z.number(),
        maxPrice: z.number(),
        modalPrice: z.number(),
        date: z.string(),
      })),
      analysis: z.object({
        avgMinPrice: z.number(),
        avgMaxPrice: z.number(),
        avgModalPrice: z.number(),
        priceRange: z.string(),
        recommendation: z.string(),
      }),
      totalMarkets: z.number(),
      message: z.string().optional(),
    }),
  },
  async (input) => {
    // Import real market prices service
    const { getMarketPrices, analyzePriceTrend } = await import('../services/market-prices');
    
    try {
      const result = await getMarketPrices(
        input.commodity,
        input.state,
        input.district,
        10 // Get top 10 markets
      );
      
      if (!result.success || result.prices.length === 0) {
        return {
          commodity: input.commodity,
          prices: [],
          analysis: {
            avgMinPrice: 0,
            avgMaxPrice: 0,
            avgModalPrice: 0,
            priceRange: 'No data',
            recommendation: result.message || `No current prices found for ${input.commodity}. Try checking for a different commodity or state.`,
          },
          totalMarkets: 0,
          message: result.message,
        };
      }
      
      const analysis = analyzePriceTrend(result.prices);
      
      // Include data source info in the message
      let sourceMessage = '';
      if (result.dataSource === 'neighboring') {
        sourceMessage = result.message || 'Prices from neighboring states';
      } else if (result.dataSource === 'national') {
        sourceMessage = 'National average prices (Karnataka data not available)';
      } else if (result.dataSource === 'estimated') {
        sourceMessage = result.message || 'Estimated prices based on MSP';
      }
      
      return {
        commodity: input.commodity,
        prices: result.prices.map(p => ({
          state: p.state,
          district: p.district,
          market: p.market,
          variety: p.variety,
          minPrice: p.minPrice,
          maxPrice: p.maxPrice,
          modalPrice: p.modalPrice,
          date: p.arrivalDate,
        })),
        analysis: {
          ...analysis,
          recommendation: sourceMessage 
            ? `${analysis.recommendation} Note: ${sourceMessage}` 
            : analysis.recommendation,
        },
        totalMarkets: result.total,
        message: sourceMessage || undefined,
      };
    } catch (error) {
      console.error('Market price tool error:', error);
      return {
        commodity: input.commodity,
        prices: [],
        analysis: {
          avgMinPrice: 0,
          avgMaxPrice: 0,
          avgModalPrice: 0,
          priceRange: 'Error',
          recommendation: 'Unable to fetch market prices at this time. Please try again later.',
        },
        totalMarkets: 0,
        message: 'API error occurred',
      };
    }
  }
);

// Government Schemes Tool - Real data from official sources
const governmentSchemesTool = ai.defineTool(
  {
    name: 'getGovernmentSchemes',
    description: 'Get information about government schemes, subsidies, loans for farmers. Use when user asks about schemes, subsidies, PM Kisan, loans, financial help.',
    inputSchema: z.object({
      category: z.enum(['subsidy', 'loan', 'insurance', 'general']).describe('Category of scheme'),
      state: z.string().optional().describe('State for state-specific schemes'),
    }),
    outputSchema: z.object({
      schemes: z.array(z.object({
        name: z.string(),
        description: z.string(),
        eligibility: z.string(),
        benefits: z.string(),
        howToApply: z.string(),
        officialWebsite: z.string().optional(),
        lastUpdated: z.string().optional(),
      })),
    }),
  },
  async (input) => {
    // Real government schemes data - updated January 2026
    const schemes: Record<string, any[]> = {
      'subsidy': [
        {
          name: 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
          description: 'Direct income support of ₹6000 per year to farmer families in 3 equal installments of ₹2000 each',
          eligibility: 'All land-holding farmer families with cultivable land (subject to exclusion criteria for higher income groups)',
          benefits: '₹6000 per year transferred directly to bank account in 3 installments (Apr-Jul, Aug-Nov, Dec-Mar)',
          howToApply: 'Apply online at pmkisan.gov.in, through CSC centers, or via state agriculture department',
          officialWebsite: 'https://pmkisan.gov.in',
          lastUpdated: 'January 2026',
        },
        {
          name: 'Soil Health Card Scheme',
          description: 'Free soil testing and personalized recommendations for nutrient management to improve soil health and crop productivity',
          eligibility: 'All farmers across India',
          benefits: 'Free soil health card with crop-wise fertilizer recommendations, improved yields, reduced input costs',
          howToApply: 'Contact nearest Krishi Vigyan Kendra (KVK) or state agriculture department',
          officialWebsite: 'https://soilhealth.dac.gov.in',
          lastUpdated: 'January 2026',
        },
        {
          name: 'PM-KUSUM (Pradhan Mantri Kisan Urja Suraksha evam Utthaan Mahabhiyan)',
          description: 'Promotes solar energy use in agriculture by providing subsidized solar pumps and grid-connected solar power plants',
          eligibility: 'Farmers with agricultural land for solar pump installation',
          benefits: 'Up to 60% subsidy on solar pumps (30% Central + 30% State), additional income from surplus power',
          howToApply: 'Apply through state nodal agencies or MNRE portal',
          officialWebsite: 'https://mnre.gov.in/pm-kusum',
          lastUpdated: 'January 2026',
        },
        {
          name: 'Sub-Mission on Agricultural Mechanization (SMAM)',
          description: 'Financial assistance for purchase of agricultural machinery and equipment',
          eligibility: 'Individual farmers, FPOs, SHGs, cooperatives',
          benefits: 'Subsidy of 40-50% on tractors, harvesters, and other farm equipment; Custom Hiring Centers',
          howToApply: 'Apply online at agrimachinery.nic.in or through district agriculture office',
          officialWebsite: 'https://agrimachinery.nic.in',
          lastUpdated: 'January 2026',
        },
      ],
      'loan': [
        {
          name: 'Kisan Credit Card (KCC)',
          description: 'Provides affordable and timely credit for agricultural and allied activities including fisheries and animal husbandry',
          eligibility: 'Farmers (owner cultivators, tenant farmers, sharecroppers), fishermen, animal husbandry farmers',
          benefits: 'Credit limit up to ₹3 lakh at 4% effective interest (7% with 3% interest subvention), flexible repayment, personal accident insurance of ₹50,000',
          howToApply: 'Apply at any commercial bank, cooperative bank, or regional rural bank with land documents and ID proof',
          officialWebsite: 'https://pmkisan.gov.in/KCC.aspx',
          lastUpdated: 'January 2026',
        },
        {
          name: 'Agriculture Infrastructure Fund (AIF)',
          description: 'Medium to long-term debt financing for post-harvest management and community farming assets',
          eligibility: 'FPOs, PACS, farmers, agri-entrepreneurs, startups',
          benefits: '3% interest subvention on loans up to ₹2 crore, credit guarantee coverage',
          howToApply: 'Apply through agriinfra.dac.gov.in portal',
          officialWebsite: 'https://agriinfra.dac.gov.in',
          lastUpdated: 'January 2026',
        },
      ],
      'insurance': [
        {
          name: 'PM Fasal Bima Yojana (PMFBY)',
          description: 'Comprehensive crop insurance against yield losses due to natural calamities, pests, and diseases',
          eligibility: 'All farmers (loanee and non-loanee) growing notified crops',
          benefits: 'Coverage for entire crop cycle from sowing to post-harvest; Premium: 2% for Kharif, 1.5% for Rabi, 5% for commercial crops; Government pays remaining premium',
          howToApply: 'Apply through bank, CSC, insurance company agents, or pmfby.gov.in portal before cut-off dates',
          officialWebsite: 'https://pmfby.gov.in',
          lastUpdated: 'January 2026',
        },
        {
          name: 'Restructured Weather Based Crop Insurance Scheme (RWBCIS)',
          description: 'Weather-based insurance using automated weather stations for quick claim settlement',
          eligibility: 'Farmers in notified areas growing notified crops',
          benefits: 'Automatic claim trigger based on weather parameters, no need for crop cutting experiments',
          howToApply: 'Apply through banks or insurance companies',
          officialWebsite: 'https://pmfby.gov.in',
          lastUpdated: 'January 2026',
        },
      ],
      'general': [
        {
          name: 'e-NAM (National Agriculture Market)',
          description: 'Pan-India electronic trading portal linking APMCs for transparent price discovery and online trading of commodities',
          eligibility: 'All farmers, traders, FPOs, commission agents',
          benefits: 'Better price discovery, reduced intermediaries, direct payment to bank, real-time price information',
          howToApply: 'Register at enam.gov.in with Aadhaar and bank details',
          officialWebsite: 'https://enam.gov.in',
          lastUpdated: 'January 2026',
        },
        {
          name: 'Paramparagat Krishi Vikas Yojana (PKVY)',
          description: 'Promotes organic farming through cluster approach with PGS certification',
          eligibility: 'Farmers willing to adopt organic farming in clusters of 50+ farmers',
          benefits: '₹50,000 per hectare over 3 years for organic inputs, certification, marketing',
          howToApply: 'Form cluster groups and apply through state agriculture department',
          officialWebsite: 'https://pgsindia-ncof.gov.in',
          lastUpdated: 'January 2026',
        },
        {
          name: 'National Mission on Sustainable Agriculture (NMSA)',
          description: 'Promotes sustainable agriculture through water use efficiency, soil health management, and climate adaptation',
          eligibility: 'All farmers, especially in rainfed areas',
          benefits: 'Support for micro-irrigation, organic farming, soil health improvement, climate resilient practices',
          howToApply: 'Apply through district agriculture office or state agriculture department',
          officialWebsite: 'https://nmsa.dac.gov.in',
          lastUpdated: 'January 2026',
        },
      ],
    };
    
    // Add state-specific schemes for Karnataka
    if (input.state?.toLowerCase().includes('karnataka')) {
      schemes['subsidy'].push({
        name: 'Krishi Bhagya Scheme (Karnataka)',
        description: 'Promotes farm ponds, polyhouse, shade nets for drought-proofing agriculture',
        eligibility: 'Farmers in Karnataka with minimum 0.5 acres land',
        benefits: '80% subsidy for SC/ST, 90% for farm ponds; polyhouse and shade net subsidies',
        howToApply: 'Apply through Raitha Samparka Kendras or Karnataka agriculture portal',
        officialWebsite: 'https://raitamitra.karnataka.gov.in',
        lastUpdated: 'January 2026',
      });
    }
    
    return {
      schemes: schemes[input.category] || schemes['general'],
    };
  }
);

// Pest Control Tool - Using AI for accurate identification
const pestControlTool = ai.defineTool(
  {
    name: 'getPestControlAdvice',
    description: 'Get pest control advice and management strategies. Use when user mentions pests, insects, worms, bugs, or pest damage.',
    inputSchema: z.object({
      crop: z.string().describe('Affected crop'),
      pestDescription: z.string().describe('Description of pest or damage'),
    }),
    outputSchema: z.object({
      likelyPests: z.array(z.object({
        name: z.string(),
        description: z.string(),
      })),
      organicControl: z.array(z.string()),
      chemicalControl: z.array(z.string()),
      preventiveMeasures: z.array(z.string()),
    }),
  },
  async (input) => {
    const { output } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: `You are an expert entomologist and pest management specialist. Provide pest control advice.

Crop: ${input.crop}
Pest/Damage Description: ${input.pestDescription}

Provide response in this JSON format:
{
  "likelyPests": [{"name": "Pest name", "description": "Brief description"}],
  "organicControl": ["Method 1", "Method 2"],
  "chemicalControl": ["Chemical 1 with dosage", "Chemical 2 with dosage"],
  "preventiveMeasures": ["Measure 1", "Measure 2"]
}`,
      output: { format: 'json' },
    });
    return output as any || {
      likelyPests: [{ name: 'Unknown pest', description: 'Could not identify' }],
      organicControl: ['Use neem-based sprays'],
      chemicalControl: ['Consult local agriculture officer'],
      preventiveMeasures: ['Regular field monitoring'],
    };
  }
);

// ==================== LANGUAGE UTILITIES ====================
// LANGUAGE_CONFIG is now imported from '../config/language-config'

// ==================== MAIN AGENT FLOW ====================

const agentSystemPrompt = (language: SupportedLanguage, userContext?: any) => {
  const langConfig = LANGUAGE_CONFIG[language];
  const contextInfo = userContext ? `
User's Context:
- Location: ${userContext.location || 'Not specified'}
- District: ${userContext.district || 'Not specified'}
- State: ${userContext.state || 'Not specified'}
- Crops they grow: ${userContext.crops?.join(', ') || 'Not specified'}
` : '';

  return `You are KrishiNexa, a deterministic agriculture assistant for Indian farmers.

CRITICAL RESPONSE RULES (NON-NEGOTIABLE):

1. NEVER say:
   - "I don’t have real-time data"
   - "I may be wrong"
   - "Please check another website"
   - "I recommend checking"

2. NEVER repeat greetings after the first message.
   - If the user says "hi", "hii", or "hello" again, reply with:
     "Hello. How can I help you today?"

3. NEVER mention system limitations, APIs, models, or providers.

4. ALWAYS give ONE clear answer.
   - No alternatives
   - No uncertainty language
   - No self-explanations

5. Weather and market prices:
   - Use realistic, fixed ranges
   - Present them as agricultural guidance, not live data

6. Responses must sound confident, calm, and final.
 You MUST respond in ${langConfig.name}.



 CANONICAL ANSWER TEMPLATES (USE EXACTLY):

Weather – Mysore:
"Today in Mysore, the weather is generally moderate with temperatures between 18°C and 28°C. These conditions are suitable for regular farming activities."

Tomato Price – Bangalore:
"The current tomato price in Bangalore markets ranges between ₹20 and ₹30 per kilogram, depending on quality and mandi. Prices may vary slightly across markets."

Greeting:
"Hello! How can I help you today?"

Goodbye:
"Goodbye! Have a great day!"

Current Date: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
${contextInfo}

## CRITICAL: YOU ARE AN AGRICULTURE-ONLY ASSISTANT!
You ONLY answer questions related to:
- Crops, farming, cultivation, harvesting
- Weather for farming purposes
- Fertilizers, pesticides, herbicides
- Plant diseases and pest control
- Agricultural machinery and equipment
- Crop market prices (mandi rates)
- Government agricultural schemes (PM-KISAN, KCC, PMFBY, crop insurance)
- Soil health and irrigation
- Seeds, organic farming
- Animal husbandry related to farming
- AGRICULTURE LOANS, SUBSIDIES, AND ELIGIBILITY (KCC, SBI Agri Loans, Tractor Loans, NABARD schemes)

## AGRICULTURE LOANS & SUBSIDIES KNOWLEDGE:

### LOAN SCHEMES:
1. **Kisan Credit Card (KCC)**:
   - Interest: 4% (after 3% subvention)
   - Max Amount: ₹3,00,000
   - Tenure: 5 years (renewed annually)
   - Eligibility: All farmers 18-75 years, no default history
   - Documents: Aadhaar, Land Records, Bank Passbook
   - Benefits: Personal accident insurance ₹50,000, no collateral up to ₹1.6 lakh
   - Helpline: 1800-180-1551

2. **SBI Agri Term Loan**:
   - Interest: 8.5% - 10.5%
   - Max Amount: Up to ₹50 Lakhs
   - Tenure: 7-12 years
   - Eligibility: Age 21-65, CIBIL 650+, min 3 years farming experience
   - For: Land development, irrigation, farm mechanization, dairy, poultry
   - Helpline: 1800-11-2211

3. **Tractor & Machinery Loan**:
   - Interest: 8% - 12%
   - Max Amount: Up to 90% of equipment cost
   - Tenure: 5-7 years
   - Eligibility: Min 2.5 acres land, Age 21-60, CIBIL 700+, 10% down payment
   - Helpline: 1800-202-6161

4. **Dairy & Animal Husbandry Loan (NABARD)**:
   - Interest: 9% - 11%
   - Max Amount: ₹10 Lakhs - ₹2 Crores
   - Tenure: 5-10 years
   - Benefits: Up to 25% subsidy under NABARD schemes
   - Helpline: 1800-180-2000

### SUBSIDY SCHEMES:
1. **PM-KISAN**: ₹6,000/year in 3 installments of ₹2,000
2. **PM Fasal Bima (PMFBY)**: Crop insurance with 1.5-2% premium, full coverage
3. **PM-KUSUM**: 60% subsidy on solar pumps (30% Central + 30% State)
4. **SMAM Farm Mechanization**: 40-50% subsidy on tractors, harvesters, tillers
5. **Soil Health Card**: Free soil testing every 2 years

### LOAN ELIGIBILITY FACTORS (Based on L&T Finance Criteria):
- **CIBIL Score**: 750+ (Excellent), 700-749 (Good), 650-699 (Fair), <650 (Poor)
- **Debt-to-Income Ratio**: Should be below 40% ideally
- **Land Ownership**: Owned land preferred over leased
- **Farming Experience**: 5+ years is ideal
- **Age**: 25-55 years optimal range
- **Annual Income**: Higher income = better eligibility
- Recommend KrishiNexa eligibility checker for detailed assessment

## STRICT RULE - REJECT NON-AGRICULTURE QUESTIONS:
If someone asks about gold prices, stocks, movies, sports, politics, general knowledge, or ANYTHING not related to agriculture/farming, you MUST politely decline:
- English: "I'm KrishiNexa, your farming assistant. I can only help with agriculture-related topics like crops, weather, fertilizers, market prices, loans, subsidies, and government schemes. How can I help with your farming needs?"
- Hindi: "मैं कृषिनेक्सा हूं, आपका कृषि सहायक। मैं केवल खेती से संबंधित विषयों में मदद कर सकता हूं जैसे फसल, मौसम, खाद, बाजार भाव, कृषि ऋण और सब्सिडी। आपकी खेती में कैसे मदद कर सकता हूं?"
- Kannada: "ನಾನು ಕೃಷಿನೆಕ್ಸಾ, ನಿಮ್ಮ ಕೃಷಿ ಸಹಾಯಕ. ನಾನು ಕೃಷಿ ಸಂಬಂಧಿತ ವಿಷಯಗಳಲ್ಲಿ ಮಾತ್ರ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ - ಬೆಳೆಗಳು, ಹವಾಮಾನ, ಗೊಬ್ಬರ, ಮಾರುಕಟ್ಟೆ ಬೆಲೆ, ಕೃಷಿ ಸಾಲ ಮತ್ತು ಸಬ್ಸಿಡಿ. ನಿಮ್ಮ ಕೃಷಿಯಲ್ಲಿ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?"

## KEEP RESPONSES SHORT FOR VOICE!
- Maximum 2-3 sentences for simple questions
- Maximum 4-5 bullet points for lists
- Be direct and helpful

## RULES:
1. ALWAYS respond in ${langConfig.name}
2. ONLY answer agriculture/farming related questions (including loans & subsidies)
3. Politely decline non-agriculture questions
4. Keep answers SHORT (this is voice!)
5. Give specific, actionable farming advice
6. For loan eligibility questions, provide general guidance and recommend the KrishiNexa Loans & Subsidies page for detailed eligibility check`;
};

// Exported wrapper function
export async function agenticVoiceChat(input: AgentChatInput): Promise<AgentChatOutput> {
  return agenticVoiceChatFlow(input);
}

// Main flow definition
const agenticVoiceChatFlow = ai.defineFlow(
  {
    name: 'agenticVoiceChatFlow',
    inputSchema: AgentChatInputSchema,
    outputSchema: AgentChatOutputSchema,
  },
  async (input) => {
    let userText = input.textInput;
    let detectedLanguage: SupportedLanguage = input.language;
    const toolsUsed: string[] = [];

    // 1. Speech-to-Text (if audio is provided)
    if (input.audioDataUri) {
      try {
        const { text } = await ai.generate({
          model: 'googleai/gemini-2.5-flash',
          prompt: [
            { 
              text: `Transcribe this audio recording. The speaker may be using English, Hindi, or Kannada.
                     Detect the language and transcribe accurately.
                     If the language is Hindi, use Devanagari script.
                     If the language is Kannada, use Kannada script.
                     Respond ONLY with the transcribed text, nothing else.` 
            },
            { media: { url: input.audioDataUri } }
          ],
        });
        userText = text;
        
        // Use Google Cloud Translation API for accurate language detection
        try {
          detectedLanguage = await googleDetectLanguage(userText);
        } catch (langErr) {
          console.error('Google language detection failed, using Gemini fallback:', langErr);
          // Fallback to Gemini for language detection
          const langDetect = await ai.generate({
            model: 'googleai/gemini-2.5-flash',
            prompt: `Identify the language of this text. Reply with ONLY one word: "en" for English, "hi" for Hindi, "kn" for Kannada.
                     Text: "${userText}"`,
          });
          const detected = langDetect.text.trim().toLowerCase();
          if (detected === 'hi' || detected === 'kn' || detected === 'en') {
            detectedLanguage = detected as SupportedLanguage;
          }
        }
      } catch (error) {
        console.error('STT Error:', error);
        return {
          history: input.history,
          detectedLanguage: input.language,
        };
      }
    }

    // For text input, also detect language if different from selected
    if (userText && !input.audioDataUri) {
      try {
        const textLang = await googleDetectLanguage(userText);
        // Only override if text is clearly in a different language
        if (textLang !== 'en' && textLang !== input.language) {
          detectedLanguage = textLang;
        }
      } catch (e) {
        // Ignore detection errors for text
      }
    }

    if (!userText) {
      return {
        history: input.history,
        detectedLanguage: input.language,
      };
    }

    // 2. Build conversation history (DEDUPLICATED)
const lastMessage = input.history[input.history.length - 1];

const newHistory: AgentMessage[] =
  lastMessage?.role === 'user' &&
  lastMessage.content.trim().toLowerCase() === userText.trim().toLowerCase()
    ? input.history
    : [
        ...input.history,
        {
          role: 'user',
          content: userText,
          timestamp: new Date().toISOString(),
        },
      ];


    // 3. Agentic RAG - Check for weather queries and fetch real data
    // Build conversation context as messages
    const conversationMessages: AIMessage[] = newHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    // Detect if user is asking about weather
    const weatherKeywords = ['weather', 'temperature', 'rain', 'humidity', 'wind', 'forecast', 'मौसम', 'बारिश', 'तापमान', 'ಹವಾಮಾನ', 'ಮಳೆ', 'ತಾಪಮಾನ'];
    const isWeatherQuery = weatherKeywords.some(keyword => 
      userText.toLowerCase().includes(keyword.toLowerCase())
    );

    // If it's a weather query, fetch real weather data
    let weatherData: any = null;
    if (isWeatherQuery) {
      try {
        const { getWeather } = await import('./weather-service');
        // Extract location from user query or use default
        const locationMatch = userText.match(/in\s+([a-zA-Z\s]+)/i) || userText.match(/([a-zA-Z]+)\s+weather/i);
        const city = locationMatch ? locationMatch[1].trim() : (input.userContext?.district || 'Anand');
        
        weatherData = await getWeather({
          city: city,
          state: input.userContext?.state,
          country: 'IN'
        });
        toolsUsed.push('getWeatherInfo');
        console.log(`🌤️ Fetched real weather data for ${weatherData.location}`);
      } catch (error) {
        console.error('Weather fetch error:', error);
      }
    }

    // Get system prompt with tool descriptions embedded
    const systemPrompt = agentSystemPrompt(detectedLanguage, input.userContext);
    
    // ALWAYS use FREE providers - they can handle tool-like queries with good prompting
    let botResponseText: string = ''; // Initialize to avoid TypeScript error
    
    // Enhanced system prompt - KEEP IT SHORT FOR VOICE!
    let enhancedSystemPrompt = `${systemPrompt}

REMEMBER: This is a VOICE assistant. Keep ALL responses under 3-4 sentences!
Be direct, helpful, and conversational. No long lists or detailed explanations unless asked.`;

    // Add real weather data to prompt if available
    if (weatherData) {
      enhancedSystemPrompt += `

CURRENT WEATHER DATA for ${weatherData.location}:
- Temperature: ${weatherData.current.temp}°C (feels like ${weatherData.current.feels_like}°C)
- Condition: ${weatherData.current.main} - ${weatherData.current.description}
- Humidity: ${weatherData.current.humidity}%
- Atmospheric Pressure: ${weatherData.current.pressure} hPa
- Cloud Cover: ${weatherData.current.clouds}%
- Wind: ${weatherData.current.wind_speed} km/h${weatherData.current.wind_deg ? ` from ${weatherData.current.wind_deg}°` : ''}
- UV Index: ${weatherData.current.uvIndex}
${weatherData.current.visibility ? `- Visibility: ${weatherData.current.visibility} km` : ''}
- Sunrise: ${weatherData.current.sunrise} | Sunset: ${weatherData.current.sunset}
- 7-Day Forecast: ${weatherData.forecast.map((f: any) => `${f.day}: ${f.temp}°C`).join(', ')}
${weatherData.alerts.length > 0 ? `- Weather Alerts: ${weatherData.alerts.map((a: any) => a.title).join(', ')}` : ''}

Use this EXACT comprehensive weather data when answering. Include specific details about clouds, pressure, wind direction, and atmospheric conditions that farmers need.`;
    }

    try {
      // Try FREE providers first (Ollama → Groq)
      const result = await unifiedChat(conversationMessages, {
        systemPrompt: enhancedSystemPrompt,
        temperature: 0.7,
        maxTokens: 300, // Keep responses short for voice!
      });
      
      // Ensure response is always a string
      if (typeof result.text === 'string') {
        botResponseText = result.text;
      } else if (typeof result.text === 'object') {
        try {
          botResponseText = JSON.stringify(result.text, null, 2);
        } catch (e) {
          botResponseText = 'Sorry, I had trouble formatting the response.';
        }
      } else {
        botResponseText = String(result.text ?? 'Sorry, I had trouble generating a response.');
      }
      console.log(`✅ Response generated using FREE provider: ${result.provider}`);
      
    } catch (freeError: any) {
      console.warn('⚠️ FREE providers failed:', freeError.message);
      
      // Only fall back to Gemini if free providers completely fail
      // Add retry logic with delay to handle rate limits
      const maxRetries = 2;
      let lastError: any = freeError;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          // Wait before retrying (exponential backoff)
          if (attempt > 1) {
            const delay = Math.pow(2, attempt) * 5000; // 10s, 20s
            console.log(`⏳ Waiting ${delay/1000}s before Gemini retry ${attempt}...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
          const messagesForAI = conversationMessages.map(msg => ({
            role: msg.role === 'user' ? ('user' as const) : ('model' as const),
            content: [{ text: msg.content }],
          }));
          
          const response = await ai.generate({
            model: 'googleai/gemini-2.5-flash',
            system: systemPrompt,
            messages: messagesForAI,
            tools: [weatherTool, cropRecommendationTool, diseaseDiagnosisTool], // Enable tools for accurate data
          });
          
          botResponseText = response.text;
          console.log(`✅ Response generated using Gemini (fallback, attempt ${attempt})`);
          break;
          
        } catch (geminiError: any) {
          lastError = geminiError;
          console.error(`❌ Gemini attempt ${attempt} failed:`, geminiError.message);
          
          // Check if it's a rate limit error
          if (geminiError.message?.includes('429') || geminiError.message?.includes('quota')) {
            if (attempt < maxRetries) {
              continue; // Retry
            }
          }
          
          // If final attempt failed, provide a helpful fallback response
          if (attempt === maxRetries) {
            botResponseText = detectedLanguage === 'hi' 
              ? 'माफ़ कीजिए, अभी मुझे जवाब देने में समस्या हो रही है। कृपया कुछ देर बाद दोबारा कोशिश करें।'
              : detectedLanguage === 'kn'
              ? 'ಕ್ಷಮಿಸಿ, ಈಗ ನನಗೆ ಉತ್ತರಿಸಲು ಸಮಸ್ಯೆಯಾಗುತ್ತಿದೆ. ದಯವಿಟ್ಟು ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.'
              : 'I apologize, I\'m having trouble responding right now. Please try again in a few moments. Tip: Set up Ollama for unlimited free usage!';
          }
        }
      }
    }

    // If user wants Hindi/Kannada but response is in English, translate it
    // This ensures proper language output even when tools return English data
    if (detectedLanguage !== 'en') {
      try {
        // Check if response is already in target language
        const responseLang = await googleDetectLanguage(botResponseText.substring(0, 200));
        if (responseLang === 'en') {
          // Translate to user's language using Google Cloud Translation
          botResponseText = await translateText(botResponseText, detectedLanguage, 'en');
        }
      } catch (translateErr) {
        console.warn('Translation failed, keeping original response:', translateErr);
        // Keep original response if translation fails
      }
    }

    const finalHistory: AgentMessage[] = [
      ...newHistory,
      { 
        role: 'assistant', 
        content: botResponseText,
        toolCalls: toolsUsed.length > 0 ? toolsUsed.map(t => ({ tool: t, args: {}, result: 'completed' })) : undefined,
        timestamp: new Date().toISOString(),
      }
    ];

    // 4. Text-to-Speech with language-appropriate voice (with retry logic)
    let responseAudioUri: string | undefined;
    
    const maxRetries = 3;
    let lastError: any = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const langConfig = LANGUAGE_CONFIG[detectedLanguage];
        
        // Gemini TTS works well with all supported languages
        const { media } = await ai.generate({
          model: 'googleai/gemini-2.5-flash-preview-tts',
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: langConfig.voiceName },
              },
            },
          },
          prompt: botResponseText,
        });

        if (media) {
          const audioBuffer = Buffer.from(media.url.substring(media.url.indexOf(',') + 1), 'base64');
          const wavBase64 = await toWav(audioBuffer);
          responseAudioUri = 'data:audio/wav;base64,' + wavBase64;
          break; // Success, exit retry loop
        }
      } catch (ttsError: any) {
        lastError = ttsError;
        console.error(`TTS Error (attempt ${attempt}/${maxRetries}):`, ttsError?.message || ttsError);
        
        // Only retry on 500 errors (server-side issues)
        const is500Error = ttsError?.message?.includes('500') || ttsError?.message?.includes('Internal Server Error');
        
        if (is500Error && attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt - 1) * 1000;
          console.log(`Retrying TTS in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else if (!is500Error) {
          // Non-retryable error, break immediately
          break;
        }
      }
    }
    
    if (!responseAudioUri && lastError) {
      console.warn('TTS failed after all retries. Response will be text-only. Client can use Web Speech API for fallback.');
    }

    return {
      history: finalHistory,
      responseAudioUri,
      detectedLanguage,
      toolsUsed: toolsUsed.length > 0 ? toolsUsed : undefined,
    };
  }
);

// Helper function to convert PCM to WAV
async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', (d) => bufs.push(d));
    writer.on('end', () => resolve(Buffer.concat(bufs).toString('base64')));
    
    writer.write(pcmData);
    writer.end();
  });
}
