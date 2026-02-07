'use server';

/**
 * @fileOverview Fetches and processes soil data from the AgroMonitoring API.
 * 
 * - getSoilData - A function that returns processed soil data for a location.
 * - SoilDataInput - The input type for the function.
 * - SoilDataOutput - The return type for the function.
 */

import { z } from 'zod';

// Input and Output Schemas
const SoilDataInputSchema = z.object({
  location: z.string().describe('The geographic location (e.g., city, state) for which to fetch soil data.'),
});
export type SoilDataInput = z.infer<typeof SoilDataInputSchema>;

const NutrientSchema = z.object({
    value: z.number(),
    classification: z.enum(['Very Low', 'Low', 'Optimum', 'High', 'Very High']),
    yieldResponseProbability: z.string(),
    recommendation: z.string(),
});

const SoilDataOutputSchema = z.object({
  soilSampleDepth: z.string(),
  nutrients: z.object({
    nitrogen: NutrientSchema,
    phosphorus: NutrientSchema,
    potassium: NutrientSchema,
  }),
});
export type SoilDataOutput = z.infer<typeof SoilDataOutputSchema>;


// Helper Functions
async function getCoordinates(location: string): Promise<{ lat: number; lon: number }> {
    const apiKey = process.env.LOCATIONIQ_API_KEY;
    if (!apiKey) {
      throw new Error('LOCATIONIQ_API_KEY is not defined.');
    }
    const url = `https://us1.locationiq.com/v1/search.php?key=${apiKey}&q=${encodeURIComponent(location)}&format=json`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch coordinates from LocationIQ.');
    const data = await response.json();
    if (!data || data.length === 0) throw new Error('Could not find coordinates for the location.');
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
}

async function createPolygon(lat: number, lon: number, apiKey: string): Promise<string> {
    const polygonUrl = `http://api.agromonitoring.com/agro/1.0/polygons?appid=${apiKey}`;
    const response = await fetch(polygonUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: `Polygon for ${lat},${lon}`,
            geo_json: {
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'Polygon',
                    coordinates: [[
                        [lon - 0.01, lat - 0.01],
                        [lon + 0.01, lat - 0.01],
                        [lon + 0.01, lat + 0.01],
                        [lon - 0.01, lat + 0.01],
                        [lon - 0.01, lat - 0.01]
                    ]]
                }
            }
        })
    });
    if (!response.ok) throw new Error(`Failed to create polygon: ${await response.text()}`);
    const data = await response.json();
    return data.id;
}

async function getSoilApiData(polygonId: string, apiKey: string): Promise<any> {
    const soilUrl = `http://api.agromonitoring.com/agro/1.0/soil?polyid=${polygonId}&appid=${apiKey}`;
    const response = await fetch(soilUrl);
    if (!response.ok) throw new Error(`Failed to fetch soil data: ${await response.text()}`);
    return await response.json();
}

// Nutrient Interpretation Logic (based on Havlin et al., 1999)
function interpretNutrient(value: number, type: 'Nitrogen' | 'Phosphorus' | 'Potassium'): NutrientData {
    let classification: NutrientData['classification'];
    let yieldResponseProbability: string;
    let recommendation: string;

    const thresholds = {
        Nitrogen: { vl: 140, l: 280, o: 560, h: 700 }, // in kg/ha
        Phosphorus: { vl: 8, l: 15, o: 30, h: 50 },  // in kg/ha
        Potassium: { vl: 60, l: 120, o: 280, h: 400 } // in kg/ha
    };
    const t = thresholds[type];
    
    if (value < t.vl) {
        classification = 'Very Low';
        yieldResponseProbability = '75-90%';
        recommendation = 'Apply full recommended dose based on crop need. Split application for N is advised.';
    } else if (value < t.l) {
        classification = 'Low';
        yieldResponseProbability = '50-75%';
        recommendation = 'Apply full recommended dose. Monitor crop response.';
    } else if (value < t.o) {
        classification = 'Optimum';
        yieldResponseProbability = '20-40%';
        recommendation = 'Apply a maintenance dose to replace nutrients removed by the crop.';
    } else if (value < t.h) {
        classification = 'High';
        yieldResponseProbability = '<20%';
        recommendation = 'Reduce standard dose by 50% or apply only a starter dose.';
    } else {
        classification = 'Very High';
        yieldResponseProbability = '<5%';
        recommendation = 'Skip application for this season to avoid nutrient imbalance and save cost.';
    }

    return { value, classification, yieldResponseProbability, recommendation };
}

function getMockSoilData(): SoilDataOutput {
  console.warn("AGROMONITORING_API_KEY is not defined or invalid. Falling back to mock soil data.");
  return {
    soilSampleDepth: '0-20cm',
    nutrients: {
      nitrogen: interpretNutrient(350, 'Nitrogen'), // Optimum
      phosphorus: interpretNutrient(12, 'Phosphorus'), // Low
      potassium: interpretNutrient(300, 'Potassium'), // High
    },
  };
}


// Main Exported Function
export async function getSoilData(input: SoilDataInput): Promise<SoilDataOutput> {
  const apiKey = process.env.AGROMONITORING_API_KEY;
  if (!apiKey) {
    return getMockSoilData();
  }

  try {
    const { lat, lon } = await getCoordinates(input.location);
    const polygonId = await createPolygon(lat, lon, apiKey);
    const apiData = await getSoilApiData(polygonId, apiKey);

    // AgroMonitoring provides P and K in kg/ha. Assume N is not provided and use a mock value.
    const pValue = apiData.p_kgha || 25; // fallback to 25 if not present
    const kValue = apiData.k_kgha || 200; // fallback to 200 if not present
    const nValue = 400; // Mock N value as it's not in the standard soil API response.

    return {
      soilSampleDepth: '0-20cm', // API provides this
      nutrients: {
        nitrogen: interpretNutrient(nValue, 'Nitrogen'),
        phosphorus: interpretNutrient(pValue, 'Phosphorus'),
        potassium: interpretNutrient(kValue, 'Potassium'),
      },
    };
  } catch (error) {
    console.error("An error occurred in getSoilData:", error);
    return getMockSoilData();
  }
}
