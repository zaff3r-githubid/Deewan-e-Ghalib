import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

// Load configuration from environment
const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT || 587;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM || '"Deewan-e-Ghalib" <noreply@deewan-ghalib.com>';
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3033";

// Check if SMTP is configured
const isSmtpConfigured = !!(smtpHost && smtpUser && smtpPass);

let transporter = null;
if (isSmtpConfigured) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort),
    secure: parseInt(smtpPort) === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
}

// Fallback: Write email to local files for inspection in development
function fallbackEmailLog(to, subject, html) {
  console.log("=========================================");
  console.log(`[SMTP Not Configured] Mock Sending Email:`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log("=========================================");

  try {
    const logsDir = path.join(process.cwd(), "sent-emails-preview");
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    const filename = `${Date.now()}-${to.replace(/[^a-zA-Z0-9]/g, "_")}.html`;
    fs.writeFileSync(path.join(logsDir, filename), html, "utf8");
    console.log(`Draft saved for review at: ${path.join(logsDir, filename)}`);
  } catch (err) {
    console.error("Failed to save email preview file:", err);
  }
}

// Generate the beautiful HTML layout for the poem email
function generatePoemHtml(poemData, unsubscribeToken) {
  const { ghazal, couplets } = poemData;
  const unsubscribeLink = `${appUrl}/unsubscribe?token=${unsubscribeToken}`;

  const coupletsHtml = couplets
    .map((c) => {
      const urduLines = c.urdu_text.split("\n");
      const transliterationLines = c.transliteration.split("\n");
      const translationLines = c.translation.split("\n");

      return `
      <div style="margin-bottom: 40px; padding-bottom: 30px; border-bottom: 1px solid rgba(212, 175, 55, 0.15); text-align: center;">
        <div style="font-size: 14px; color: #e5c158; font-weight: 600; letter-spacing: 0.1em; margin-bottom: 12px; text-transform: uppercase;">
          Couplet ${c.couplet_number}
        </div>
        
        <!-- Urdu Script -->
        <div style="font-family: 'Noto Nastaliq Urdu', Georgia, serif; font-size: 24px; line-height: 2; margin-bottom: 20px; color: #f3f4f6; direction: rtl;">
          ${urduLines[0] || ""}<br/>
          ${urduLines[1] || ""}
        </div>
        
        <!-- Roman Transliteration -->
        <div style="font-family: sans-serif; font-size: 16px; font-style: italic; color: #9ca3af; margin-bottom: 20px; line-height: 1.6;">
          ${transliterationLines[0] || ""}<br/>
          ${transliterationLines[1] || ""}
        </div>
        
        <!-- English Translation -->
        <div style="font-family: sans-serif; font-size: 16px; font-weight: 500; color: #e5c158; margin-bottom: 20px; line-height: 1.6;">
          ${translationLines[0] || ""}<br/>
          ${translationLines[1] || ""}
        </div>
        
        <!-- Explanation & Commentary -->
        <div style="font-family: sans-serif; text-align: left; background-color: rgba(255, 255, 255, 0.03); border-left: 3px solid #e5c158; padding: 15px; margin-top: 15px; border-radius: 4px;">
          <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #f3f4f6; text-transform: uppercase; letter-spacing: 0.05em;">Commentary</h4>
          <p style="margin: 0; font-size: 14px; color: #d1d5db; line-height: 1.6;">${c.explanation}</p>
          
          <h5 style="margin: 12px 0 6px 0; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;">Context & Inspiration</h5>
          <p style="margin: 0; font-size: 13px; color: #9ca3af; line-height: 1.6;">${c.context}</p>
        </div>
      </div>
    `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Poem of the Day</title>
    </head>
    <body style="background-color: #0a0c10; color: #f3f4f6; font-family: sans-serif; margin: 0; padding: 0; -webkit-text-size-adjust: none; -ms-text-size-adjust: none;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0a0c10; padding: 40px 10px;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #12161f; border: 1px solid rgba(212, 175, 55, 0.2); border-radius: 12px; padding: 40px;">
              
              <!-- Header -->
              <tr>
                <td align="center" style="border-bottom: 1px solid rgba(212, 175, 55, 0.2); padding-bottom: 20px;">
                  <div style="font-size: 12px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 8px;">Deewan-e-Ghalib</div>
                  <h1 style="margin: 0; font-size: 24px; color: #e5c158; font-weight: 700; letter-spacing: -0.02em;">Poem of the Day</h1>
                  <p style="margin: 8px 0 0 0; font-size: 14px; color: #9ca3af; font-style: italic;">"${ghazal.title}"</p>
                </td>
              </tr>
              
              <!-- Body -->
              <tr>
                <td style="padding-top: 45px;">
                  ${coupletsHtml}
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td align="center" style="border-top: 1px solid rgba(212, 175, 55, 0.2); padding-top: 30px; margin-top: 30px;">
                  <p style="margin: 0 0 16px 0; font-size: 13px; color: #9ca3af; text-align: center;">
                    You are receiving this because you signed up for the daily Deewan-e-Ghalib email newsletter.
                  </p>
                  <p style="margin: 0; text-align: center;">
                    <a href="${unsubscribeLink}" style="color: #e5c158; text-decoration: underline; font-size: 13px; font-weight: 500;">
                      Unsubscribe
                    </a>
                  </p>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Generate the beautiful HTML layout for the welcome email
function generateWelcomeHtml(unsubscribeToken) {
  const unsubscribeLink = `${appUrl}/unsubscribe?token=${unsubscribeToken}`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to Deewan-e-Ghalib</title>
    </head>
    <body style="background-color: #0a0c10; color: #f3f4f6; font-family: sans-serif; margin: 0; padding: 0;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0a0c10; padding: 40px 10px;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #12161f; border: 1px solid rgba(212, 175, 55, 0.2); border-radius: 12px; padding: 40px;">
              
              <!-- Header -->
              <tr>
                <td align="center" style="border-bottom: 1px solid rgba(212, 175, 55, 0.2); padding-bottom: 20px;">
                  <h1 style="margin: 0; font-size: 24px; color: #e5c158; font-weight: 700;">Welcome to Deewan-e-Ghalib!</h1>
                </td>
              </tr>
              
              <!-- Body -->
              <tr>
                <td style="padding: 30px 0; font-size: 15px; line-height: 1.6; color: #d1d5db;">
                  <p>Aadaab,</p>
                  <p>Thank you for subscribing to the <strong>Deewan-e-Ghalib Daily Poem</strong> newsletter. You have taken a beautiful step into the profound, rich, and mystical world of Mirza Asadullah Khan Ghalib.</p>
                  <p>Starting tomorrow, you will receive one beautiful couplet-by-couplet translation, Roman transliteration, and deep scholarly commentary in your inbox every day.</p>
                  <p>To view today's poem immediately, visit our homepage at <a href="${appUrl}" style="color: #e5c158; text-decoration: underline;">${appUrl}</a>.</p>
                  <p>We are delighted to have you join us on this poetic journey.</p>
                  <p style="margin-top: 30px;">Warmly,<br/>The Deewan-e-Ghalib team</p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td align="center" style="border-top: 1px solid rgba(212, 175, 55, 0.2); padding-top: 20px;">
                  <p style="margin: 0;">
                    <a href="${unsubscribeLink}" style="color: #9ca3af; text-decoration: underline; font-size: 12px;">
                      Unsubscribe from these emails
                    </a>
                  </p>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Function: Send Daily Poem Email
export async function sendDailyPoemEmail(to, unsubscribeToken, poemData) {
  const subject = `Deewan-e-Ghalib: Poem of the Day - ${poemData.ghazal.title}`;
  const html = generatePoemHtml(poemData, unsubscribeToken);

  if (isSmtpConfigured) {
    try {
      await transporter.sendMail({
        from: smtpFrom,
        to,
        subject,
        html,
      });
      console.log(`Successfully sent daily poem email to: ${to}`);
      return { success: true };
    } catch (err) {
      console.error(`Error sending SMTP email to ${to}:`, err);
      return { success: false, error: err.message };
    }
  } else {
    fallbackEmailLog(to, subject, html);
    return { success: true, mocked: true };
  }
}

// Function: Send Welcome Email
export async function sendWelcomeEmail(to, unsubscribeToken) {
  const subject = "Welcome to Deewan-e-Ghalib: Your Daily Poem Subscription";
  const html = generateWelcomeHtml(unsubscribeToken);

  if (isSmtpConfigured) {
    try {
      await transporter.sendMail({
        from: smtpFrom,
        to,
        subject,
        html,
      });
      console.log(`Successfully sent welcome email to: ${to}`);
      return { success: true };
    } catch (err) {
      console.error(`Error sending SMTP welcome email to ${to}:`, err);
      return { success: false, error: err.message };
    }
  } else {
    fallbackEmailLog(to, subject, html);
    return { success: true, mocked: true };
  }
}
