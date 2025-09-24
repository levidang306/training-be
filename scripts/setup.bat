@echo off
REM Package Manager Check Script for Windows
REM This script ensures the correct package manager is being used

echo 🔧 Setting up Task Management Backend...

REM Check if pnpm is installed
pnpm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ pnpm is not installed
    echo 📦 Installing pnpm...
    npm install -g pnpm
    if %errorlevel% neq 0 (
        echo ❌ Failed to install pnpm
        exit /b 1
    )
)

REM Check pnpm version
for /f "tokens=*" %%i in ('pnpm --version') do set PNPM_VERSION=%%i
echo ✅ pnpm version: %PNPM_VERSION%

REM Remove conflicting lock files
if exist "yarn.lock" (
    echo 🧹 Removing yarn.lock...
    del yarn.lock
)

if exist "package-lock.json" (
    echo 🧹 Removing package-lock.json...
    del package-lock.json
)

REM Check if pnpm-lock.yaml exists
if not exist "pnpm-lock.yaml" (
    echo 📦 No pnpm-lock.yaml found, installing dependencies...
    pnpm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        exit /b 1
    )
    echo ✅ Dependencies installed successfully
) else (
    echo ✅ pnpm-lock.yaml exists
)

echo 🎉 Ready to go! Use 'pnpm run dev' to start development
pause