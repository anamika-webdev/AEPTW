# PowerShell script to replace blue colors with orange/amber theme
# Run this from the project root

$files = Get-ChildItem -Path "frontend\src" -Include *.tsx,*.ts -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Replace all blue color variants with orange/amber
    $content = $content -replace 'bg-blue-50', 'bg-orange-50'
    $content = $content -replace 'bg-blue-100', 'bg-orange-100'
    $content = $content -replace 'bg-blue-200', 'bg-orange-200'
    $content = $content -replace 'bg-blue-500', 'bg-orange-500'
    $content = $content -replace 'bg-blue-600', 'bg-orange-600'
    $content = $content -replace 'bg-blue-700', 'bg-orange-700'
    $content = $content -replace 'bg-blue-800', 'bg-orange-800'
    
    $content = $content -replace 'text-blue-50', 'text-orange-50'
    $content = $content -replace 'text-blue-100', 'text-orange-100'
    $content = $content -replace 'text-blue-200', 'text-orange-200'
    $content = $content -replace 'text-blue-500', 'text-orange-500'
    $content = $content -replace 'text-blue-600', 'text-orange-600'
    $content = $content -replace 'text-blue-700', 'text-orange-700'
    $content = $content -replace 'text-blue-800', 'text-orange-800'
    $content = $content -replace 'text-blue-900', 'text-orange-900'
    
    $content = $content -replace 'border-blue-50', 'border-orange-50'
    $content = $content -replace 'border-blue-100', 'border-orange-100'
    $content = $content -replace 'border-blue-200', 'border-orange-200'
    $content = $content -replace 'border-blue-300', 'border-orange-300'
    $content = $content -replace 'border-blue-500', 'border-orange-500'
    $content = $content -replace 'border-blue-600', 'border-orange-600'
    $content = $content -replace 'border-blue-700', 'border-orange-700'
    
    $content = $content -replace 'hover:bg-blue-50', 'hover:bg-orange-50'
    $content = $content -replace 'hover:bg-blue-100', 'hover:bg-orange-100'
    $content = $content -replace 'hover:bg-orange-200', 'hover:bg-orange-200'
    $content = $content -replace 'hover:bg-blue-700', 'hover:bg-orange-700'
    $content = $content -replace 'hover:bg-blue-800', 'hover:bg-orange-800'
    
    $content = $content -replace 'hover:text-blue-600', 'hover:text-orange-600'
    $content = $content -replace 'hover:text-blue-700', 'hover:text-orange-700'
    $content = $content -replace 'hover:text-blue-800', 'hover:text-orange-800'
    $content = $content -replace 'hover:text-blue-900', 'hover:text-orange-900'
    
    $content = $content -replace 'focus:ring-blue-500', 'focus:ring-orange-500'
    $content = $content -replace 'focus:ring-blue-600', 'focus:ring-orange-600'
    $content = $content -replace 'focus:border-blue-500', 'focus:border-orange-500'
    $content = $content -replace 'focus:border-blue-600', 'focus:border-orange-600'
    
    $content = $content -replace 'focus-visible:outline-blue-600', 'focus-visible:outline-orange-600'
    
    # Write back to file
    Set-Content -Path $file.FullName -Value $content -NoNewline
}

Write-Host "Color theme updated successfully! All blue colors replaced with orange/amber." -ForegroundColor Green
