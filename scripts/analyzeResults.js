/**
 * Results Analyzer for PWA Caching Strategy Research
 *
 * Analyzes test results and generates statistical summaries
 * for dissertation reporting.
 *
 * Usage: node scripts/analyzeResults.js
 */

const fs = require('fs');
const path = require('path');

const RESULTS_DIR = path.join(__dirname, '../results');
const OUTPUT_DIR = path.join(__dirname, '../reports');

function loadResults() {
  if (!fs.existsSync(RESULTS_DIR)) {
    console.error('Results directory not found. Run tests first.');
    process.exit(1);
  }

  const files = fs.readdirSync(RESULTS_DIR).filter(f => f.endsWith('.json'));
  return files.map(f => {
    const content = fs.readFileSync(path.join(RESULTS_DIR, f), 'utf-8');
    return JSON.parse(content);
  });
}

function calculateStats(values) {
  if (values.length === 0) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / values.length;

  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(variance);

  return {
    count: values.length,
    mean: mean,
    median: sorted[Math.floor(sorted.length / 2)],
    min: sorted[0],
    max: sorted[sorted.length - 1],
    stdDev: stdDev,
    p95: sorted[Math.floor(sorted.length * 0.95)] || sorted[sorted.length - 1],
    p99: sorted[Math.floor(sorted.length * 0.99)] || sorted[sorted.length - 1]
  };
}

function groupBy(results, key) {
  return results.reduce((groups, item) => {
    const value = item[key];
    if (!groups[value]) groups[value] = [];
    groups[value].push(item);
    return groups;
  }, {});
}

function analyzeByStrategy(results) {
  const byStrategy = groupBy(results, 'strategy');
  const analysis = {};

  for (const [strategy, items] of Object.entries(byStrategy)) {
    const loadTimes = items.filter(i => i.success).map(i => i.metrics.loadTime);
    const fcpValues = items.filter(i => i.success && i.metrics.fcp).map(i => i.metrics.fcp);

    analysis[strategy] = {
      totalTests: items.length,
      successRate: (items.filter(i => i.success).length / items.length) * 100,
      loadTime: calculateStats(loadTimes),
      fcp: calculateStats(fcpValues)
    };
  }

  return analysis;
}

function analyzeByNetwork(results) {
  const byNetwork = groupBy(results, 'networkCondition');
  const analysis = {};

  for (const [network, items] of Object.entries(byNetwork)) {
    const loadTimes = items.filter(i => i.success).map(i => i.metrics.loadTime);

    analysis[network] = {
      totalTests: items.length,
      successRate: (items.filter(i => i.success).length / items.length) * 100,
      loadTime: calculateStats(loadTimes)
    };
  }

  return analysis;
}

function generateMarkdownReport(results, strategyAnalysis, networkAnalysis) {
  let md = '# PWA Caching Strategy Performance Analysis\n\n';
  md += `Generated: ${new Date().toISOString()}\n\n`;
  md += `Total Test Results: ${results.length}\n\n`;

  // Strategy comparison table
  md += '## Performance by Caching Strategy\n\n';
  md += '| Strategy | Tests | Success Rate | Avg Load Time | P95 Load Time | Std Dev |\n';
  md += '|----------|-------|--------------|---------------|---------------|--------|\n';

  for (const [strategy, data] of Object.entries(strategyAnalysis)) {
    const lt = data.loadTime;
    if (lt) {
      md += `| ${strategy} | ${data.totalTests} | ${data.successRate.toFixed(1)}% | ${lt.mean.toFixed(0)}ms | ${lt.p95.toFixed(0)}ms | ${lt.stdDev.toFixed(0)}ms |\n`;
    }
  }

  // Network condition table
  md += '\n## Performance by Network Condition\n\n';
  md += '| Network | Tests | Success Rate | Avg Load Time | P95 Load Time |\n';
  md += '|---------|-------|--------------|---------------|---------------|\n';

  for (const [network, data] of Object.entries(networkAnalysis)) {
    const lt = data.loadTime;
    if (lt) {
      md += `| ${network} | ${data.totalTests} | ${data.successRate.toFixed(1)}% | ${lt.mean.toFixed(0)}ms | ${lt.p95.toFixed(0)}ms |\n`;
    }
  }

  // Cross-tabulation
  md += '\n## Strategy x Network Matrix (Avg Load Time in ms)\n\n';

  const strategies = Object.keys(strategyAnalysis);
  const networks = Object.keys(networkAnalysis);

  md += '| Strategy | ' + networks.join(' | ') + ' |\n';
  md += '|----------|' + networks.map(() => '------').join('|') + '|\n';

  for (const strategy of strategies) {
    let row = `| ${strategy} |`;
    for (const network of networks) {
      const filtered = results.filter(r => r.strategy === strategy && r.networkCondition === network && r.success);
      const loadTimes = filtered.map(r => r.metrics.loadTime);
      const avg = loadTimes.length > 0 ? (loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length).toFixed(0) : '-';
      row += ` ${avg} |`;
    }
    md += row + '\n';
  }

  return md;
}

function main() {
  console.log('Loading test results...');
  const results = loadResults();
  console.log(`Loaded ${results.length} test results`);

  console.log('Analyzing by strategy...');
  const strategyAnalysis = analyzeByStrategy(results);

  console.log('Analyzing by network condition...');
  const networkAnalysis = analyzeByNetwork(results);

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Save JSON analysis
  const jsonOutput = {
    generatedAt: new Date().toISOString(),
    totalResults: results.length,
    byStrategy: strategyAnalysis,
    byNetwork: networkAnalysis
  };
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'analysis.json'),
    JSON.stringify(jsonOutput, null, 2)
  );

  // Generate markdown report
  const markdown = generateMarkdownReport(results, strategyAnalysis, networkAnalysis);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'analysis.md'), markdown);

  console.log('\nAnalysis complete!');
  console.log(`- JSON: ${path.join(OUTPUT_DIR, 'analysis.json')}`);
  console.log(`- Markdown: ${path.join(OUTPUT_DIR, 'analysis.md')}`);

  // Print summary
  console.log('\n=== SUMMARY ===\n');
  console.log('By Strategy (Avg Load Time):');
  for (const [strategy, data] of Object.entries(strategyAnalysis)) {
    if (data.loadTime) {
      console.log(`  ${strategy}: ${data.loadTime.mean.toFixed(0)}ms (±${data.loadTime.stdDev.toFixed(0)}ms)`);
    }
  }
}

main();
