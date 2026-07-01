# Connecting Google Forms to the Deewan-e-Ghalib Subscription Service

If you are using Google Forms for email subscriptions and have deployed your site on a server environment (like Vercel), you can easily connect the form to your application. When a user submits the Google Form, a **Google Apps Script** will run, sending the email address directly to your `/api/subscribe` API route.

Follow these simple steps to configure the integration:

---

## Step 1: Open the Apps Script Editor in Google Forms

1. Go to your **Google Form**.
2. In the top-right corner, click on the **three vertical dots** (More menu).
3. Select **`< > Script editor`** from the dropdown menu. This will open a new Google Apps Script project bound to your form.

---

## Step 2: Add the Webhook Script

Replace any default code in the editor with the following script:

```javascript
/**
 * Triggers on form submission. Parses the respondent's email and forwards it to the Deewan-e-Ghalib API.
 */
function onFormSubmit(e) {
  try {
    // 1. Get the form and responses
    var form = FormApp.getActiveForm();
    var responses = form.getResponses();
    var latestResponse = responses[responses.length - 1];
    var itemResponses = latestResponse.getItemResponses();
    
    // 2. Extract the email address from the form fields
    var email = "";
    for (var i = 0; i < itemResponses.length; i++) {
      var item = itemResponses[i].getItem();
      var title = item.getTitle();
      
      // Look for a text field whose question title contains "email" (case-insensitive)
      if (title.toLowerCase().indexOf("email") > -1) {
        email = itemResponses[i].getResponse().trim();
        break;
      }
    }
    
    // Fallback: If "Collect emails" is enabled in settings, grab the respondent's authenticated email
    if (!email) {
      email = latestResponse.getRespondentEmail();
    }
    
    if (!email) {
      Logger.log("No email address found in the form submission.");
      return;
    }
    
    // 3. Define your deployed website URL
    // REPLACE this with your actual Vercel/production domain!
    var apiEndpoint = "https://your-deployed-app.vercel.app/api/subscribe";
    
    // 4. Send the POST request to the API
    var payload = {
      email: email
    };
    
    var options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    Logger.log("Sending email to webhook: " + email);
    var response = UrlFetchApp.fetch(apiEndpoint, options);
    Logger.log("Response Code: " + response.getResponseCode());
    Logger.log("Response Body: " + response.getContentText());
    
  } catch (error) {
    Logger.log("Error processing form submission: " + error.toString());
  }
}
```

> [!IMPORTANT]
> Make sure to update the `apiEndpoint` variable in the script to match your production domain:
> `var apiEndpoint = "https://your-deployed-app.vercel.app/api/subscribe";` (or `http://localhost:3033/api/subscribe` for local development testing).

---

## Step 3: Save and Set Up the Trigger

Apps Script requires an explicit trigger to run the script when a form is submitted.

1. In the Apps Script editor, click the **Save project** (floppy disk icon) at the top. You can rename the project to something like `Deewan Subscription Webhook`.
2. On the left-hand sidebar, click the **Triggers** icon (clock icon).
3. Click the blue **`+ Add Trigger`** button in the bottom right.
4. Set up the trigger with the following configurations:
   - **Choose which function to run**: `onFormSubmit`
   - **Choose which deployment should run**: `Head`
   - **Select event source**: `From form`
   - **Select event type**: `On form submit`
   - **Failure notification settings**: `Notify me daily` (or immediately)
5. Click **Save**.
6. A Google authorization popup will appear. Click your account, click **Advanced**, and click **Go to Deewan Subscription Webhook (unsafe)** to grant permissions for the script to fetch external URLs and read form responses.

---

## Step 4: Test the Setup

1. Open your Google Form in preview mode.
2. Fill it out with a test email address and submit.
3. Check your deployed database or verify that the welcome email draft was generated:
   - Locally, this will be saved under the `sent-emails-preview/` directory as an HTML file.
   - On production with SMTP configured, the test email address will receive a welcome email immediately!
