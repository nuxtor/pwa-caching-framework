import { useState } from 'react';
import { usePerformanceMetrics } from './hooks/usePerformanceMetrics';
import { StrategySelector, WebVitalsPanel, SurveyPanel } from './components';
import { webVitalsService } from './services/webVitals';

function App() {
  const { currentStrategy, changeStrategy, getReport, clearMetrics, exportMetrics, metrics } = usePerformanceMetrics();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<string>(webVitalsService.getNetworkCondition());
  const [showSurvey, setShowSurvey] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const start = performance.now();

    try {
      const response = await fetch('/api/data');
      const json = await response.json();
      setData(json);

      const duration = performance.now() - start;
      console.log(`Fetch completed in ${duration.toFixed(2)}ms`);
    } catch (error) {
      console.error('Fetch failed:', error);
    } finally {
      setLoading(false);
      setNetworkStatus(webVitalsService.getNetworkCondition());
    }
  };

  const exportAllMetrics = () => {
    const snapshot = webVitalsService.captureSnapshot(currentStrategy);
    const exportData = {
      cacheMetrics: metrics,
      webVitals: snapshot,
      report: getReport()
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `full-metrics-${currentStrategy}-${Date.now()}.json`;
    a.click();
  };

  const report = getReport();

  const buttonStyle: React.CSSProperties = {
    padding: '10px 16px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    background: 'white',
    cursor: 'pointer',
    fontSize: '14px'
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '30px' }}>
        <h1>PWA Caching Strategy Framework</h1>
        <p style={{ color: '#666' }}>MSc Dissertation Research Tool</p>
        <div style={{
          display: 'inline-block',
          padding: '5px 12px',
          background: networkStatus === '4g' ? '#e8f5e9' : networkStatus === '3g' ? '#fff3e0' : '#ffebee',
          borderRadius: '20px',
          fontSize: '13px'
        }}>
          Network: <strong>{networkStatus.toUpperCase()}</strong>
        </div>
      </header>

      {/* Web Vitals Panel */}
      <WebVitalsPanel />

      {/* Strategy Selector */}
      <StrategySelector currentStrategy={currentStrategy} onStrategyChange={changeStrategy} />

      {/* Test Controls */}
      <section style={{ marginBottom: '20px' }}>
        <h2>Test Controls</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={fetchData} disabled={loading} style={buttonStyle}>
            {loading ? 'Loading...' : 'Fetch Data'}
          </button>
          <button onClick={clearMetrics} style={buttonStyle}>
            Clear Metrics
          </button>
          <button onClick={exportMetrics} style={buttonStyle}>
            Export Cache Metrics
          </button>
          <button onClick={exportAllMetrics} style={buttonStyle}>
            Export Full Report
          </button>
          <button
            onClick={() => setShowSurvey(true)}
            style={{
              ...buttonStyle,
              background: '#0066cc',
              color: 'white',
              border: 'none',
              fontWeight: 'bold'
            }}
          >
            Start User Survey
          </button>
        </div>
      </section>

      {/* Survey Panel Modal */}
      {showSurvey && (
        <SurveyPanel
          currentStrategy={currentStrategy}
          onClose={() => setShowSurvey(false)}
        />
      )}

      {/* Performance Report */}
      {report && (
        <section style={{ marginBottom: '20px' }}>
          <h2>Performance Report</h2>
          <table style={{ borderCollapse: 'collapse', width: '100%', maxWidth: '500px' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>Strategy</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{report.strategy}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>Avg Load Time</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{report.metrics.avgLoadTime.toFixed(2)} ms</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>P95 Load Time</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{report.metrics.p95LoadTime.toFixed(2)} ms</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>Cache Hit Rate</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{report.metrics.cacheHitRate.toFixed(1)}%</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>Total Requests</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{report.metrics.totalRequests}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>Network Condition</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{report.networkCondition}</td>
              </tr>
            </tbody>
          </table>
        </section>
      )}

      {/* Raw Metrics */}
      <section>
        <h2>Raw Metrics ({metrics.length} records)</h2>
        <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto', maxHeight: '300px' }}>
          {JSON.stringify(metrics.slice(-10), null, 2)}
        </pre>
      </section>
    </div>
  );
}

export default App;
