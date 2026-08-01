# LLM Context: Deewan-e-Ghalib Web App

This document compiles the complete architecture, codebase structure, database schemas, and build procedures for the **Deewan-e-Ghalib** web portal. It is designed to be fed into any LLM (such as Claude, ChatGPT, or Gemini) to instantly bring it up to speed on the project constraints and implementation patterns.

---

## 1. Project Overview & Architecture

*   **Goal**: An interactive Urdu literature reader dedicated to Mirza Ghalib's Ghazals and Letters (*Khutoot*), featuring Nastaliq scripts, interactive hover dictionaries, English/Roman transliterations, and deep commentary.
*   **Core Stack**: Next.js 16 (App Router), Vanilla CSS, SQLite / libSQL Client (Turso), and `@google/genai` SDK.
*   **Dual-mode Deployment Compatibility**:
    1.  **Static Mode (GitHub Pages - Currently Active)**: Next.js is configured for static export (`output: "export"`). Under this mode, dynamic SQL endpoints are disabled, and pages are fully pre-rendered. Email subscription features run via **Google Forms + Sheets + Apps Script** webhook.
    2.  **Dynamic Mode (Vercel + Turso Cloud)**: The build config can be adjusted to dynamic hosting, enabling a live subscribers database and backend Node.js cron jobs (`/api/cron/send-daily`) running SMTP mailers.

---

## 2. File & Directory Reference

Here is a map of the key directories and what they are responsible for:

*   **`src/app/`**: Application UI pages and routes.
    *   `page.js`: The landing page rendering the "Poem of the Day".
    *   `PoemClientView.js`: Interactive client-side component handling dictionary word hovers/clicks, commentary tabs, and pronunciation/transliteration toggles.
    *   `archive/`: Directory lookup showing previously active poems.
    *   `letters/`: Directory and page structures showing correspondence in side-by-side columns.
    *   `biography/`: Educational biographical details.
*   **`src/lib/`**: Business logic, database abstractions, and API interfaces.
    *   `db.js`: Database client connection wrapper and helper queries (seeds, fetches, subscribers list).
    *   `gemini.js`: Handles structure-guided content generation prompts to enrich details via the official Google Gemini SDK.
*   **`scripts/`**: Build utilities and cron tasks.
    *   `seed.js`: Database initializer and seeder. Connects to Gemini if `GEMINI_API_KEY` is present to generate extra poem analysis.
    *   `toggle-dynamic-routes.js`: A pre/post-build utility that comments or uncomment dynamic API routes when exporting static HTML to prevent Next.js build-time dynamic render errors.
    *   `generate-daily-json.js`: Outputs today's active poem data into a static file (`public/daily-poem.json`) during the build process, enabling external Apps Scripts to retrieve it.
    *   `send-daily.js`: Standard Node script running SMTP mailers to active subscribers.

---

## 3. Database Schema

The database relies on SQLite (locally stored at `deewan.db`) or Turso Cloud in dynamic environments. Below are the schema creation DDLs:

```sql
-- Subscribers list
CREATE TABLE IF NOT EXISTS subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active', -- 'active' or 'unsubscribed'
  token TEXT UNIQUE NOT NULL,    -- Used for secure unsubscribe tokens
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Ghazals container
CREATE TABLE IF NOT EXISTS ghazals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  urdu_title TEXT,
  poet TEXT DEFAULT 'Mirza Ghalib',
  language TEXT DEFAULT 'urdu',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Ghazal Couplets (Misras)
CREATE TABLE IF NOT EXISTS couplets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ghazal_id INTEGER,
  couplet_number INTEGER,
  urdu_text TEXT NOT NULL,         -- Divided by \n for lines 1 & 2
  transliteration TEXT NOT NULL,   -- Roman Urdu text
  translation TEXT NOT NULL,       -- English translation
  urdu_translation TEXT,
  explanation TEXT NOT NULL,       -- Literary commentary
  explanation_urdu TEXT,
  context TEXT NOT NULL,           -- Historical or motif context
  context_urdu TEXT,
  FOREIGN KEY(ghazal_id) REFERENCES ghazals(id) ON DELETE CASCADE
);

-- Word-by-Word Definitions
CREATE TABLE IF NOT EXISTS word_meanings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  couplet_id INTEGER,
  word_order INTEGER,
  word_urdu TEXT NOT NULL,
  meaning_urdu TEXT NOT NULL,
  meaning_english TEXT NOT NULL,
  FOREIGN KEY(couplet_id) REFERENCES couplets(id) ON DELETE CASCADE
);

-- Historical correspondence (Letters)
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
```

---

## 4. Gemini AI Integration Prompts

To generate structured translations, vocabularies, and commentaries, the application uses **`gemini-2.5-flash`** with structured JSON output responses. 

### Ghazal Prompt Schema:
```json
{
  "title": "English/Roman transliteration of first line",
  "urdu_title": "Urdu script of first line",
  "poet": "Mirza Ghalib",
  "couplets": [
    {
      "couplet_number": 1,
      "urdu_text": "accurate Urdu script (separate misras with \\n)",
      "transliteration": "Roman Urdu script (separate misras with \\n)",
      "translation": "English translation (separate lines with \\n)",
      "explanation": "2-3 paragraphs of detailed commentary exploring metaphors and Sufi themes",
      "context": "2 paragraphs of historical context or motif explanations",
      "words": [
        {
          "word_order": 1,
          "word_urdu": "Urdu script word/izafat",
          "meaning_urdu": "Meaning in plain Urdu",
          "meaning_english": "Meaning in English"
        }
      ]
    }
  ]
}
```

### Letter Prompt Schema:
```json
{
  "title": "Short title (e.g. Letter to Taftah on poetry editing)",
  "recipient": "Har Gopal Taftah",
  "date_written": "e.g. 1858",
  "urdu_text": "Letter body in Urdu script (use \\n\\n for paragraphs)",
  "transliteration": "Roman Urdu transliteration",
  "translation": "English translation preserving Ghalib's conversational style",
  "explanation": "2-4 paragraphs of historical commentary, highlighting his wit and epistolary revolution"
}
```

---

## 5. Build Pipeline Tasks

The project script lifecycle defined in `package.json` includes:

*   `npm run dev`: Boots local development server on port `3033`.
*   `npm run seed`: Initializes the schema and populates local database tables using data stored inside `src/lib/seed-data.json`.
*   `npm run prebuild`: Run before compile to (a) run `toggle-dynamic-routes.js hide` to disable/comment endpoints that error during static compilation, and (b) execute `generate-daily-json.js` to create the static JSON object of the daily poem.
*   `npm run build`: Bundles the application statically into `./out` via `next build`.
*   `npm run postbuild`: Restores the dynamic route files commented out during the prebuild stage.
*   `npm run deploy`: Automated script to seed database, compile static files, write the `.nojekyll` routing bypassed file, and push to GitHub Pages.

---

## 6. Serverless Form Subscriptions Architecture

For static configurations where direct databases aren't reachable, the application relies on an external workflow described in **`GOOGLE_FORM_SETUP.md`**:

```
[Subscriber Form Submit] -> [Google Form] -> [Google Sheets Log]
                                                    |
                                          (Google Apps Script)
                                         /                    \
                     [Immediate Welcome Email]             [Daily Trigger Cron]
                                                                |
                                                     [Fetches daily-poem.json]
                                                                |
                                                     [Batch Emails Subscriber]
```

### Web App/App Script triggers configured:
1.  **Form Trigger (`onFormSubmit`)**: Linked to run on form submission, sending an immediate welcome email template.
2.  **Daily Trigger (`sendDailyEmails`)**: Configured as a time-driven trigger to run daily at 7–8 AM. Fetches the active poem from `https://zaff3r-githubid.github.io/Deewan-e-Ghalib/daily-poem.json` and distributes it to all listed emails.
