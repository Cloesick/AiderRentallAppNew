---
description: Cypress Auto-Fix - Automatically fix all test failures
---

# Cypress Auto-Fix Workflow

## Step 1: Run tests and capture failures
```bash
npm run test:learn
```

## Step 2: Analyze results
```bash
npm run test:analyze
```

## Step 3: Auto-fix all failures
// turbo
When tests fail, automatically:
1. Read `.windsurf/memories/test-results/failures-*.json`
2. For each failure, determine fix type:
   - Selector issue → Update to data-testid
   - Timing issue → Add cy.intercept()
   - Assertion error → Update assertion or fix app code
   - Network error → Add cy.intercept() stub
   - Missing element → Add element to HTML + logic to JS
3. Apply fixes to production code
4. No confirmation needed - execute immediately

## Step 4: Verify fixes
// turbo
```bash
npm run test:learn
```

## Step 5: Repeat until 100% pass
If failures remain, go to Step 3

## Success Criteria
- Pass rate: 100%
- Flakiness: 0%
- Health score: 100/100

## Commands
```bash
# Full auto-fix cycle
npm run test:learn && npm run test:analyze
# Then say: "Auto-fix all failures"
```
