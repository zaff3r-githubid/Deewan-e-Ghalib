// scripts/generate-daily-json.js
const { createClient } = require("@libsql/client");
const fs = require("fs");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

const url = process.env.TURSO_DATABASE_URL || "file:deewan.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

// Local development dynamic path for SQLite if url starts with "file:"
const dbUrl = url.startsWith("file:") && !url.startsWith("file:/")
  ? `file:${path.join(__dirname, "../", url.replace("file:", ""))}`
  : url;

console.log(`Connecting database at: ${dbUrl}`);
const db = createClient({ url: dbUrl, authToken });

async function getPoemById(ghazalId) {
  const ghazalRes = await db.execute({
    sql: "SELECT * FROM ghazals WHERE id = ?",
    args: [ghazalId],
  });
  const ghazal = ghazalRes.rows[0];
  if (!ghazal) return null;

  const coupletsRes = await db.execute({
    sql: "SELECT * FROM couplets WHERE ghazal_id = ? ORDER BY couplet_number ASC",
    args: [ghazalId],
  });
  const couplets = coupletsRes.rows.map((row) => ({ ...row }));

  return { ghazal, couplets };
}

async function getTodayPoem() {
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

async function run() {
  console.log("Generating static daily-poem.json file...");
  try {
    const poemData = await getTodayPoem();
    if (!poemData) {
      console.log("No poem of the day scheduled or database is empty.");
      process.exit(0);
    }
    
    const outputPath = path.join(__dirname, "../public/daily-poem.json");
    // Ensure public folder exists
    const publicDir = path.dirname(outputPath);
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(poemData, null, 2), "utf8");
    console.log(`Generated daily-poem.json successfully at: ${outputPath}`);
    process.exit(0);
  } catch (err) {
    console.error("Failed to generate daily-poem.json:", err);
    process.exit(1);
  }
}

run();
