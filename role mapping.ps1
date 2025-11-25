# Amazon EPTW - Role Mapping Setup (No Database Changes)
# This script copies all necessary files for role mapping implementation

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Amazon EPTW - Role Mapping Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "frontend")) {
    Write-Host "ERROR: Must run from project root directory" -ForegroundColor Red
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
    exit 1
}

Write-Host "This script will implement role mapping:" -ForegroundColor Yellow
Write-Host "  • Admin → Admin Dashboard" -ForegroundColor White
Write-Host "  • Approver_Safety → Supervisor Dashboard" -ForegroundColor White
Write-Host "  • Approver_AreaManager → Supervisor Dashboard" -ForegroundColor White
Write-Host "  • Requester → Supervisor Dashboard" -ForegroundColor White
Write-Host ""
Write-Host "No database changes required!" -ForegroundColor Green
Write-Host ""

$response = Read-Host "Continue with setup? (y/n)"

if ($response -ne "y" -and $response -ne "Y") {
    Write-Host "Setup cancelled" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Step 1: Creating utils directory..." -ForegroundColor Blue

# Create utils directory if it doesn't exist
if (-not (Test-Path "frontend\src\utils")) {
    New-Item -Path "frontend\src\utils" -ItemType Directory | Out-Null
    Write-Host "✓ Created frontend\src\utils directory" -ForegroundColor Green
} else {
    Write-Host "✓ frontend\src\utils directory exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 2: Backing up existing files..." -ForegroundColor Blue

# Backup existing files
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "frontend\src\backup_$timestamp"

if (-not (Test-Path $backupDir)) {
    New-Item -Path $backupDir -ItemType Directory | Out-Null
}

$filesToBackup = @(
    "frontend\src\App.tsx",
    "frontend\src\components\common\Sidebar.tsx",
    "frontend\src\pages\auth\LoginPage.tsx",
    "frontend\src\types\index.ts"
)

foreach ($file in $filesToBackup) {
    if (Test-Path $file) {
        $filename = Split-Path $file -Leaf
        Copy-Item $file "$backupDir\$filename" -Force
        Write-Host "✓ Backed up: $filename" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Step 3: Copying new files..." -ForegroundColor Blue

# Check if source files exist
$sourceFiles = @{
    "App.tsx" = "frontend\src\App.tsx"
    "Sidebar.tsx" = "frontend\src\components\common\Sidebar.tsx"
    "LoginPage.tsx" = "frontend\src\pages\auth\LoginPage.tsx"
    "roleMapper.ts" = "frontend\src\utils\roleMapper.ts"
    "types-index.ts" = "frontend\src\types\index.ts"
}

$allFilesExist = $true
foreach ($file in $sourceFiles.Keys) {
    if (-not (Test-Path $file)) {
        Write-Host "✗ Missing source file: $file" -ForegroundColor Red
        $allFilesExist = $false
    }
}

if (-not $allFilesExist) {
    Write-Host ""
    Write-Host "ERROR: Some source files are missing" -ForegroundColor Red
    Write-Host "Please ensure all downloaded files are in the current directory" -ForegroundColor Yellow
    exit 1
}

# Copy files
foreach ($source in $sourceFiles.Keys) {
    $destination = $sourceFiles[$source]
    
    Copy-Item $source $destination -Force
    Write-Host "✓ Copied: $source → $destination" -ForegroundColor Green
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Files updated:" -ForegroundColor Yellow
Write-Host "  ✓ frontend/src/App.tsx" -ForegroundColor White
Write-Host "  ✓ frontend/src/components/common/Sidebar.tsx" -ForegroundColor White
Write-Host "  ✓ frontend/src/pages/auth/LoginPage.tsx" -ForegroundColor White
Write-Host "  ✓ frontend/src/utils/roleMapper.ts (NEW)" -ForegroundColor White
Write-Host "  ✓ frontend/src/types/index.ts" -ForegroundColor White
Write-Host ""

Write-Host "Backup location:" -ForegroundColor Yellow
Write-Host "  $backupDir" -ForegroundColor White
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Restart your development server" -ForegroundColor White
Write-Host "     npm start" -ForegroundColor Cyan
Write-Host ""
Write-Host "  2. Test each role:" -ForegroundColor White
Write-Host "     Admin: admin / 123" -ForegroundColor Cyan
Write-Host "     Safety: safe1 / 123" -ForegroundColor Cyan
Write-Host "     Area Manager: area1 / 123" -ForegroundColor Cyan
Write-Host "     Requester: request1 / 123" -ForegroundColor Cyan
Write-Host ""

$restart = Read-Host "Restart development server now? (y/n)"

if ($restart -eq "y" -or $restart -eq "Y") {
    Write-Host ""
    Write-Host "Starting development server..." -ForegroundColor Blue
    Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
    Write-Host ""
    
    cd frontend
    npm start
} else {
    Write-Host ""
    Write-Host "When ready, run: npm start" -ForegroundColor Cyan
    Write-Host ""
}