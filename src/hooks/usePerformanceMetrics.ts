import { useState, useEffect, useCallback } from 'react';
import { CacheMetric, CachingStrategy, PerformanceReport } from '../types';

export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<CacheMetric[]>([]);
  const [currentStrategy, setCurrentStrategy] = useState<CachingStrategy>('stale-while-revalidate');

  // Listen for metrics from service worker
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'CACHE_METRICS') {
        setMetrics(prev => [...prev, event.data.data]);
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleMessage);
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, []);

  // Change caching strategy
  const changeStrategy = useCallback(async (strategy: CachingStrategy) => {
    const registration = await navigator.serviceWorker?.ready;
    registration?.active?.postMessage({
      type: 'SET_STRATEGY',
      strategy
    });
    setCurrentStrategy(strategy);
  }, []);

  // Calculate performance report
  const getReport = useCallback((): PerformanceReport | null => {
    const strategyMetrics = metrics.filter(m => m.strategy === currentStrategy);
    if (strategyMetrics.length === 0) return null;

    const loadTimes = strategyMetrics.map(m => m.duration);
    const sortedTimes = [...loadTimes].sort((a, b) => a - b);
    const cacheHits = strategyMetrics.filter(m => m.fromCache).length;

    return {
      strategy: currentStrategy,
      metrics: {
        avgLoadTime: loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length,
        cacheHitRate: (cacheHits / strategyMetrics.length) * 100,
        totalRequests: strategyMetrics.length,
        p95LoadTime: sortedTimes[Math.floor(sortedTimes.length * 0.95)] || 0
      },
      networkCondition: navigator.connection?.effectiveType || 'unknown',
      timestamp: Date.now()
    };
  }, [metrics, currentStrategy]);

  // Clear metrics
  const clearMetrics = useCallback(() => {
    setMetrics([]);
  }, []);

  // Export metrics as JSON
  const exportMetrics = useCallback(() => {
    const data = JSON.stringify(metrics, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metrics-${currentStrategy}-${Date.now()}.json`;
    a.click();
  }, [metrics, currentStrategy]);

  return {
    metrics,
    currentStrategy,
    changeStrategy,
    getReport,
    clearMetrics,
    exportMetrics
  };
}
