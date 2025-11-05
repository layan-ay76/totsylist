export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
    
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const { userInput } = (await req.json()) as { userInput: string };
    console.log("User input:", userInput);

    // Test with just one model that should work
    console.log("Testing with gemini-1.5-flash model...");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `Generate a JSON list of baby travel products for: "${userInput}"

Return this exact JSON structure:
{
  "summary": {
    "due_date": "Travel with toddler",
    "budget": "moderate", 
    "key_prefs": ["travel-friendly"],
    "disclaimers": ["AI generated recommendations"]
  },
  "categories": [
    {
      "category": "Travel Essentials",
      "priority": "essential",
      "items": [
        {
          "name": "Toddler Travel Harness",
          "brand": "Munchkin", 
          "why": "Safety during flight",
          "eco_friendly": false,
          "est_price_usd": 25,
          "url": "https://www.amazon.com/dp/sample"
        }
      ]
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    
    const response = await result.response;
    const text = response.text();
    
    console.log(`Working model: ${workingModel}`);
    console.log("Raw response:", text.substring(0, 200) + "...");
    
    // Clean up the response
    let cleanText = text.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/```json\n?/, '').replace(/\n?```$/, '');
    }
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/```\n?/, '').replace(/\n?```$/, '');
    }
    
    const json = JSON.parse(cleanText);
    return NextResponse.json(json, { status: 200 });
    
  } catch (error: any) {
    console.error("=== GEMINI API ERROR ===");
    console.error("Error message:", error.message);
    
    // Return fallback data
    return NextResponse.json({ 
      summary: {
        due_date: "Travel with toddler",
        budget: "moderate",
        key_prefs: ["travel-friendly"],
        disclaimers: [`API Error: ${error.message}. Showing sample data.`]
      },
      categories: [
        {
          category: "Travel Essentials",
          priority: "essential",
          items: [
            {
              name: "Toddler Travel Harness",
              brand: "Munchkin",
              why: "Keeps toddler secure during flight",
              eco_friendly: false,
              est_price_usd: 25,
              url: "https://www.amazon.com/dp/sample"
            }
          ]
        }
      ]
    }, { status: 200 });
  }
}
