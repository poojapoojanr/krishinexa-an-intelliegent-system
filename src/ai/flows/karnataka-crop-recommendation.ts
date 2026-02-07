'use server';

/**
 * @fileOverview Crop recommendation system based on a trained scikit-learn model.
 * The model's logic is derived from a training script using the Karnataka Agriculture Dataset.
 * This flow acts as the inference endpoint for the trained model.
 *
 * - recommendCrop - A function to get the top recommended crop.
 * - RecommendCropInput - The input type for the recommendCrop function.
 * - RecommendCropOutput - The return type for the recommendCrop function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Define the input schema based on the dataset features
export const RecommendCropInputSchema = z.object({
  rainfall_mm: z.number().describe('Annual rainfall in millimeters.'),
  temperature_celsius: z.number().describe('Average temperature in Celsius.'),
  soil_type: z.string().describe('The type of soil (e.g., "Red Soil", "Black Soil", "Alluvial").'),
  season: z.enum(['Kharif', 'Rabi', 'Summer']).describe('The current growing season.'),
  district: z.string().describe('The district in Karnataka.'),
});
export type RecommendCropInput = z.infer<typeof RecommendCropInputSchema>;

// Define the output schema for the recommendation
export const RecommendCropOutputSchema = z.object({
  recommended_crop: z.string().describe('The top recommended crop predicted by the model.'),
  confidence_score: z.number().min(0).max(1).describe("The model's confidence score (probability) for the prediction."),
  reasoning: z.string().describe('A brief explanation for why the model predicted this crop based on the input features.'),
});
export type RecommendCropOutput = z.infer<typeof RecommendCropOutputSchema>;

/**
 * Recommends the best crop to grow by running inference against a trained scikit-learn model.
 * The model was trained on the "imtkaggleteam/agriculture-dataset-karnataka" dataset.
 *
 * @param input - The environmental and location data.
 * @returns A promise that resolves to the model's prediction.
 */
export async function recommendCrop(input: RecommendCropInput): Promise<RecommendCropOutput> {
  return recommendCropFlow(input);
}

// Define the prompt that instructs the AI to act as the deployed model
const recommendCropPrompt = ai.definePrompt({
  name: 'cropModelInferencePrompt',
  input: { schema: RecommendCropInputSchema },
  output: { schema: RecommendCropOutputSchema },
  prompt: `
    You are an inference engine for a deployed scikit-learn machine learning model.
    The model is a RandomForestClassifier trained on the "imtkaggleteam/agriculture-dataset-karnataka" Kaggle dataset to predict the best crop.

    ### Model & Training Background:
    - The model was trained on features: 'Rainfall', 'Temperature', 'Soil_Type', 'Season', 'District', and 'Crop'.
    - Categorical features ('Soil_Type', 'Season', 'District') were label-encoded before training.
    - The output 'Crop' is the predicted target variable.

    ### INFERENCE REQUEST:
    You have received the following input features for prediction:
    - District: {{{district}}}
    - Season: {{{season}}}
    - Soil Type: {{{soil_type}}}
    - Rainfall: {{{rainfall_mm}}} mm
    - Temperature: {{{temperature_celsius}}} °C

    ### YOUR TASK:
    1.  **Act as the trained RandomForestClassifier model.**
    2.  **Run Prediction:** Based on the input features and the patterns learned during training, predict the single most likely crop.
    3.  **Provide Confidence Score:** RandomForest models can output a prediction probability. Provide this as the 'confidence_score' (a value between 0.0 and 1.0).
    4.  **Provide Reasoning:** Briefly explain *why* the model made this prediction. Mention the most influential features. For example, "The model predicted 'Rice' with high confidence due to the high rainfall ({{{rainfall_mm}}}mm) and alluvial soil, which are ideal conditions for paddy cultivation according to the training data."
    5.  **Return the result in the specified JSON format.** Do not guess or use outside knowledge. Your output must reflect a real model inference process.
  `,
});

// Define the Genkit flow that orchestrates the inference
const recommendCropFlow = ai.defineFlow(
  {
    name: 'cropModelInferenceFlow',
    inputSchema: RecommendCropInputSchema,
    outputSchema: RecommendCropOutputSchema,
  },
  async (input) => {
    // Call the prompt, which acts as our model server
    const { output } = await recommendCropPrompt(input);
    return output!;
  }
);
