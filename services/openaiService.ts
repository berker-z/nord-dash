import { BibleQuote } from '../types';

export const getBibleQuote = async (feeling: string): Promise<BibleQuote> => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey || apiKey === 'YOUR_OPENAI_API_KEY_HERE') {
    return {
      reference: "System Error",
      text: "OpenAI API Key is missing. Please configure your environment."
    };
  }

  try {
    const prompt = `The user is feeling: "${feeling}".
Find a bible verse that resonates with this feeling and offers comfort, wisdom, or guidance.
Prefer the New Testament, but use the Old Testament if it is a perfect fit.
Return ONLY a valid JSON object with this exact structure:
{
  "reference": "Book Chapter:Verse",
  "text": "The verse text"
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that provides relevant Bible verses. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in response');
    }

    return JSON.parse(content) as BibleQuote;

  } catch (error) {
    console.error("OpenAI API Error:", error);
    return {
      reference: "Error 500",
      text: "I could not retrieve a divine message at this time. Please try again later."
    };
  }
};
