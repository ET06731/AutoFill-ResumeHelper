const statusEl = document.getElementById("status");
const parseBtn = document.getElementById("parse-btn");
const openReviewBtn = document.getElementById("open-review");
const openManualBtn = document.getElementById("open-manual");
const clearDataBtn = document.getElementById("clear-data");
const consentCard = document.getElementById("consent");
const mainCard = document.getElementById("main");

const BACKEND_URL = "http://127.0.0.1:8000";

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? "#b91c1c" : "#475569";
}

async function init() {
  const { consentAccepted } = await chrome.storage.local.get("consentAccepted");
  if (consentAccepted) {
    mainCard.classList.remove("hidden");
  } else {
    consentCard.classList.remove("hidden");
  }
}

document.getElementById("accept-consent").addEventListener("click", async () => {
  await chrome.storage.local.set({ consentAccepted: true });
  consentCard.classList.add("hidden");
  mainCard.classList.remove("hidden");
});

parseBtn.addEventListener("click", async () => {
  const fileInput = document.getElementById("resume-file");
  const file = fileInput.files[0];
  if (!file) {
    setStatus("Please choose a PDF file.", true);
    return;
  }

  setStatus("Parsing resume...");
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${BACKEND_URL}/parse-resume`, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "Parse failed.");
    }

    const data = await response.json();
    await chrome.storage.local.set({
      jsonResume: data.json_resume,
      flatFields: data.flat_fields
    });
    setStatus("Parsed successfully.");
  } catch (err) {
    setStatus(err.message, true);
  }
});

openReviewBtn.addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("pages/review.html") });
});

openManualBtn.addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("pages/manual.html") });
});

clearDataBtn.addEventListener("click", async () => {
  await chrome.storage.local.remove(["jsonResume", "flatFields"]);
  setStatus("Local data cleared.");
});

init();
