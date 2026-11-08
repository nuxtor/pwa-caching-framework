import { CachingStrategy } from '../types';

interface StrategySelectorProps {
  currentStrategy: CachingStrategy;
  onStrategyChange: (strategy: CachingStrategy) => void;
}

const STRATEGIES: { value: CachingStrategy; label: string; description: string; useCase: string }[] = [
  {
    value: 'cache-first',
    label: 'Cache First',
    description: 'Serve from cache, fallback to network',
    useCase: 'Static assets, images, fonts'
  },
  {
    value: 'network-first',
    label: 'Network First',
    description: 'Fetch from network, fallback to cache',
    useCase: 'API data, real-time content'
  },
  {
    value: 'stale-while-revalidate',
    label: 'Stale While Revalidate',
    description: 'Serve cache immediately, update in background',
    useCase: 'Frequently updated content'
  },
  {
    value: 'network-only',
    label: 'Network Only',
    description: 'Always fetch from network, no caching',
    useCase: 'Analytics, real-time data'
  },
  {
    value: 'cache-only',
    label: 'Cache Only',
    description: 'Only serve from pre-populated cache',
    useCase: 'Offline-first apps'
  }
];

export function StrategySelector({ currentStrategy, onStrategyChange }: StrategySelectorProps) {
  return (
    <section style={{ marginBottom: '20px' }}>
      <h2>Caching Strategy</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
        {STRATEGIES.map(strategy => (
          <button
            key={strategy.value}
            onClick={() => onStrategyChange(strategy.value)}
            style={{
              padding: '15px',
              border: currentStrategy === strategy.value ? '2px solid #0066cc' : '1px solid #ddd',
              borderRadius: '8px',
              background: currentStrategy === strategy.value ? '#e6f0ff' : 'white',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{strategy.label}</div>
            <div style={{ fontSize: '13px', color: '#666', marginBottom: '5px' }}>{strategy.description}</div>
            <div style={{ fontSize: '11px', color: '#999' }}>Use case: {strategy.useCase}</div>
          </button>
        ))}
      </div>
    </section>
  );
}
