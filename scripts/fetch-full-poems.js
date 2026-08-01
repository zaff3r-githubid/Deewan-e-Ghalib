// scripts/fetch-full-poems.js
const fs = require("fs");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");

// Load environment variables
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Error: GEMINI_API_KEY is not defined in .env.local");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

const poemsGuide = {
  "Ibne-Maryam hua kare koi": {
    count: 11,
    guide: `Include all 11 standard couplets of the ghazal. The first lines of these couplets are:
1. Ibn-e-Maryam hua kare koi
2. Shara-o-aaeen par madaar sahi
3. Chaal jaise kadi kamaan ka teer
4. Baat par vaan zabaan kat-ti hai
5. Bak raha hoon junoon mein kya kya kuch
6. Na suno gar bura kahe koi
7. Na kaho gar bura kare koi
8. Rok lo gar ghalat chale koi
9. Bakhsh do gar khataa kare koi
10. Kon hai jo nahi hai haajatmand
11. Jab tawaqqo hee uth gayi Ghalib`
  },
  "Hazaaron khwahishein aisi ke har khwahish pe dam nikle": {
    count: 11,
    guide: `Include all 11 standard couplets of the ghazal. The first lines of these couplets are:
1. Hazaron khwahishein aisi ke har khwahish pe dam nikle
2. Dare kyon mera qaatil, kya rahega uski gardan par
3. Nikalna khuld se aadam ka sunte aaye hain lekin
4. Bharam khul jaaye zaalim, teri qaamat ki daraazi ka
5. Magar likhwaye koi usko khat, to humse likhwaye
6. Hui is daur mein mansoob mujhse baada-aashami
7. Hui jinse tavaqqo khastagi ki daad paane ki
8. Mohabbat mein nahin hai farq jeene aur marne ka
9. Zara kar jor seene par ki teer-e-pur-sitam nikle
10. Khuda ke waaste parda na kaabe se utha zaalim
11. Kahaan maikhaane ka darwaaza 'Ghalib' aur kahaan waaiz`
  },
  "Ye na thi hamari qismat ke wisal-e-yaar hota": {
    count: 11,
    guide: `Include all 11 standard couplets of the ghazal. The first lines of these couplets are:
1. ye na thii hamaarii qismat ke visaal-e-yaar hota
2. tere vaade par jiye ham to yah jaan jhuuTh jaanaa
3. terii naazukii se jaanaa ke ba.ndha tha 'ahd-e-buudaa
4. koii mere dil se puuchhe tere tiir-e-niimkash ko
5. ye kahaa.N kii dostii hai ke bane hai.N dost naaseh
6. rag-e-sa.ng se tapaktaa vo lahuu ke phir na thamtaa
7. gham agarche jaa.N-gusil hai pe kahaa.N bache.N ke dil hai
8. kahuu.N kis se mai.N ke kya hai shab-e-gham burii balaa hai
9. hue mar ke ham jo rusvaa hue kyo.N na gharq-e-dariyaa
10. use kaun dekh saktaa ke yagaana hai vo yaktaa
11. ye masaail-e-tasavvuf ye teraa bayaan 'Ghalib'`
  },
  "Har ek baat pe kehte ho tum ke tu kya hai": {
    count: 10,
    guide: `Include all 10 standard couplets of the ghazal. The first lines of these couplets are:
1. har ek baat pe kehte ho tum ki tu kya hai
2. na sholon mein ye karishma na barq mein ye ada
3. ye rashk hai ki vo hota hai ham-sukhan tum se
4. chipak raha hai badan par lahu se pairahan
5. jala hai jism jahaan dil bhi jal gaya hoga
6. ragon mein daudte phirne ke hum nahin qaa'il
7. vo cheez jiske liye hamko ho bahisht azeez
8. piyoon sharaab agar khum bhi dekh loon do-chaar
9. rahi na taaqat-e-guftaar aur agar ho bhi
10. bana hai shah ka musahib, fire hai itraata`
  }
};

const seedFilePath = path.join(__dirname, "../src/lib/seed-data.json");

async function fetchFullPoem(title, details) {
  console.log(`Requesting full poem analysis from Gemini for: "${title}" (${details.count} couplets)...`);
  
  const prompt = `
    You are an expert scholar of Mirza Ghalib's poetry. Retrieve and analyze the standard Urdu ghazal starting with "${title}".
    
    ${details.guide}
    
    Provide the response strictly as a JSON object matching the following structure:
    {
      "title": "${title}",
      "urdu_title": "Urdu script of the first line",
      "poet": "Mirza Ghalib",
      "language": "urdu",
      "couplets": [
        {
          "couplet_number": 1,
          "urdu_text": "couplet in Urdu script (separated by \\n)",
          "transliteration": "couplet in Roman Urdu (separated by \\n)",
          "translation": "English translation (separated by \\n)",
          "urdu_translation": "Literal or poetic translation in modern Urdu prose/verse (separated by \\n)",
          "explanation": "Commentary in English (3-4 paragraphs separated by \\n\\n)",
          "explanation_urdu": "Commentary in Urdu (3-4 paragraphs separated by \\n\\n)",
          "context": "Background/context in English (2 paragraphs separated by \\n\\n)",
          "context_urdu": "Background/context in Urdu (2 paragraphs separated by \\n\\n)",
          "words": [
            {
              "word_order": 1,
              "word_urdu": "Urdu word from the couplet (without punctuation)",
              "meaning_urdu": "Urdu meaning",
              "meaning_english": "English meaning"
            }
          ]
        }
      ]
    }
    
    Ensure that:
    1. You return ONLY valid JSON matching this schema (do not wrap in markdown code blocks like \`\`\`json).
    2. You include ALL the specified couplets.
    3. You extract 4-6 key words per couplet in the "words" array.
    4. Text values use '\\n' for new lines as specified.
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
    console.log(`Successfully fetched "${title}" with ${data.couplets.length} couplets.`);
    return data;
  } catch (err) {
    console.error(`Error fetching "${title}":`, err.message);
    throw err;
  }
}

async function run() {
  if (!fs.existsSync(seedFilePath)) {
    console.error(`Seed file not found at: ${seedFilePath}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(seedFilePath, "utf8");
  const seedData = JSON.parse(rawData);

  for (const [title, details] of Object.entries(poemsGuide)) {
    // Fetch complete poem data
    const fullPoem = await poolPromise(title, details);

    // Find and replace the static poem entry in seed-data.json
    const idx = seedData.ghazals.findIndex(g => g.title.toLowerCase().trim() === title.toLowerCase().trim());
    if (idx !== -1) {
      seedData.ghazals[idx] = fullPoem;
      console.log(`Replaced "${title}" in seed data memory.`);
    } else {
      seedData.ghazals.push(fullPoem);
      console.log(`Added new poem "${title}" to seed data memory.`);
    }
    
    // Wait to avoid rate limiting
    console.log("Waiting 5 seconds before next request...");
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // Write updated seed-data.json back to file
  fs.writeFileSync(seedFilePath, JSON.stringify(seedData, null, 2), "utf8");
  console.log("Updated src/lib/seed-data.json successfully with full poems!");
}

async function poolPromise(title, details) {
  let attempts = 3;
  while (attempts > 0) {
    try {
      return await fetchFullPoem(title, details);
    } catch (e) {
      attempts--;
      if (attempts === 0) throw e;
      console.log(`Error encountered. Retrying ${title}... (${attempts} attempts left)`);
      await new Promise(r => setTimeout(r, 8000));
    }
  }
}

run();
