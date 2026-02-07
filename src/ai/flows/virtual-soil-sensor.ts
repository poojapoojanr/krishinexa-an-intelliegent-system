'use server';

/**
 * @fileOverview Simulates soil sensor data using an AI model.
 * 
 * - getVirtualSensorData - A function that returns simulated soil data for a location.
 * - VirtualSensorInput - The input type for the function.
 * - VirtualSensorOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Input Schema
export type VirtualSensorInput = z.infer<typeof VirtualSensorInputSchema>;
const VirtualSensorInputSchema = z.object({
  location: z.string().describe('The geographic location (e.g., city, state) for which to simulate soil data.'),
});

// Nutrient classification logic based on Havlin et al., 1999 principles
const NutrientSchema = z.object({
    value: z.number().describe('The estimated numerical value of the nutrient (e.g., in kg/ha).'),
    classification: z.enum(['Very Low', 'Low', 'Optimum', 'High', 'Very High']).describe('The classified level of the nutrient.'),
    yieldResponseProbability: z.string().describe("A percentage range indicating the probability of a significant yield increase if the recommended fertilizer is applied (e.g., '75-90%', '40-60%', '<10%')."),
    recommendation: z.string().describe('A clear, actionable fertilizer management recommendation based on the classification.'),
});

export type VirtualSensorOutput = z.infer<typeof VirtualSensorOutputSchema>;
const VirtualSensorOutputSchema = z.object({
  soilTestMethod: z.string().describe("The simulated testing method used, e.g., 'Olsen P Test, Ammonium Acetate for K'."),
  soilSampleDepth: z.string().describe("The standard soil sample depth, e.g., '0-15 cm'."),
  nutrients: z.object({
    nitrogen: NutrientSchema,
    phosphorus: NutrientSchema,
    potassium: NutrientSchema,
  }).describe('A detailed analysis for N, P, and K including value, classification, and recommendations.'),
});


// Exported wrapper function
export async function getVirtualSensorData(input: VirtualSensorInput): Promise<VirtualSensorOutput> {
  return virtualSensorFlow(input);
}


// AI Prompt Definition
const prompt = ai.definePrompt({
  name: 'virtualSensorPrompt',
  input: { schema: VirtualSensorInputSchema },
  output: { schema: VirtualSensorOutputSchema },
  prompt: `
    You are an expert soil scientist AI. Your task is to generate a soil nutrient analysis for a given location, mimicking a real soil test report.
    Follow this logic EXACTLY.

    ### LOCATION FOR ANALYSIS:
    - {{{location}}}

    ### EXPERT KNOWLEDGE (Use this if location is in Karnataka, India):
    - **Red Soils**: Widespread in South/Central Karnataka. High iron oxide, low humus, low water retention. Supports Ragi, Jowar, Groundnut. Typically lower in N, P, K.
    - **Black Soils (Regur)**: Northern districts. High clay, excellent water retention, nutrient-rich. Supports Cotton, Sugarcane, Jowar. Typically Optimum to High in nutrients.
    - **Laterite Soils**: Western Ghats/coastal. Rich in iron/aluminum, often acidic. Supports Coffee, Cashew. Can have low P availability.
    - **Coastal Alluvial Soils**: Western coast. Highly fertile, rich organic matter. Supports Rice, Coconut. Generally well-balanced.

    ### ALGORITHM:
    1.  **SET METADATA**: Set 'soilTestMethod' to 'Standard Wet Chemistry Analysis' and 'soilSampleDepth' to '0-15 cm'.
    2.  **SIMULATE NUTRIENT VALUES**: Based on the location and expert knowledge (if applicable), estimate realistic values for Nitrogen (N), Phosphorus (P), and Potassium (K) in kg/ha.
        - Red soils should have lower values, Black/Alluvial soils should have higher values. Be agronomically consistent.
    3.  **CLASSIFY EACH NUTRIENT**: Use the following universal classification table (based on standard soil science principles, Havlin et al.):
        -   **Nitrogen (N) kg/ha**: <280=Low, 280-560=Optimum, >560=High. (Self-correct: <140='Very Low', >700='Very High')
        -   **Phosphorus (P) kg/ha**: <15=Low, 15-30=Optimum, >30=High. (Self-correct: <8='Very Low', >50='Very High')
        -   **Potassium (K) kg/ha**: <120=Low, 120-280=Optimum, >280=High. (Self-correct: <60='Very Low', >400='Very High')
    4.  **DETERMINE YIELD RESPONSE & RECOMMENDATION**: Based on the classification, determine the probability of yield response to fertilizer and provide a specific, actionable recommendation.
        -   **Very Low**: Yield Response = '75-90%'. Recommendation = 'Apply full recommended dose based on crop need. Split application for N is advised.'
        -   **Low**: Yield Response = '50-75%'. Recommendation = 'Apply full recommended dose. Monitor crop response.'
        -   **Optimum**: Yield Response = '20-40%'. Recommendation = 'Apply a maintenance dose to replace nutrients removed by the crop.'
        -   **High**: Yield Response = '<20%'. Recommendation = 'Reduce standard dose by 50% or apply only a starter dose.'
        -   **Very High**: Yield Response = '<5%'. Recommendation = 'Skip application for this season to avoid nutrient imbalance and save cost.'
    
    ### OUTPUT:
    Generate a JSON object strictly following the output schema. For each nutrient (nitrogen, phosphorus, potassium), provide its simulated value, classification, yield response probability, and a clear, actionable recommendation. DO NOT add any extra commentary outside the JSON structure.
  `,
});


// Genkit Flow Definition
const virtualSensorFlow = ai.defineFlow(
  {
    name: 'virtualSensorFlow',
    inputSchema: VirtualSensorInputSchema,
    outputSchema: VirtualSensorOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
