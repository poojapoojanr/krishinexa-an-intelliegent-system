
import { getMarketPrices } from "@/ai/services/market-prices";
import 'dotenv/config';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const commodity = searchParams.get("commodity") || "Tomato";
    const prices = await getMarketPrices(commodity);
    return new Response(JSON.stringify(prices), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch market prices." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
