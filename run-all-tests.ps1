#!/usr/bin/env pwsh
# Automated Test Runner - Runs all E2E and unit tests

Write-Host "🧪 Running All Tests - OnbudsmanLeads" -ForegroundColor Cyan
Write-Host "=" * 60

$ErrorActionPreference = "Continue"
$testsPassed = $true

# 1. Run Cypress E2E Tests
Write-Host "`n📊 Running Cypress E2E Tests..." -ForegroundColor Yellow
npm run test:learn
if ($LASTEXITCODE -ne 0) {
    $testsPassed = $false
    Write-Host "❌ Cypress tests failed" -ForegroundColor Red
} else {
    Write-Host "✅ Cypress tests passed" -ForegroundColor Green
}

# 2. Analyze Results
Write-Host "`n📈 Analyzing Test Results..." -ForegroundColor Yellow
npm run test:analyze

# 3. Check for failures
$notificationFile = ".windsurf\notifications\test-failures.json"
if (Test-Path $notificationFile) {
    Write-Host "`n🔔 Test failures detected!" -ForegroundColor Red
    Write-Host "📝 Notification file created: $notificationFile" -ForegroundColor Yellow
    
    $notification = Get-Content $notificationFile | ConvertFrom-Json
    $failureCount = $notification.summary.total_failures
    $flakyCount = $notification.summary.total_flaky
    
    Write-Host "`n⚠️  Failures: $failureCount" -ForegroundColor Red
    Write-Host "⚠️  Flaky: $flakyCount" -ForegroundColor Yellow
    Write-Host "🏥 Health Score: $($notification.summary.health_score)/100" -ForegroundColor Yellow
    
    Write-Host "`n💬 Next Steps:" -ForegroundColor Cyan
    Write-Host "   1. Open Windsurf" -ForegroundColor White
    Write-Host "   2. Say: 'Auto-fix all failures'" -ForegroundColor White
    Write-Host "   3. Run tests again to verify" -ForegroundColor White
    
} else {
    Write-Host "`n✅ All tests passed! No failures detected." -ForegroundColor Green
}

# 4. Summary
Write-Host "`n" + "=" * 60
if ($testsPassed) {
    Write-Host "✅ TEST RUN COMPLETE - ALL PASSED" -ForegroundColor Green
} else {
    Write-Host "⚠️  TEST RUN COMPLETE - FAILURES DETECTED" -ForegroundColor Yellow
    Write-Host "📝 Check .windsurf/notifications/test-failures.json for details" -ForegroundColor Yellow
}
Write-Host "=" * 60

exit $(if ($testsPassed) { 0 } else { 1 })
