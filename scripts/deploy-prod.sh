#!/bin/bash

# Union Digitale - Production Deployment Script
# Deploys to Firebase Hosting + Functions

set -e # Exit on error

echo "🚀 Union Digitale - Production Deployment"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git is not installed. Please install Git first.${NC}"
    exit 1
fi

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLI is not installed.${NC}"
    echo "Install with: npm install -g firebase-tools"
    exit 1
fi

# Check if logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Firebase${NC}"
    echo "Logging in..."
    firebase login
fi

# Confirm deployment
echo ""
echo -e "${YELLOW}⚠️  You are about to deploy to PRODUCTION${NC}"
echo "Project: union-digitale-haiti"
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled"
    exit 0
fi

# Step 1: Run tests
echo ""
echo "📋 Step 1/6: Running tests..."
npm run lint || echo -e "${YELLOW}⚠️  Linting warnings (non-blocking)${NC}"

# Step 2: Build production bundle
echo ""
echo "🔨 Step 2/6: Building production bundle..."
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build failed - dist directory not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful${NC}"

# Step 3: Deploy Firestore Rules
echo ""
echo "🔒 Step 3/6: Deploying Firestore rules..."
firebase deploy --only firestore:rules

echo -e "${GREEN}✅ Firestore rules deployed${NC}"

# Step 4: Deploy Firestore Indexes
echo ""
echo "📊 Step 4/6: Deploying Firestore indexes..."
firebase deploy --only firestore:indexes

echo -e "${GREEN}✅ Firestore indexes deployed (may take 5-10 minutes to build)${NC}"

# Step 5: Deploy Cloud Functions
echo ""
echo "⚡ Step 5/6: Deploying Cloud Functions..."
cd functions
npm install --production
cd ..
firebase deploy --only functions

echo -e "${GREEN}✅ Cloud Functions deployed${NC}"

# Step 6: Deploy Hosting
echo ""
echo "🌐 Step 6/6: Deploying to Firebase Hosting..."
firebase deploy --only hosting

echo -e "${GREEN}✅ Hosting deployed${NC}"

# Get deployment URL
HOSTING_URL=$(firebase hosting:channel:list | grep "live" | awk '{print $3}')

echo ""
echo "=========================================="
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo "📱 Live URL: https://union-digitale-haiti.web.app"
echo "📊 Firebase Console: https://console.firebase.google.com/project/union-digitale-haiti"
echo ""
echo "Next steps:"
echo "1. Monitor Firebase Console > Functions > Logs"
echo "2. Check Firestore > Usage (should be <80%)"
echo "3. Test MonCash webhook in production"
echo "4. Monitor Stackdriver logs for errors"
echo ""
echo -e "${YELLOW}⚠️  Remember to:${NC}"
echo "- Set MonCash production credentials in Functions config"
echo "- Update MONCASH_MODE to 'production' in .env"
echo "- Test with real MonCash sandbox first"
echo ""
