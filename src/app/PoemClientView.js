"use client";

import { useState } from "react";
import Link from "next/link";

export default function PoemClientView({ poemData, isArchiveView = false }) {
  const { ghazal, couplets } = poemData;

  const [activeWords, setActiveWords] = useState({}); // coupletIndex -> word object
  const [expandedSections, setExpandedSections] = useState({}); // coupletIndex -> { explanation: bool, context: bool }
  const [email, setEmail] = useState("");
  const [subscribeStatus, setSubscribeStatus] = useState({ state: "idle", message: "" });
  const [commentaryLang, setCommentaryLang] = useState("en"); // 'en' or 'ur'

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setSubscribeStatus({ state: "error", message: "Please enter a valid email address." });
      return;
    }

    setSubscribeStatus({ state: "loading", message: "" });

    try {
      const response = await fetch("/Deewan-e-Ghalib/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      }).catch(async () => {
        // Fallback to absolute path if basePath fails or during dev/production variation
        return fetch("/api/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        });
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubscribeStatus({
          state: "success",
          message: data.message,
        });
        setEmail("");
      } else {
        setSubscribeStatus({
          state: "error",
          message: data.error || "Failed to subscribe. Please try again.",
        });
      }
    } catch (err) {
      setSubscribeStatus({
        state: "error",
        message: "Failed to connect to the subscription service. Server-side API endpoints are not active on static deployments.",
      });
    }
  };

  // Toggle accordions
  const toggleSection = (coupletIndex, section) => {
    setExpandedSections((prev) => {
      const coupletSections = prev[coupletIndex] || { explanation: false, context: false };
      return {
        ...prev,
        [coupletIndex]: {
          ...coupletSections,
          [section]: !coupletSections[section],
        },
      };
    });
  };

  // Helper: render lines with hover interaction
  const renderInteractiveLines = (couplet, coupletIndex) => {
    const lines = couplet.urdu_text.split("\n");

    return lines.map((line, lineIdx) => {
      const words = line.split(" ");

      return (
        <div 
          key={lineIdx} 
          style={{ 
            display: "flex", 
            flexWrap: "wrap", 
            justifyContent: "center", 
            gap: "8px",
            margin: "6px 0"
          }}
        >
          {words.map((wordStr, wordIdx) => {
            // Clean word from basic punctuation to match dictionary keys
            const cleanWord = wordStr.replace(/[؟،۔!]/g, "").trim();

            // Find if this word matches any word in our vocabulary array
            const matchedWord = couplet.words?.find((w) => {
              const cleanDictWord = w.word_urdu.replace(/[؟،۔!]/g, "").trim();
              return cleanDictWord === cleanWord;
            });

            if (matchedWord) {
              const isActive = activeWords[coupletIndex]?.word_order === matchedWord.word_order;

              return (
                <span
                  key={wordIdx}
                  onClick={() => setActiveWords(prev => ({
                    ...prev,
                    [coupletIndex]: matchedWord
                  }))}
                  className="interactive-word"
                  style={{
                    color: isActive ? "var(--color-gold)" : "inherit",
                    backgroundColor: isActive ? "rgba(229, 193, 88, 0.15)" : "transparent",
                    borderBottomStyle: isActive ? "solid" : "dashed"
                  }}
                >
                  {wordStr}
                </span>
              );
            }

            return <span key={wordIdx}>{wordStr}</span>;
          })}
        </div>
      );
    });
  };

  return (
    <div style={{ maxWidth: "800px", width: "100%", margin: "0 auto", padding: "40px 20px 80px 20px" }}>

      {/* Navigation Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "60px", paddingBottom: "20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Link href="/" style={{ textDecoration: "none", color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--color-gold)" }}>دیوان</span>
          <span style={{ fontSize: "1.1rem", fontWeight: "300", letterSpacing: "0.1em", textTransform: "uppercase" }}>Deewan-e-Ghalib</span>
        </Link>
        <nav style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <Link 
            href="/" 
            className="btn-secondary" 
            style={{ 
              textDecoration: "none", 
              fontSize: "0.9rem", 
              padding: "8px 16px",
              ...(!isArchiveView ? { borderColor: "var(--color-gold)", color: "var(--color-gold)" } : {})
            }}
          >
            Poem of the Day
          </Link>
          <Link 
            href="/biography" 
            className="btn-secondary" 
            style={{ 
              textDecoration: "none", 
              fontSize: "0.9rem", 
              padding: "8px 16px"
            }}
          >
            Biography
          </Link>
          <Link 
            href="/letters" 
            className="btn-secondary" 
            style={{ 
              textDecoration: "none", 
              fontSize: "0.9rem", 
              padding: "8px 16px"
            }}
          >
            Letters
          </Link>
          <Link 
            href="/archive" 
            className="btn-secondary" 
            style={{ 
              textDecoration: "none", 
              fontSize: "0.9rem", 
              padding: "8px 16px",
              ...(isArchiveView ? { borderColor: "var(--color-gold)", color: "var(--color-gold)" } : {})
            }}
          >
            Archive
          </Link>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="fade-in">

        {/* Poem Header Card */}
        <div className="glass-panel" style={{ padding: "40px", textAlign: "center", marginBottom: "40px" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--color-emerald)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            {isArchiveView ? "Poem Archive" : "Poem of the Day"}
            {ghazal.language === "persian" && " • Persian Poetry (فارسی)"}
          </span>
          <h1 className="poetry-title" style={{ fontSize: "1.8rem", margin: "16px 0 8px 0" }}>
            {ghazal.title}
          </h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "1.4rem", fontFamily: "var(--font-urdu)", direction: "rtl", margin: "12px 0" }}>
            {ghazal.urdu_title}
          </p>
          <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            By {ghazal.poet}
          </p>
        </div>

        {/* Global Commentary Language Toggle */}
        <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginBottom: "30px" }}>
          <button 
            onClick={() => setCommentaryLang("en")}
            className="btn-secondary"
            style={{ 
              fontSize: "0.85rem", 
              padding: "8px 16px",
              borderColor: commentaryLang === "en" ? "var(--color-gold)" : "rgba(255,255,255,0.05)",
              color: commentaryLang === "en" ? "var(--color-gold)" : "var(--color-text-secondary)",
              background: commentaryLang === "en" ? "rgba(229,193,88,0.05)" : "transparent"
            }}
          >
            English Commentary
          </button>
          <button 
            onClick={() => setCommentaryLang("ur")}
            className="btn-secondary"
            style={{ 
              fontSize: "0.85rem", 
              padding: "8px 16px",
              borderColor: commentaryLang === "ur" ? "var(--color-gold)" : "rgba(255,255,255,0.05)",
              color: commentaryLang === "ur" ? "var(--color-gold)" : "var(--color-text-secondary)",
              background: commentaryLang === "ur" ? "rgba(229,193,88,0.05)" : "transparent"
            }}
          >
            اردو تبصرہ (Urdu)
          </button>
        </div>

        {/* Couplets List */}
        <section style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
          {couplets.map((couplet, coupletIdx) => {
            const activeWord = activeWords[coupletIdx];
            const isExplanationExpanded = expandedSections[coupletIdx]?.explanation;
            const isContextExpanded = expandedSections[coupletIdx]?.context;

            // Get active explanation text based on language toggling
            const explanationText = (commentaryLang === "ur" ? couplet.explanation_urdu : couplet.explanation) || couplet.explanation;
            const contextText = (commentaryLang === "ur" ? couplet.context_urdu : couplet.context) || couplet.context;

            return (
              <div key={couplet.id} className="glass-panel" style={{ padding: "40px" }}>

                {/* Couplet Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--color-gold)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    Couplet {couplet.couplet_number}
                  </span>
                </div>

                {/* Interactive Original Text Couplet */}
                <div className="nastaliq" style={{ marginBottom: "24px" }}>
                  {renderInteractiveLines(couplet, coupletIdx)}
                </div>

                {/* Urdu Translation (specifically for Persian Poetry) */}
                {ghazal.language === "persian" && couplet.urdu_translation && (
                  <div className="nastaliq" style={{ 
                    fontSize: "1.2rem", 
                    lineHeight: "2.0rem", 
                    color: "var(--color-text-secondary)", 
                    margin: "20px 0", 
                    borderBottom: "1px dashed rgba(255,255,255,0.05)", 
                    paddingBottom: "16px" 
                  }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-emerald)", display: "block", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px", fontFamily: "var(--font-sans)", direction: "ltr" }}>
                      Urdu Translation (اردو ترجمہ)
                    </span>
                    {couplet.urdu_translation.split("\n").map((line, idx) => (
                      <div key={idx}>{line}</div>
                    ))}
                  </div>
                )}

                {/* Roman Transliteration */}
                <div style={{ textAlign: "center", fontStyle: "italic", color: "var(--color-text-secondary)", margin: "20px 0", fontSize: "0.95rem", lineHeight: "1.6" }}>
                  {couplet.transliteration.split("\n").map((line, idx) => (
                    <div key={idx}>{line}</div>
                  ))}
                </div>

                {/* English Translation */}
                <div style={{ textAlign: "center", color: "var(--color-gold)", margin: "20px 0", fontSize: "1.0rem", fontWeight: "500", lineHeight: "1.6" }}>
                  {couplet.translation.split("\n").map((line, idx) => (
                    <div key={idx}>{line}</div>
                  ))}
                </div>

                {/* Word Meaning Explorer Panel */}
                <div style={{ margin: "28px 0", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "20px" }}>
                  <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>💡 Hover or tap dashed Urdu words for translations:</span>
                    {activeWord && (
                      <button 
                        onClick={() => setActiveWords(prev => ({ ...prev, [coupletIdx]: null }))}
                        style={{ background: "none", border: "none", color: "var(--color-gold)", cursor: "pointer", fontSize: "0.85rem" }}
                      >
                        Clear definition
                      </button>
                    )}
                  </div>

                  {/* Dynamic Vocabulary Card */}
                  <div style={{ 
                    background: "rgba(255,255,255,0.02)", 
                    border: "1px solid rgba(212,175,55,0.1)", 
                    borderRadius: "8px", 
                    padding: "16px",
                    minHeight: "72px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    transition: "var(--transition-smooth)"
                  }}>
                    {activeWord ? (
                      <div>
                        <div style={{ fontSize: "1.3rem", color: "var(--color-gold)", fontFamily: "var(--font-urdu)", marginBottom: "4px" }}>
                          {activeWord.word_urdu}
                        </div>
                        <div style={{ fontSize: "0.95rem", color: "var(--color-text-primary)", marginBottom: "2px" }}>
                          Meaning in Urdu: <strong>{activeWord.meaning_urdu}</strong>
                        </div>
                        <div style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)" }}>
                          Meaning in English: <strong>{activeWord.meaning_english}</strong>
                        </div>
                      </div>
                    ) : (
                      <div style={{ color: "var(--color-text-muted)", fontStyle: "italic", fontSize: "0.9rem" }}>
                        Hover over a dashed word above or browse vocabulary details.
                      </div>
                    )}
                  </div>

                  {/* Vocabulary Table Accordion dropdown */}
                  <details style={{ marginTop: "12px", width: "100%" }}>
                    <summary style={{ fontSize: "0.85rem", color: "var(--color-gold)", cursor: "pointer", userSelect: "none" }}>
                      View all vocabulary in this couplet
                    </summary>
                    <div style={{ marginTop: "10px", maxHeight: "200px", overflowY: "auto", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "6px" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem", textAlign: "left" }}>
                        <thead>
                          <tr style={{ background: "rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                            <th style={{ padding: "10px", color: "var(--color-text-secondary)" }}>Word (Urdu)</th>
                            <th style={{ padding: "10px", color: "var(--color-text-secondary)" }}>Meaning in Urdu</th>
                            <th style={{ padding: "10px", color: "var(--color-text-secondary)" }}>Meaning in English</th>
                          </tr>
                        </thead>
                        <tbody>
                          {couplet.words?.map((w, wIdx) => (
                            <tr 
                              key={wIdx} 
                              style={{ 
                                borderBottom: "1px solid rgba(255,255,255,0.02)",
                                background: wIdx % 2 === 1 ? "rgba(255,255,255,0.01)" : "transparent"
                              }}
                            >
                              <td style={{ padding: "10px", fontFamily: "var(--font-urdu)", fontSize: "1.2rem", color: "var(--color-gold)" }}>{w.word_urdu}</td>
                              <td style={{ padding: "10px", color: "var(--color-text-primary)" }}>{w.meaning_urdu}</td>
                              <td style={{ padding: "10px", color: "var(--color-text-primary)" }}>{w.meaning_english}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                </div>

                {/* Explanations Accordion */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "20px" }}>

                  {/* Commentary Accordion */}
                  <div style={{ border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px", overflow: "hidden" }}>
                    <button
                      onClick={() => toggleSection(coupletIdx, "explanation")}
                      style={{
                        width: "100%",
                        padding: "16px",
                        background: "rgba(255,255,255,0.02)",
                        border: "none",
                        color: "var(--color-text-primary)",
                        textAlign: "left",
                        fontSize: "0.95rem",
                        fontWeight: "600",
                        display: "flex",
                        justifyContent: "space-between",
                        cursor: "pointer"
                      }}
                    >
                      <span>📖 {commentaryLang === "ur" ? "علمی تبصرہ" : "Scholarly Commentary"}</span>
                      <span style={{ color: "var(--color-gold)" }}>{isExplanationExpanded ? "▲" : "▼"}</span>
                    </button>
                    {isExplanationExpanded && (
                      <div style={{ 
                        padding: "20px", 
                        borderTop: "1px solid rgba(255,255,255,0.05)", 
                        fontSize: commentaryLang === "ur" ? "1.15rem" : "0.95rem", 
                        lineHeight: "1.8", 
                        color: "var(--color-text-secondary)", 
                        background: "rgba(0,0,0,0.2)",
                        direction: commentaryLang === "ur" ? "rtl" : "ltr",
                        textAlign: commentaryLang === "ur" ? "right" : "left",
                        fontFamily: commentaryLang === "ur" ? "var(--font-urdu)" : "inherit"
                      }}>
                        {explanationText.split("\n\n").map((p, pIdx) => (
                          <p key={pIdx} style={{ marginBottom: pIdx < explanationText.split("\n\n").length - 1 ? "14px" : "0" }}>{p}</p>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Context/Inspiration Accordion */}
                  <div style={{ border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px", overflow: "hidden" }}>
                    <button
                      onClick={() => toggleSection(coupletIdx, "context")}
                      style={{
                        width: "100%",
                        padding: "16px",
                        background: "rgba(255,255,255,0.02)",
                        border: "none",
                        color: "var(--color-text-primary)",
                        textAlign: "left",
                        fontSize: "0.95rem",
                        fontWeight: "600",
                        display: "flex",
                        justifyContent: "space-between",
                        cursor: "pointer"
                      }}
                    >
                      <span>📜 {commentaryLang === "ur" ? "پس منظر اور الہام" : "Context & Inspiration"}</span>
                      <span style={{ color: "var(--color-gold)" }}>{isContextExpanded ? "▲" : "▼"}</span>
                    </button>
                    {isContextExpanded && (
                      <div style={{ 
                        padding: "20px", 
                        borderTop: "1px solid rgba(255,255,255,0.05)", 
                        fontSize: commentaryLang === "ur" ? "1.15rem" : "0.95rem", 
                        lineHeight: "1.8", 
                        color: "var(--color-text-secondary)", 
                        background: "rgba(0,0,0,0.2)",
                        direction: commentaryLang === "ur" ? "rtl" : "ltr",
                        textAlign: commentaryLang === "ur" ? "right" : "left",
                        fontFamily: commentaryLang === "ur" ? "var(--font-urdu)" : "inherit"
                      }}>
                        {contextText.split("\n\n").map((p, pIdx) => (
                          <p key={pIdx} style={{ marginBottom: pIdx < contextText.split("\n\n").length - 1 ? "14px" : "0" }}>{p}</p>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

              </div>
            );
          })}
        </section>

        {/* Newsletter Signup Form Widget */}
        {!isArchiveView && (
          <section className="glass-panel" style={{ padding: "40px", marginTop: "60px", textAlign: "center" }}>
            <h2 style={{ fontSize: "1.8rem", color: "var(--color-gold)", marginBottom: "12px" }}>
              A Poem A Day In Your Inbox
            </h2>
            <p style={{ color: "var(--color-text-secondary)", maxWidth: "500px", margin: "0 auto 28px auto", fontSize: "0.95rem", lineHeight: "1.6" }}>
              Join other lovers of classical literature. Enter your email below to receive a beautifully annotated ghazal couplet breakdown in your inbox every single morning.
            </p>
            <form onSubmit={handleSubscribe} className="newsletter-form" style={{ maxWidth: "450px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="input-group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder=" "
                  required
                  disabled={subscribeStatus.state === "loading"}
                />
                <label className="input-label">Email Address</label>
              </div>
              <button
                type="submit"
                className="btn-primary"
                disabled={subscribeStatus.state === "loading"}
                style={{ cursor: "pointer", fontWeight: "600", width: "100%" }}
              >
                {subscribeStatus.state === "loading" ? "Subscribing..." : "📩 Subscribe to Daily Poem"}
              </button>
              {subscribeStatus.message && (
                <p style={{
                  marginTop: "12px",
                  fontSize: "0.9rem",
                  color: subscribeStatus.state === "success" ? "var(--color-emerald)" : "#f87171"
                }}>
                  {subscribeStatus.message}
                </p>
              )}
            </form>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginTop: "24px" }}>
              Prefer Google Forms? <a href="https://forms.gle/bdd6Xr2SPgmUsoC57" target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-gold)", textDecoration: "underline" }}>Subscribe via Google Forms instead</a>.
            </p>
          </section>
        )}

      </main>

      {/* Elegant Footer */}
      <footer style={{ marginTop: "100px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "30px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: "12px" }}>
        <p>Built with deep appreciation for Mirza Ghalib's poetic genius.</p>
        <p style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
          <span>References:</span>
          <a href="https://rekhta.org" target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-text-secondary)", textDecoration: "none" }}>Rekhta Foundation</a>
          <span>•</span>
          <a href="https://www.columbia.edu/~fp7/asru/roses.html" target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-text-secondary)", textDecoration: "none" }}>A Desertful of Roses</a>
        </p>
      </footer>
    </div>
  );
}
