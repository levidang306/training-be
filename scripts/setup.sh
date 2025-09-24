#!/bin/bash

# Package Manager Check Script
# This script ensures the correct package manager is being used

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}❌ pnpm is not installed${NC}"
    echo -e "${YELLOW}📦 Installing pnpm...${NC}"
    npm install -g pnpm
fi

# Check pnpm version
PNPM_VERSION=$(pnpm --version)
echo -e "${GREEN}✅ pnpm version: $PNPM_VERSION${NC}"

# Remove conflicting lock files
if [ -f "yarn.lock" ]; then
    echo -e "${YELLOW}🧹 Removing yarn.lock...${NC}"
    rm -f yarn.lock
fi

if [ -f "package-lock.json" ]; then
    echo -e "${YELLOW}🧹 Removing package-lock.json...${NC}"
    rm -f package-lock.json
fi

# Check if pnpm-lock.yaml exists
if [ ! -f "pnpm-lock.yaml" ]; then
    echo -e "${YELLOW}📦 No pnpm-lock.yaml found, installing dependencies...${NC}"
    pnpm install
    echo -e "${GREEN}✅ Dependencies installed successfully${NC}"
else
    echo -e "${GREEN}✅ pnpm-lock.yaml exists${NC}"
fi

echo -e "${GREEN}🎉 Ready to go! Use 'pnpm run dev' to start development${NC}"