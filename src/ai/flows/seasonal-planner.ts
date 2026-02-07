'use server';

/**
 * @fileOverview Provides a detailed, location-specific seasonal farming plan.
 *
 * - getSeasonalPlan - A function that returns a comprehensive seasonal plan.
 * - SeasonalPlanInput - The input type for the function.
 * - SeasonalPlanOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Input Schema
const SeasonalPlanInputSchema = z.object({
  location: z.string().describe('The geographic location (e.g., district, state) for which to generate a plan.'),
  cropPreference: z.string().optional().describe('An optional user-selected crop.'),
});
export type SeasonalPlanInput = z.infer<typeof SeasonalPlanInputSchema>;


// Output Schema
const RecommendedCropSchema = z.object({
  cropName: z.string().describe("The name of the single most recommended crop for the current season."),
  sowingWindow: z.string().describe("The ideal sowing window for this crop, e.g., 'Late October – Mid December'."),
  cropType: z.string().describe("The type of crop, e.g., 'Kharif Crop', 'Rabi Crop'."),
  reasoning: z.string().describe("A brief, clear reason why this crop is suitable now, considering the season, weather, and soil."),
});

const SeasonalTaskSchema = z.object({
    taskName: z.string().describe("Name of the farming activity, e.g., 'Land Preparation', 'Sowing', 'First Irrigation'."),
    idealTiming: z.string().describe("The ideal time to perform this task, e.g., 'Next 10-15 days', 'First week of June', '30-40 DAS' (Days After Sowing)."),
    notes: z.string().describe("A concise, helpful tip or note for this specific task.")
});

const SeasonalPlanOutputSchema = z.object({
  currentSeason: z.string().describe("The name of the current agricultural season based on the calendar, e.g., 'Kharif', 'Rabi', 'Zaid'."),
  recommendedCrop: RecommendedCropSchema,
  seasonalTasks: z.array(SeasonalTaskSchema).describe("A chronological list of 5-7 key tasks for the recommended crop, from preparation to harvest."),
  generalAdvice: z.array(z.string()).describe("A list of 2-3 general, actionable tips and weather-based alerts for the upcoming season in that location (e.g., advice on water conservation, pest monitoring, irrigation warnings based on forecast)."),
});
export type SeasonalPlanOutput = z.infer<typeof SeasonalPlanOutputSchema>;


// Exported wrapper function
export async function getSeasonalPlan(input: SeasonalPlanInput): Promise<SeasonalPlanOutput> {
  return seasonalPlannerFlow(input);
}


// AI Prompt Definition
const prompt = ai.definePrompt({
  name: 'seasonalPlannerPrompt',
  input: { schema: SeasonalPlanInputSchema },
  output: { schema: SeasonalPlanOutputSchema },
  prompt: `
    You are an expert Indian agronomist AI. Your task is to generate a complete Seasonal Crop Planner.
    Follow this algorithm EXACTLY.

    ### MANDATORY INPUTS:
    - **Current Date**: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
    - **Location**: {{{location}}}
    {{#if cropPreference}}- **User's Preferred Crop**: {{{cropPreference}}}{{/if}}
    - You will also have access to weather, soil, and regional data.

    ### ALGORITHM:

    **STEP 1: Determine the Current Agricultural Season for the location.**
    - Kharif: June–Sep
    - Rabi: Oct–Feb
    - Zaid: Mar–May
    Based on the current date, identify and state the current season in the 'currentSeason' output field.

    **STEP 2: Analyze Suitability & Select Crop.**
    {{#if cropPreference}}
      - The user has selected **{{{cropPreference}}}**.
      - **Validate this crop** against the current season and typical weather for **{{{location}}}**.
      - If it is **NOT SUITABLE** (e.g., planting rice in a dry Rabi season), state this clearly in the 'reasoning' and 'generalAdvice' fields, then **select the best alternative crop** for the current season and generate the plan for that alternative.
      - If it **IS SUITABLE**, generate the plan for {{{cropPreference}}}.
    {{else}}
      - The user has not selected a crop.
      - **You MUST choose the single best crop** for the **{{{location}}}** for the **current season**.
      - Base your choice on local cropping patterns, weather suitability, and water requirements.
    {{/if}}

    **STEP 3: Generate the Detailed Seasonal Plan.**
    Your entire output MUST be in the specified JSON format.
    - **recommendedCrop**: Introduce the chosen crop and provide a clear, simple reason for its suitability right now.
    - **seasonalTasks**: Create a simple, chronological list of 5-7 major activities. Timing can be in weeks, months, or 'DAS' (Days After Sowing).
    - **generalAdvice**: Provide 2-3 critical, weather-based alerts or general tips. For example: "If heavy rain is forecast, delay sowing by a week." or "High humidity increases the risk of fungal disease; monitor closely."

    ### RULES:
    - Your reasoning must be simple and direct for a farmer.
    - Use only the provided data. Do not ask for more information.
    - Provide the output strictly in the requested JSON format. Do not add any extra commentary outside the JSON structure.

    Begin analysis.
  `,
});


// Genkit Flow Definition
const seasonalPlannerFlow = ai.defineFlow(
  {
    name: 'seasonalPlannerFlow',
    inputSchema: SeasonalPlanInputSchema,
    outputSchema: SeasonalPlanOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
