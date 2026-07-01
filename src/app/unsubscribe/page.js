import Link from "next/link";
import { unsubscribeEmail } from "@/lib/db";

export const metadata = {
  title: "Unsubscribe | Deewan-e-Ghalib",
  description: "Unsubscribe from the Deewan-e-Ghalib Daily Poem mailing list.",
};

export const dynamic = "force-dynamic";

export default async function Unsubscribe({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const token = resolvedSearchParams.token;

  let success = false;
  if (token) {
    success = await unsubscribeEmail(token);
  }

  return (
    <div style={{ maxWidth: "800px", width: "100%", margin: "0 auto", padding: "40px 20px 80px 20px" }}>
      
      {/* Navigation Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "60px", paddingBottom: "20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Link href="/" style={{ textDecoration: "none", color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "1.3rem", fontWeight: "800", color: "var(--color-gold)" }}>دیوان</span>
          <span style={{ fontSize: "1.0rem", fontWeight: "300", letterSpacing: "0.1em", textTransform: "uppercase" }}>Deewan-e-Ghalib</span>
        </Link>
        <nav style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <Link href="/" className="btn-secondary" style={{ textDecoration: "none", fontSize: "0.85rem", padding: "6px 12px" }}>
            Home
          </Link>
          <Link href="/biography" className="btn-secondary" style={{ textDecoration: "none", fontSize: "0.85rem", padding: "6px 12px" }}>
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

      {/* Main Container */}
      <main className="fade-in" style={{ display: "flex", justifyContent: "center", marginTop: "40px" }}>
        <div className="glass-panel" style={{ padding: "40px", textAlign: "center", maxWidth: "500px", width: "100%" }}>
          {success ? (
            <>
              <div style={{ fontSize: "3rem", marginBottom: "20px" }}>🔕</div>
              <h1 style={{ fontSize: "1.8rem", color: "var(--color-gold)", marginBottom: "16px" }}>
                Unsubscribed Successfully
              </h1>
              <p style={{ color: "var(--color-text-secondary)", lineHeight: "1.6", marginBottom: "30px" }}>
                Your email has been removed from our daily mailing list. You will no longer receive the Poem of the Day in your inbox.
              </p>
            </>
          ) : (
            <>
              <div style={{ fontSize: "3rem", marginBottom: "20px" }}>⚠️</div>
              <h1 style={{ fontSize: "1.8rem", color: "#f87171", marginBottom: "16px" }}>
                Unsubscribe Failed
              </h1>
              <p style={{ color: "var(--color-text-secondary)", lineHeight: "1.6", marginBottom: "30px" }}>
                We couldn't process your request. The token is invalid, expired, or may have already been used to unsubscribe.
              </p>
            </>
          )}

          <Link href="/" className="btn-primary" style={{ textDecoration: "none", display: "inline-block" }}>
            Return to Homepage
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ marginTop: "100px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "30px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
        <p>Built with deep appreciation for Mirza Ghalib's poetic genius.</p>
      </footer>
    </div>
  );
}
