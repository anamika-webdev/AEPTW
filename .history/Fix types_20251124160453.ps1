# Automated Fix for Type Mismatch Error
# Run this from your project root directory

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Amazon EPTW - Type Mismatch Fix" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "frontend") -or -not (Test-Path "backend")) {
    Write-Host "ERROR: Must run from project root directory" -ForegroundColor Red
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
    exit 1
}

Write-Host "Step 1: Checking for conflicting types file..." -ForegroundColor Blue

# Check if conflicting types.ts exists
if (Test-Path "frontend\src\types.ts") {
    Write-Host "! Found conflicting types.ts file" -ForegroundColor Yellow
    $response = Read-Host "Do you want to delete frontend\src\types.ts? (y/n)"
    
    if ($response -eq "y" -or $response -eq "Y") {
        Remove-Item "frontend\src\types.ts" -Force
        Write-Host "✓ Deleted frontend\src\types.ts" -ForegroundColor Green
    } else {
        Write-Host "! Skipping deletion - you must delete this file manually" -ForegroundColor Yellow
        Write-Host "  The file conflicts with frontend\src\types\index.ts" -ForegroundColor Gray
    }
} else {
    Write-Host "✓ No conflicting types.ts file found" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 2: Checking correct types location..." -ForegroundColor Blue

# Verify correct types directory exists
if (Test-Path "frontend\src\types\index.ts") {
    Write-Host "✓ Correct types file exists: frontend\src\types\index.ts" -ForegroundColor Green
} else {
    Write-Host "! Warning: frontend\src\types\index.ts not found" -ForegroundColor Yellow
    Write-Host "  This file should contain your User interface with login_id" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Step 3: Verifying file structure..." -ForegroundColor Blue

# Check if required files exist
$requiredFiles = @(
    "frontend\index.html",
    "frontend\src\App.tsx",
    "frontend\src\main.tsx",
    "frontend\src\index.css",
    "frontend\src\pages\auth\LoginPage.tsx"
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file (missing)" -ForegroundColor Red
        $allFilesExist = $false
    }
}

if (-not $allFilesExist) {
    Write-Host ""
    Write-Host "! Some required files are missing" -ForegroundColor Yellow
    Write-Host "  Please ensure all files from the fix guide are in place" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Step 4: Checking TypeScript configuration..." -ForegroundColor Blue

if (Test-Path "frontend\tsconfig.json") {
    $tsconfigContent = Get-Content "frontend\tsconfig.json" -Raw
    if ($tsconfigContent -match '"baseUrl"') {
        Write-Host "✓ TypeScript path mapping configured" -ForegroundColor Green
    } else {
        Write-Host "! TypeScript may need baseUrl configuration" -ForegroundColor Yellow
    }
} else {
    Write-Host "✗ frontend\tsconfig.json not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Fix Summary" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

if (Test-Path "frontend\src\types.ts") {
    Write-Host "⚠ ACTION REQUIRED:" -ForegroundColor Yellow
    Write-Host "  Delete: frontend\src\types.ts" -ForegroundColor White
    Write-Host "  Command: Remove-Item frontend\src\types.ts" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "✓ Your correct types are in: frontend\src\types\index.ts" -ForegroundColor Green
Write-Host ""

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Make sure App.tsx imports from './types' (not './types.ts')" -ForegroundColor White
Write-Host "  2. Make sure LoginPage.tsx imports from '../../types'" -ForegroundColor White
Write-Host "  3. Restart your development server:" -ForegroundColor White
Write-Host "     npm start" -ForegroundColor Cyan
Write-Host ""
Write-Host "  4. If VSCode still shows errors, restart TypeScript:" -ForegroundColor White
Write-Host "     Ctrl+Shift+P -> 'TypeScript: Restart TS Server'" -ForegroundColor Cyan
Write-Host ""

# Offer to restart the server
$response = Read-Host "Do you want to restart the development server now? (y/n)"

if ($response -eq "y" -or $response -eq "Y") {
    Write-Host ""
    Write-Host "Restarting development server..." -ForegroundColor Blue
    Write-Host "Press Ctrl+C to stop the servers when needed" -ForegroundColor Gray
    Write-Host ""
    npm start
} else {
    Write-Host ""
    Write-Host "When ready, start the server with: npm start" -ForegroundColor Cyan
    Write-Host ""
}