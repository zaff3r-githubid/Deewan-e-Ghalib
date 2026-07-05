// scripts/seed.js
const { createClient } = require("@libsql/client");
const fs = require("fs");
const path = require("path");

// Load dotenv
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

const url = process.env.TURSO_DATABASE_URL || "file:deewan.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

// Local development with dynamic relative path for SQLite if url starts with "file:"
const dbUrl = url.startsWith("file:") && !url.startsWith("file:/")
  ? `file:${path.join(__dirname, "../", url.replace("file:", ""))}`
  : url;

console.log(`Connecting database at: ${dbUrl}`);
const db = createClient({ url: dbUrl, authToken });

async function initSchema() {
  console.log("Initializing database schema...");
  
  await db.execute(`
    CREATE TABLE IF NOT EXISTS subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'active',
      token TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS ghazals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      urdu_title TEXT,
      poet TEXT DEFAULT 'Mirza Ghalib',
      language TEXT DEFAULT 'urdu',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS couplets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ghazal_id INTEGER,
      couplet_number INTEGER,
      urdu_text TEXT NOT NULL,
      transliteration TEXT NOT NULL,
      translation TEXT NOT NULL,
      urdu_translation TEXT,
      explanation TEXT NOT NULL,
      explanation_urdu TEXT,
      context TEXT NOT NULL,
      context_urdu TEXT,
      FOREIGN KEY(ghazal_id) REFERENCES ghazals(id) ON DELETE CASCADE
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS word_meanings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      couplet_id INTEGER,
      word_order INTEGER,
      word_urdu TEXT NOT NULL,
      meaning_urdu TEXT NOT NULL,
      meaning_english TEXT NOT NULL,
      FOREIGN KEY(couplet_id) REFERENCES couplets(id) ON DELETE CASCADE
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS daily_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ghazal_id INTEGER,
      scheduled_date TEXT UNIQUE NOT NULL,
      sent INTEGER DEFAULT 0,
      FOREIGN KEY(ghazal_id) REFERENCES ghazals(id) ON DELETE CASCADE
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS letters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      recipient TEXT NOT NULL,
      date_written TEXT,
      urdu_text TEXT NOT NULL,
      transliteration TEXT NOT NULL,
      translation TEXT NOT NULL,
      explanation TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log("Database schema verification completed.");
}

async function insertGhazal(ghazalData) {
  const existing = await db.execute({
    sql: "SELECT id FROM ghazals WHERE title = ?",
    args: [ghazalData.title],
  });
  
  if (existing.rows.length > 0) {
    console.log(`Ghazal "${ghazalData.title}" already exists. Skipping.`);
    return Number(existing.rows[0].id);
  }

  const result = await db.execute({
    sql: "INSERT INTO ghazals (title, urdu_title, poet, language) VALUES (?, ?, ?, ?)",
    args: [ghazalData.title, ghazalData.urdu_title || null, ghazalData.poet || "Mirza Ghalib", ghazalData.language || "urdu"],
  });
  
  const ghazalId = Number(result.lastInsertRowid);
  console.log(`Inserted Ghazal: ${ghazalData.title} (ID: ${ghazalId})`);

  for (const couplet of ghazalData.couplets) {
    const coupletResult = await db.execute({
      sql: `
        INSERT INTO couplets (ghazal_id, couplet_number, urdu_text, transliteration, translation, urdu_translation, explanation, explanation_urdu, context, context_urdu)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        ghazalId,
        couplet.couplet_number,
        couplet.urdu_text,
        couplet.transliteration,
        couplet.translation,
        couplet.urdu_translation || null,
        couplet.explanation,
        couplet.explanation_urdu || null,
        couplet.context,
        couplet.context_urdu || null,
      ],
    });

    const coupletId = Number(coupletResult.lastInsertRowid);

    if (couplet.words && Array.isArray(couplet.words)) {
      for (const word of couplet.words) {
        await db.execute({
          sql: `
            INSERT INTO word_meanings (couplet_id, word_order, word_urdu, meaning_urdu, meaning_english)
            VALUES (?, ?, ?, ?, ?)
          `,
          args: [
            coupletId,
            word.word_order,
            word.word_urdu,
            word.meaning_urdu,
            word.meaning_english,
          ],
        });
      }
    }
  }

  return ghazalId;
}

async function insertLetter(letterData) {
  const existing = await db.execute({
    sql: "SELECT id FROM letters WHERE title = ?",
    args: [letterData.title],
  });

  if (existing.rows.length > 0) {
    console.log(`Letter "${letterData.title}" already exists. Skipping.`);
    return Number(existing.rows[0].id);
  }

  const result = await db.execute({
    sql: `
      INSERT INTO letters (title, recipient, date_written, urdu_text, transliteration, translation, explanation)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      letterData.title,
      letterData.recipient,
      letterData.date_written || null,
      letterData.urdu_text,
      letterData.transliteration,
      letterData.translation,
      letterData.explanation,
    ],
  });

  const letterId = Number(result.lastInsertRowid);
  console.log(`Inserted Letter: ${letterData.title} (ID: ${letterId})`);
  return letterId;
}

async function seedStaticData() {
  const seedFilePath = path.join(__dirname, "../src/lib/seed-data.json");
  if (!fs.existsSync(seedFilePath)) {
    console.error(`Static seed file not found at: ${seedFilePath}`);
    return;
  }

  console.log("Seeding static database entries...");
  const rawData = fs.readFileSync(seedFilePath, "utf8");
  const data = JSON.parse(rawData);

  if (data.ghazals && Array.isArray(data.ghazals)) {
    for (const ghazal of data.ghazals) {
      await insertGhazal(ghazal);
    }
  }

  if (data.letters && Array.isArray(data.letters)) {
    for (const letter of data.letters) {
      await insertLetter(letter);
    }
  }
}

async function seedDynamicData() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log("No GEMINI_API_KEY found in environment. Skipping dynamic seeding.");
    return;
  }

  const { GoogleGenAI } = require("@google/genai");
  const ai = new GoogleGenAI({ apiKey });

  console.log("GEMINI_API_KEY detected! Initializing complete Deewan-e-Ghalib index...");

  let extraGhazals = [];
  try {
    const indexPrompt = `
      You are an expert scholar of Mirza Ghalib's poetry. Provide a definitive list of the opening lines (transliterated in Roman English script) of all Urdu ghazals in the standard Deewan-e-Ghalib.
      Format your response strictly as a JSON object with a single key "titles" containing a JSON array of strings, like this:
      {
        "titles": [
          "Dil-e-nadaan tujhe hua kya hai",
          "Ye na thi hamari qismat ke wisal-e-yaar hota"
        ]
      }
      Return ONLY valid JSON matching this schema. Provide all available Urdu ghazals in the Deewan (aim for up to 230 unique ghazals).
    `;

    const listRes = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: indexPrompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const listData = JSON.parse(listRes.text);
    extraGhazals = listData.titles || [];
    console.log(`Retrieved index of ${extraGhazals.length} ghazals from Gemini.`);
  } catch (err) {
    console.error("Failed to retrieve complete ghazal index from Gemini:", err.message);
    return;
  }

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  for (let i = 0; i < extraGhazals.length; i++) {
    const title = extraGhazals[i];
    
    // Fuzzy duplicate checking to support resume after interruption
    const checkTitle = title.substring(0, 15);
    const existing = await db.execute({
      sql: "SELECT id FROM ghazals WHERE title LIKE ?",
      args: [`%${checkTitle}%`],
    });
    
    if (existing.rows.length > 0) {
      console.log(`[${i + 1}/${extraGhazals.length}] Ghazal resembling "${title}" already exists. Skipping.`);
      continue;
    }

    console.log(`[${i + 1}/${extraGhazals.length}] Requesting full poem from Gemini: "${title}"...`);
    try {
      const prompt = `
        You are a scholar of Mirza Ghalib's poetry. Retrieve and analyze the ghazal starting with "${title}".
        Provide the response strictly as a JSON object with this structure:
        {
          "title": "English transliteration of first line",
          "urdu_title": "Urdu script of first line",
          "poet": "Mirza Ghalib",
          "couplets": [
            {
              "couplet_number": 1,
              "urdu_text": "couplet in Urdu script (separated by \\n)",
              "transliteration": "couplet in Roman Urdu (separated by \\n)",
              "translation": "English translation (separated by \\n)",
              "explanation": "commentary (3-4 paragraphs separated by \\n\\n)",
              "context": "background (2 paragraphs separated by \\n\\n)",
              "words": [
                {
                  "word_order": 1,
                  "word_urdu": "Urdu word",
                  "meaning_urdu": "Urdu meaning",
                  "meaning_english": "English meaning"
                }
              ]
            }
          ]
        }
        Return ONLY valid JSON matching this schema. Include the complete ghazal (with all of its famous couplets, typically 5 to 11 couplets). Extract 4-6 key words per couplet.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const ghazalData = JSON.parse(response.text);
      await insertGhazal(ghazalData);
      console.log(`Successfully seeded: "${title}"`);

      // Rate limit delay to stay under Gemini free tier limit (15 RPM)
      if (i < extraGhazals.length - 1) {
        console.log("Waiting 5 seconds to stay under free tier rate limits...");
        await delay(5000);
      }
    } catch (err) {
      console.error(`Failed to fetch dynamic content for "${title}":`, err.message);
    }
  }

  // Dynamic Letters
  const extraLetters = [
    "Letter to Munshi Hargopal Taftah: on poverty and correction of verses",
    "Letter to Mir Mehdi Majrooh: describing post-1857 ruined Delhi",
  ];

  console.log("Seeding additional letters dynamically...");

  for (const title of extraLetters) {
    const existing = await db.execute({
      sql: "SELECT id FROM letters WHERE title LIKE ?",
      args: [`%${title}%`],
    });
    
    if (existing.rows.length > 0) {
      console.log(`Letter "${title}" already exists. Skipping.`);
      continue;
    }

    console.log(`Requesting letter from Gemini for: "${title}"...`);
    try {
      const prompt = `
        You are a scholar of Urdu prose, specializing in Mirza Ghalib's letters. Retrieve Ghalib's letter matching: "${title}".
        Provide the response strictly as a JSON object with this structure:
        {
          "title": "Short English title describing letter",
          "recipient": "Recipient name (e.g. Har Gopal Taftah)",
          "date_written": "Approximate year (e.g. 1859)",
          "urdu_text": "Letter body in Urdu script (use \\n\\n for paragraphs)",
          "transliteration": "Letter body in Roman Urdu (use \\n\\n for paragraphs)",
          "translation": "Conversational English translation (use \\n\\n for paragraphs)",
          "explanation": "Literary analysis of Ghalib's prose style, humor, and details of his life/history (3 paragraphs separated by \\n\\n)"
        }
        Return ONLY valid JSON matching this schema.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const letterData = JSON.parse(response.text);
      await insertLetter(letterData);
      console.log(`Successfully generated and inserted letter: "${title}"`);
    } catch (err) {
      console.error(`Failed to fetch dynamic letter for "${title}":`, err.message);
    }
  }
}

async function scheduleDailyQueue() {
  console.log("Scheduling daily queue...");
  
  const ghazalsRes = await db.execute("SELECT id FROM ghazals ORDER BY id ASC");
  const ghazals = ghazalsRes.rows;
  if (ghazals.length === 0) {
    console.log("No ghazals in DB to schedule.");
    return;
  }

  const today = new Date();
  
  for (let index = 0; index < ghazals.length; index++) {
    const ghazal = ghazals[index];
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + index);
    const dateStr = targetDate.toISOString().split("T")[0];

    const existingRes = await db.execute({
      sql: "SELECT id FROM daily_queue WHERE scheduled_date = ?",
      args: [dateStr],
    });

    if (existingRes.rows.length === 0) {
      await db.execute({
        sql: "INSERT INTO daily_queue (ghazal_id, scheduled_date) VALUES (?, ?)",
        args: [Number(ghazal.id), dateStr],
      });
      console.log(`Scheduled Ghazal ID ${ghazal.id} for date: ${dateStr}`);
    } else {
      console.log(`Date ${dateStr} is already scheduled with Ghazal ID: ${existingRes.rows[0].ghazal_id}`);
    }
  }
}

async function run() {
  try {
    await initSchema();
    await seedStaticData();
    await seedDynamicData();
    await scheduleDailyQueue();
    console.log("Seeding process completed successfully.");
  } catch (err) {
    console.error("Critical seeding error:", err);
    process.exit(1);
  }
}

run();
