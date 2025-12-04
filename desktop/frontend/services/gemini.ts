import { GoogleGenAI, Type } from "@google/genai";
import { Flashcard } from "../types";
import { createInitialSRSState } from "./srs";

const apiKey = process.env.API_KEY; // Assumed to be available

// Helper to generate flashcards from text
export const generateFlashcardsFromText = async (text: string): Promise<Flashcard[]> => {
  if (!apiKey) {
    console.warn("Gemini API Key is missing. Returning empty list.");
    return [];
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate 5-10 useful flashcards for learning English from the following text. 
      Focus on difficult vocabulary or key phrases. 
      Text: "${text.substring(0, 2000)}"`, // Truncate for safety
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              front: { type: Type.STRING, description: "The word or phrase to learn" },
              back: { type: Type.STRING, description: "The definition or translation (in simple English)" }
            },
            required: ["front", "back"]
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) return [];
    
    const rawData = JSON.parse(jsonText) as { front: string; back: string }[];
    
    // Initialize with SRS defaults
    return rawData.map((item) => ({
      id: crypto.randomUUID(),
      front: item.front,
      back: item.back,
      ...createInitialSRSState()
    }));

  } catch (error) {
    console.error("Failed to generate flashcards", error);
    throw error;
  }
};