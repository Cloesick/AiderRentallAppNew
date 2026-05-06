---
description: Fix GitHub Actions failures automatically
---

# GitHub Actions Auto-Fix Workflow

## When GitHub Actions Fail

### 1. Notification Created
After GitHub Actions run fails:
- Notification file created: `.windsurf/notifications/github-actions-failure.json`
- Memory saved: `.windsurf/memories/github-actions/failure-[timestamp].json`
- GitHub comment posted (if PR)
- GitHub issue created (optional)

### 2. Check Notification
```bash
cat .windsurf/notifications/github-actions-failure.json
```

### 3. Auto-Fix
// turbo
Say: "Fix GitHub Actions failures"

### 4. Verify Locally
// turbo
```bash
npm run test:learn
```

### 5. Push Fixes
// turbo
```bash
git add .
git commit -m "fix: resolve GitHub Actions test failures"
git push
```

### 6. Verify on GitHub
Check GitHub Actions run passes

## Workflow Details

### GitHub Actions → Windsurf Flow

```
1. Push code to GitHub
2. GitHub Actions runs tests
3. Tests fail
4. Reporter script executes
5. Creates notification in .windsurf/notifications/
6. Posts comment to PR (if applicable)
7. Creates GitHub issue (optional)
8. You pull code
9. Windsurf reads notification
10. Say: "Fix GitHub Actions failures"
11. Windsurf applies fixes
12. You verify and push
13. GitHub Actions runs again
14. Tests pass ✅
```

## Commands

### View Failures
```
"Show GitHub Actions failures"
"What failed in GitHub Actions?"
"Show me the GitHub Actions errors"
```

### Fix Failures
```
"Fix GitHub Actions failures"
"Fix all GitHub Actions errors"
"Resolve GitHub Actions test failures"
```

### Specific Fixes
```
"Fix timeout errors in GitHub Actions"
"Fix network errors in GitHub Actions"
"Fix assertion errors in GitHub Actions"
```

## Success Criteria
- GitHub Actions runs pass
- All tests green
- No failures in notification
- PR approved and merged
