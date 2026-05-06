/**
 * Cypress Windsurf Reporter Plugin
 * Captures test results and creates Windsurf memories for learning
 */

const fs = require('fs');
const path = require('path');

class WindsurfReporter {
  constructor(on, config) {
    this.config = config;
    this.results = {
      startTime: null,
      endTime: null,
      duration: 0,
      tests: [],
      suites: [],
      stats: {
        total: 0,
        passes: 0,
        failures: 0,
        pending: 0,
        skipped: 0
      },
      failures: [],
      flakyTests: [],
      slowTests: []
    };

    this.setupEventListeners(on);
  }

  setupEventListeners(on) {
    // Before run starts
    on('before:run', (details) => {
      this.results.startTime = new Date().toISOString();
      console.log('\n' + '='.repeat(60));
      console.log('🧪 WINDSURF TEST LEARNING - STARTING TEST RUN');
      console.log('='.repeat(60));
      console.log(`📅 Start Time: ${new Date().toLocaleString()}`);
      console.log(`📁 Specs: ${details.specs?.length || 0} file(s)`);
      console.log('='.repeat(60) + '\n');
    });

    // After each spec file
    on('after:spec', (spec, results) => {
      this.processSpecResults(spec, results);
      this.logSpecResults(spec, results);
    });

    // After entire run
    on('after:run', (results) => {
      this.results.endTime = new Date().toISOString();
      this.results.duration = results.totalDuration;
      this.results.stats = results.totalTests ? {
        total: results.totalTests,
        passes: results.totalPassed,
        failures: results.totalFailed,
        pending: results.totalPending,
        skipped: results.totalSkipped
      } : this.results.stats;

      this.generateInsights();
      this.createWindsurfMemories();
      this.saveResults();
      this.logFinalSummary();
    });
  }

  processSpecResults(spec, results) {
    if (!results || !results.tests) return;

    results.tests.forEach(test => {
      const testData = {
        title: test.title.join(' > '),
        fullTitle: test.title,
        state: test.state,
        duration: test.duration,
        error: test.displayError || null,
        stack: test.err?.stack || null,
        attempts: test.attempts || [],
        spec: spec.relative,
        timestamp: new Date().toISOString()
      };

      this.results.tests.push(testData);

      // Track failures
      if (test.state === 'failed') {
        this.results.failures.push(testData);
      }

      // Detect flaky tests (passed after retries)
      if (test.attempts && test.attempts.length > 1) {
        const hadFailure = test.attempts.some(a => a.state === 'failed');
        if (hadFailure && test.state === 'passed') {
          this.results.flakyTests.push(testData);
        }
      }

      // Track slow tests (>5 seconds)
      if (test.duration > 5000) {
        this.results.slowTests.push(testData);
      }
    });
  }

  logSpecResults(spec, results) {
    if (!results || !results.tests) return;

    console.log(`\n📄 Spec: ${spec.relative}`);
    console.log('-'.repeat(60));

    results.tests.forEach(test => {
      const icon = test.state === 'passed' ? '✅' : test.state === 'failed' ? '❌' : '⏭️';
      const duration = test.duration ? `(${test.duration}ms)` : '';
      const title = test.title.join(' > ');
      
      console.log(`${icon} ${title} ${duration}`);

      // Log error details for failures
      if (test.state === 'failed' && test.displayError) {
        console.log(`   ⚠️  Error: ${test.displayError.substring(0, 100)}...`);
      }

      // Log flaky test warning
      if (test.attempts && test.attempts.length > 1) {
        const hadFailure = test.attempts.some(a => a.state === 'failed');
        if (hadFailure && test.state === 'passed') {
          console.log(`   ⚠️  FLAKY: Passed after ${test.attempts.length} attempts`);
        }
      }

      // Log slow test warning
      if (test.duration > 5000) {
        console.log(`   🐌 SLOW: ${(test.duration / 1000).toFixed(2)}s (threshold: 5s)`);
      }
    });

    const specStats = {
      total: results.tests.length,
      passed: results.tests.filter(t => t.state === 'passed').length,
      failed: results.tests.filter(t => t.state === 'failed').length,
      pending: results.tests.filter(t => t.state === 'pending').length
    };

    console.log('-'.repeat(60));
    console.log(`📊 Spec Summary: ${specStats.passed}/${specStats.total} passed`);
    if (specStats.failed > 0) console.log(`   ❌ ${specStats.failed} failed`);
    if (specStats.pending > 0) console.log(`   ⏭️  ${specStats.pending} pending`);
    console.log('');
  }

  generateInsights() {
    const insights = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.results.stats.total,
        passRate: this.calculatePassRate(),
        flakinessRate: this.calculateFlakinessRate(),
        avgDuration: this.calculateAvgDuration()
      },
      patterns: this.detectPatterns(),
      recommendations: this.generateRecommendations()
    };

    this.results.insights = insights;
  }

  calculatePassRate() {
    if (this.results.stats.total === 0) return 100;
    return ((this.results.stats.passes / this.results.stats.total) * 100).toFixed(2);
  }

  calculateFlakinessRate() {
    if (this.results.stats.total === 0) return 0;
    return ((this.results.flakyTests.length / this.results.stats.total) * 100).toFixed(2);
  }

  calculateAvgDuration() {
    if (this.results.tests.length === 0) return 0;
    const total = this.results.tests.reduce((sum, test) => sum + (test.duration || 0), 0);
    return (total / this.results.tests.length).toFixed(0);
  }

  detectPatterns() {
    const patterns = {
      selectorIssues: [],
      timingIssues: [],
      assertionErrors: [],
      networkErrors: []
    };

    this.results.failures.forEach(failure => {
      const error = failure.error || '';
      const stack = failure.stack || '';

      // Detect selector issues
      if (error.includes('Timed out retrying') || error.includes('expected to find element')) {
        patterns.selectorIssues.push({
          test: failure.title,
          error: error.substring(0, 200)
        });
      }

      // Detect timing issues
      if (error.includes('timeout') || error.includes('wait')) {
        patterns.timingIssues.push({
          test: failure.title,
          error: error.substring(0, 200)
        });
      }

      // Detect assertion errors
      if (error.includes('AssertionError') || error.includes('expected')) {
        patterns.assertionErrors.push({
          test: failure.title,
          error: error.substring(0, 200)
        });
      }

      // Detect network errors
      if (error.includes('network') || error.includes('fetch') || error.includes('XHR')) {
        patterns.networkErrors.push({
          test: failure.title,
          error: error.substring(0, 200)
        });
      }
    });

    return patterns;
  }

  generateRecommendations() {
    const recommendations = [];

    // Pass rate recommendations
    const passRate = parseFloat(this.calculatePassRate());
    if (passRate < 95) {
      recommendations.push({
        type: 'critical',
        category: 'test_health',
        message: `Test pass rate is ${passRate}%. Target is 95%+. Review and fix failing tests.`,
        action: 'Fix failing tests or update assertions to match current behavior'
      });
    }

    // Flakiness recommendations
    const flakinessRate = parseFloat(this.calculateFlakinessRate());
    if (flakinessRate > 2) {
      recommendations.push({
        type: 'warning',
        category: 'flakiness',
        message: `${this.results.flakyTests.length} flaky tests detected (${flakinessRate}%). Target is <2%.`,
        action: 'Add proper waits, use cy.intercept() for API calls, avoid hard-coded timeouts'
      });
    }

    // Performance recommendations
    if (this.results.slowTests.length > 0) {
      recommendations.push({
        type: 'info',
        category: 'performance',
        message: `${this.results.slowTests.length} slow tests detected (>5s each).`,
        action: 'Optimize test setup, use fixtures, mock slow API calls'
      });
    }

    // Pattern-based recommendations
    const patterns = this.results.insights?.patterns || this.detectPatterns();
    
    if (patterns.selectorIssues.length > 0) {
      recommendations.push({
        type: 'warning',
        category: 'selectors',
        message: `${patterns.selectorIssues.length} tests failing due to selector issues.`,
        action: 'Use data-testid attributes instead of classes/IDs. Add proper waits for dynamic content.'
      });
    }

    if (patterns.timingIssues.length > 0) {
      recommendations.push({
        type: 'warning',
        category: 'timing',
        message: `${patterns.timingIssues.length} tests failing due to timing issues.`,
        action: 'Use cy.intercept() and cy.wait() for API calls. Avoid cy.wait(milliseconds).'
      });
    }

    return recommendations;
  }

  createWindsurfMemories() {
    const memoriesDir = path.join(process.cwd(), '.windsurf', 'memories', 'test-results');
    
    // Ensure directory exists
    if (!fs.existsSync(memoriesDir)) {
      fs.mkdirSync(memoriesDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    // Create memory for failed tests
    if (this.results.failures.length > 0) {
      const failureMemory = {
        timestamp: new Date().toISOString(),
        type: 'test_failures',
        count: this.results.failures.length,
        failures: this.results.failures.map(f => ({
          test: f.title,
          spec: f.spec,
          error: f.error,
          recommendation: this.getFailureRecommendation(f)
        }))
      };

      fs.writeFileSync(
        path.join(memoriesDir, `failures-${timestamp}.json`),
        JSON.stringify(failureMemory, null, 2)
      );
    }

    // Create memory for flaky tests
    if (this.results.flakyTests.length > 0) {
      const flakyMemory = {
        timestamp: new Date().toISOString(),
        type: 'flaky_tests',
        count: this.results.flakyTests.length,
        tests: this.results.flakyTests.map(f => ({
          test: f.title,
          spec: f.spec,
          attempts: f.attempts?.length || 0,
          recommendation: 'Add proper waits and use cy.intercept() for API calls'
        }))
      };

      fs.writeFileSync(
        path.join(memoriesDir, `flaky-${timestamp}.json`),
        JSON.stringify(flakyMemory, null, 2)
      );
    }

    // Create summary memory
    const summaryMemory = {
      timestamp: new Date().toISOString(),
      type: 'test_summary',
      stats: this.results.stats,
      insights: this.results.insights,
      health: {
        passRate: this.calculatePassRate(),
        flakinessRate: this.calculateFlakinessRate(),
        avgDuration: this.calculateAvgDuration()
      }
    };

    fs.writeFileSync(
      path.join(memoriesDir, `summary-${timestamp}.json`),
      JSON.stringify(summaryMemory, null, 2)
    );
  }

  getFailureRecommendation(failure) {
    const error = failure.error || '';

    if (error.includes('Timed out retrying')) {
      return 'Add proper wait: cy.get(selector, { timeout: 10000 }) or use cy.intercept() for API calls';
    }
    if (error.includes('expected to find element')) {
      return 'Verify selector is correct. Consider using data-testid attribute. Check if element is visible.';
    }
    if (error.includes('AssertionError')) {
      return 'Update assertion to match current behavior or fix the implementation';
    }
    if (error.includes('network') || error.includes('fetch')) {
      return 'Use cy.intercept() to stub network calls or add proper error handling';
    }

    return 'Review error message and stack trace for specific fix';
  }

  saveResults() {
    const resultsDir = path.join(process.cwd(), 'cypress', 'insights');
    
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `test-results-${timestamp}.json`;

    fs.writeFileSync(
      path.join(resultsDir, filename),
      JSON.stringify(this.results, null, 2)
    );

    // Also save latest results
    fs.writeFileSync(
      path.join(resultsDir, 'latest.json'),
      JSON.stringify(this.results, null, 2)
    );

    console.log(`📊 Test results saved to: cypress/insights/${filename}`);
    
    // Notify Windsurf if there are failures
    if (this.results.failures.length > 0 || this.results.flakyTests.length > 0) {
      this.notifyWindsurf();
    }
  }

  notifyWindsurf() {
    const notificationFile = path.join(process.cwd(), '.windsurf', 'notifications', 'test-failures.json');
    const notificationDir = path.dirname(notificationFile);
    
    if (!fs.existsSync(notificationDir)) {
      fs.mkdirSync(notificationDir, { recursive: true });
    }

    const notification = {
      timestamp: new Date().toISOString(),
      type: 'test_failures',
      priority: 'high',
      action_required: true,
      summary: {
        total_failures: this.results.failures.length,
        total_flaky: this.results.flakyTests.length,
        health_score: this.calculateHealthScore(),
        pass_rate: this.calculatePassRate()
      },
      failures: this.results.failures.map(f => ({
        test: f.title,
        spec: f.spec,
        error: f.error,
        pattern: this.detectErrorPattern(f),
        recommended_fix: this.getFailureRecommendation(f)
      })),
      flaky_tests: this.results.flakyTests.map(f => ({
        test: f.title,
        spec: f.spec,
        attempts: f.attempts?.length || 0
      })),
      auto_fix_command: 'Auto-fix all failures',
      next_steps: [
        'Windsurf will analyze failures automatically',
        'Say: "Auto-fix all failures" to apply fixes',
        'Or say: "Show test failures" for details'
      ]
    };

    fs.writeFileSync(notificationFile, JSON.stringify(notification, null, 2));
    
    console.log('\n🔔 WINDSURF NOTIFICATION');
    console.log('━'.repeat(60));
    console.log(`⚠️  ${this.results.failures.length} test failures detected`);
    if (this.results.flakyTests.length > 0) {
      console.log(`⚠️  ${this.results.flakyTests.length} flaky tests detected`);
    }
    console.log('📝 Notification sent to Windsurf for auto-analysis');
    console.log('💬 Say: "Auto-fix all failures" to resolve');
    console.log('━'.repeat(60) + '\n');
  }

  calculateHealthScore() {
    const passRate = parseFloat(this.calculatePassRate());
    const flakinessRate = parseFloat(this.calculateFlakinessRate());
    let healthScore = 100;
    healthScore -= (100 - passRate);
    healthScore -= (flakinessRate * 5);
    healthScore -= Math.min(this.results.slowTests.length * 2, 10);
    return Math.max(0, healthScore).toFixed(1);
  }

  detectErrorPattern(failure) {
    const error = failure.error?.toLowerCase() || '';
    
    if (error.includes('expected to find element') || error.includes('timed out retrying')) {
      return 'selector_issue';
    }
    if (error.includes('timeout') || error.includes('wait')) {
      return 'timing_issue';
    }
    if (error.includes('assertionerror') || error.includes('expected')) {
      return 'assertion_error';
    }
    if (error.includes('network') || error.includes('request failed') || error.includes('status code')) {
      return 'network_error';
    }
    
    return 'unknown';
  }

  logFinalSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 WINDSURF TEST LEARNING - FINAL SUMMARY');
    console.log('='.repeat(60));
    
    // Overall stats
    console.log('\n📈 OVERALL STATISTICS:');
    console.log(`   Total Tests:     ${this.results.stats.total}`);
    console.log(`   ✅ Passed:       ${this.results.stats.passes} (${this.calculatePassRate()}%)`);
    console.log(`   ❌ Failed:       ${this.results.stats.failures}`);
    console.log(`   ⏭️  Pending:      ${this.results.stats.pending}`);
    console.log(`   ⏩ Skipped:      ${this.results.stats.skipped}`);
    
    // Flaky tests
    if (this.results.flakyTests.length > 0) {
      console.log(`\n⚠️  FLAKY TESTS: ${this.results.flakyTests.length} (${this.calculateFlakinessRate()}%)`);
      this.results.flakyTests.forEach((test, i) => {
        console.log(`   ${i + 1}. ${test.title}`);
      });
    }
    
    // Slow tests
    if (this.results.slowTests.length > 0) {
      console.log(`\n🐌 SLOW TESTS: ${this.results.slowTests.length} tests (>5s each)`);
      this.results.slowTests.slice(0, 5).forEach((test, i) => {
        console.log(`   ${i + 1}. ${test.title} (${(test.duration / 1000).toFixed(2)}s)`);
      });
      if (this.results.slowTests.length > 5) {
        console.log(`   ... and ${this.results.slowTests.length - 5} more`);
      }
    }
    
    // Failed tests details
    if (this.results.failures.length > 0) {
      console.log(`\n❌ FAILED TESTS: ${this.results.failures.length}`);
      this.results.failures.forEach((test, i) => {
        console.log(`\n   ${i + 1}. ${test.title}`);
        console.log(`      Spec: ${test.spec}`);
        if (test.error) {
          console.log(`      Error: ${test.error.substring(0, 150)}...`);
        }
      });
    }
    
    // Patterns detected
    const patterns = this.results.insights?.patterns || this.detectPatterns();
    const hasPatterns = Object.values(patterns).some(p => p.length > 0);
    
    if (hasPatterns) {
      console.log('\n🔍 PATTERNS DETECTED:');
      if (patterns.selectorIssues.length > 0) {
        console.log(`   🎯 Selector Issues: ${patterns.selectorIssues.length}`);
      }
      if (patterns.timingIssues.length > 0) {
        console.log(`   ⏱️  Timing Issues: ${patterns.timingIssues.length}`);
      }
      if (patterns.assertionErrors.length > 0) {
        console.log(`   ✓ Assertion Errors: ${patterns.assertionErrors.length}`);
      }
      if (patterns.networkErrors.length > 0) {
        console.log(`   🌐 Network Errors: ${patterns.networkErrors.length}`);
      }
    }
    
    // Recommendations
    const recommendations = this.results.insights?.recommendations || this.generateRecommendations();
    if (recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      recommendations.forEach((rec, i) => {
        const icon = rec.type === 'critical' ? '🔴' : rec.type === 'warning' ? '🟡' : 'ℹ️';
        console.log(`   ${icon} ${rec.message}`);
      });
    }
    
    // Health score
    const passRate = parseFloat(this.calculatePassRate());
    const flakinessRate = parseFloat(this.calculateFlakinessRate());
    let healthScore = 100;
    healthScore -= (100 - passRate);
    healthScore -= (flakinessRate * 5);
    healthScore -= Math.min(this.results.slowTests.length * 2, 10);
    healthScore = Math.max(0, healthScore);
    
    const grade = healthScore >= 95 ? 'A+' : healthScore >= 85 ? 'A' : healthScore >= 75 ? 'B' : healthScore >= 65 ? 'C' : 'F';
    const gradeIcon = healthScore >= 95 ? '🟢' : healthScore >= 85 ? '🟢' : healthScore >= 75 ? '🟡' : healthScore >= 65 ? '🟠' : '🔴';
    
    console.log('\n🏥 TEST SUITE HEALTH:');
    console.log(`   ${gradeIcon} Overall Score: ${healthScore.toFixed(1)}/100 (Grade: ${grade})`);
    
    // Duration
    const durationSec = (this.results.duration / 1000).toFixed(2);
    console.log(`\n⏱️  DURATION:`);
    console.log(`   Total Time: ${durationSec}s`);
    console.log(`   Avg per Test: ${this.calculateAvgDuration()}ms`);
    
    // Windsurf integration
    console.log('\n🧠 WINDSURF INTEGRATION:');
    console.log(`   ✅ Memories created in .windsurf/memories/test-results/`);
    console.log(`   ✅ Results saved to cypress/insights/`);
    console.log(`   ✅ Dashboard available: npm run test:dashboard`);
    
    console.log('\n💬 ASK WINDSURF:');
    console.log('   "What tests failed?"');
    console.log('   "Show me flaky tests"');
    console.log('   "How can I fix the failing tests?"');
    console.log('   "What\'s the test suite health score?"');
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ WINDSURF TEST LEARNING COMPLETE');
    console.log('='.repeat(60) + '\n');
  }
}

module.exports = (on, config) => {
  new WindsurfReporter(on, config);
  return config;
};
