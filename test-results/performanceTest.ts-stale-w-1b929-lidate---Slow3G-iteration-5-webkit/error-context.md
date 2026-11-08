# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: performanceTest.ts >> stale-while-revalidate - Slow3G >> iteration 5
- Location: tests\performanceTest.ts:169:13

# Error details

```
Error: browserContext.newCDPSession: CDP session is only available in Chromium
```

# Test source

```ts
  93  | 
  94  |     if (networkCondition === 'Offline') {
  95  |       await client.send('Network.enable');
  96  |       await client.send('Network.emulateNetworkConditions', {
  97  |         offline: true,
  98  |         downloadThroughput: 0,
  99  |         uploadThroughput: 0,
  100 |         latency: 0
  101 |       });
  102 |     } else if (NETWORK_CONDITIONS[networkCondition]) {
  103 |       await client.send('Network.enable');
  104 |       await client.send('Network.emulateNetworkConditions', {
  105 |         offline: false,
  106 |         ...NETWORK_CONDITIONS[networkCondition]
  107 |       });
  108 |     }
  109 | 
  110 |     // Navigate and wait for load
  111 |     const startTime = Date.now();
  112 |     await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  113 |     const loadTime = Date.now() - startTime;
  114 | 
  115 |     // Set caching strategy
  116 |     await page.evaluate((strat: string) => {
  117 |       navigator.serviceWorker?.ready.then(reg => {
  118 |         reg.active?.postMessage({ type: 'SET_STRATEGY', strategy: strat });
  119 |       });
  120 |     }, strategy);
  121 | 
  122 |     // Wait for strategy to apply
  123 |     await page.waitForTimeout(500);
  124 | 
  125 |     // Trigger data fetch
  126 |     await page.click('button:has-text("Fetch Data")');
  127 |     await page.waitForTimeout(2000);
  128 | 
  129 |     // Collect Web Vitals
  130 |     const metrics = await page.evaluate(() => {
  131 |       const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  132 |       const paint = performance.getEntriesByType('paint');
  133 |       const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  134 | 
  135 |       const fcp = paint.find(p => p.name === 'first-contentful-paint');
  136 | 
  137 |       return {
  138 |         fcp: fcp?.startTime ?? null,
  139 |         ttfb: nav?.responseStart ?? null,
  140 |         loadTime: nav?.loadEventEnd - nav?.startTime ?? 0,
  141 |         domContentLoaded: nav?.domContentLoadedEventEnd - nav?.startTime ?? 0,
  142 |         transferSize: resources.reduce((sum, r) => sum + (r.transferSize || 0), 0)
  143 |       };
  144 |     });
  145 | 
  146 |     result.metrics = { ...result.metrics, ...metrics };
  147 |     result.success = true;
  148 | 
  149 |     // Reset network conditions
  150 |     await client.send('Network.emulateNetworkConditions', {
  151 |       offline: false,
  152 |       downloadThroughput: -1,
  153 |       uploadThroughput: -1,
  154 |       latency: 0
  155 |     });
  156 | 
  157 |   } catch (error) {
  158 |     result.error = error instanceof Error ? error.message : String(error);
  159 |   }
  160 | 
  161 |   return result;
  162 | }
  163 | 
  164 | // Generate test cases
  165 | for (const strategy of STRATEGIES) {
  166 |   for (const networkCondition of Object.keys(NETWORK_CONDITIONS) as Array<keyof typeof NETWORK_CONDITIONS>) {
  167 |     test.describe(`${strategy} - ${networkCondition}`, () => {
  168 |       for (let i = 1; i <= ITERATIONS_PER_COMBINATION; i++) {
  169 |         test(`iteration ${i}`, async ({ page, context, browserName }) => {
  170 |           const result = await runTest(
  171 |             page,
  172 |             context,
  173 |             strategy,
  174 |             networkCondition,
  175 |             i,
  176 |             browserName
  177 |           );
  178 | 
  179 |           // Save result
  180 |           const resultsDir = path.join(__dirname, '../results');
  181 |           if (!fs.existsSync(resultsDir)) {
  182 |             fs.mkdirSync(resultsDir, { recursive: true });
  183 |           }
  184 | 
  185 |           const filename = `${strategy}_${networkCondition}_${browserName}_${i}.json`;
  186 |           fs.writeFileSync(
  187 |             path.join(resultsDir, filename),
  188 |             JSON.stringify(result, null, 2)
  189 |           );
  190 | 
  191 |           // Assert success
  192 |           if (!result.success) {
> 193 |             throw new Error(result.error);
      |                   ^ Error: browserContext.newCDPSession: CDP session is only available in Chromium
  194 |           }
  195 |         });
  196 |       }
  197 |     });
  198 |   }
  199 | }
  200 | 
```