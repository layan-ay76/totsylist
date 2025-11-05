export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ 
    ok: true, 
    where: "/api/generate-list",
    hasApiKey: !!process.env.GEMINI_API_KEY,
    keyLength: process.env.GEMINI_API_KEY?.length || 0
  });
}

export async function POST(req: NextRequest) {
  try {
    console.log("=== GENERATING BABY PRODUCTS WITH GEMINI ===");
    console.log("API Key exists:", !!process.env.GEMINI_API_KEY);
    
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }
    
    const { userInput } = (await req.json()) as { userInput: string };
    console.log("User input:", userInput);

    console.log("Calling Google Gemini...");
    
    const prompt = `You are TotsyList, a baby product shopping expert. Your task is to help a parent find all the products they need for their planned activity in one place. You are helping them parse through all the products available on the web with ease. Be comprehensive. This parent is relying on you. Consider yourself their best friend who has a baby and wants to make sure they are covered with everything that they need to buy. They shouldn't have to go anywhere else for info but here. Generate a comprehensive baby product list for: "${userInput}"

Return ONLY valid JSON with this exact structure (no markdown, no extra text):
{
  "summary": {
    "due_date": "Extract the main activity from user input (e.g., 'Having a baby', 'Baby shower', 'First month with newborn')",
    "budget": "extract from user input if applicable", 
    "key_prefs": ["extract from user input"],
    "disclaimers": ["Generated recommendations based on the parent's needs"]
  },
  "categories": [
    {
      "category": "Category Name",
      "priority": "essential",
      "items": [
        {
          "name": "Product Name",
          "brand": "Brand Name", 
          "why": "Brief reason why this product fits their needs",
          "eco_friendly": true,
          "est_price_usd": 25,
          "url": "https://www.amazon.com/product-link"
        }
      ]
    }
  ]
}

IMPORTANT: 
- In the "due_date" field, extract and summarize the main activity or situation from the user's input.
- Create MULTIPLE categories that are MOST RELEVANT to their specific situation and needs. Always create at least 3-5 different categories.
- Categories can be anything appropriate: "Feeding", "Sleep", "Diapering", "Travel", "Safety", "Clothing", "Bath Time", "Play & Development", "Nursery Setup", "Postpartum Care", "Baby Gear", "Emergency Kit", etc. Anything that you can think of. You do not need to abide by these.
- Choose the top categories that best match their specific needs and activity.
- For each category, think of ALL relevant products, rank them by importance/necessity from most important to least important, then return the TOP 10 most important products in that ranked order.
- For each product, include a "url" field with a direct purchase link (prefer Amazon, Target, Buy Buy Baby, or other major retailers).
- Consider their budget and preferences mentioned in the input.
- Prioritize categories as "essential" or "nice_to_have" based on their situation.

Return ONLY the JSON, no other text.`;

    // Use v1 API instead of v1beta with correct model
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API responded with ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Gemini API response received");
    
    if (!data.candidates || !data.candidates[0]) {
      throw new Error("No response from Gemini API");
    }
    
    const text = data.candidates[0].content.parts[0].text;
    console.log("Raw response:", text.substring(0, 200) + "...");
    
    // Clean up the response (remove any markdown formatting)
    let cleanText = text.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/```json\n?/, '').replace(/\n?```$/, '');
    }
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/```\n?/, '').replace(/\n?```$/, '');
    }
    
    const json = JSON.parse(cleanText);
    console.log("Generated categories:", json.categories?.length || 0);

    return NextResponse.json(json, { status: 200 });
    
  } catch (error: any) {
    console.error("=== GEMINI API ERROR ===");
    console.error("Error type:", typeof error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    // Return proper structure even on error
    return NextResponse.json({ 
      error: "Failed to generate list",
      details: error.message,
      summary: {
        due_date: "Error occurred",
        budget: "unknown",
        key_prefs: [],
        disclaimers: [`Gemini API Error: ${error.message}. Please check your API key.`]
      },
      categories: []
    }, { status: 500 });
  }
}
