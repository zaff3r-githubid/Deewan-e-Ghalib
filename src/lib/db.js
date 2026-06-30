import { createClient } from "@libsql/client";
import path from "path";

let db;

const url = process.env.TURSO_DATABASE_URL || "file:deewan.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

// Local development with dynamic relative path for SQLite if url starts with "file:"
const dbUrl = url.startsWith("file:") && !url.startsWith("file:/")
  ? `file:${path.join(/*turbopackIgnore: true*/ process.cwd(), url.replace("file:", ""))}`
  : url;

if (process.env.NODE_ENV === "production") {
  db = createClient({ url: dbUrl, authToken });
} else {
  if (!global._deewan_libsql_db) {
    global._deewan_libsql_db = createClient({ url: dbUrl, authToken });
  }
  db = global._deewan_libsql_db;
}

// Initialize Database Tables (Async)
export async function initDb() {
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
}

// Call initialization in background
initDb().catch((err) => {
  console.error("Failed to initialize database:", err);
});

// Helper: Get full poem detail structure by Ghazal ID
export async function getPoemById(ghazalId) {
  const ghazalRes = await db.execute({
    sql: "SELECT * FROM ghazals WHERE id = ?",
    args: [ghazalId],
  });
  const ghazal = ghazalRes.rows[0] ? { ...ghazalRes.rows[0] } : null;
  if (!ghazal) return null;

  const coupletsRes = await db.execute({
    sql: "SELECT * FROM couplets WHERE ghazal_id = ? ORDER BY couplet_number ASC",
    args: [ghazalId],
  });
  
  const couplets = coupletsRes.rows.map((row) => ({ ...row }));

  for (const couplet of couplets) {
    const wordsRes = await db.execute({
      sql: "SELECT word_urdu, meaning_urdu, meaning_english FROM word_meanings WHERE couplet_id = ? ORDER BY word_order ASC",
      args: [couplet.id],
    });
    couplet.words = wordsRes.rows.map((row) => ({ ...row }));
  }

  return { ghazal, couplets };
}

// Helper: Get today's daily poem
export async function getTodayPoem() {
  const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  
  let queueRes = await db.execute({
    sql: "SELECT * FROM daily_queue WHERE scheduled_date = ?",
    args: [todayStr],
  });
  let queueEntry = queueRes.rows[0];
  
  if (!queueEntry) {
    // Pick the next unscheduled ghazal
    const nextGhazalRes = await db.execute(`
      SELECT * FROM ghazals 
      WHERE id NOT IN (SELECT ghazal_id FROM daily_queue) 
      ORDER BY id ASC 
      LIMIT 1
    `);
    let ghazal = nextGhazalRes.rows[0];

    // Cycle check
    if (!ghazal) {
      const randomGhazalRes = await db.execute("SELECT * FROM ghazals ORDER BY RANDOM() LIMIT 1");
      ghazal = randomGhazalRes.rows[0];
    }

    if (!ghazal) {
      return null;
    }

    // Insert into queue
    await db.execute({
      sql: "INSERT INTO daily_queue (ghazal_id, scheduled_date) VALUES (?, ?)",
      args: [ghazal.id, todayStr],
    });

    const refreshedQueueRes = await db.execute({
      sql: "SELECT * FROM daily_queue WHERE scheduled_date = ?",
      args: [todayStr],
    });
    queueEntry = refreshedQueueRes.rows[0];
  }

  return getPoemById(Number(queueEntry.ghazal_id));
}

// Helper: Get all past daily poems
export async function getArchive() {
  const todayStr = new Date().toISOString().split("T")[0];
  const res = await db.execute({
    sql: `
      SELECT g.*, dq.scheduled_date 
      FROM ghazals g 
      JOIN daily_queue dq ON g.id = dq.ghazal_id 
      WHERE dq.scheduled_date <= ? 
      ORDER BY dq.scheduled_date DESC
    `,
    args: [todayStr],
  });
  return res.rows.map((row) => ({ ...row }));
}

// Helper: Subscribe Email
export async function subscribeEmail(email) {
  const checkRes = await db.execute({
    sql: "SELECT * FROM subscribers WHERE email = ?",
    args: [email],
  });
  const existing = checkRes.rows[0];
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  if (existing) {
    if (existing.status === "unsubscribed") {
      await db.execute({
        sql: "UPDATE subscribers SET status = 'active' WHERE email = ?",
        args: [email],
      });
      return { success: true, isNew: false, token: existing.token };
    }
    return { success: true, isNew: false, token: existing.token };
  }

  await db.execute({
    sql: "INSERT INTO subscribers (email, token) VALUES (?, ?)",
    args: [email, token],
  });
  return { success: true, isNew: true, token };
}

// Helper: Unsubscribe Email
export async function unsubscribeEmail(token) {
  const result = await db.execute({
    sql: "UPDATE subscribers SET status = 'unsubscribed' WHERE token = ?",
    args: [token],
  });
  return Number(result.rowsAffected) > 0;
}

// Letters Helpers
export async function getAllLetters() {
  const res = await db.execute("SELECT id, title, recipient, date_written FROM letters ORDER BY id ASC");
  return res.rows.map((row) => ({ ...row }));
}

export async function getLetterById(id) {
  const res = await db.execute({
    sql: "SELECT * FROM letters WHERE id = ?",
    args: [id],
  });
  return res.rows[0] ? { ...res.rows[0] } : null;
}

export { db };
