# Union Digitale - Production Deployment Script (PowerShell)
# Deploys to Firebase Hosting + Functions

$ErrorActionPreference = "Stop"

Write-Host "🚀 Union Digitale - Production Deployment" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Check if Git is installed
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Git is not installed. Please install Git first." -ForegroundColor Red
    exit 1
}

# Check if Firebase CLI is installed
if (-not (Get-Command firebase -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Firebase CLI is not installed." -ForegroundColor Red
    Write-Host "Install with: npm install -g firebase-tools" -ForegroundColor Yellow
    exit 1
}

# Check if logged in to Firebase
try {
    firebase projects:list | Out-Null
} catch {
    Write-Host "⚠️  Not logged in to Firebase" -ForegroundColor Yellow
    Write-Host "Logging in..."
    firebase login
}

# Confirm deployment
Write-Host ""
Write-Host "⚠️  You are about to deploy to PRODUCTION" -ForegroundColor Yellow
Write-Host "Project: union-digitale-haiti"
$confirmation = Read-Host "Continue? (y/N)"
if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-Host "Deployment cancelled"
    exit 0
}

# Step 1: Run tests
Write-Host ""
Write-Host "📋 Step 1/6: Running tests..." -ForegroundColor Cyan
try {
    npm run lint
} catch {
    Write-Host "⚠️  Linting warnings (non-blocking)" -ForegroundColor Yellow
}

# Step 2: Build production bundle
Write-Host ""
Write-Host "🔨 Step 2/6: Building production bundle..." -ForegroundColor Cyan
npm run build

if (-not (Test-Path "dist")) {
    Write-Host "❌ Build failed - dist directory not found" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful" -ForegroundColor Green

# Step 3: Deploy Firestore Rules
Write-Host ""
Write-Host "🔒 Step 3/6: Deploying Firestore rules..." -ForegroundColor Cyan
firebase deploy --only firestore:rules

Write-Host "✅ Firestore rules deployed" -ForegroundColor Green

# Step 4: Deploy Firestore Indexes
Write-Host ""
Write-Host "📊 Step 4/6: Deploying Firestore indexes..." -ForegroundColor Cyan
firebase deploy --only firestore:indexes

Write-Host "✅ Firestore indexes deployed (may take 5-10 minutes to build)" -ForegroundColor Green

# Step 5: Deploy Cloud Functions
Write-Host ""
Write-Host "⚡ Step 5/6: Deploying Cloud Functions..." -ForegroundColor Cyan
Push-Location functions
npm install --production
Pop-Location
firebase deploy --only functions

Write-Host "✅ Cloud Functions deployed" -ForegroundColor Green

# Step 6: Deploy Hosting
Write-Host ""
Write-Host "🌐 Step 6/6: Deploying to Firebase Hosting..." -ForegroundColor Cyan
firebase deploy --only hosting

Write-Host "✅ Hosting deployed" -ForegroundColor Green

# Completion message
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 Live URL: https://union-digitale-haiti.web.app"
Write-Host "📊 Firebase Console: https://console.firebase.google.com/project/union-digitale-haiti"
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Monitor Firebase Console > Functions > Logs"
Write-Host "2. Check Firestore > Usage (should be <80%)"
Write-Host "3. Test MonCash webhook in production"
Write-Host "4. Monitor Stackdriver logs for errors"
Write-Host ""
Write-Host "⚠️  Remember to:" -ForegroundColor Yellow
Write-Host "- Set MonCash production credentials in Functions config"
Write-Host "- Update MONCASH_MODE to 'production' in .env"
Write-Host "- Test with real MonCash sandbox first"
Write-Host ""
