/**
 * Automated Performance Testing Script
 *
 * Runs systematic performance tests across:
 * - 5 caching strategies
 * - 4 network conditions
 * - Multiple iterations
 *
 * Usage: npx playwright test tests/performanceTest.ts
 */

import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const STRATEGIES = [
  'cache-first',
  'network-first',
  'stale-while-revalidate',
  'network-only',
  'cache-only'
] as const;

const NETWORK_CONDITIONS = {
  '4G': { downloadThroughput: 4 * 1024 * 1024 / 8, uploadThroughput: 3 * 1024 * 1024 / 8, latency: 20 },
  '3G': { downloadThroughput: 1.5 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8, latency: 40 },
  'Slow3G': { downloadThroughput: 500 * 1024 / 8, uploadThroughput: 500 * 1024 / 8, latency: 100 },
  'Offline': null
} as const;

const ITERATIONS_PER_COMBINATION = 10;
const BASE_URL = 'http://localhost:5173';

interface TestResult {
  strategy: string;
  networkCondition: string;
  iteration: number;
  browser: string;
  timestamp: number;
  metrics: {
    fcp: number | null;
    lcp: number | null;
    cls: number | null;
    ttfb: number | null;
    loadTime: number;
    domContentLoaded: number;
    transferSize: number;
  };
  cacheMetrics: {
    hitRate: number;
    totalRequests: number;
  };
  success: boolean;
  error?: string;
}

async function runTest(
  page: any,
  context: any,
  strategy: string,
  networkCondition: keyof typeof NETWORK_CONDITIONS,
  iteration: number,
  browser: string
): Promise<TestResult> {
  const result: TestResult = {
    strategy,
    networkCondition,
    iteration,
    browser,
    timestamp: Date.now(),
    metrics: {
      fcp: null,
      lcp: null,
      cls: null,
      ttfb: null,
      loadTime: 0,
      domContentLoaded: 0,
      transferSize: 0
    },
    cacheMetrics: {
      hitRate: 0,
      totalRequests: 0
    },
    success: false
  };

  try {
    // Clear browser state
    await context.clearCookies();

    // Apply network throttling via CDP
    const client = await context.newCDPSession(page);

    if (networkCondition === 'Offline') {
      await client.send('Network.enable');
      await client.send('Network.emulateNetworkConditions', {
        offline: true,
        downloadThroughput: 0,
        uploadThroughput: 0,
        latency: 0
      });
    } else if (NETWORK_CONDITIONS[networkCondition]) {
      await client.send('Network.enable');
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        ...NETWORK_CONDITIONS[networkCondition]
      });
    }

    // Navigate and wait for load
    const startTime = Date.now();
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;

    // Set caching strategy
    await page.evaluate((strat: string) => {
      navigator.serviceWorker?.ready.then(reg => {
        reg.active?.postMessage({ type: 'SET_STRATEGY', strategy: strat });
      });
    }, strategy);

    // Wait for strategy to apply
    await page.waitForTimeout(500);

    // Trigger data fetch
    await page.click('button:has-text("Fetch Data")');
    await page.waitForTimeout(2000);

    // Collect Web Vitals
    const metrics = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

      const fcp = paint.find(p => p.name === 'first-contentful-paint');

      return {
        fcp: fcp?.startTime ?? null,
        ttfb: nav?.responseStart ?? null,
        loadTime: nav?.loadEventEnd - nav?.startTime ?? 0,
        domContentLoaded: nav?.domContentLoadedEventEnd - nav?.startTime ?? 0,
        transferSize: resources.reduce((sum, r) => sum + (r.transferSize || 0), 0)
      };
    });

    result.metrics = { ...result.metrics, ...metrics };
    result.success = true;

    // Reset network conditions
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: -1,
      uploadThroughput: -1,
      latency: 0
    });

  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
  }

  return result;
}

// Generate test cases
for (const strategy of STRATEGIES) {
  for (const networkCondition of Object.keys(NETWORK_CONDITIONS) as Array<keyof typeof NETWORK_CONDITIONS>) {
    test.describe(`${strategy} - ${networkCondition}`, () => {
      for (let i = 1; i <= ITERATIONS_PER_COMBINATION; i++) {
        test(`iteration ${i}`, async ({ page, context, browserName }) => {
          const result = await runTest(
            page,
            context,
            strategy,
            networkCondition,
            i,
            browserName
          );

          // Save result
          const resultsDir = path.join(__dirname, '../results');
          if (!fs.existsSync(resultsDir)) {
            fs.mkdirSync(resultsDir, { recursive: true });
          }

          const filename = `${strategy}_${networkCondition}_${browserName}_${i}.json`;
          fs.writeFileSync(
            path.join(resultsDir, filename),
            JSON.stringify(result, null, 2)
          );

          // Assert success
          if (!result.success) {
            throw new Error(result.error);
          }
        });
      }
    });
  }
}
