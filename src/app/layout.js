import { Outfit, Playfair_Display, Noto_Nastaliq_Urdu } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const urduNastaliq = Noto_Nastaliq_Urdu({
  subsets: ["arabic"],
  variable: "--font-urdu-nastaliq",
  weight: ["400", "700"],
});

export const metadata = {
  title: "Deewan-e-Ghalib | Poem of the Day",
  description: "A daily dose of Mirza Ghalib's classical Urdu ghazals, with word-by-word translations, deep commentaries, and daily email delivery.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${playfair.variable} ${urduNastaliq.variable}`}
      style={{ height: "100%" }}
    >
      <body style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative" }}>
        <div className="bg-glow-container">
          <div className="bg-glow-1"></div>
          <div className="bg-glow-2"></div>
        </div>
        {children}
      </body>
    </html>
  );
}
