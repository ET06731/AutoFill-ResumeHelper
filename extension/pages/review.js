const jsonText = document.getElementById("json-text");
const flatFieldsEl = document.getElementById("flat-fields");
const statusEl = document.getElementById("status");

const BACKEND_URL = "http://127.0.0.1:8000";

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? "#fecaca" : "#e2e8f0";
}

function renderFlatFields(flatFields = {}) {
  flatFieldsEl.innerHTML = "";
  Object.entries(flatFields).forEach(([key, value]) => {
    const div = document.createElement("div");
    div.className = "flat-item";
    div.textContent = `${key}: ${value}`;
    flatFieldsEl.appendChild(div);
  });
}

async function loadData() {
  const { jsonResume, flatFields } = await chrome.storage.local.get([
    "jsonResume",
    "flatFields"
  ]);
  if (jsonResume) {
    jsonText.value = JSON.stringify(jsonResume, null, 2);
  }
  renderFlatFields(flatFields || {});
}

async function saveChanges() {
  try {
    const parsed = JSON.parse(jsonText.value);
    const response = await fetch(`${BACKEND_URL}/normalize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed)
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "Normalize failed.");
    }

    const data = await response.json();
    await chrome.storage.local.set({
      jsonResume: parsed,
      flatFields: data.flat_fields
    });
    renderFlatFields(data.flat_fields);
    setStatus("Saved and normalized.");
  } catch (err) {
    setStatus(err.message, true);
  }
}

async function sendToActiveTab(action) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    setStatus("No active tab detected.", true);
    return;
  }

  const { flatFields } = await chrome.storage.local.get("flatFields");
  chrome.tabs.sendMessage(tab.id, { action, flatFields }, (response) => {
    if (chrome.runtime.lastError) {
      setStatus("Unable to reach the page. Reload and try again.", true);
      return;
    }
    setStatus(response?.message || "Action completed.");
  });
}

document.getElementById("save-btn").addEventListener("click", saveChanges);
document.getElementById("preview-btn").addEventListener("click", () => sendToActiveTab("preview"));
document.getElementById("fill-btn").addEventListener("click", () => sendToActiveTab("fill"));

loadData();
