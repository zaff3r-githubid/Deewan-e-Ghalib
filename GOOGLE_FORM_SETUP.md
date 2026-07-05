# Serverless Email Subscription via Google Forms & Google Sheets (GitHub Pages Compatible)

Since this application is hosted on **GitHub Pages**, it operates as a static website with no server-side backend or database at runtime. To support newsletter subscriptions and daily email delivery without external hosting costs, you can run the entire emailing pipeline directly inside **Google Cloud** using **Google Apps Script** tied to your **Google Sheet** (where form responses are stored).

Here is how to set up the complete system:

---

## How It Works
1. **Subscriber Signups**: Users submit their email address via your Google Form, which automatically logs it into a Google Sheet.
2. **Immediate Welcome Email**: A Google Apps Script trigger runs on form submission, instantly emailing a welcome message to the new subscriber.
3. **Daily Poem Update**: Your daily GitHub Actions build automatically generates a static JSON file containing today's poem at `https://zaff3r-githubid.github.io/Deewan-e-Ghalib/daily-poem.json`.
4. **Daily Email Dispatch**: A Google Apps Script time-driven trigger runs every morning, fetches the static daily poem JSON from your website, and emails the formatted poem to every subscriber listed in the Google Sheet.
5. **Easy Unsubscribing**: Emails include a feedback contact link and an Unsubscribe option. Out of the box, the Unsubscribe link lets users email you to request removal. Optionally, you can follow the guide below to deploy a 1-click automated unsubscribe link!

---

## Step 1: Open the Apps Script Editor in your Google Sheet

1. Go to your **Google Form**.
2. Click on the **Responses** tab.
3. Click the green **Link to Sheets** (or **View in Sheets**) button. This will open the Google Sheet where all subscriber emails are stored.
4. In the top menu of the Google Sheet, click **Extensions** -> **Apps Script**. This will open the script editor bound to your sheet.

---

## Step 2: Add the Webhook and Mailer Code

Clear any default code in the editor (e.g. `Code.gs`) and paste the following Google Apps Script code:

```javascript
// Google Apps Script code to send Welcome and Daily Poem emails

// CONFIGURATION: If you set up the automated unsubscribe Web App (Step 5 below),
// replace this placeholder with your deployed Web App URL!
// Otherwise, leave it as is and the script will use a secure email-based unsubscribe fallback.
var UNSUBSCRIBE_WEB_APP_URL = "https://script.google.com/macros/s/YOUR_WEB_APP_ID/exec";
var CONTACT_EMAIL = "zafaraadil@gmail.com";

// 1. Send Welcome Email immediately on Form Submission
function onFormSubmit(e) {
  try {
    var email = "";
    
    // Check if the e.response object exists (when run as a form-submit trigger)
    if (e && e.response) {
      email = e.response.getRespondentEmail() || "";
      if (!email) {
        var itemResponses = e.response.getItemResponses();
        for (var i = 0; i < itemResponses.length; i++) {
          var title = itemResponses[i].getItem().getTitle().toLowerCase();
          if (title.indexOf("email") > -1) {
            email = itemResponses[i].getResponse().trim();
            break;
          }
        }
      }
    }
    
    if (email) {
      sendWelcomeEmail(email);
    }
  } catch (err) {
    Logger.log("Error in onFormSubmit: " + err.toString());
  }
}

function sendWelcomeEmail(toEmail) {
  var subject = "Welcome to Deewan-e-Ghalib: Your Daily Poem Subscription";
  
  // Choose unsubscribe method based on configuration
  var unsubscribeLink = UNSUBSCRIBE_WEB_APP_URL.indexOf("YOUR_WEB_APP_ID") > -1
    ? "mailto:" + CONTACT_EMAIL + "?subject=Unsubscribe%20Deewan-e-Ghalib&body=Please%20unsubscribe%20email%20address:%20" + encodeURIComponent(toEmail)
    : UNSUBSCRIBE_WEB_APP_URL + "?email=" + encodeURIComponent(toEmail);

  var htmlBody = [
    '<div style="background-color: #0a0c10; color: #f3f4f6; font-family: sans-serif; padding: 40px 10px;">',
    '  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #12161f; border: 1px solid rgba(212, 175, 55, 0.2); border-radius: 12px; padding: 40px;">',
    '    <tr>',
    '      <td align="center" style="border-bottom: 1px solid rgba(212, 175, 55, 0.2); padding-bottom: 20px;">',
    '        <h1 style="margin: 0; font-size: 24px; color: #e5c158; font-weight: 700;">Welcome to Deewan-e-Ghalib!</h1>',
    '      </td>',
    '    </tr>',
    '    <tr>',
    '      <td style="padding: 30px 0; font-size: 15px; line-height: 1.6; color: #d1d5db;">',
    '        <p>Aadaab,</p>',
    '        <p>Thank you for subscribing to the <strong>Deewan-e-Ghalib Daily Poem</strong> newsletter. You have taken a beautiful step into the profound, rich, and mystical world of Mirza Asadullah Khan Ghalib.</p>',
    '        <p>Starting tomorrow, you will receive one beautiful couplet-by-couplet translation, Roman transliteration, and deep scholarly commentary in your inbox every day.</p>',
    '        <p>To view today\'s poem immediately, visit our homepage at <a href="https://zaff3r-githubid.github.io/Deewan-e-Ghalib" style="color: #e5c158; text-decoration: underline;">Deewan-e-Ghalib</a>.</p>',
    '        <p>We are delighted to have you join us on this poetic journey.</p>',
    '        <p style="margin-top: 30px;">Warmly,<br/>The Deewan-e-Ghalib team</p>',
    '      </td>',
    '    </tr>',
    '    <tr>',
    '      <td align="center" style="border-top: 1px solid rgba(212, 175, 55, 0.2); padding-top: 20px; font-size: 12px; color: #9ca3af;">',
    '        <p style="margin: 0 0 10px 0;">Questions or feedback? Contact us at <a href="mailto:' + CONTACT_EMAIL + '" style="color: #e5c158; text-decoration: underline;">' + CONTACT_EMAIL + '</a>.</p>',
    '        <p style="margin: 0;">',
    '          <a href="' + unsubscribeLink + '" style="color: #9ca3af; text-decoration: underline;">Unsubscribe</a>',
    '        </p>',
    '      </td>',
    '    </tr>',
    '  </table>',
    '</div>'
  ].join('\n');
  
  MailApp.sendEmail({
    to: toEmail,
    subject: subject,
    htmlBody: htmlBody
  });
  Logger.log("Sent welcome email to: " + toEmail);
}

// 2. Send Daily Poem Email to All Subscribers
function sendDailyPoem() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  
  // REPLACE this with your actual GitHub Pages URL!
  var jsonUrl = "https://zaff3r-githubid.github.io/Deewan-e-Ghalib/daily-poem.json";
  
  var response;
  try {
    response = UrlFetchApp.fetch(jsonUrl);
  } catch (err) {
    Logger.log("Failed to fetch daily-poem.json from " + jsonUrl + ": " + err.toString());
    return;
  }
  
  var poemData = JSON.parse(response.getContentText());
  var title = poemData.ghazal.title;
  var poemId = poemData.ghazal.id;
  var couplets = poemData.couplets;
  
  // Format couplets HTML body using ES5 string array joining
  var coupletsHtml = couplets.map(function(c) {
    var urduLines = c.urdu_text.split("\n");
    var transliterationLines = c.transliteration.split("\n");
    var translationLines = c.translation.split("\n");
    
    return [
      '<div style="margin-bottom: 40px; padding-bottom: 30px; border-bottom: 1px solid rgba(212, 175, 55, 0.15); text-align: center;">',
      '  <div style="font-size: 14px; color: #e5c158; font-weight: 600; letter-spacing: 0.1em; margin-bottom: 12px; text-transform: uppercase;">',
      '    Couplet ' + c.couplet_number,
      '  </div>',
      '  <div style="font-size: 24px; line-height: 2; margin-bottom: 20px; color: #f3f4f6;">',
      '    ' + (urduLines[0] || "") + '<br/>' + (urduLines[1] || ""),
      '  </div>',
      '  <div style="font-size: 16px; font-style: italic; color: #9ca3af; margin-bottom: 20px; line-height: 1.6;">',
      '    ' + (transliterationLines[0] || "") + '<br/>' + (transliterationLines[1] || ""),
      '  </div>',
      '  <div style="font-size: 16px; font-weight: 500; color: #e5c158; margin-bottom: 20px; line-height: 1.6;">',
      '    ' + (translationLines[0] || "") + '<br/>' + (translationLines[1] || ""),
      '  </div>',
      '  <div style="text-align: left; background-color: rgba(255, 255, 255, 0.03); border-left: 3px solid #e5c158; padding: 15px; margin-top: 15px; border-radius: 4px;">',
      '    <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #f3f4f6; text-transform: uppercase; letter-spacing: 0.05em;">Commentary</h4>',
      '    <p style="margin: 0; font-size: 14px; color: #d1d5db; line-height: 1.6;">' + c.explanation + '</p>',
      '    <h5 style="margin: 12px 0 6px 0; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;">Context & Inspiration</h5>',
      '    <p style="margin: 0; font-size: 13px; color: #9ca3af; line-height: 1.6;">' + c.context + '</p>',
      '  </div>',
      '</div>'
    ].join('\n');
  }).join('\n');
  
  var emailHtml = [
    '<!DOCTYPE html>',
    '<html>',
    '<body style="background-color: #0a0c10; color: #f3f4f6; font-family: sans-serif; margin: 0; padding: 0;">',
    '  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0a0c10; padding: 40px 10px;">',
    '    <tr>',
    '      <td align="center">',
    '        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #12161f; border: 1px solid rgba(212, 175, 55, 0.2); border-radius: 12px; padding: 40px;">',
    '          <tr>',
    '            <td align="center" style="border-bottom: 1px solid rgba(212, 175, 55, 0.2); padding-bottom: 20px;">',
    '              <div style="font-size: 12px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 8px;">Deewan-e-Ghalib</div>',
    '              <h1 style="margin: 0; font-size: 24px; color: #e5c158; font-weight: 700; letter-spacing: -0.02em;">Poem of the Day</h1>',
    '              <p style="margin: 8px 0 0 0; font-size: 14px; color: #9ca3af; font-style: italic;">"' + title + '"</p>',
    '            </td>',
    '          </tr>',
    '          <tr>',
    '            <td style="padding-top: 45px;">',
    '              ' + coupletsHtml,
    '            </td>',
    '          </tr>',
    '          <tr>',
    '            <td align="center" style="border-top: 1px solid rgba(212, 175, 55, 0.2); padding-top: 30px; margin-top: 30px; font-size: 13px; line-height: 1.6; color: #9ca3af;">',
    '              <p style="margin: 0 0 10px 0;">',
    '                Read the full poem with word-by-word meanings on the <a href="https://zaff3r-githubid.github.io/Deewan-e-Ghalib/poem/' + poemId + '" style="color: #e5c158; text-decoration: underline;">Deewan-e-Ghalib website</a>.',
    '              </p>',
    '              <p style="margin: 0 0 20px 0;">',
    '                Text source and reference: <a href="https://www.rekhta.org" style="color: #e5c158; text-decoration: underline;">Rekhta</a>.',
    '              </p>',
    '              <p style="margin: 0 0 10px 0; border-top: 1px solid rgba(212, 175, 55, 0.1); padding-top: 15px; font-size: 12px;">',
    '                Questions or feedback? Contact us at <a href="mailto:' + CONTACT_EMAIL + '" style="color: #e5c158; text-decoration: underline;">' + CONTACT_EMAIL + '</a>.',
    '              </p>',
    '              <p style="margin: 20px 0 0 0; font-size: 12px;">',
    '                You are receiving this because you subscribed to the Deewan-e-Ghalib Daily Poem newsletter.',
    '              </p>',
    '              <p style="margin: 5px 0 0 0; font-size: 12px;">',
    '                <a href="{{UNSUBSCRIBE_LINK}}" style="color: #9ca3af; text-decoration: underline;">Unsubscribe</a>',
    '              </p>',
    '            </td>',
    '          </tr>',
    '        </table>',
    '      </td>',
    '    </tr>',
    '  </table>',
    '</body>',
    '</html>'
  ].join('\n');
  
  var subject = "Deewan-e-Ghalib: Poem of the Day - " + title;
  
  // Find the column index for email addresses
  var emailColIdx = -1;
  var headers = data[0];
  for (var i = 0; i < headers.length; i++) {
    if (headers[i].toString().toLowerCase().indexOf("email") > -1) {
      emailColIdx = i;
      break;
    }
  }
  
  if (emailColIdx === -1) {
    Logger.log("Could not find email column in the spreadsheet.");
    return;
  }
  
  // Collect active emails and avoid sending duplicates
  var sentEmails = {};
  var count = 0;
  
  // Loop through rows starting from index 1 (skipping header)
  for (var rowIdx = 1; rowIdx < data.length; rowIdx++) {
    var emailCell = data[rowIdx][emailColIdx].toString().trim().toLowerCase();
    
    if (emailCell && emailCell.indexOf("@") > -1 && !sentEmails[emailCell]) {
      sentEmails[emailCell] = true;
      
      // Calculate unsubscribe link for this subscriber
      var unsubscribeLink = UNSUBSCRIBE_WEB_APP_URL.indexOf("YOUR_WEB_APP_ID") > -1
        ? "mailto:" + CONTACT_EMAIL + "?subject=Unsubscribe%20Deewan-e-Ghalib&body=Please%20unsubscribe%20email%20address:%20" + encodeURIComponent(emailCell)
        : UNSUBSCRIBE_WEB_APP_URL + "?email=" + encodeURIComponent(emailCell);
        
      var personalizedHtml = emailHtml.replace("{{UNSUBSCRIBE_LINK}}", unsubscribeLink);
      
      try {
        MailApp.sendEmail({
          to: emailCell,
          subject: subject,
          htmlBody: personalizedHtml
        });
        count++;
      } catch (sendErr) {
        Logger.log("Failed to send email to " + emailCell + ": " + sendErr.toString());
      }
    }
  }
  
  Logger.log("Successfully sent daily poem to " + count + " active subscribers.");
}
```

---

## Step 3: Configure Automation Triggers

You need to tell Google Sheets when to run the script functions.

### Trigger 1: Welcome Email on Form Submission
1. In the Apps Script editor, click the **Triggers** icon (clock icon) in the left menu.
2. Click the blue **`+ Add Trigger`** button in the bottom right.
3. Configure the settings:
   - **Choose which function to run**: `onFormSubmit`
   - **Choose which deployment should run**: `Head`
   - **Select event source**: `From spreadsheet`
   - **Select event type**: `On form submit`
4. Click **Save** and grant permissions if prompted.

### Trigger 2: Daily Poem Email Dispatch
1. Click the blue **`+ Add Trigger`** button again.
2. Configure the settings:
   - **Choose which function to run**: `sendDailyPoem`
   - **Choose which deployment should run**: `Head`
   - **Select event source**: `Time-driven`
   - **Select type of time based trigger**: `Day timer`
   - **Select time of day**: Select the hour you want the email to go out (e.g., `7 AM to 8 AM`).
3. Click **Save**.

---

## Step 4: Verification

To test the system immediately:
1. In the Apps Script editor toolbar, select the `sendDailyPoem` function from the dropdown.
2. Click the **Run** button.
3. Check the Google Sheet's execution log to ensure it compiled cleanly. It will send a test email of today's poem to every email address in the sheet!

---

## Step 5: (Optional) Set up Automated One-Click Unsubscribe

If you want clicking the "Unsubscribe" link to **automatically remove the subscriber's email** from your Google Sheet instead of generating a feedback email:

1. In your Apps Script editor, click the **`+`** icon next to the "Files" heading in the left sidebar and select **Script**. Name it `Unsubscribe` (it will become `Unsubscribe.gs`).
2. Delete the default function block and paste this code:

```javascript
// doGet function handles GET requests to this Web App
function doGet(e) {
  var email = e.parameter.email;
  
  if (email) {
    var success = unsubscribeSubscriber(email);
    if (success) {
      return HtmlService.createHtmlOutput(
        '<html><body style="font-family: sans-serif; text-align: center; padding-top: 50px; background-color: #0a0c10; color: #f3f4f6;">' +
        '<h2 style="color:#e5c158;">Unsubscribe Successful</h2>' +
        '<p>The email address <strong>' + email + '</strong> has been removed from our subscription list.</p>' +
        '<p>Aadaab, and we hope to see you again.</p>' +
        '</body></html>'
      );
    } else {
      return HtmlService.createHtmlOutput(
        '<html><body style="font-family: sans-serif; text-align: center; padding-top: 50px; background-color: #0a0c10; color: #f3f4f6;">' +
        '<h2>Email Not Found</h2>' +
        '<p>We could not find the address <strong>' + email + '</strong> on our active subscription list.</p>' +
        '</body></html>'
      );
    }
  }
  return HtmlService.createHtmlOutput('Invalid request. No email parameter provided.');
}

function unsubscribeSubscriber(emailAddress) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  
  var emailColIdx = -1;
  var headers = data[0];
  for (var i = 0; i < headers.length; i++) {
    if (headers[i].toString().toLowerCase().indexOf("email") > -1) {
      emailColIdx = i;
      break;
    }
  }
  
  if (emailColIdx === -1) {
    return false;
  }
  
  var removed = false;
  // Loop backward to safely delete rows while iterating
  for (var rowIdx = data.length - 1; rowIdx >= 1; rowIdx--) {
    var cellValue = data[rowIdx][emailColIdx].toString().trim().toLowerCase();
    if (cellValue === emailAddress.trim().toLowerCase()) {
      sheet.deleteRow(rowIdx + 1); // delete row (1-indexed, and skipping header is compensated by rowIdx+1)
      removed = true;
    }
  }
  
  return removed;
}
```

3. Click **Save** (floppy disk icon).
4. In the top-right corner of the Apps Script window, click the blue **Deploy** button and choose **New deployment**.
5. Click the **Gear icon** next to "Select type" and choose **Web app**.
6. Set the configuration details:
   - **Description**: `Unsubscribe Web App`
   - **Execute as**: `Me (your-email@gmail.com)`
   - **Who has access**: `Anyone` *(Crucial, so the link works for external unsubscribers)*
7. Click **Deploy**.
8. Grant permissions if prompted (Go to Advanced -> Allow).
9. Copy the **Web App URL** shown (it will end with `/exec`).
10. Open `Code.gs` in your Apps Script files list and update line 7:
    Replace `"https://script.google.com/macros/s/YOUR_WEB_APP_ID/exec"` with your **copied Web App URL**.
11. Click **Save**. You are done!
