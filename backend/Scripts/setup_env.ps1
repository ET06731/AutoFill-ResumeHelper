$ErrorActionPreference = "Stop"

Write-Host ">>> Checking uv installation..." -ForegroundColor Cyan
if (-not (Get-Command uv -ErrorAction SilentlyContinue)) {
    Write-Error "uv not found. Please install uv: https://docs.astral.sh/uv/getting-started/installation/"
}

$BackendDir = Resolve-Path ".."
Set-Location $BackendDir

Write-Host ">>> Creating virtual environment (.venv)..." -ForegroundColor Cyan
uv venv

Write-Host ">>> Installing dependencies (requirements.txt)..." -ForegroundColor Cyan
uv pip install -r requirements.txt

Write-Host "`n>>> Environment setup complete!" -ForegroundColor Green
Write-Host "You can activate the environment using:" -ForegroundColor Yellow
Write-Host ".\.venv\Scripts\Activate.ps1" -ForegroundColor Yellow
