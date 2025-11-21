import { GoogleGenAI, Type } from "@google/genai";
import { BibleQuote } from '../types';

export const getBibleQuote = async (feeling: string): Promise<BibleQuote> => {
  if (!process.env.API_KEY) {
    return {
      reference: "System Error",
      text: "API Key is missing. Please configure your environment."
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      The user is feeling: "${feeling}".
      Find a bible verse that resonates with this feeling and offers comfort, wisdom, or guidance.
      Prefer the New Testament, but use the Old Testament if it is a perfect fit.
      Return only the reference (Book Chapter:Verse) and the text content.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reference: { type: Type.STRING },
            text: { type: Type.STRING }
          },
          required: ["reference", "text"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response text");
    
    return JSON.parse(jsonText) as BibleQuote;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      reference: "Error 500",
      text: "I could not retrieve a divine message at this time. Please try again later."
    };
  }
};
