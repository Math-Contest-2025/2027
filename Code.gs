/**
 * UBUNIFU MARKETING REPRESENTATIVE REGISTRATION
 * Google Apps Script backend.
 *
 * Setup:
 * 1. Create a new Apps Script project and paste this file into Code.gs.
 * 2. Run setupSpreadsheet() once and authorize it.
 * 3. Deploy > New deployment > Web app.
 *    Execute as: Me. Access: Anyone (if permitted by your account policy).
 * 4. Copy the /exec URL into CONFIG.appsScriptUrl in script.js.
 *
 * Note: Apps Script web apps may have cross-origin limitations in some browsers.
 * Test the deployed form using the exact public URL before sharing it widely.
 */

const SHEET_NAME = "Registrations";
const SPREADSHEET_NAME = "Ubunifu Marketing Representatives Database";
const PROPERTY_KEY = "UBUNIFU_REGISTRATION_SPREADSHEET_ID";
const HEADERS = [
  "Registration ID", "Submitted At", "Full Name", "WhatsApp Number", "Email",
  "Main County", "Town / Area", "Profession", "Employment Status",
  "Has Other Job / Business", "Other Job Details", "Work Related to Schools",
  "School Experience", "School Experience Details", "Has School Contacts",
  "Institution Types", "Counties Covered", "Work Preferences", "Heard About Ubunifu",
  "Additional Information", "Privacy Consent", "Marketing Updates Consent"
];

function setupSpreadsheet() {
  const properties = PropertiesService.getScriptProperties();
  let spreadsheetId = properties.getProperty(PROPERTY_KEY);
  let spreadsheet;

  if (spreadsheetId) {
    try {
      spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    } catch (error) {
      spreadsheet = null;
    }
  }

  if (!spreadsheet) {
    spreadsheet = SpreadsheetApp.create(SPREADSHEET_NAME);
    properties.setProperty(PROPERTY_KEY, spreadsheet.getId());
  }

  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);

  // Only write headers when the sheet is empty; never clear existing records.
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length)
      .setFontWeight("bold")
      .setBackground("#102a56")
      .setFontColor("#ffffff")
      .setWrap(true);
    sheet.autoResizeColumns(1, HEADERS.length);
  }

  // Remove the default empty Sheet1 if a Registrations sheet was newly created.
  const defaultSheet = spreadsheet.getSheetByName("Sheet1");
  if (defaultSheet && defaultSheet.getLastRow() === 0 && spreadsheet.getSheets().length > 1) {
    spreadsheet.deleteSheet(defaultSheet);
  }

  Logger.log("Spreadsheet URL: " + spreadsheet.getUrl());
  return { spreadsheetId: spreadsheet.getId(), spreadsheetUrl: spreadsheet.getUrl() };
}

function doGet() {
  return jsonOutput_({
    success: true,
    message: "Ubunifu registration service is available.",
    service: "Ubunifu Marketing Representative Registration"
  });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const raw = e && e.postData && e.postData.contents;
    if (!raw) return jsonOutput_({ success: false, message: "No registration data was received." });

    const data = JSON.parse(raw);

    // Honeypot field: normal visitors should leave this empty.
    if (String(data.website || "").trim()) {
      return jsonOutput_({ success: true, registrationId: "Received" });
    }

    const clean = validateAndClean_(data);
    const spreadsheet = getSpreadsheet_();
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error("Registration worksheet is missing. Run setupSpreadsheet().");

    // Practical duplicate check: same normalized email or phone within the last 10 minutes.
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const startRow = Math.max(2, lastRow - 499);
      const rows = sheet.getRange(startRow, 4, lastRow - startRow + 1, 2).getDisplayValues();
      const now = Date.now();
      for (let i = rows.length - 1; i >= 0; i--) {
        const existingPhone = String(rows[i][0] || "").trim();
        const existingEmail = String(rows[i][1] || "").trim().toLowerCase();
        if ((existingPhone === clean.phone || existingEmail === clean.email.toLowerCase()) &&
            (now - new Date(sheet.getRange(startRow + i, 2).getValue()).getTime()) < 10 * 60 * 1000) {
          return jsonOutput_({
            success: false,
            message: "A recent registration with this email or phone number already exists. If you just submitted the form, please wait before trying again."
          });
        }
      }
    }

    const registrationId = "UB-" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd") +
      "-" + Utilities.getUuid().replace(/-/g, "").substring(0, 8).toUpperCase();

    const row = [
      registrationId, new Date(), clean.fullName, clean.phone, clean.email,
      clean.county, clean.town, clean.profession, clean.employmentStatus,
      clean.hasOtherJob, clean.otherJobDetails, clean.schoolRelated,
      clean.schoolExperience, clean.schoolExperienceDetails, clean.schoolContacts,
      clean.institutions.join(", "), clean.coverageCounties.join(", "),
      clean.workPreferences.join(", "), clean.heardAbout, clean.additionalInfo,
      clean.privacyConsent ? "Yes" : "No", clean.marketingConsent ? "Yes" : "No"
    ];

    const nextRow = sheet.getLastRow() + 1;
    // Store applicant-provided values as plain text to reduce spreadsheet formula injection.
    const safeRow = row.map((value, index) => {
      if (index === 1) return value;
      if (typeof value === "string" && /^[=+\-@]/.test(value)) return "'" + value;
      return value;
    });
    sheet.getRange(nextRow, 1, 1, safeRow.length).setValues([safeRow]);
    return jsonOutput_({ success: true, registrationId: registrationId, message: "Registration saved successfully." });
  } catch (error) {
    console.error("Registration submission error: " + error.message);
    return jsonOutput_({
      success: false,
      message: error && error.message ? error.message : "The registration could not be saved. Please try again."
    });
  } finally {
    try { lock.releaseLock(); } catch (ignored) {}
  }
}

function validateAndClean_(data) {
  function str(key, max, required) {
    const value = String(data[key] == null ? "" : data[key]).trim();
    if (required && !value) throw new Error("Please complete all required fields.");
    if (value.length > max) throw new Error("One or more fields exceed the allowed length.");
    return value;
  }
  function choice(key, allowed, required) {
    const value = str(key, 200, required);
    if (value && allowed.indexOf(value) === -1) throw new Error("An invalid option was submitted.");
    return value;
  }
  function list(key, allowed, required) {
    const value = data[key];
    if (!Array.isArray(value)) {
      if (required) throw new Error("Please select the required options.");
      return [];
    }
    const cleaned = [...new Set(value.map(v => String(v).trim()).filter(Boolean))];
    if (required && cleaned.length === 0) throw new Error("Please select the required options.");
    if (cleaned.length > allowed.length || cleaned.some(v => allowed.indexOf(v) === -1)) {
      throw new Error("One or more selected options are invalid.");
    }
    return cleaned;
  }

  const fullName = str("fullName", 120, true);
  const phone = str("phone", 20, true);
  const email = str("email", 160, true);
  if (!/^\+254[17]\d{8}$/.test(phone)) throw new Error("Enter a valid Kenyan mobile number using the +254 format.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address.");
  if (!data.privacyConsent) throw new Error("Please agree to the privacy notice.");

  const counties = [
    "Baringo","Bomet","Bungoma","Busia","Elgeyo-Marakwet","Embu","Garissa","Homa Bay","Isiolo","Kajiado","Kakamega","Kericho","Kiambu","Kilifi","Kirinyaga","Kisii","Kisumu","Kitui","Kwale","Laikipia","Lamu","Machakos","Makueni","Mandera","Marsabit","Meru","Migori","Mombasa","Murang'a","Nairobi","Nakuru","Nandi","Narok","Nyamira","Nyandarua","Nyeri","Samburu","Siaya","Taita-Taveta","Tana River","Tharaka-Nithi","Trans Nzoia","Turkana","Uasin Gishu","Vihiga","Wajir","West Pokot"
  ];
  const institutionOptions = ["Primary schools","Junior schools","Secondary schools","Colleges and training institutions","Private school owners","Public schools","Other education organizations"];
  const workOptions = ["Commission-based marketing","Part-time marketing","Business partnership","School referrals","Other"];

  return {
    fullName: fullName,
    phone: phone,
    email: email,
    county: choice("county", counties, true),
    town: str("town", 100, false),
    profession: str("profession", 150, true),
    employmentStatus: choice("employmentStatus", ["Employed","Self-employed","Business owner","Student","Unemployed","Other"], true),
    hasOtherJob: choice("hasOtherJob", ["Yes","No"], true),
    otherJobDetails: str("otherJobDetails", 700, false),
    schoolRelated: choice("schoolRelated", ["Yes","No","Partially"], true),
    schoolExperience: choice("schoolExperience", ["Yes","No"], true),
    schoolExperienceDetails: str("schoolExperienceDetails", 700, false),
    schoolContacts: choice("schoolContacts", ["Yes","No"], true),
    institutions: list("institutions", institutionOptions, true),
    coverageCounties: list("coverageCounties", counties, true),
    workPreferences: list("workPreferences", workOptions, true),
    heardAbout: choice("heardAbout", ["WhatsApp","Facebook","Instagram","Friend or colleague","School or education event","Ubunifu representative","Other"], false),
    additionalInfo: str("additionalInfo", 1000, false),
    privacyConsent: Boolean(data.privacyConsent),
    marketingConsent: Boolean(data.marketingConsent)
  };
}

function getSpreadsheet_() {
  const properties = PropertiesService.getScriptProperties();
  let id = properties.getProperty(PROPERTY_KEY);
  if (!id) {
    const result = setupSpreadsheet();
    id = result.spreadsheetId;
  }
  const spreadsheet = SpreadsheetApp.openById(id);
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }
  return spreadsheet;
}

function getSpreadsheetUrl() {
  return getSpreadsheet_().getUrl();
}

function jsonOutput_(object) {
  return ContentService.createTextOutput(JSON.stringify(object))
    .setMimeType(ContentService.MimeType.JSON);
}
