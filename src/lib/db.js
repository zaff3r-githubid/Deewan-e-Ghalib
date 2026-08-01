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

// Helper: Get (or persist) the ghazal scheduled for a given date, cycling
// through every ghazal exactly once before any repeat. The rotation cursor
// is the number of dates already scheduled, so it only moves forward -
// unlike a date-diff formula it never reshuffles past assignments when the
// ghazal pool grows.
async function assignGhazalForDate(dateStr) {
  const existing = await db.execute({
    sql: "SELECT ghazal_id FROM daily_queue WHERE scheduled_date = ?",
    args: [dateStr],
  });
  if (existing.rows[0]) return Number(existing.rows[0].ghazal_id);

  const ghazalsRes = await db.execute("SELECT id FROM ghazals ORDER BY id ASC");
  const ghazals = ghazalsRes.rows;
  if (ghazals.length === 0) return null;

  const countRes = await db.execute("SELECT COUNT(*) as c FROM daily_queue");
  const idx = Number(countRes.rows[0].c) % ghazals.length;
  const ghazalId = Number(ghazals[idx].id);

  await db.execute({
    sql: "INSERT INTO daily_queue (ghazal_id, scheduled_date) VALUES (?, ?)",
    args: [ghazalId, dateStr],
  });
  return ghazalId;
}

// Helper: Get today's daily poem
export async function getTodayPoem() {
  const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const ghazalId = await assignGhazalForDate(todayStr);
  if (!ghazalId) return null;
  return getPoemById(ghazalId);
}

// Helper: Get all past daily poems (daily_queue is the authoritative history)
export async function getArchive() {
  const res = await db.execute(`
    SELECT g.*, dq.scheduled_date FROM daily_queue dq
    JOIN ghazals g ON g.id = dq.ghazal_id
    ORDER BY dq.scheduled_date DESC
  `);
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
