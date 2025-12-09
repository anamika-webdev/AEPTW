# Update background colors to white
$files = Get-ChildItem -Path "frontend\src\pages" -Include *.tsx -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Replace gray-50 backgrounds with white for main containers
    $content = $content -replace 'min-h-screen p-4 bg-gray-50', 'min-h-screen p-4 bg-white'
    $content = $content -replace 'min-h-screen p-6 bg-gray-50', 'min-h-screen p-6 bg-white'
    $content = $content -replace 'min-h-screen p-4 bg-gray-50 sm:p-6 lg:p-8', 'min-h-screen p-4 bg-white sm:p-6 lg:p-8'
    
    Set-Content -Path $file.FullName -Value $content -NoNewline
}

Write-Host "Background colors updated to white!" -ForegroundColor Green
