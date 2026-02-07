
'use server';

/**
 * @fileOverview Provides a holistic soil health assessment based on real-time environmental data.
 *
 * - getSoilHealthAdvice - A function that returns a structured analysis of soil conditions.
 */

import { ai } from '@/ai/genkit';
import { SoilHealthAdvisorInputSchema, SoilHealthAdvisorOutputSchema, type SoilHealthAdvisorInput, type SoilHealthAdvisorOutput } from '@/types/soil-health';


// Exported wrapper function
export async function getSoilHealthAdvice(input: SoilHealthAdvisorInput): Promise<SoilHealthAdvisorOutput> {
  return soilHealthAdvisorFlow(input);
}


// AI Prompt Definition
const prompt = ai.definePrompt({
  name: 'soilHealthAdvisorPrompt',
  input: { schema: SoilHealthAdvisorInputSchema },
  output: { schema: SoilHealthAdvisorOutputSchema },
  prompt: `
    You are an expert agronomist AI. Your task is to generate a soil health assessment based ONLY on the provided environmental data.
    Follow this logic EXACTLY. Do NOT invent data. Do NOT provide numerical NPK values. Your response must be scientifically sound but easy for a farmer to understand.

    ### INPUT DATA:
    - Location: {{{location}}}
    - Current Soil Moisture: {{{soil_moisture}}}%
    - Current Root-Zone Soil Temperature: {{{soil_temperature}}}°C
    - 7-Day Cumulative Rainfall: {{{cumulative_rainfall_7d}}} mm

    ### ALGORITHM & OUTPUT SECTIONS:

    **SECTION 1: Observed Soil Conditions**
    - Directly report the input values.
    - Classify the soil moisture status based on the percentage:
      - < 10%: Very Dry
      - 10-20%: Moderately Dry
      - 20-35%: Optimal
      - 35-45%: Wet
      - > 45%: Saturated

    **SECTION 2: Soil Suitability Insights**
    Based on the input data, provide a qualitative analysis for each point below. Your reasoning MUST be brief and based on soil science.

    -   Root Activity (Poor / Fair / Good):
        -   Logic: Optimal root activity occurs in moist (not dry or saturated) and warm (not cold) soils.
        -   Example Reasoning: "Good - Soil is warm and has optimal moisture, encouraging root growth and nutrient uptake." OR "Poor - Very dry soil restricts root growth and exploration."

    -   Nutrient Mobility (Limited / Moderate / Good):
        -   Logic: Water is essential for transporting nutrients to the roots.
        -   Example Reasoning: "Good - Sufficient soil moisture allows nutrients to dissolve and move freely to plant roots." OR "Limited - Dry conditions prevent nutrients from being transported in the soil solution."

    -   Fertilizer Efficiency (Low / Medium / High):
        -   Logic: Fertilizer is most effective when plants are actively growing and there is enough water to dissolve and transport nutrients.
        -   Example Reasoning: "High - With optimal moisture and temperature, plants can efficiently absorb the applied fertilizers." OR "Low - In very dry or waterlogged soil, applied fertilizers may be lost or unavailable to the plant."

    **SECTION 3: Estimated Nutrient Availability**
    Estimate the availability status (not quantity) for N, P, and K based on temperature and moisture.
    - For each nutrient, provide:
        - availability ('Low' / 'Moderate' / 'Optimum')
        - action_hint (A short, farmer-friendly tip)
        - confidence ('Low' / 'Medium' / 'High')
    -   Nitrogen (N) Availability:
        -   Logic: N mineralization is a biological process optimal in warm, moist soil. It's lower in cold, dry, or saturated soil.
    -   Phosphorus (P) Availability:
        -   Logic: P availability is highly sensitive to temperature. It is low in cold soils.
    -   Potassium (K) Availability:
        -   Logic: K is transported by water. Availability is low in dry soils.
    -  Action Hint Examples: "Consider a starter dose of N.", "P availability may be restricted by cold soil.", "Good K uptake is likely."
    -  Confidence Logic: Confidence is 'High' when conditions are clearly optimal or clearly poor. Confidence is 'Medium' for intermediate conditions. It is 'Low' if data is contradictory.

    ### FINAL INSTRUCTIONS:
    - Your entire response MUST be in the specified JSON format.
    - Do not add any commentary outside the JSON structure.
    - Label the source of data and estimations clearly in the UI, not in this JSON output.

    Begin analysis.
  `,
});


// Genkit Flow Definition
const soilHealthAdvisorFlow = ai.defineFlow(
  {
    name: 'soilHealthAdvisorFlow',
    inputSchema: SoilHealthAdvisorInputSchema,
    outputSchema: SoilHealthAdvisorOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
