import Link from "next/link";
import { db, getLetterById } from "@/lib/db";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const res = await db.execute("SELECT id FROM letters");
  return res.rows.map((row) => ({
    id: row.id.toString(),
  }));
}

export default async function LetterDetail({ params }) {
  const resolvedParams = await params;
  const letterId = parseInt(resolvedParams.id, 10);

  if (isNaN(letterId)) {
    notFound();
  }

  const letter = await getLetterById(letterId);

  if (!letter) {
    notFound();
  }

  return (
    <div style={{ maxWidth: "1000px", width: "100%", margin: "0 auto", padding: "40px 20px 80px 20px" }}>
      
      {/* Navigation Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "60px", paddingBottom: "20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Link href="/" style={{ textDecoration: "none", color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--color-gold)" }}>دیوان</span>
          <span style={{ fontSize: "1.1rem", fontWeight: "300", letterSpacing: "0.1em", textTransform: "uppercase" }}>Deewan-e-Ghalib</span>
        </Link>
        <nav style={{ display: "flex", gap: "16px" }}>
          <Link href="/" className="btn-secondary" style={{ textDecoration: "none", fontSize: "0.9rem", padding: "8px 16px" }}>
            Poem of the Day
          </Link>
          <Link href="/letters" className="btn-secondary" style={{ textDecoration: "none", fontSize: "0.9rem", padding: "8px 16px", borderColor: "var(--color-gold)", color: "var(--color-gold)" }}>
            Letters
          </Link>
          <Link href="/archive" className="btn-secondary" style={{ textDecoration: "none", fontSize: "0.9rem", padding: "8px 16px" }}>
            Archive
          </Link>
        </nav>
      </header>

      {/* Letter Meta Panel */}
      <div className="glass-panel fade-in" style={{ padding: "40px", textAlign: "center", marginBottom: "40px" }}>
        <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--color-emerald)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
          Correspondence
        </span>
        <h1 className="poetry-title" style={{ fontSize: "2rem", marginTop: "12px", marginBottom: "16px" }}>
          {letter.title}
        </h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "0.95rem" }}>
          To: <strong>{letter.recipient}</strong> {letter.date_written ? `• Written in ${letter.date_written}` : ""}
        </p>
      </div>

      {/* Side-by-Side Parallel Text Translation Layout */}
      <main className="fade-in" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginBottom: "40px", alignItems: "start" }}>
        
        {/* Left Column: Urdu and Transliteration */}
        <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
          
          {/* Original Urdu Text Card */}
          <div className="glass-panel" style={{ padding: "35px" }}>
            <h3 style={{ fontSize: "0.9rem", color: "var(--color-gold)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "20px", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>
              Original Urdu (خام خط)
            </h3>
            <div className="nastaliq" style={{ 
              fontSize: "1.35rem", 
              lineHeight: "2.3rem", 
              textAlign: "right",
              direction: "rtl",
              color: "#f3f4f6",
              whiteSpace: "pre-wrap",
              textShadow: "none"
            }}>
              {letter.urdu_text}
            </div>
          </div>

          {/* Roman Urdu Transliteration Card */}
          <div className="glass-panel" style={{ padding: "35px" }}>
            <h3 style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "20px", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>
              Roman Transliteration
            </h3>
            <div style={{ 
              fontSize: "0.95rem", 
              lineHeight: "1.7", 
              color: "var(--color-text-secondary)", 
              fontStyle: "italic",
              whiteSpace: "pre-wrap"
            }}>
              {letter.transliteration}
            </div>
          </div>

        </div>

        {/* Right Column: English Translation and Commentary */}
        <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>

          {/* English Translation Card */}
          <div className="glass-panel" style={{ padding: "35px" }}>
            <h3 style={{ fontSize: "0.9rem", color: "var(--color-gold)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "20px", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>
              English Translation
            </h3>
            <div style={{ 
              fontSize: "0.98rem", 
              lineHeight: "1.7", 
              color: "var(--color-text-primary)",
              whiteSpace: "pre-wrap"
            }}>
              {letter.translation}
            </div>
          </div>

          {/* Scholarly Commentary Card */}
          <div className="glass-panel" style={{ padding: "35px", border: "1px solid rgba(16, 185, 129, 0.25)" }}>
            <h3 style={{ fontSize: "0.9rem", color: "var(--color-emerald)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "20px", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>
              Literary & Historical Commentary
            </h3>
            <div style={{ 
              fontSize: "0.95rem", 
              lineHeight: "1.7", 
              color: "var(--color-text-secondary)"
            }}>
              {letter.explanation.split("\n\n").map((para, idx) => (
                <p key={idx} style={{ marginBottom: idx < letter.explanation.split("\n\n").length - 1 ? "16px" : "0" }}>
                  {para}
                </p>
              ))}
            </div>
          </div>

        </div>

      </main>

      {/* CSS layout adjustment for mobile responsiveness */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          main {
            grid-template-columns: 1fr !important;
          }
        }
      `}} />

      {/* Footer */}
      <footer style={{ marginTop: "100px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "30px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
        <Link href="/letters" className="btn-secondary" style={{ textDecoration: "none", display: "inline-block", marginBottom: "20px" }}>
          ➔ Back to Letters Catalog
        </Link>
        <p>Ghalib's Letters Collection. All analysis matches standard historical commentators.</p>
      </footer>

    </div>
  );
}
