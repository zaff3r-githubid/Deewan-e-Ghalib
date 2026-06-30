import Link from "next/link";

export const metadata = {
  title: "Deewan-e-Ghalib | Biography of Mirza Ghalib",
  description: "Explore the life, career, historical context, and literary genius of Mirza Asadullah Khan Ghalib, the greatest classical Urdu and Persian poet.",
};

export default function Biography() {
  return (
    <div style={{ maxWidth: "800px", width: "100%", margin: "0 auto", padding: "40px 20px 80px 20px" }}>
      
      {/* Navigation Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px", paddingBottom: "20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Link href="/" style={{ textDecoration: "none", color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "1.3rem", fontWeight: "800", color: "var(--color-gold)" }}>دیوان</span>
          <span style={{ fontSize: "1.0rem", fontWeight: "300", letterSpacing: "0.1em", textTransform: "uppercase" }}>Deewan-e-Ghalib</span>
        </Link>
        <nav style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <Link href="/" className="btn-secondary" style={{ textDecoration: "none", fontSize: "0.85rem", padding: "6px 12px" }}>
            Poem of the Day
          </Link>
          <Link href="/biography" className="btn-secondary" style={{ textDecoration: "none", fontSize: "0.85rem", padding: "6px 12px", borderColor: "var(--color-gold)", color: "var(--color-gold)" }}>
            Biography
          </Link>
          <Link href="/letters" className="btn-secondary" style={{ textDecoration: "none", fontSize: "0.85rem", padding: "6px 12px" }}>
            Letters
          </Link>
          <Link href="/archive" className="btn-secondary" style={{ textDecoration: "none", fontSize: "0.85rem", padding: "6px 12px" }}>
            Archive
          </Link>
        </nav>
      </header>

      {/* Biography Header Card */}
      <div className="glass-panel fade-in" style={{ padding: "30px", textAlign: "center", marginBottom: "30px" }}>
        <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--color-emerald)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
          The Poet Laureate
        </span>
        <h1 className="poetry-title" style={{ fontSize: "1.8rem", marginTop: "8px", marginBottom: "12px" }}>
          Mirza Asadullah Khan Ghalib
        </h1>
        <p style={{ color: "var(--color-text-secondary)", maxWidth: "550px", margin: "0 auto", fontSize: "0.85rem", lineHeight: "1.6" }}>
          Discover the life, wit, and existential struggles of the ultimate master of Urdu and Persian classical poetry, who witnessed the end of the Mughal Empire and birthed modern Urdu prose.
        </p>
      </div>

      {/* Timeline & Biographical Content */}
      <main className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* Core Identity Section */}
        <section className="glass-panel" style={{ padding: "28px", color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>
          <h2 style={{ fontSize: "1.15rem", color: "var(--color-gold)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>👤</span> Life at a Glance
          </h2>
          <p style={{ marginBottom: "12px", lineHeight: "1.6" }}>
            <strong>Mirza Ghalib</strong> (born December 27, 1797 in Agra — died February 15, 1869 in Delhi) was a preeminent Indian poet during the final years of the Mughal Empire. He wrote in both <strong>Urdu</strong> and <strong>Persian</strong>, and although his Persian diwan was his pride, it is his Urdu poetry collection, the <em>Deewan-e-Ghalib</em>, that achieved legendary status across the globe.
          </p>
          <p style={{ lineHeight: "1.6" }}>
            Ghalib's poetry is characterized by a deep philosophical skepticism, questioning traditional religious orthodoxy, celebrating human independence, and exploring the psychological pain of love and existence—all seasoned with his trademark dry wit and irony.
          </p>
        </section>

        {/* Famous Quote Card */}
        <div className="glass-panel" style={{ padding: "24px", borderLeft: "4px solid var(--color-gold)", background: "rgba(212,175,55,0.02)" }}>
          <p className="nastaliq" style={{ fontSize: "1.2rem", lineHeight: "1.9rem", color: "var(--color-text-primary)", marginBottom: "8px", textAlign: "right" }}>
            ہوئے مر کے ہم جو رسوا، ہوئے کیوں نہ غرقِ دریا<br/>
            نہ کبھی جنازہ اٹھتا، نہ کہیں مزار ہوتا
          </p>
          <p style={{ fontStyle: "italic", fontSize: "0.8rem", color: "var(--color-text-muted)", textAlign: "center", margin: "8px 0", lineHeight: "1.5" }}>
            "Having died, why was I disgraced? Why didn't I drown in the sea?<br/>
            No funeral would ever have been held, nor any tomb would exist."
          </p>
        </div>

        {/* Chronological Timeline */}
        <section className="glass-panel" style={{ padding: "28px" }}>
          <h2 style={{ fontSize: "1.15rem", color: "var(--color-gold)", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>⏳</span> Chronology of a Master
          </h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", borderLeft: "2px solid rgba(212,175,55,0.15)", paddingLeft: "16px", marginLeft: "8px" }}>
            
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "-23px", top: "4px", width: "10px", height: "10px", borderRadius: "50%", background: "var(--color-gold)", boxShadow: "0 0 6px var(--color-gold)" }}></div>
              <strong style={{ color: "var(--color-text-primary)", fontSize: "0.95rem" }}>1797 — Birth in Agra</strong>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem", marginTop: "4px", lineHeight: "1.5" }}>
                Born into a noble family of Seljuk Turkish ancestry. His father, Abdullah Beg Khan, died in battle when Ghalib was just 5 years old. He was raised by his uncle, Nasrullah Beg Khan.
              </p>
            </div>

            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "-23px", top: "4px", width: "10px", height: "10px", borderRadius: "50%", background: "rgba(212,175,55,0.4)" }}></div>
              <strong style={{ color: "var(--color-text-primary)", fontSize: "0.95rem" }}>1810 — Marriage & Move to Delhi</strong>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem", marginTop: "4px", lineHeight: "1.5" }}>
                Married Umrao Begum at the age of 13 and moved permanently to Delhi, which he fell in love with. The marriage was emotionally distant, and sadly, all seven of their children died in infancy.
              </p>
            </div>

            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "-23px", top: "4px", width: "10px", height: "10px", borderRadius: "50%", background: "rgba(212,175,55,0.4)" }}></div>
              <strong style={{ color: "var(--color-text-primary)", fontSize: "0.95rem" }}>1827–1829 — The Journey to Calcutta</strong>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem", marginTop: "4px", lineHeight: "1.5" }}>
                Travelled to Calcutta to petition the British East India Company to restore his family pension. Though the legal battle failed, the exposure to British administration and printing presses broadened his outlook.
              </p>
            </div>

            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "-23px", top: "4px", width: "10px", height: "10px", borderRadius: "50%", background: "rgba(212,175,55,0.4)" }}></div>
              <strong style={{ color: "var(--color-text-primary)", fontSize: "0.95rem" }}>1850 — Court Poet & Royal Titles</strong>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem", marginTop: "4px", lineHeight: "1.5" }}>
                Appointed royal historian and court poet by the last Mughal Emperor, Bahadur Shah Zafar. He was awarded the titles of <em>Najm-ud-Daula</em> (Star of the State) and <em>Dabir-ul-Mulk</em> (Writer of the Kingdom).
              </p>
            </div>

            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "-23px", top: "4px", width: "10px", height: "10px", borderRadius: "50%", background: "var(--color-emerald)", boxShadow: "0 0 6px var(--color-emerald)" }}></div>
              <strong style={{ color: "var(--color-text-primary)", fontSize: "0.95rem" }}>1857 — The Great Mutiny & Ruins</strong>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem", marginTop: "4px", lineHeight: "1.5" }}>
                The Indian Rebellion of 1857 broke out. Ghalib stayed in Delhi, witnessing the bloody sack of the city, execution of friends, and the exile of the Emperor. The Mughal Empire ended, and Ghalib's royal pension was cut off.
              </p>
            </div>

            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "-23px", top: "4px", width: "10px", height: "10px", borderRadius: "50%", background: "rgba(212,175,55,0.4)" }}></div>
              <strong style={{ color: "var(--color-text-primary)", fontSize: "0.95rem" }}>1869 — Death and Legacy</strong>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem", marginTop: "4px", lineHeight: "1.5" }}>
                Passed away in poverty on February 15, 1869, at his residence in Gali Qasim Jan, Ballimaran, Delhi. He is buried near the shrine of Nizamuddin Auliya.
              </p>
            </div>

          </div>
        </section>

        {/* Prose Revolution Section */}
        <section className="glass-panel" style={{ padding: "28px", color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>
          <h2 style={{ fontSize: "1.15rem", color: "var(--color-gold)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>✍️</span> The Revolution of Urdu Letters
          </h2>
          <p style={{ marginBottom: "12px", lineHeight: "1.6" }}>
            Prior to Ghalib, Urdu letter writing (<em>Maktub Nigaari</em>) was heavily formal, dry, and packed with complex Persian and Arabic greetings. Ghalib completely revolutionized this medium by turning letters into conversational dialogues.
          </p>
          <p style={{ lineHeight: "1.6" }}>
            As he famously wrote to his disciple Taftah: <em>"Muraasla ko mukaalma bana diya"</em> (I have turned correspondence into a face-to-face conversation). His letters are loaded with colloquial jokes, news, literary corrections, and personal feelings, laying the foundation for modern Urdu prose.
          </p>
        </section>

      </main>

      {/* Elegant Footer */}
      <footer style={{ marginTop: "60px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "24px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.8rem" }}>
        <p>Built with deep appreciation for Mirza Ghalib's poetic genius.</p>
      </footer>
    </div>
  );
}
