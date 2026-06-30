import Link from "next/link";
import { getAllLetters } from "@/lib/db";

export default async function Letters() {
  const lettersList = await getAllLetters();

  return (
    <div style={{ maxWidth: "800px", width: "100%", margin: "0 auto", padding: "40px 20px 80px 20px" }}>
      
      {/* Navigation Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "60px", paddingBottom: "20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Link href="/" style={{ textDecoration: "none", color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--color-gold)" }}>دیوان</span>
          <span style={{ fontSize: "1.1rem", fontWeight: "300", letterSpacing: "0.1em", textTransform: "uppercase" }}>Deewan-e-Ghalib</span>
        </Link>
        <nav style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <Link href="/" className="btn-secondary" style={{ textDecoration: "none", fontSize: "0.9rem", padding: "8px 16px" }}>
            Poem of the Day
          </Link>
          <Link href="/biography" className="btn-secondary" style={{ textDecoration: "none", fontSize: "0.9rem", padding: "8px 16px" }}>
            Biography
          </Link>
          <Link href="/letters" className="btn-secondary" style={{ textDecoration: "none", fontSize: "0.9rem", padding: "8px 16px", borderColor: "var(--color-gold)", color: "var(--color-gold)" }}>
            Letters
          </Link>
          <Link href="/archive" className="btn-secondary" style={{ textDecoration: "none", fontSize: "0.9rem", padding: "8px 16px" }}>
            Archive
          </Link>
        </nav>
      </header>

      {/* Letters Header */}
      <div className="glass-panel fade-in" style={{ padding: "40px", textAlign: "center", marginBottom: "40px" }}>
        <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--color-gold)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
          Letters & Correspondence
        </span>
        <h1 className="poetry-title" style={{ fontSize: "2.2rem", marginTop: "12px", marginBottom: "16px" }}>
          Ghalib's Khutoot
        </h1>
        <p style={{ color: "var(--color-text-secondary)", maxWidth: "550px", margin: "0 auto", fontSize: "0.95rem", lineHeight: "1.6" }}>
          Mirza Ghalib revolutionized Urdu prose with his informal, witty, and conversational letters. Explore his correspondence with disciples, friends, and patrons.
        </p>
      </div>

      {/* Letters Grid List */}
      <main className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {lettersList.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--color-text-muted)", fontStyle: "italic" }}>
            No letters have been loaded in the database yet.
          </div>
        ) : (
          lettersList.map((letter) => (
            <Link 
              key={letter.id}
              href={`/letters/${letter.id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div className="glass-panel" style={{ 
                padding: "24px 30px", 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                gap: "20px"
              }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--color-emerald)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Recipient: {letter.recipient} {letter.date_written ? `(${letter.date_written})` : ""}
                  </span>
                  <h2 className="poetry-title" style={{ fontSize: "1.3rem", margin: "6px 0 2px 0" }}>
                    {letter.title}
                  </h2>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ 
                    fontSize: "0.8rem", 
                    color: "var(--color-gold)",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}>
                    <span>Read Letter</span>
                    <span>➔</span>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </main>

      {/* Footer */}
      <footer style={{ marginTop: "100px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "30px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
        <p>Ghalib's Letters Collection. All letters translated into Roman Urdu and English.</p>
      </footer>

    </div>
  );
}
