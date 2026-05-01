import { BibleQuote } from "../types";

const OPENAI_MODEL = "gpt-5.4-nano";

const BIBLE_QUOTE_SCHEMA = {
  type: "object",
  properties: {
    reference: {
      type: "string",
      description: "Bible reference in Book Chapter:StartVerse-EndVerse format.",
    },
    text: {
      type: "string",
      description: "The full passage text for the selected verses.",
    },
  },
  required: ["reference", "text"],
  additionalProperties: false,
} as const;

export const getBibleQuote = async (feeling: string): Promise<BibleQuote> => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey || apiKey === "YOUR_OPENAI_API_KEY_HERE") {
    return {
      reference: "System Error",
      text: "OpenAI API Key is missing. Please configure your environment.",
    };
  }

  try {
    const prompt = `The user is feeling: "${feeling}".
Find a meaningful bible passage (3-6 verses) that resonates with this feeling and offers deep comfort, wisdom, or guidance.
Focus on passages that encourage reflection and provide substantial spiritual nourishment.
Prefer the New Testament, but use the Old Testament if it is a perfect fit.
Return ONLY a valid JSON object with this exact structure:
{
  "reference": "Book Chapter:StartVerse-EndVerse",
  "text": "The full passage text"
}`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        input: [
          {
            role: "system",
            content:
              "You are a helpful assistant that provides relevant Bible passages. Always respond with valid JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "bible_quote",
            schema: BIBLE_QUOTE_SCHEMA,
            strict: true,
          },
        },
        max_output_tokens: 600,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${errorBody}`);
    }

    const data = await response.json();
    const content = data.output_text;

    if (!content) {
      throw new Error("No content in response");
    }

    return JSON.parse(content) as BibleQuote;
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return {
      reference: "Error 500",
      text: "I could not retrieve a divine message at this time. Please try again later.",
    };
  }
};
