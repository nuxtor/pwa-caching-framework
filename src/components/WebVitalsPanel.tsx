import { useState, useEffect } from 'react';
import { webVitalsService, WebVitalsMetrics } from '../services/webVitals';

interface VitalThreshold {
  good: number;
  needsImprovement: number;
}

const THRESHOLDS: Record<string, VitalThreshold> = {
  fcp: { good: 1800, needsImprovement: 3000 },
  lcp: { good: 2500, needsImprovement: 4000 },
  cls: { good: 0.1, needsImprovement: 0.25 },
  inp: { good: 200, needsImprovement: 500 },
  ttfb: { good: 800, needsImprovement: 1800 },
  tti: { good: 3800, needsImprovement: 7300 }
};

function getScoreColor(metric: keyof WebVitalsMetrics, value: number | null): string {
  if (value === null) return '#999';
  const threshold = THRESHOLDS[metric];
  if (!threshold) return '#999';

  if (value <= threshold.good) return '#0cce6b';
  if (value <= threshold.needsImprovement) return '#ffa400';
  return '#ff4e42';
}

function formatValue(metric: keyof WebVitalsMetrics, value: number | null): string {
  if (value === null) return '-';
  if (metric === 'cls') return value.toFixed(3);
  return `${Math.round(value)} ms`;
}

export function WebVitalsPanel() {
  const [metrics, setMetrics] = useState<WebVitalsMetrics | null>(null);
  const [navigation, setNavigation] = useState<ReturnType<typeof webVitalsService.getNavigationMetrics> | null>(null);

  useEffect(() => {
    // Initial load
    const updateMetrics = () => {
      setMetrics(webVitalsService.getMetrics());
      setNavigation(webVitalsService.getNavigationMetrics());
    };

    // Update after page load
    if (document.readyState === 'complete') {
      updateMetrics();
    } else {
      window.addEventListener('load', updateMetrics);
    }

    // Periodic updates for LCP/CLS which can change
    const interval = setInterval(updateMetrics, 1000);

    return () => {
      window.removeEventListener('load', updateMetrics);
      clearInterval(interval);
    };
  }, []);

  if (!metrics) return null;

  const vitals: { key: keyof WebVitalsMetrics; label: string; description: string }[] = [
    { key: 'fcp', label: 'FCP', description: 'First Contentful Paint' },
    { key: 'lcp', label: 'LCP', description: 'Largest Contentful Paint' },
    { key: 'cls', label: 'CLS', description: 'Cumulative Layout Shift' },
    { key: 'inp', label: 'INP', description: 'Interaction to Next Paint' },
    { key: 'ttfb', label: 'TTFB', description: 'Time to First Byte' },
    { key: 'tti', label: 'TTI', description: 'Time to Interactive' }
  ];

  return (
    <section style={{ marginBottom: '20px' }}>
      <h2>Core Web Vitals</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
        {vitals.map(({ key, label, description }) => (
          <div
            key={key}
            style={{
              padding: '15px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              textAlign: 'center',
              borderLeft: `4px solid ${getScoreColor(key, metrics[key])}`
            }}
          >
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: getScoreColor(key, metrics[key]) }}>
              {formatValue(key, metrics[key])}
            </div>
            <div style={{ fontWeight: 'bold' }}>{label}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{description}</div>
          </div>
        ))}
      </div>

      {navigation && (
        <div style={{ marginTop: '15px', padding: '10px', background: '#f9f9f9', borderRadius: '5px' }}>
          <strong>Navigation Timing:</strong>
          <span style={{ marginLeft: '15px' }}>Load: {Math.round(navigation.loadTime)}ms</span>
          <span style={{ marginLeft: '15px' }}>DOMContentLoaded: {Math.round(navigation.domContentLoaded)}ms</span>
          <span style={{ marginLeft: '15px' }}>Transfer: {(navigation.transferSize / 1024).toFixed(1)} KB</span>
          <span style={{ marginLeft: '15px' }}>Resources: {navigation.resourceCount}</span>
        </div>
      )}
    </section>
  );
}
