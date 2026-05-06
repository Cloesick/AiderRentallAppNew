#!/usr/bin/env node
// GitHub Actions → Windsurf Reporter
// Captures GitHub Actions failures and pushes to Windsurf for auto-fix

const fs = require('fs');
const path = require('path');
const https = require('https');

const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';
const repoName = process.env.GITHUB_REPOSITORY || 'unknown/unknown';
const runId = process.env.GITHUB_RUN_ID || 'unknown';
const runNumber = process.env.GITHUB_RUN_NUMBER || 'unknown';
const workflow = process.env.GITHUB_WORKFLOW || 'unknown';
const actor = process.env.GITHUB_ACTOR || 'unknown';
const ref = process.env.GITHUB_REF || 'unknown';
const sha = process.env.GITHUB_SHA || 'unknown';
const eventName = process.env.GITHUB_EVENT_NAME || 'unknown';
const serverUrl = process.env.GITHUB_SERVER_URL || 'https://github.com';
const runUrl = `${serverUrl}/${repoName}/actions/runs/${runId}`;

function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

function parseTestResults(resultsPath) {
  if (!fs.existsSync(resultsPath)) {
    log(`⚠️  Test results not found: ${resultsPath}`);
    return null;
  }

  try {
    const content = fs.readFileSync(resultsPath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    log(`❌ Error parsing test results: ${err.message}`);
    return null;
  }
}

function parseJestResults(resultsPath) {
  const results = parseTestResults(resultsPath);
  if (!results) return null;

  const failures = [];
  
  if (results.testResults) {
    results.testResults.forEach(suite => {
      if (suite.assertionResults) {
        suite.assertionResults.forEach(test => {
          if (test.status === 'failed') {
            failures.push({
              suite: suite.name,
              test: test.fullName || test.title,
              error: test.failureMessages ? test.failureMessages.join('\n') : 'Unknown error',
              duration: test.duration || 0
            });
          }
        });
      }
    });
  }

  return {
    total: results.numTotalTests || 0,
    passed: results.numPassedTests || 0,
    failed: results.numFailedTests || 0,
    failures
  };
}

function parseCypressResults(resultsPath) {
  const results = parseTestResults(resultsPath);
  if (!results) return null;

  return {
    total: results.totalTests || 0,
    passed: results.totalPassed || 0,
    failed: results.failures?.length || 0,
    failures: results.failures || []
  };
}

function detectErrorPattern(error) {
  const errorLower = (error || '').toLowerCase();
  
  if (errorLower.includes('timeout') || errorLower.includes('timed out')) {
    return 'timeout';
  }
  if (errorLower.includes('network') || errorLower.includes('econnrefused') || errorLower.includes('fetch failed')) {
    return 'network';
  }
  if (errorLower.includes('assertion') || errorLower.includes('expected')) {
    return 'assertion';
  }
  if (errorLower.includes('syntax') || errorLower.includes('unexpected token')) {
    return 'syntax';
  }
  if (errorLower.includes('module not found') || errorLower.includes('cannot find')) {
    return 'dependency';
  }
  if (errorLower.includes('permission denied') || errorLower.includes('eacces')) {
    return 'permission';
  }
  
  return 'unknown';
}

function getRecommendedFix(pattern, error) {
  const fixes = {
    timeout: 'Increase timeout values or optimize async operations',
    network: 'Check network connectivity, API endpoints, or mock external calls',
    assertion: 'Review test expectations vs actual implementation',
    syntax: 'Fix syntax errors in code',
    dependency: 'Install missing dependencies or fix import paths',
    permission: 'Check file permissions or run with appropriate privileges',
    unknown: 'Review error message and stack trace'
  };
  
  return fixes[pattern] || fixes.unknown;
}

function createWindsurfNotification(testResults, jobName, conclusion) {
  const projectRoot = process.cwd();
  const notificationDir = path.join(projectRoot, '.windsurf', 'notifications');
  const notificationFile = path.join(notificationDir, 'github-actions-failure.json');

  if (!fs.existsSync(notificationDir)) {
    fs.mkdirSync(notificationDir, { recursive: true });
  }

  const notification = {
    timestamp: new Date().toISOString(),
    type: 'github_actions_failure',
    priority: 'high',
    action_required: true,
    github: {
      repository: repoName,
      workflow,
      job: jobName,
      run_id: runId,
      run_number: runNumber,
      run_url: runUrl,
      actor,
      ref,
      sha: sha.substring(0, 7),
      event: eventName,
      conclusion
    },
    summary: {
      total_tests: testResults?.total || 0,
      passed: testResults?.passed || 0,
      failed: testResults?.failed || 0,
      pass_rate: testResults?.total > 0 
        ? ((testResults.passed / testResults.total) * 100).toFixed(2) 
        : '0.00'
    },
    failures: (testResults?.failures || []).map(f => ({
      test: f.test || f.title,
      suite: f.suite || f.spec,
      error: f.error,
      pattern: detectErrorPattern(f.error),
      recommended_fix: getRecommendedFix(detectErrorPattern(f.error), f.error),
      duration: f.duration
    })),
    auto_fix_command: 'Fix GitHub Actions failures',
    next_steps: [
      'Windsurf will analyze failures automatically',
      'Say: "Fix GitHub Actions failures" to apply fixes',
      'Or say: "Show GitHub Actions failures" for details',
      `View full run: ${runUrl}`
    ]
  };

  fs.writeFileSync(notificationFile, JSON.stringify(notification, null, 2));
  
  log('');
  log('🔔 WINDSURF NOTIFICATION - GITHUB ACTIONS FAILURE');
  log('━'.repeat(80));
  log(`📦 Repository: ${repoName}`);
  log(`🔧 Workflow: ${workflow} (${jobName})`);
  log(`🔗 Run: #${runNumber} - ${runUrl}`);
  log(`⚠️  Failed tests: ${testResults?.failed || 0}/${testResults?.total || 0}`);
  log(`📊 Pass rate: ${notification.summary.pass_rate}%`);
  log('');
  log('📝 Notification sent to Windsurf for auto-analysis');
  log('💬 Say: "Fix GitHub Actions failures" to resolve');
  log('━'.repeat(80));
  log('');

  return notificationFile;
}

function createMemory(testResults, jobName, conclusion) {
  const projectRoot = process.cwd();
  const memoryDir = path.join(projectRoot, '.windsurf', 'memories', 'github-actions');
  
  if (!fs.existsSync(memoryDir)) {
    fs.mkdirSync(memoryDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const memoryFile = path.join(memoryDir, `failure-${timestamp}.json`);

  const memory = {
    timestamp: new Date().toISOString(),
    repository: repoName,
    workflow,
    job: jobName,
    run_id: runId,
    run_url: runUrl,
    conclusion,
    test_results: testResults,
    failures: testResults?.failures || []
  };

  fs.writeFileSync(memoryFile, JSON.stringify(memory, null, 2));
  log(`💾 Memory saved: ${memoryFile}`);
}

function postToGitHubComment(notification) {
  // Only post if we have a GitHub token and it's a PR
  const token = process.env.GITHUB_TOKEN;
  const isPR = eventName === 'pull_request';
  
  if (!token || !isPR) {
    log('ℹ️  Skipping GitHub comment (no token or not a PR)');
    return;
  }

  const prNumber = process.env.GITHUB_REF?.match(/refs\/pull\/(\d+)\//)?.[1];
  if (!prNumber) {
    log('ℹ️  Skipping GitHub comment (no PR number)');
    return;
  }

  const [owner, repo] = repoName.split('/');
  const failures = notification.failures.slice(0, 5); // Limit to 5 failures
  
  const comment = `## 🔴 GitHub Actions Failure - Windsurf Auto-Fix Available

**Workflow:** ${workflow}
**Run:** [#${runNumber}](${runUrl})
**Failed Tests:** ${notification.summary.failed}/${notification.summary.total}
**Pass Rate:** ${notification.summary.pass_rate}%

### Failed Tests
${failures.map(f => `- **${f.test}**\n  - Pattern: \`${f.pattern}\`\n  - Fix: ${f.recommended_fix}`).join('\n')}

${notification.summary.failed > 5 ? `\n_...and ${notification.summary.failed - 5} more failures_\n` : ''}

### 🤖 Auto-Fix Available
Windsurf has been notified and can fix these failures automatically.

**In Windsurf:**
\`\`\`
Say: "Fix GitHub Actions failures"
\`\`\`

[View full run →](${runUrl})
`;

  const postData = JSON.stringify({ body: comment });
  
  const options = {
    hostname: 'api.github.com',
    path: `/repos/${owner}/${repo}/issues/${prNumber}/comments`,
    method: 'POST',
    headers: {
      'Authorization': `token ${token}`,
      'User-Agent': 'Windsurf-GitHub-Reporter',
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = https.request(options, (res) => {
    if (res.statusCode === 201) {
      log('✅ Posted comment to GitHub PR');
    } else {
      log(`⚠️  Failed to post comment: ${res.statusCode}`);
    }
  });

  req.on('error', (err) => {
    log(`❌ Error posting comment: ${err.message}`);
  });

  req.write(postData);
  req.end();
}

function main() {
  log('🚀 GitHub Actions → Windsurf Reporter');
  
  if (!isGitHubActions) {
    log('ℹ️  Not running in GitHub Actions, skipping');
    process.exit(0);
  }

  const jobName = process.argv[2] || 'test';
  const resultsPath = process.argv[3] || 'cypress/insights/latest.json';
  const testType = process.argv[4] || 'cypress'; // cypress or jest
  const conclusion = process.argv[5] || 'failure';

  log(`📊 Job: ${jobName}`);
  log(`📁 Results: ${resultsPath}`);
  log(`🧪 Type: ${testType}`);
  log(`📈 Conclusion: ${conclusion}`);

  let testResults;
  
  if (testType === 'jest') {
    testResults = parseJestResults(resultsPath);
  } else {
    testResults = parseCypressResults(resultsPath);
  }

  if (!testResults) {
    log('❌ No test results found');
    process.exit(1);
  }

  if (testResults.failed > 0 || conclusion === 'failure') {
    log(`⚠️  Detected ${testResults.failed} test failures`);
    
    const notificationFile = createWindsurfNotification(testResults, jobName, conclusion);
    createMemory(testResults, jobName, conclusion);
    
    const notification = JSON.parse(fs.readFileSync(notificationFile, 'utf8'));
    postToGitHubComment(notification);
    
    log('✅ Windsurf notification complete');
  } else {
    log('✅ All tests passed');
  }
}

main();
