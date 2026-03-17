# AI Resume Parser + Automated Form Filling (Gemini) — MVP

This project provides a **privacy-first** workflow to parse a PDF resume locally, convert it to JSON Resume, and fill web forms with a Chrome/Edge extension.

## Overview
- **Extension**: `D:\Project\PRwithAI\AutoFiller\extension\`
  - Upload resume, review/edit parsed data, and fill the current page.
  - Manual entry page for users who prefer not to upload PDFs.
- **Backend**: `D:\Project\PRwithAI\AutoFiller\backend\`
  - FastAPI service that extracts PDF text locally and calls Gemini to generate JSON Resume.

## Local-First Privacy
- No request/response logging.
- No storage by default (in-memory only) unless user explicitly saves in the extension.
- Gemini API key read from local `.env` file.

## Quick Start
1. Backend
   - Copy `backend\.env.example` to `backend\.env` and add your `GEMINI_API_KEY`.
   - Create a virtual environment and install dependencies:
     ```bash
     pip install -r backend/requirements.txt
     ```
   - Run the API:
     ```bash
     uvicorn backend.app:app --reload --host 127.0.0.1 --port 8000
     ```
2. Extension
   - Open Chrome/Edge → `chrome://extensions`
   - Enable **Developer mode**
   - **Load unpacked** → select `D:\Project\PRwithAI\AutoFiller\extension`

## Backend Endpoints
- `GET /health`
- `POST /parse-resume` (multipart PDF) → `{ json_resume, flat_fields }`
- `POST /normalize` (JSON Resume) → `{ flat_fields }`

## CORS Configuration
- Set `ALLOWED_ORIGINS` in `backend/.env` to your extension origin.
- Example: `ALLOWED_ORIGINS=chrome-extension://<extension-id>`
