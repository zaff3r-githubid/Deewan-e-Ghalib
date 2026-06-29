# 📖 Deewan-e-Ghalib Daily Web App

A beautiful, interactive web portal dedicated to the complete works, correspondence, and literary analysis of the legendary Urdu poet **Mirza Asadullah Khan Ghalib**.

Built using **Next.js (App Router)** and styled with premium **Vanilla CSS**, this application serves as a scholarly reader for Ghalib's ghazals and letters (*Khutoot*), featuring interactive Nastaliq translations and commentary.

---

## ✨ Features

*   **Poem of the Day**: A handpicked daily ghazal couplet with original Urdu script, Roman transliteration, and fluent English translation.
*   **Nastaliq Word-Hover Dictionary**: Hover over or click any Urdu word to view instant definitions, grammar markers, and translations in both English and Urdu.
*   **Ghalib's Letters (*Khutoot*)**: Explore historical correspondence with Ghalib's disciples and friends (like Har Gopal Taftah and Mir Mehdi Majrooh) rendered in a gorgeous **side-by-side parallel column layout** (Urdu Nastaliq, Roman Urdu, English translation, and analysis).
*   **Scholarly Commentary**: Detailed, multi-paragraph commentaries exploring philosophical layers, metaphors, historical contexts, and Sufic themes for every couplet and letter.
*   **Historical Archive**: A complete lookup directory of all loaded poetry.
*   **Fully Responsive & Premium UI**: Features custom Outfit, Playfair Display, and Noto Nastaliq Urdu typography, animated gold glows, and glassmorphic panels.

---

## 🛠️ Tech Stack

*   **Framework**: Next.js 16 (App Router)
*   **Database**: libSQL client (compatible with local SQLite files and remote Turso Cloud)
*   **AI Integration**: Gemini 2.5 API (via official `@google/genai` SDK)
*   **Styling**: Vanilla CSS (Fluid layouts, dark mode, responsive glassmorphism)

---

## 🚀 Getting Started Locally

### 1. Clone & Install
```bash
git clone https://github.com/zaff3r-githubid/Deewan-e-Ghalib.git
cd Deewan-e-Ghalib
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
# Optional: Add your Gemini API key to dynamically fetch and seed extra poetry
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Initialize & Seed the Database
Run the seeder script to set up database schemas and populate poetry/letters:
```bash
npm run seed
```
*Note: If `GEMINI_API_KEY` is present, the script will dynamically call Gemini to generate and seed extra ghazals and letters!*

### 4. Run Development Server
Start the dev server (configured to bind to port **3033** to prevent local conflicts):
```bash
npm run dev
```
Open **[http://localhost:3033](http://localhost:3033)** in your browser to view the application.

---

## 📦 Deployment Guide

### Option A: GitHub Pages (Static HTML Export) - *Currently Active*

We have configured Next.js to compile as a static HTML site (`output: "export"`). A GitHub Actions workflow automatically builds and deploys changes on every push to `main`.

#### How to Enable GitHub Pages:
1. Go to your repository settings page: `https://github.com/zaff3r-githubid/Deewan-e-Ghalib/settings`
2. Click **Pages** in the left menu.
3. Under **Build and deployment** -> **Source**, select **GitHub Actions** from the dropdown menu.
4. Your website will be live in minutes!

*Note: Since GitHub Pages is static, the backend newsletter subscription database and mailer cron job are disabled. If you want active mailing lists, deploy to Vercel.*

---

### Option B: Vercel + Turso Cloud (Dynamic Server Support)

To restore active mailing list subscriptions, cron schedules, and welcome emails:

1.  Remove `output: "export"` from `next.config.mjs`.
2.  Spin up a free database at [Turso](https://turso.tech) and get your connection parameters.
3.  Configure these environment variables on Vercel:
    ```env
    TURSO_DATABASE_URL=libsql://your-db-url.turso.io
    TURSO_AUTH_TOKEN=your_auth_token_here
    GEMINI_API_KEY=your_gemini_api_key_here
    SMTP_HOST=your_smtp_server
    SMTP_PORT=587
    SMTP_USER=your_smtp_username
    SMTP_PASS=your_smtp_password
    SMTP_FROM="Deewan-e-Ghalib" <your_email@example.com>
    ```
4.  Run `npm run seed` locally with the remote environment variables to populate your Turso cloud database.
5.  Link your GitHub repo to Vercel and click deploy.
