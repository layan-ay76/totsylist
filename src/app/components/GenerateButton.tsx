"use client";
import { useState } from "react";
import { mockBabyRegistryData } from "@/app/lib/mockData";

export default function GenerateButton({ onResult }: { onResult: (data: any) => void }) {
  const [input, setInput] = useState(
    "I am traveling with a toddler what do I need to take with me on the flight"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    try {
      setLoading(true);
      setError(null);
      
      // Real API call using Gemini
      const res = await fetch("/api/generate-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInput: input })
      });
      
      if (!res.ok) {
        throw new Error(`API call failed: ${res.status}`);
      }
      
      const json = await res.json();
      
      // Add the original input to the result so we can use it for explanations
      json.originalInput = input;
      
      onResult(json);
      
    } catch (e: any) {
      console.error("API Error:", e);
      setError(e?.message ?? "Something went wrong.");
      
      // Fallback to mock data if API fails
      onResult(mockBabyRegistryData);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Tell us about your needs</h2>
      
      <div className="space-y-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full h-32 border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="I am traveling with a toddler what do I need to take with me on the flight"
        />
        
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate My TotsyList'}
        </button>
        
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}