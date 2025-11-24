# Fix imports in all UI component files
$files = Get-ChildItem -Path "src/components/ui" -Filter "*.tsx" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Fix Radix UI imports
    $content = $content -replace '@radix-ui/react-select@[\d.]+', '@radix-ui/react-select'
    $content = $content -replace '@radix-ui/react-label@[\d.]+', '@radix-ui/react-label'
    $content = $content -replace '@radix-ui/react-slot@[\d.]+', '@radix-ui/react-slot'
    $content = $content -replace '@radix-ui/react-dialog@[\d.]+', '@radix-ui/react-dialog'
    $content = $content -replace '@radix-ui/react-checkbox@[\d.]+', '@radix-ui/react-checkbox'
    $content = $content -replace '@radix-ui/react-progress@[\d.]+', '@radix-ui/react-progress'
    $content = $content -replace '@radix-ui/react-tabs@[\d.]+', '@radix-ui/react-tabs'
    $content = $content -replace '@radix-ui/react-navigation-menu@[\d.]+', '@radix-ui/react-navigation-menu'
    
    # Fix lucide-react imports
    $content = $content -replace 'lucide-react@[\d.]+', 'lucide-react'
    
    # Fix class-variance-authority imports
    $content = $content -replace 'class-variance-authority@[\d.]+', 'class-variance-authority'
    
    Set-Content $file.FullName -Value $content
    Write-Host "Fixed: $($file.Name)" -ForegroundColor Green
}

Write-Host "`nAll imports fixed!" -ForegroundColor Green