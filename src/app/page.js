import { getTodayPoem } from "@/lib/db";
import PoemClientView from "./PoemClientView";

export default async function Home() {
  const poemData = await getTodayPoem();

  if (!poemData) {
    return (
      <div style={{ 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        justifyContent: "center", 
        minHeight: "100vh", 
        padding: "20px", 
        textAlign: "center",
        backgroundColor: "var(--bg-primary)",
        color: "var(--color-text-primary)"
      }}>
        <h1 style={{ color: "var(--color-gold)", marginBottom: "20px", fontSize: "2rem" }}>
          No Poetry Loaded
        </h1>
        <p style={{ color: "var(--color-text-secondary)", marginBottom: "30px", maxWidth: "500px", lineHeight: "1.6" }}>
          The database is initialized but empty. Please run the seeding script in your workspace terminal to load the Ghalib ghazals:
        </p>
        <code style={{ 
          background: "rgba(255, 255, 255, 0.05)", 
          border: "1px solid rgba(212, 175, 55, 0.2)",
          padding: "12px 24px", 
          borderRadius: "8px", 
          color: "var(--color-gold)", 
          fontFamily: "monospace",
          fontSize: "1.1rem"
        }}>
          npm run seed
        </code>
      </div>
    );
  }

  return <PoemClientView poemData={poemData} />;
}
