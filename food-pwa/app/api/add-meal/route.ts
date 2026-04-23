import { NextResponse } from 'next/server';

/**
 * POST /api/add-meal
 * Expected body: { name: string, quantity: string }
 * Uses FatSecret API to fetch nutrition information for the given food.
 * If FatSecret fails, falls back to Grok API (simple placeholder).
 */
export async function POST(request: Request) {
  let name: string | undefined;
  let quantity: string | undefined;

  try {
    const body = await request.json();
    name = body.name;
    quantity = body.quantity;
    if (!name) {
      return NextResponse.json({ message: 'Meal name is required' }, { status: 400 });
    }
    const clientId = process.env.FATSECRET_CLIENT_ID;
    const clientSecret = process.env.FATSECRET_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return NextResponse.json({ message: 'FatSecret credentials missing' }, { status: 500 });
    }
    // Build FatSecret API request – using the public REST endpoint.
    // Documentation: https://platform.fatsecret.com/api/ – method=foods.search
    const params = new URLSearchParams({
      method: 'foods.search',
      format: 'json',
      oauth_consumer_key: clientId,
      oauth_consumer_secret: clientSecret,
      search_expression: name,
    });
    const fatSecretUrl = `https://platform.fatsecret.com/rest/server.api?${params.toString()}`;
    const fsRes = await fetch(fatSecretUrl);
    if (!fsRes.ok) throw new Error('FatSecret request failed');
    const fsData = await fsRes.json();
    // Very minimal parsing – pick the first food item if available.
    const food = fsData?.foods?.food?.[0];
    if (!food) throw new Error('No food data returned');
    // Build a simple nutrition summary.
    const result = {
      name: food.food_name,
      calories: food.food_calories,
      protein: food.food_protein,
      carbs: food.food_carbohydrate,
      fat: food.food_fat,
    };
    return NextResponse.json({ message: 'Meal added', data: result }, { status: 200 });
  } catch (err) {
    // Fallback to Grok – very simple placeholder that returns an error message.
    const grokKey = [
      process.env.GROK_API_KEY,
      process.env.XAI_API_KEY,
      process.env.GROQ_API_KEY,
    ].find((key) => key && !key.startsWith("your_") && !key.includes("placeholder"));

    if (grokKey) {
      // Example call – not a real implementation.
      try {
        const grokRes = await fetch('https://api.grok.ai/v1/food', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${grokKey}`,
          },
          body: JSON.stringify({ name, quantity }),
        });
        if (grokRes.ok) {
          const grokData = await grokRes.json();
          return NextResponse.json({ message: 'Meal added via Grok', data: grokData }, { status: 200 });
        }
      } catch (_) {
        // ignore
      }
    }
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ message: `Failed to add meal: ${message}` }, { status: 500 });
  }
}
