import io
import json
import os
from typing import Any, Dict

import pdfplumber
import google.generativeai as genai
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from jsonschema import validate, ValidationError


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SCHEMA_PATH = os.path.join(BASE_DIR, "resume_schema.json")
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

load_dotenv(os.path.join(BASE_DIR, ".env"))

app = FastAPI(title="AI Resume Parser", version="0.1.0")


def _load_schema() -> Dict[str, Any]:
    with open(SCHEMA_PATH, "r", encoding="utf-8") as handle:
        return json.load(handle)


def _extract_pdf_text(file_bytes: bytes) -> str:
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        pages = [page.extract_text() or "" for page in pdf.pages]
    return "\n".join(pages).strip()


def _get_gemini_model() -> genai.GenerativeModel:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured.")
    model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash").strip()
    genai.configure(api_key=api_key)
    return genai.GenerativeModel(model_name)


def _prompt_resume_json(text: str) -> Dict[str, Any]:
    schema = _load_schema()
    model = _get_gemini_model()
    prompt = (
        "You are an expert resume parser. Convert the resume text into JSON Resume format.\n"
        "Rules:\n"
        "1) Output ONLY valid JSON, no markdown, no extra text.\n"
        "2) Follow this JSON Schema strictly (minimal version):\n"
        f"{json.dumps(schema)}\n"
        "Resume text:\n"
        f"{text}"
    )
    response = model.generate_content(prompt)
    try:
        parsed = json.loads(response.text)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=502, detail=f"Gemini returned invalid JSON: {exc}") from exc
    return parsed


def _flat_fields(resume: Dict[str, Any]) -> Dict[str, Any]:
    basics = resume.get("basics", {}) or {}
    profiles = basics.get("profiles", []) or []

    def _find_profile(network_name: str) -> str:
        for profile in profiles:
            if str(profile.get("network", "")).lower() == network_name:
                return profile.get("url") or profile.get("username") or ""
        return ""

    flat = {
        "full_name": basics.get("name", ""),
        "title": basics.get("label", ""),
        "email": basics.get("email", ""),
        "phone": basics.get("phone", ""),
        "website": basics.get("url", ""),
        "summary": basics.get("summary", ""),
        "location_address": (basics.get("location") or {}).get("address", ""),
        "location_city": (basics.get("location") or {}).get("city", ""),
        "location_region": (basics.get("location") or {}).get("region", ""),
        "location_postal": (basics.get("location") or {}).get("postalCode", ""),
        "location_country": (basics.get("location") or {}).get("countryCode", ""),
        "linkedin": _find_profile("linkedin"),
        "github": _find_profile("github"),
    }

    for idx, edu in enumerate(resume.get("education", []) or [], start=1):
        flat[f"education_school_{idx}"] = edu.get("institution", "")
        flat[f"education_area_{idx}"] = edu.get("area", "")
        flat[f"education_degree_{idx}"] = edu.get("studyType", "")
        flat[f"education_start_{idx}"] = edu.get("startDate", "")
        flat[f"education_end_{idx}"] = edu.get("endDate", "")
        flat[f"education_gpa_{idx}"] = edu.get("gpa", "")

    for idx, work in enumerate(resume.get("work", []) or [], start=1):
        flat[f"work_company_{idx}"] = work.get("name", "")
        flat[f"work_position_{idx}"] = work.get("position", "")
        flat[f"work_start_{idx}"] = work.get("startDate", "")
        flat[f"work_end_{idx}"] = work.get("endDate", "")
        flat[f"work_summary_{idx}"] = work.get("summary", "")

    skills = []
    for skill in resume.get("skills", []) or []:
        if isinstance(skill, dict):
            if skill.get("name"):
                skills.append(skill["name"])
            skills.extend(skill.get("keywords", []) or [])
        elif isinstance(skill, str):
            skills.append(skill)
    if skills:
        flat["skills"] = ", ".join(dict.fromkeys([s for s in skills if s]))

    return flat


def _validate_resume(resume: Dict[str, Any]) -> None:
    schema = _load_schema()
    try:
        validate(instance=resume, schema=schema)
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=f"JSON Resume validation failed: {exc.message}") from exc


def _get_allowed_origins() -> list:
    raw = os.getenv("ALLOWED_ORIGINS", "").strip()
    if not raw:
        return ["*"]
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


app.add_middleware(
    CORSMiddleware,
    allow_origins=_get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.post("/parse-resume")
async def parse_resume(file: UploadFile = File(...)) -> Dict[str, Any]:
    if file.content_type != "application/pdf" and not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF resumes are supported.")
    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="File too large.")

    text = _extract_pdf_text(file_bytes)
    if not text:
        raise HTTPException(status_code=400, detail="No text extracted from PDF.")

    resume_json = _prompt_resume_json(text)
    _validate_resume(resume_json)
    flat = _flat_fields(resume_json)
    return {"json_resume": resume_json, "flat_fields": flat}


@app.post("/normalize")
async def normalize_resume(resume: Dict[str, Any]) -> Dict[str, Any]:
    _validate_resume(resume)
    return {"flat_fields": _flat_fields(resume)}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
