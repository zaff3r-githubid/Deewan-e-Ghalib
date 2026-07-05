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
  
  const ghazalsRes = await db.execute("SELECT id FROM ghazals ORDER BY id ASC");
  const ghazals = ghazalsRes.rows;
  if (ghazals.length === 0) return null;

  const baseDate = new Date("2026-07-01T00:00:00Z");
  const currentDate = new Date(todayStr + "T00:00:00Z");
  const diffTime = currentDate.getTime() - baseDate.getTime();
  const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  const ghazalIdx = diffDays % ghazals.length;
  const ghazalId = ghazals[ghazalIdx].id;

  return getPoemById(Number(ghazalId));
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
