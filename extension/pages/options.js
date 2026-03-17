const rulesText = document.getElementById("rules-text");
const statusEl = document.getElementById("status");

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? "#b91c1c" : "#475569";
}

async function loadRules() {
  const { mappingRules } = await chrome.storage.local.get("mappingRules");
  if (mappingRules) {
    rulesText.value = JSON.stringify(mappingRules, null, 2);
  } else {
    rulesText.value = "{}";
  }
}

document.getElementById("save-btn").addEventListener("click", async () => {
  try {
    const parsed = JSON.parse(rulesText.value);
    await chrome.storage.local.set({ mappingRules: parsed });
    setStatus("Rules saved.");
  } catch (err) {
    setStatus("Invalid JSON.", true);
  }
});

document.getElementById("reset-btn").addEventListener("click", async () => {
  await chrome.storage.local.remove("mappingRules");
  rulesText.value = "{}";
  setStatus("Rules cleared.");
});

loadRules();
