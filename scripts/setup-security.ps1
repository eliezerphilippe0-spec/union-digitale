# Firebase Security Configuration Helper for Windows
# Usage: .\scripts\setup-security.ps1

Write-Host "`n[SECURITY] Firebase Security Setup Helper" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan

# Define paths
$rootPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootPath = Split-Path -Parent $rootPath
$rootEnvLocal = Join-Path $rootPath ".env.local"
$functionsEnvLocal = Join-Path $rootPath "functions\.env.local"
$gitignorePath = Join-Path $rootPath ".gitignore"
$functionsGitignore = Join-Path $rootPath "functions\.gitignore"

# Check files exist
Write-Host "`n[CHECK] Checking security files..." -ForegroundColor Yellow

if (Test-Path $rootEnvLocal) {
    Write-Host "[OK] Found .env.local in root" -ForegroundColor Green
} else {
    Write-Host "[WARN] Missing .env.local in root" -ForegroundColor Yellow
}

if (Test-Path $functionsEnvLocal) {
    Write-Host "[OK] Found .env.local in functions/" -ForegroundColor Green
} else {
    Write-Host "[WARN] Missing .env.local in functions/" -ForegroundColor Yellow
}

if (Test-Path $gitignorePath) {
    Write-Host "[OK] Found .gitignore in root" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Missing .gitignore in root" -ForegroundColor Red
}

if (Test-Path $functionsGitignore) {
    Write-Host "[OK] Found .gitignore in functions/" -ForegroundColor Green
} else {
    Write-Host "[WARN] Missing .gitignore in functions/" -ForegroundColor Yellow
}

# Check .gitignore content
Write-Host "`n[LOCK] Security checks:" -ForegroundColor Yellow

$gitignoreContent = Get-Content $gitignorePath -Raw
$checks = @{
    ".env pattern" = $gitignoreContent -match '\.env'
    "firebase-adminsdk pattern" = $gitignoreContent -match 'firebase-adminsdk'
    ".env.local pattern" = $gitignoreContent -match '\.env\.local'
}

$checks.GetEnumerator() | ForEach-Object {
    $status = if ($_.Value) { "[OK]" } else { "[ERROR]" }
    $color = if ($_.Value) { "Green" } else { "Red" }
    Write-Host "  $status $($_.Key) ignored" -ForegroundColor $color
}

# Check for exposed credentials
Write-Host "`n[ALERT] Checking for exposed credentials..." -ForegroundColor Yellow

$exposedFiles = @()
if (Test-Path $rootPath) {
    Get-ChildItem -Path $rootPath -Filter "*firebase-adminsdk*.json" -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
        $exposedFiles += $_.FullName
    }
}

if ($exposedFiles.Count -gt 0) {
    Write-Host "  [ERROR] Found exposed Firebase credentials:" -ForegroundColor Red
    $exposedFiles | ForEach-Object {
        Write-Host "     - $_" -ForegroundColor Red
    }
    Write-Host "`n  [ALERT] IMMEDIATE ACTION REQUIRED:" -ForegroundColor Red
    Write-Host "     1. Regenerate keys in Firebase Console" -ForegroundColor Red
    Write-Host "     2. Delete these files" -ForegroundColor Red
    Write-Host "     3. Remove from git history if committed" -ForegroundColor Red
} else {
    Write-Host "  [OK] No exposed Firebase credentials found" -ForegroundColor Green
}

# Summary
Write-Host "`n" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host "[OK] Setup Summary" -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Cyan

Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "  1. [KEY] Regenerate Firebase service account keys in Console" -ForegroundColor Cyan
Write-Host "  2. [EDIT] Update .env.local with your credentials" -ForegroundColor Cyan
Write-Host "  3. [FOLDER] Store firebase-adminsdk.json in functions/ directory" -ForegroundColor Cyan
Write-Host "  4. [ROCKET] Run: npm install && npm run build" -ForegroundColor Cyan
Write-Host "  5. [OK] Verify with: npm run lint" -ForegroundColor Cyan

Write-Host "`nProtected files (in .gitignore):" -ForegroundColor Cyan
Write-Host "  - .env" -ForegroundColor Cyan
Write-Host "  - .env.local" -ForegroundColor Cyan
Write-Host "  - *-firebase-adminsdk-*.json" -ForegroundColor Cyan
Write-Host "  - firebase-adminsdk.json" -ForegroundColor Cyan

Write-Host "`nDocumentation:" -ForegroundColor Cyan
Write-Host "  --> Read FIREBASE_SECURITY_SETUP.md for detailed instructions" -ForegroundColor Cyan

Write-Host ("`n" + ("=" * 50)) -ForegroundColor Cyan
