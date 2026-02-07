'use server';

/**
 * @fileOverview Provides personalized crop recommendations based on a variety of farm-specific inputs.
 *
 * - personalizedCropRecommendation - A function that returns detailed crop recommendations.
 * - PersonalizedCropRecommendationInput - The input type for the personalizedCropRecommendation function.
 * - PersonalizedCropRecommendationOutput - The return type for the personalizedCropRecommendation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedCropRecommendationInputSchema = z.object({
  location: z.string().describe('Geographic location of the farm (e.g., city, state, country).'),
  soilType: z.enum(['Sandy', 'Loamy', 'Clay', 'Silt', 'Peat']).describe('The primary soil type of the farm.'),
  waterAvailability: z.enum(['Low', 'Medium', 'High']).describe('The general availability of water for irrigation.'),
  farmSize: z.number().describe('The size of the farm in acres.'),
  cropPreference: z.string().optional().describe('An optional preferred crop to consider.'),
  soilAnalysis: z.string().optional().describe('Optional detailed soil analysis report (e.g., pH, nutrient levels).'),
});

export type PersonalizedCropRecommendationInput = z.infer<typeof PersonalizedCropRecommendationInputSchema>;


const TopCropSchema = z.object({
    crop: z.string().describe("The name of the recommended crop."),
    suitability_score: z.string().describe("A score from 0-100 indicating how suitable the crop is."),
    reasoning: z.string().describe("A detailed explanation for why this crop is recommended, considering all input factors like soil, climate, water, and local patterns."),
    best_sowing_month: z.string().describe("The ideal month or season to sow the crop in the given location."),
    water_requirement: z.string().describe("Estimated water requirement for the crop (e.g., 'Low', 'Medium', 'High', or a specific range in mm)."),
    expected_yield: z.string().describe("An estimated potential yield per acre (e.g., '10-12 quintals/acre')."),
    market_advantage: z.string().describe("Briefly describe the market advantage, like high demand, good local price, or government support.")
});

const PersonalizedCropRecommendationOutputSchema = z.object({
  top_crops: z.array(TopCropSchema).describe('A ranked list of the most suitable crops.'),
  intercrop_suggestions: z.array(z.string()).describe("Suggestions for compatible intercropping or companion planting to maximize yield and soil health."),
  warnings: z.array(z.string()).describe("Any critical warnings for the farmer, such as extreme soil pH requiring amendment or high risk of a specific regional pest."),
  notes: z.array(z.string()).describe("General helpful notes or advice, like soil health improvement tips or water conservation techniques.")
});

export type PersonalizedCropRecommendationOutput = z.infer<typeof PersonalizedCropRecommendationOutputSchema>;

export async function personalizedCropRecommendation(input: PersonalizedCropRecommendationInput): Promise<PersonalizedCropRecommendationOutput> {
  return personalizedCropRecommendationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedCropRecommendationPrompt',
  input: {schema: PersonalizedCropRecommendationInputSchema},
  output: {schema: PersonalizedCropRecommendationOutputSchema},
  prompt: `You are an expert agricultural advisor and agronomist. 
Your task is to recommend the best crops for a farmer based on accurate scientific analysis.

### REGIONAL EXPERT KNOWLEDGE: KARNATAKA
If the user's location is in Karnataka, India, you MUST use the following expert soil data to inform your recommendation:
- **Red Soils**: Most widespread in South & Central Karnataka (Mysuru, Bengaluru, Chitradurga). Low water retention. Best for Ragi, Jowar, Groundnut, Pulses.
- **Black Soils (Regur)**: Found in Northern districts (Belgavi, Kalburgi, Bidar). Excellent water retention. Best for Cotton, Sugarcane, Jowar, Wheat.
- **Laterite Soils**: Found in Western Ghats & coastal regions. Supports Coffee, Rubber, Cashew, Spices.
- **Coastal Alluvial Soils**: Found along the western coast. Highly fertile. Best for Rice, Coconut, Sugarcane.

### USER-PROVIDED & APP-FETCHED DATA:
- Location: {{{location}}}
- Soil Type (as reported by user): {{{soilType}}}
- Water Availability: {{{waterAvailability}}}
- Farm Size: {{{farmSize}}} acres
- Additional Soil Analysis: {{{soilAnalysis}}}
{{#if cropPreference}}- Preferred Crop to consider: {{{cropPreference}}}{{/if}}

For the given location, you will also auto-fetch and consider typical weather patterns, rainfall, sunlight, common local crop patterns, and market prices to give a holistic recommendation.

### YOUR TASK:
Analyze all the above data and rank the MOST SUITABLE crops. Your analysis must consider:
- **Soil Suitability**: Combine the user's soil type with the expert regional data for Karnataka if applicable.
- Climate & rainfall compatibility
- Water requirement vs availability
- Local crop patterns and suitability
- Profit potential and market demand
- Pest/disease resistance for the region
- Sowing and harvest season compatibility

### RULES:
- Always prioritize crops naturally suited to the region using the provided expert knowledge.
- If user water availability is low, avoid high water crops (e.g., sugarcane, paddy).
- If pH or NPK are extreme based on soil analysis, include a soil amendment recommendation in the 'warnings' field.
- Keep answers scientifically accurate but simple for farmers to understand.
- Structure your entire response strictly according to the JSON output schema.

Begin analysis.
  `,
});

const personalizedCropRecommendationFlow = ai.defineFlow(
  {
    name: 'personalizedCropRecommendationFlow',
    inputSchema: PersonalizedCropRecommendationInputSchema,
    outputSchema: PersonalizedCropRecommendationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
