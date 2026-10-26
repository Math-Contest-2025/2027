/* Ubunifu registration form.
   For a live Google Sheets integration, deploy the included Code.gs as a web app
   and paste the deployment URL into CONFIG.appsScriptUrl below. */
const CONFIG = {
  companyName: "Ubunifu Bytes",
  // Replace with the deployed Apps Script Web App URL ending in /exec.
  appsScriptUrl: "https://script.google.com/macros/s/AKfycbxXwGwnVwvtnLtNeKsN3cHwd9engKdL5joY-iB2UI8JEmvZCqZ7osC9kr2oCANWWH3TAw/exec",
  // Replace with the official WhatsApp number, digits only, including country code.
  companyWhatsApp: "+254705176259"
};

const COUNTIES = [
  "Baringo","Bomet","Bungoma","Busia","Elgeyo-Marakwet","Embu","Garissa","Homa Bay","Isiolo","Kajiado","Kakamega","Kericho","Kiambu","Kilifi","Kirinyaga","Kisii","Kisumu","Kitui","Kwale","Laikipia","Lamu","Machakos","Makueni","Mandera","Marsabit","Meru","Migori","Mombasa","Murang'a","Nairobi","Nakuru","Nandi","Narok","Nyamira","Nyandarua","Nyeri","Samburu","Siaya","Taita-Taveta","Tana River","Tharaka-Nithi","Trans Nzoia","Turkana","Uasin Gishu","Vihiga","Wajir","West Pokot"
];

const form = document.getElementById("registrationForm");
const pages = [...document.querySelectorAll(".page")];
const nav = document.getElementById("mainNav");
const menuToggle = document.getElementById("menuToggle");
let currentStep = 1;

document.getElementById("year").textContent = new Date().getFullYear();

function populateCounties() {
  const mainCounty = form.elements.county;
  COUNTIES.forEach(county => {
    const option = document.createElement("option");
    option.value = county;
    option.textContent = county;
    mainCounty.appendChild(option);
    const label = document.createElement("label");
    label.className = "county-option";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = "coverageCounties";
    input.value = county;
    label.append(input, document.createTextNode(county));
    document.getElementById("coverageCounties").appendChild(label);
  });
}
populateCounties();

function showPage(name) {
  pages.forEach(page => page.classList.toggle("active", page.id === `page-${name}`));
  document.querySelectorAll(".nav-link").forEach(button => button.classList.toggle("active", button.dataset.page === name));
  nav.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
  window.scrollTo({ top: 0, behavior: "smooth" });
}
document.querySelectorAll("[data-page]").forEach(button => {
  button.addEventListener("click", () => showPage(button.dataset.page));
});
menuToggle.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
});

function showMessage(message, type = "error-message") {
  const box = document.getElementById("formMessage");
  box.textContent = message;
  box.className = `form-message show ${type}`;
}
function clearMessage() {
  const box = document.getElementById("formMessage");
  box.textContent = "";
  box.className = "form-message";
}
function selectedValues(name) {
  return [...form.querySelectorAll(`input[name="${name}"]:checked`)].map(el => el.value);
}
function setError(field, message) {
  const container = field.closest(".field") || field.closest(".consent-box");
  if (!container) return;
  const error = container.querySelector(".error");
  if (error) error.textContent = message;
  field.classList.toggle("invalid", Boolean(message));
}
function validateStep(stepNumber) {
  clearMessage();
  const step = document.querySelector(`.form-step[data-step="${stepNumber}"]`);
  let valid = true;
  step.querySelectorAll(".error").forEach(el => el.textContent = "");
  step.querySelectorAll(".invalid").forEach(el => el.classList.remove("invalid"));

  step.querySelectorAll("input[required], select[required], textarea[required]").forEach(field => {
    if (field.type === "radio" || field.type === "checkbox") return;
    if (!field.value.trim()) {
      setError(field, "This field is required.");
      valid = false;
    } else if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim())) {
      setError(field, "Enter a valid email address.");
      valid = false;
    }
  });

  if (stepNumber === 1) {
    const phone = form.elements.phone;
    const digits = phone.value.replace(/\D/g, "").replace(/^0/, "");
    if (digits.length < 9 || digits.length > 12) {
      setError(phone, "Enter a valid phone number.");
      valid = false;
    }
  }
  if (stepNumber === 2) {
    ["hasOtherJob", "schoolRelated", "schoolExperience", "schoolContacts"].forEach(name => {
      const group = step.querySelectorAll(`input[name="${name}"]`);
      if (![...group].some(input => input.checked)) {
        const field = group[0];
        setError(field, "Please select an option.");
        valid = false;
      }
    });
  }
  if (stepNumber === 3) {
    const institutions = selectedValues("institutions");
    const counties = selectedValues("coverageCounties");
    const preferences = selectedValues("workPreferences");
    if (!institutions.length) {
      step.querySelector("#institutionOptions").parentElement.querySelector(".error").textContent = "Select at least one institution type.";
      valid = false;
    }
    if (!counties.length) {
      document.getElementById("coverageCounties").parentElement.querySelector(".error").textContent = "Select at least one county.";
      valid = false;
    }
    if (!preferences.length) {
      const group = [...step.querySelectorAll('input[name="workPreferences"]')][0].closest("fieldset");
      group.querySelector(".error").textContent = "Select at least one preference.";
      valid = false;
    }
    if (!form.elements.privacyConsent.checked) {
      document.querySelector(".consent-error").textContent = "Please agree to the privacy notice to continue.";
      valid = false;
    }
  }
  if (!valid) {
    showMessage("Please check the highlighted fields and complete the required information.");
    const firstInvalid = step.querySelector(".invalid");
    if (firstInvalid) firstInvalid.focus({preventScroll:true});
  }
  return valid;
}
function updateProgress() {
  document.getElementById("stepLabel").textContent = `STEP ${currentStep} OF 3`;
  document.getElementById("progressPercent").textContent = `${Math.round(currentStep / 3 * 100)}%`;
  document.getElementById("progressBar").style.width = `${currentStep / 3 * 100}%`;
  document.querySelectorAll(".aside-step").forEach((item, index) => {
    const number = item.querySelector(".step-number");
    number.style.background = index + 1 <= currentStep ? "var(--navy)" : "#fff";
    number.style.color = index + 1 <= currentStep ? "var(--yellow)" : "#8795a9";
    number.style.borderColor = index + 1 <= currentStep ? "var(--navy)" : "#dce4ef";
  });
}
function goToStep(next) {
  currentStep = next;
  document.querySelectorAll(".form-step").forEach(step => step.classList.toggle("active", Number(step.dataset.step) === next));
  updateProgress();
  clearMessage();
  document.querySelector(".registration-form").scrollIntoView({behavior:"smooth", block:"start"});
}
document.querySelectorAll(".next-step").forEach(button => button.addEventListener("click", () => {
  if (validateStep(currentStep)) goToStep(Math.min(3, currentStep + 1));
}));
document.querySelectorAll(".prev-step").forEach(button => button.addEventListener("click", () => goToStep(Math.max(1, currentStep - 1))));

form.elements.hasOtherJob.forEach(input => input.addEventListener("change", () => {
  document.getElementById("otherJobWrap").classList.toggle("hidden", input.value !== "Yes" || !input.checked);
}));
form.elements.schoolExperience.forEach(input => input.addEventListener("change", () => {
  document.getElementById("experienceWrap").classList.toggle("hidden", input.value !== "Yes" || !input.checked);
}));
document.getElementById("selectMyCounty").addEventListener("click", () => {
  const county = form.elements.county.value;
  if (!county) { showMessage("Choose your main county on the first step first."); return; }
  form.querySelectorAll('input[name="coverageCounties"]').forEach(input => input.checked = input.value === county);
  const error = document.getElementById("coverageCounties").parentElement.querySelector(".error");
  if (error) error.textContent = "";
});
form.addEventListener("input", event => {
  if (event.target.matches("input,select,textarea")) event.target.classList.remove("invalid");
});

function normalizeKenyanPhone(raw) {
  let digits = String(raw || "").replace(/\D/g, "");
  if (digits.startsWith("254")) digits = digits.slice(3);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return "+254" + digits;
}
function buildPayload() {
  const data = new FormData(form);
  return {
    fullName: data.get("fullName")?.trim() || "",
    phone: normalizeKenyanPhone(data.get("phone")),
    email: data.get("email")?.trim() || "",
    county: data.get("county") || "",
    town: data.get("town")?.trim() || "",
    profession: data.get("profession")?.trim() || "",
    employmentStatus: data.get("employmentStatus") || "",
    hasOtherJob: data.get("hasOtherJob") || "",
    otherJobDetails: data.get("otherJobDetails")?.trim() || "",
    schoolRelated: data.get("schoolRelated") || "",
    schoolExperience: data.get("schoolExperience") || "",
    schoolExperienceDetails: data.get("schoolExperienceDetails")?.trim() || "",
    schoolContacts: data.get("schoolContacts") || "",
    institutions: selectedValues("institutions"),
    coverageCounties: selectedValues("coverageCounties"),
    workPreferences: selectedValues("workPreferences"),
    heardAbout: data.get("heardAbout") || "",
    additionalInfo: data.get("additionalInfo")?.trim() || "",
    privacyConsent: form.elements.privacyConsent.checked,
    marketingConsent: form.elements.marketingConsent.checked,
    website: data.get("website") || ""
  };
}
form.addEventListener("submit", async event => {
  event.preventDefault();
  if (!validateStep(3)) return;
  const button = document.getElementById("submitButton");
  const payload = buildPayload();
  button.disabled = true;
  button.textContent = "Submitting…";
  clearMessage();
  try {
    if (!CONFIG.appsScriptUrl) {
      // Demo mode keeps the front end testable but does not store data.
      showMessage("The form is in preview mode and has not saved your information. The administrator must configure the Google Apps Script Web App URL before publishing.", "error-message");
      button.disabled = false;
      button.innerHTML = 'Submit registration <span>→</span>';
      return;
    }
    const response = await fetch(CONFIG.appsScriptUrl, {
      method: "POST",
      headers: {"Content-Type":"text/plain;charset=utf-8"},
      body: JSON.stringify(payload),
      redirect: "follow"
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || "We could not save your registration. Please try again.");
    document.getElementById("registrationReference").textContent = result.registrationId || "Received";
    const wa = CONFIG.companyWhatsApp.replace(/\D/g, "");
    const whatsappLink = document.getElementById("whatsappLink");
    if (wa) whatsappLink.href = `https://wa.me/${wa}`;
    else whatsappLink.style.display = "none";
    form.reset();
    document.getElementById("otherJobWrap").classList.add("hidden");
    document.getElementById("experienceWrap").classList.add("hidden");
    goToStep(1);
    showPage("success");
  } catch (error) {
    showMessage(error.message || "Submission failed. Please check your connection and try again.");
  } finally {
    button.disabled = false;
    button.innerHTML = 'Submit registration <span>→</span>';
  }
});
updateProgress();
