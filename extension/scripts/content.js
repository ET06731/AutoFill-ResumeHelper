function getLabelText(el) {
  const id = el.getAttribute("id");
  if (id) {
    const label = document.querySelector(`label[for='${id}']`);
    if (label) return label.textContent.trim();
  }
  if (el.closest("label")) {
    return el.closest("label").textContent.trim();
  }
  return "";
}

function normalizeText(text) {
  return (text || "").toLowerCase();
}

const FIELD_KEYWORDS = {
  full_name: ["full name", "name"],
  email: ["email"],
  phone: ["phone", "mobile", "tel"],
  linkedin: ["linkedin"],
  github: ["github"],
  website: ["website", "portfolio"],
  summary: ["summary", "about", "bio"],
  location_city: ["city"],
  location_region: ["state", "region", "province"],
  location_country: ["country"],
  education_school_1: ["school", "university", "college", "institution"],
  education_degree_1: ["degree", "major", "qualification"],
  work_company_1: ["company", "employer", "organization"],
  work_position_1: ["position", "title", "role"]
};

function findBestKey(el, flatFields) {
  const text = normalizeText(
    [
      el.getAttribute("name"),
      el.getAttribute("id"),
      el.getAttribute("placeholder"),
      el.getAttribute("aria-label"),
      getLabelText(el)
    ].join(" ")
  );

  let bestKey = null;
  let bestScore = 0;
  Object.entries(FIELD_KEYWORDS).forEach(([key, keywords]) => {
    let score = 0;
    keywords.forEach((keyword) => {
      if (text.includes(keyword)) score += 1;
    });
    if (score > bestScore && flatFields[key]) {
      bestScore = score;
      bestKey = key;
    }
  });
  return bestKey;
}

function setValue(el, value) {
  const tag = el.tagName.toLowerCase();
  if (tag === "select") {
    const option = Array.from(el.options).find(
      (opt) => normalizeText(opt.text).includes(normalizeText(value))
    );
    if (option) {
      el.value = option.value;
    }
  } else if (el.type === "checkbox" || el.type === "radio") {
    el.checked = Boolean(value);
  } else {
    el.value = value;
  }
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

async function applyMapping(flatFields, action) {
  const { mappingRules } = await chrome.storage.local.get("mappingRules");
  const elements = Array.from(
    document.querySelectorAll("input, textarea, select")
  ).filter((el) => !el.disabled && el.type !== "hidden");

  let filledCount = 0;

  if (mappingRules && typeof mappingRules === "object") {
    Object.entries(mappingRules).forEach(([key, selector]) => {
      if (!flatFields[key]) return;
      const el = document.querySelector(selector);
      if (el) {
        if (action === "fill") setValue(el, flatFields[key]);
        el.style.outline = "2px solid #22c55e";
        filledCount += 1;
      }
    });
  }

  elements.forEach((el) => {
    const bestKey = findBestKey(el, flatFields);
    if (bestKey) {
      if (action === "fill") setValue(el, flatFields[bestKey]);
      el.style.outline = "2px solid #f59e0b";
      filledCount += 1;
    }
  });

  return filledCount;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message?.flatFields) {
    sendResponse({ message: "No data available." });
    return;
  }
  const action = message.action || "fill";
  applyMapping(message.flatFields, action).then((count) => {
    sendResponse({ message: `Updated ${count} fields.` });
  });
  return true;
});
