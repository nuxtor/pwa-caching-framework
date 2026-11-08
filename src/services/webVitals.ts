/**
 * Web Vitals Service
 * Collects Core Web Vitals and additional performance metrics
 * for dissertation research on PWA caching strategies
 */

export interface WebVitalsMetrics {
  fcp: number | null;  // First Contentful Paint
  lcp: number | null;  // Largest Contentful Paint
  cls: number | null;  // Cumulative Layout Shift
  inp: number | null;  // Interaction to Next Paint (replaced FID)
  ttfb: number | null; // Time to First Byte
  tti: number | null;  // Time to Interactive (estimated)
}

export interface PerformanceSnapshot {
  webVitals: WebVitalsMetrics;
  navigation: {
    loadTime: number;
    domContentLoaded: number;
    domInteractive: number;
    transferSize: number;
    resourceCount: number;
  };
  timestamp: number;
  strategy: string;
  networkCondition: string;
}

class WebVitalsService {
  private fcpValue: number | null = null;
  private lcpValue: number | null = null;
  private clsValue: number | null = null;
  private inpValue: number | null = null;

  constructor() {
    this.initObservers();
  }

  private initObservers(): void {
    // First Contentful Paint
    this.observePaint('first-contentful-paint', (value) => {
      this.fcpValue = value;
    });

    // Largest Contentful Paint
    this.observeLCP();

    // Cumulative Layout Shift
    this.observeCLS();

    // Interaction to Next Paint
    this.observeINP();
  }

  private observePaint(name: string, callback: (value: number) => void): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const entry = entries.find(e => e.name === name);
        if (entry) {
          callback(entry.startTime);
        }
      });
      observer.observe({ type: 'paint', buffered: true });
    } catch (e) {
      console.warn(`Paint observer not supported: ${name}`);
    }
  }

  private observeLCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          this.lcpValue = lastEntry.startTime;
        }
      });
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {
      console.warn('LCP observer not supported');
    }
  }

  private observeCLS(): void {
    try {
      let clsTotal = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) {
          if (!entry.hadRecentInput) {
            clsTotal += entry.value;
          }
        }
        this.clsValue = clsTotal;
      });
      observer.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
      console.warn('CLS observer not supported');
    }
  }

  private observeINP(): void {
    try {
      let maxINP = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) {
          if (entry.duration > maxINP) {
            maxINP = entry.duration;
          }
        }
        this.inpValue = maxINP;
      });
      observer.observe({ type: 'event', buffered: true });
    } catch (e) {
      console.warn('INP observer not supported');
    }
  }

  getMetrics(): WebVitalsMetrics {
    const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;

    return {
      fcp: this.fcpValue,
      lcp: this.lcpValue,
      cls: this.clsValue,
      inp: this.inpValue,
      ttfb: navEntry?.responseStart ?? null,
      tti: this.estimateTTI()
    };
  }

  private estimateTTI(): number | null {
    const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (!navEntry) return null;

    // Simple TTI estimation: domInteractive + longest blocking task
    // For more accurate TTI, use web-vitals library
    return navEntry.domInteractive;
  }

  getNavigationMetrics() {
    const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    if (!navEntry) {
      return {
        loadTime: 0,
        domContentLoaded: 0,
        domInteractive: 0,
        transferSize: 0,
        resourceCount: 0
      };
    }

    const totalTransfer = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);

    return {
      loadTime: navEntry.loadEventEnd - navEntry.startTime,
      domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.startTime,
      domInteractive: navEntry.domInteractive - navEntry.startTime,
      transferSize: totalTransfer,
      resourceCount: resources.length
    };
  }

  getNetworkCondition(): string {
    const connection = (navigator as any).connection;
    if (!connection) return 'unknown';

    return connection.effectiveType || 'unknown';
  }

  captureSnapshot(strategy: string): PerformanceSnapshot {
    return {
      webVitals: this.getMetrics(),
      navigation: this.getNavigationMetrics(),
      timestamp: Date.now(),
      strategy,
      networkCondition: this.getNetworkCondition()
    };
  }

  reset(): void {
    this.fcpValue = null;
    this.lcpValue = null;
    this.clsValue = null;
    this.inpValue = null;
  }
}

export const webVitalsService = new WebVitalsService();
