# Ubunifu Marketing Representative Registration

A responsive multi-step registration form built with HTML, CSS, JavaScript and Google Apps Script. The Apps Script backend creates a Google Sheet and records registration submissions.

## Files

- `index.html` — home page, company information, benefits, registration form and success screen.
- `style.css` — responsive Ubunifu-branded layout.
- `script.js` — form navigation, validation, conditional questions and submission logic.
- `Code.gs` — Google Sheets setup and server-side submission validation.

## 1. Set up the Google Sheets backend

1. Visit https://script.google.com and create a new project.
2. Replace the contents of `Code.gs` with the supplied `Code.gs` code.
3. Save the project.
4. In the function dropdown, select `setupSpreadsheet` and click **Run**.
5. Approve the requested Google permissions.
6. Open **Execution log** to find the spreadsheet URL, or run `getSpreadsheetUrl`.
7. Confirm that the `Registrations` tab and its column headers exist.

The script stores the spreadsheet ID in Script Properties. Running setup again does not clear existing rows.

## 2. Deploy the web form through Apps Script

The easiest Apps Script-hosted deployment requires HTML files to be served by Apps Script. The included front end is a standalone set of files, so either:

- Host `index.html`, `style.css`, and `script.js` on a static web host and use the Apps Script deployment URL as the endpoint; or
- Move the HTML into Apps Script HTML files and adjust `doGet()` to serve the page and include CSS/JS using Apps Script HTML templates.

To deploy the backend:
1. Click **Deploy → New deployment**.
2. Choose **Web app**.
3. Set **Execute as** to your account.
4. Set access to the intended public audience, such as **Anyone**, if your account and organization permit it.
5. Deploy and copy the URL ending in `/exec`.
6. In `script.js`, set `CONFIG.appsScriptUrl` to that exact URL.

### Important integration note

Some browsers and hosting arrangements may block a direct cross-origin `fetch()` to Apps Script or may not expose the JSON response consistently. Test a real submission from the exact hosted page and browser before distributing the link. If the browser blocks the response, host the form inside Apps Script itself or use a trusted server-side proxy. Do not mark the form as live until the response and saved row have both been verified.

## 3. Customize company details

At the top of `script.js`:

- `appsScriptUrl`: paste your deployed Apps Script `/exec` URL.
- `companyWhatsApp`: enter the official Ubunifu WhatsApp number as digits only, including country code, e.g. `2547XXXXXXXX`.

The visible logo is a stylized placeholder “U”. Replace it with the official Ubunifu logo when available. Update the company email/privacy contact if you add one to the site.

## 4. Test before sharing

- Submit a test record and verify it appears in the Google Sheet.
- Test required fields, invalid email and phone numbers, conditional questions, and consent.
- Test on mobile and desktop.
- Verify that the sheet is private and only authorized staff can open it.
- Test duplicate submissions and failed network requests.
- Share only the public form URL, never the sheet's edit link.

## Privacy and consent

The form asks for consent to process registration details for registration review and follow-up. Optional marketing consent is separate. Add a complete privacy notice with the organization's contact details and retention process before public launch, and confirm compliance with applicable Kenyan data protection requirements.

## Copyright

© 2026 Ubunifu. All Rights Reserved.
