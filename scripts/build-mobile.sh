#!/bin/bash

# Union Digitale Mobile Build Script
# Usage: ./scripts/build-mobile.sh [android|ios|all]

set -e

PLATFORM=${1:-all}
BUILD_TYPE=${2:-release}

echo "🔗 Union Digitale - Mobile Build"
echo "================================"
echo "Platform: $PLATFORM"
echo "Build Type: $BUILD_TYPE"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
check_prerequisites() {
    echo "📋 Checking prerequisites..."
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js not found${NC}"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm not found${NC}"
        exit 1
    fi
    
    if [[ "$PLATFORM" == "android" || "$PLATFORM" == "all" ]]; then
        if [ -z "$ANDROID_HOME" ]; then
            echo -e "${YELLOW}⚠️  ANDROID_HOME not set. Android build may fail.${NC}"
        fi
    fi
    
    if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "all" ]]; then
        if [[ "$OSTYPE" != "darwin"* ]]; then
            echo -e "${YELLOW}⚠️  iOS build requires macOS${NC}"
            if [[ "$PLATFORM" == "ios" ]]; then
                exit 1
            fi
        fi
    fi
    
    echo -e "${GREEN}✅ Prerequisites OK${NC}"
}

# Install dependencies
install_deps() {
    echo ""
    echo "📦 Installing dependencies..."
    npm ci
    
    # Install Capacitor plugins if not present
    npm install @capacitor/push-notifications @capacitor/local-notifications \
        @capacitor/splash-screen @capacitor/status-bar @capacitor/keyboard \
        @capacitor/share @capacitor/camera @capacitor/geolocation \
        @capacitor/browser @capacitor/storage @capacitor/network \
        @capacitor/device @capacitor/app --save 2>/dev/null || true
    
    echo -e "${GREEN}✅ Dependencies installed${NC}"
}

# Build web assets
build_web() {
    echo ""
    echo "🌐 Building web assets..."
    npm run build
    echo -e "${GREEN}✅ Web build complete${NC}"
}

# Sync Capacitor
sync_capacitor() {
    echo ""
    echo "🔄 Syncing Capacitor..."
    npx cap sync
    echo -e "${GREEN}✅ Capacitor synced${NC}"
}

# Build Android
build_android() {
    if [[ "$PLATFORM" != "android" && "$PLATFORM" != "all" ]]; then
        return
    fi
    
    echo ""
    echo "🤖 Building Android..."
    
    # Check if android folder exists
    if [ ! -d "android" ]; then
        echo "Adding Android platform..."
        npx cap add android
    fi
    
    cd android
    
    if [[ "$BUILD_TYPE" == "release" ]]; then
        echo "Building release APK..."
        ./gradlew assembleRelease
        
        APK_PATH="app/build/outputs/apk/release/app-release.apk"
        if [ -f "$APK_PATH" ]; then
            cp "$APK_PATH" "../dist/union-digitale-release.apk"
            echo -e "${GREEN}✅ APK: dist/union-digitale-release.apk${NC}"
        fi
        
        # Also build AAB for Play Store
        echo "Building release AAB..."
        ./gradlew bundleRelease
        
        AAB_PATH="app/build/outputs/bundle/release/app-release.aab"
        if [ -f "$AAB_PATH" ]; then
            cp "$AAB_PATH" "../dist/union-digitale-release.aab"
            echo -e "${GREEN}✅ AAB: dist/union-digitale-release.aab${NC}"
        fi
    else
        echo "Building debug APK..."
        ./gradlew assembleDebug
        
        APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
        if [ -f "$APK_PATH" ]; then
            cp "$APK_PATH" "../dist/union-digitale-debug.apk"
            echo -e "${GREEN}✅ APK: dist/union-digitale-debug.apk${NC}"
        fi
    fi
    
    cd ..
}

# Build iOS
build_ios() {
    if [[ "$PLATFORM" != "ios" && "$PLATFORM" != "all" ]]; then
        return
    fi
    
    if [[ "$OSTYPE" != "darwin"* ]]; then
        echo -e "${YELLOW}⚠️  Skipping iOS (requires macOS)${NC}"
        return
    fi
    
    echo ""
    echo "🍎 Building iOS..."
    
    # Check if ios folder exists
    if [ ! -d "ios" ]; then
        echo "Adding iOS platform..."
        npx cap add ios
    fi
    
    cd ios/App
    
    if [[ "$BUILD_TYPE" == "release" ]]; then
        echo "Building release archive..."
        xcodebuild -workspace App.xcworkspace \
            -scheme App \
            -configuration Release \
            -archivePath ../build/UnionDigitale.xcarchive \
            archive
        
        echo -e "${GREEN}✅ Archive: ios/build/UnionDigitale.xcarchive${NC}"
        echo "Use Xcode to export IPA for App Store"
    else
        echo "Building debug..."
        xcodebuild -workspace App.xcworkspace \
            -scheme App \
            -configuration Debug \
            -sdk iphonesimulator \
            build
        
        echo -e "${GREEN}✅ Debug build complete${NC}"
    fi
    
    cd ../..
}

# Open in IDE
open_ide() {
    if [[ "$PLATFORM" == "android" ]]; then
        npx cap open android
    elif [[ "$PLATFORM" == "ios" ]]; then
        npx cap open ios
    fi
}

# Main
main() {
    check_prerequisites
    install_deps
    build_web
    sync_capacitor
    build_android
    build_ios
    
    echo ""
    echo "================================"
    echo -e "${GREEN}🎉 Build complete!${NC}"
    echo ""
    echo "Next steps:"
    
    if [[ "$PLATFORM" == "android" || "$PLATFORM" == "all" ]]; then
        echo "  Android: Check dist/union-digitale-*.apk"
        echo "           Upload .aab to Play Console"
    fi
    
    if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "all" ]] && [[ "$OSTYPE" == "darwin"* ]]; then
        echo "  iOS: Open ios/build/UnionDigitale.xcarchive in Xcode"
        echo "       Export and upload to App Store Connect"
    fi
    
    echo ""
    echo "To open in IDE: npx cap open [android|ios]"
}

main
