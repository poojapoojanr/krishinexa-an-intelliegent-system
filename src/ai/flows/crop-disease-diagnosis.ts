'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

/* ================= INPUT SCHEMA ================= */
const DiagnoseDiseaseInputSchema = z.object({
  photoDataUri: z.string().describe(
    "Image as data URI: data:<mime>;base64,<data>"
  ),
});

export type DiagnoseDiseaseInput = z.infer<
  typeof DiagnoseDiseaseInputSchema
>;

/* ================= OUTPUT SCHEMA ================= */
const DiagnoseDiseaseOutputSchema = z.object({
  diseaseName: z.string(),
  severity: z.string(),
  treatment: z.string(),
});

export type DiagnoseDiseaseOutput = z.infer<
  typeof DiagnoseDiseaseOutputSchema
>;

/* ================= FLOW ================= */
const diagnoseDiseaseFlow = ai.defineFlow(
  {
    name: 'diagnoseDiseaseFlow',
    inputSchema: DiagnoseDiseaseInputSchema,
    outputSchema: DiagnoseDiseaseOutputSchema,
  },
  async ({ photoDataUri }) => {
    const response: any = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are an expert in plant pathology.

Analyze the crop image and respond clearly in this format:

Disease: <name>
Severity: <low|medium|high>
Treatment: <treatment details>`,
            },
            {
              type: 'image_url',
              image_url: photoDataUri,
            },
          ],
        },
      ],
    });

    // ✅ SAFE text extraction (no red errors)
    const text: string =
      response?.candidates?.[0]?.content?.[0]?.text ?? '';

    return {
      diseaseName: extractValue(text, 'Disease'),
      severity: extractValue(text, 'Severity'),
      treatment: extractValue(text, 'Treatment'),
    };
  }
);

/* ================= PUBLIC FUNCTION ================= */
export async function diagnoseDisease(
  input: DiagnoseDiseaseInput
): Promise<DiagnoseDiseaseOutput> {
  return diagnoseDiseaseFlow(input);
}

/* ================= HELPER ================= */
function extractValue(text: string, key: string): string {
  const regex = new RegExp(`${key}\\s*[:\\-]\\s*(.*)`, 'i');
  const match = text.match(regex);
  return match?.[1]?.trim() || 'Unknown';
}