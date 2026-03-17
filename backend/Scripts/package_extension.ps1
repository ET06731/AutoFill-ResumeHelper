# package_extension.ps1
# Packages the extension directory into a zip file

$ErrorActionPreference = "Stop"

# Calculate paths relative to script location
$BackendScriptsDir = $PSScriptRoot
$BackendDir = Split-Path -Parent $BackendScriptsDir
$ProjectRoot = Split-Path -Parent $BackendDir

$ExtensionDir = Join-Path $ProjectRoot "extension"
$DistDir = Join-Path $ProjectRoot "dist"

# Get version from manifest
$ManifestPath = Join-Path $ExtensionDir "manifest.json"
if (-not (Test-Path $ManifestPath)) {
    Write-Error "Could not find manifest.json at $ManifestPath"
}

$Manifest = Get-Content $ManifestPath | ConvertFrom-Json
$Version = $Manifest.version

# Create dist directory
if (-not (Test-Path $DistDir)) {
    New-Item -ItemType Directory -Path $DistDir | Out-Null
}

$ZipFile = Join-Path $DistDir "extension_v$Version.zip"

# Remove if exists
if (Test-Path $ZipFile) {
    Remove-Item $ZipFile
}

Write-Host ">>> Packaging extension v$Version to $ZipFile ..." -ForegroundColor Cyan

# Zip extension contents
Compress-Archive -Path "$ExtensionDir\*" -DestinationPath $ZipFile

Write-Host "`n>>> Packaging complete!" -ForegroundColor Green
Write-Host "File location: $ZipFile" -ForegroundColor Yellow
