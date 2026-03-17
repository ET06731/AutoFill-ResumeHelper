const statusEl = document.getElementById("status");

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? "#fecaca" : "#e2e8f0";
}

function valueOf(id) {
  return document.getElementById(id)?.value?.trim() || "";
}

function buildJsonResume(flat) {
  const profiles = [];
  if (flat.linkedin) profiles.push({ network: "LinkedIn", url: flat.linkedin });
  if (flat.github) profiles.push({ network: "GitHub", url: flat.github });

  const resume = {
    basics: {
      name: flat.full_name,
      label: flat.title,
      email: flat.email,
      phone: flat.phone,
      url: flat.website,
      summary: flat.summary,
      location: {
        address: flat.location_address,
        city: flat.location_city,
        region: flat.location_region,
        postalCode: flat.location_postal,
        countryCode: flat.location_country
      },
      profiles
    },
    education: [
      {
        institution: flat.education_school_1,
        studyType: flat.education_degree_1,
        area: flat.education_area_1,
        startDate: flat.education_start_1,
        endDate: flat.education_end_1,
        gpa: flat.education_gpa_1
      }
    ],
    work: [
      {
        name: flat.work_company_1,
        position: flat.work_position_1,
        startDate: flat.work_start_1,
        endDate: flat.work_end_1,
        summary: flat.work_summary_1
      }
    ],
    skills: flat.skills
      ? flat.skills.split(",").map((s) => s.trim()).filter(Boolean).map((s) => ({ name: s }))
      : []
  };

  return resume;
}

function collectFlatFields() {
  return {
    full_name: valueOf("full_name"),
    title: valueOf("title"),
    email: valueOf("email"),
    phone: valueOf("phone"),
    website: valueOf("website"),
    linkedin: valueOf("linkedin"),
    github: valueOf("github"),
    summary: valueOf("summary"),
    location_address: valueOf("location_address"),
    location_city: valueOf("location_city"),
    location_region: valueOf("location_region"),
    location_postal: valueOf("location_postal"),
    location_country: valueOf("location_country"),
    education_school_1: valueOf("education_school_1"),
    education_degree_1: valueOf("education_degree_1"),
    education_area_1: valueOf("education_area_1"),
    education_start_1: valueOf("education_start_1"),
    education_end_1: valueOf("education_end_1"),
    education_gpa_1: valueOf("education_gpa_1"),
    work_company_1: valueOf("work_company_1"),
    work_position_1: valueOf("work_position_1"),
    work_start_1: valueOf("work_start_1"),
    work_end_1: valueOf("work_end_1"),
    work_summary_1: valueOf("work_summary_1"),
    skills: valueOf("skills")
  };
}

async function loadExisting() {
  const { flatFields } = await chrome.storage.local.get("flatFields");
  if (!flatFields) return;
  Object.keys(flatFields).forEach((key) => {
    const el = document.getElementById(key);
    if (el) el.value = flatFields[key];
  });
}

document.getElementById("save-btn").addEventListener("click", async () => {
  try {
    const flatFields = collectFlatFields();
    const jsonResume = buildJsonResume(flatFields);
    await chrome.storage.local.set({ flatFields, jsonResume });
    setStatus("Saved manual entry.");
  } catch (err) {
    setStatus("Failed to save.", true);
  }
});

document.getElementById("open-review").addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("pages/review.html") });
});

loadExisting();
