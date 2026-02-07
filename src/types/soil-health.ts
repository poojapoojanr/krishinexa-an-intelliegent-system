import { z } from 'zod';

// Input Schema
export const SoilHealthAdvisorInputSchema = z.object({
  soil_moisture: z.number().describe('The current soil moisture percentage (e.g., 13.5).'),
  soil_temperature: z.number().describe('The current root-zone soil temperature in Celsius (e.g., 19).'),
  cumulative_rainfall_7d: z.number().describe('The total rainfall in the last 7 days in mm (e.g., 4).'),
  location: z.string().describe('The location context for the analysis (e.g., "Davanagere, Karnataka").'),
});
export type SoilHealthAdvisorInput = z.infer<typeof SoilHealthAdvisorInputSchema>;


// Output Schema
const ObservedConditionsSchema = z.object({
    soil_moisture_percentage: z.number(),
    soil_moisture_status: z.string().describe("A qualitative status for soil moisture, e.g., 'Moderately Dry', 'Optimal', 'Saturated'."),
    soil_temperature_celsius: z.number(),
    rainfall_7d_mm: z.number(),
});

const SoilSuitabilitySchema = z.object({
    root_activity: z.enum(['Poor', 'Fair', 'Good']),
    root_activity_reasoning: z.string().describe("A brief explanation linking soil conditions to root activity."),
    nutrient_mobility: z.enum(['Limited', 'Moderate', 'Good']),
    nutrient_mobility_reasoning: z.string().describe("A brief explanation on how water availability affects nutrient transport."),
    fertilizer_efficiency: z.enum(['Low', 'Medium', 'High', 'Optimum']),
    fertilizer_efficiency_reasoning: z.string().describe("An explanation of how soil conditions impact fertilizer effectiveness."),
});

export const NutrientEstimationSchema = z.object({
  availability: z.enum(['Low', 'Moderate', 'Optimum']),
  action_hint: z.string().describe("A short, actionable tip for the farmer based on the estimated availability."),
  confidence: z.enum(['Low', 'Medium', 'High']).describe("The confidence level of this model-based estimation (Low, Medium, or High).")
});
export type NutrientEstimation = z.infer<typeof NutrientEstimationSchema>;

const EstimatedNutrientsSchema = z.object({
    nitrogen: NutrientEstimationSchema,
    phosphorus: NutrientEstimationSchema,
    potassium: NutrientEstimationSchema,
});

export const SoilHealthAdvisorOutputSchema = z.object({
  observed_conditions: ObservedConditionsSchema,
  soil_suitability: SoilSuitabilitySchema,
  estimated_nutrients: EstimatedNutrientsSchema,
});
export type SoilHealthAdvisorOutput = z.infer<typeof SoilHealthAdvisorOutputSchema>;
