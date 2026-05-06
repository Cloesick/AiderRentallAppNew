---
description: Automated test monitoring and error resolution
---

# Automated Test Monitoring & Error Resolution

## Setup: Run All Tests Automatically

### 1. Create test runner script
```bash
# File: run-all-tests.ps1
cd C:\Users\nicol\Projects\OnbudsmanLeads
npm run test:learn
```

### 2. Schedule automatic test runs
Use Windows Task Scheduler or run manually before each commit

### 3. Windsurf auto-reads failures
After each test run, check `.windsurf/notifications/test-failures.json`

## Daily Workflow

### Morning: Check test health
```bash
cd OnbudsmanLeads
npm run test:analyze
```

### After code changes: Run tests
// turbo
```bash
npm run test:learn
```

### If failures appear: Auto-fix
// turbo
Say: "Auto-fix all failures"

### Verify fixes
// turbo
```bash
npm run test:learn
```

## Continuous Monitoring

### Watch for notifications
Terminal shows:
```
🔔 WINDSURF NOTIFICATION
⚠️  X test failures detected
💬 Say: "Auto-fix all failures" to resolve
```

### Auto-response
When notification appears, immediately say:
"Auto-fix all failures"

### Verification loop
Run tests → Fix failures → Run tests → Repeat until 100%

## Success Criteria
- All E2E tests passing
- All unit tests passing
- Health score: 100/100
- No flaky tests
- No slow tests (>5s)
