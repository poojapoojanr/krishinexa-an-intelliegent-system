'use server';

/**
 * @fileOverview Fetches satellite imagery from the OpenWeatherMap API.
 * 
 * - getSatelliteImage - A function that returns a URL for a satellite image tile.
 * - GetSatelliteImageInput - The input type for the getSatelliteImage function.
 * - GetSatelliteImageOutput - The return type for the getSatelliteImage function.
 */

import { z } from 'genkit';

const GetSatelliteImageInputSchema = z.object({
  lat: z.number().describe('Latitude for the center of the map tile.'),
  lon: z.number().describe('Longitude for the center of the map tile.'),
  zoom: z.number().default(15).describe('Zoom level of the map tile.'),
});
export type GetSatelliteImageInput = z.infer<typeof GetSatelliteImageInputSchema>;

const GetSatelliteImageOutputSchema = z.object({
  imageUrl: z.string().describe('The URL of the fetched satellite image tile.'),
});
export type GetSatelliteImageOutput = z.infer<typeof GetSatelliteImageOutputSchema>;


export async function getSatelliteImage(input: GetSatelliteImageInput): Promise<GetSatelliteImageOutput> {
  const apiKey = process.env.SATELLITE_API_KEY;
  if (!apiKey) {
    // Fallback to picsum if no key is provided, for dev purposes
    const { lat, lon } = input;
    const placeholderUrl = `https://picsum.photos/seed/map${lat}${lon}/500/500`;
    console.warn("SATELLITE_API_KEY is not defined. Falling back to placeholder image.");
    return { imageUrl: placeholderUrl };
  }

  const { lat, lon, zoom } = input;
  
  // Convert lat/lon to tile coordinates for a standard TMS (Tile Map Service)
  const n = Math.pow(2, zoom);
  const xtile = Math.floor(n * ((lon + 180) / 360));
  const ytile = Math.floor(n * (1 - (Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI)) / 2);

  // Using OpenWeatherMap satellite layer URL format.
  const imageUrl = `https://sat.owm.io/sql/${zoom}/${xtile}/${ytile}?appid=${apiKey}`;
  
  // We will check if the image is actually available by making a HEAD request.
  try {
    const response = await fetch(imageUrl, { method: 'HEAD' });
    if (response.ok) {
        return { imageUrl };
    } else {
        // If the tile is not found, fallback to a placeholder.
        console.warn(`Satellite tile not found for ${zoom}/${xtile}/${ytile}. Falling back to placeholder.`);
        const placeholderUrl = `https://picsum.photos/seed/map${lat}${lon}/500/500`;
        return { imageUrl: placeholderUrl };
    }
  } catch (error) {
    console.error("Error checking satellite image existence:", error);
    const placeholderUrl = `https://picsum.photos/seed/map${lat}${lon}/500/500`;
    return { imageUrl: placeholderUrl };
  }
}
