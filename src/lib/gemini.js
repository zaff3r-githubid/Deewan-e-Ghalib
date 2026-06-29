import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

export async function fetchGhazalFromGemini(ghazalTitle) {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    You are a world-class scholar of Urdu literature, specializing in Mirza Ghalib's poetry.
    Retrieve and analyze the ghazal by Mirza Ghalib matching the following title or opening line: "${ghazalTitle}".
    
    Provide the response strictly as a JSON object with the following structure:
    {
      "title": "English/Roman transliteration of the first line (e.g., 'Dil-e-nadaan tujhe hua kya hai')",
      "urdu_title": "Urdu script of the first line",
      "poet": "Mirza Ghalib",
      "couplets": [
        {
          "couplet_number": 1,
          "urdu_text": "The couplet written in accurate Urdu script (use newline \\n to separate the two lines/misras)",
          "transliteration": "The couplet in Roman Urdu (use newline \\n to separate)",
          "translation": "Fluent and poetic English translation of the couplet (use newline \\n to separate lines if needed)",
          "explanation": "A deep literary explanation of the couplet, analyzing Ghalib's metaphors, Sufic themes, and philosophical layers. Provide a thorough analysis in 2 to 3 detailed paragraphs separated by double newlines (\\n\\n).",
          "context": "Any historical context, background, or inspiration for this couplet (e.g., the specific phase of Ghalib's life, poetic context, or common motifs used here) (about 2 paragraphs separated by \\n\\n)",
          "words": [
            {
              "word_order": 1,
              "word_urdu": "A key word or phrase from the couplet in Urdu script",
              "meaning_urdu": "Meaning of the word/phrase in plain Urdu",
              "meaning_english": "Meaning of the word/phrase in English"
            }
          ]
        }
      ]
    }

    Requirements:
    1. Include the most famous couplets of this ghazal (between 3 and 7 couplets).
    2. For each couplet, extract 4-6 key vocabulary words or compound phrases (such as izafats) and provide their meanings in both plain Urdu and English.
    3. Ensure the Nastaliq spelling and layout is correct.
    4. Provide highly professional, insightful commentary.
    5. Return ONLY the JSON object.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const data = JSON.parse(response.text);
    return data;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

export async function fetchLetterFromGemini(letterTitle) {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    You are a world-class scholar of Urdu literature, specializing in Mirza Ghalib's prose and letters (khutoot).
    Retrieve and analyze Ghalib's letter matching the following subject or title: "${letterTitle}".
    
    Provide the response strictly as a JSON object with the following structure:
    {
      "title": "A short English title for the letter (e.g., 'Letter to Taftah: on mangoes')",
      "recipient": "Name of the recipient in English (e.g., 'Har Gopal Taftah')",
      "date_written": "Approximate year written (e.g., '1858')",
      "urdu_text": "The letter's body text in accurate Urdu script (use double newlines \\n\\n for paragraphs)",
      "transliteration": "The letter's body in Roman Urdu transliteration (use double newlines \\n\\n for paragraphs)",
      "translation": "Complete, fluent, and conversational English translation (use double newlines \\n\\n for paragraphs)",
      "explanation": "A deep literary and historical commentary on the letter. Analyze Ghalib's humor, his conversational style ('muraasla ko mukaalma bana diya'), the specific recipient's relationship, and any historical contexts like the aftermath of 1857 (about 2-4 detailed paragraphs separated by double newlines \\n\\n)"
    }

    Requirements:
    1. Ensure the Urdu transcription is accurate and represents Ghalib's original style.
    2. The English translation must preserve Ghalib's wit and conversational tone.
    3. Return ONLY the JSON object.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Letter API Error:", error);
    throw error;
  }
}
