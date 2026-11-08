import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import {
  CacheFirst,
  NetworkFirst,
  StaleWhileRevalidate,
  NetworkOnly,
  CacheOnly
} from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare let self: ServiceWorkerGlobalScope;

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST);

// Configuration - can be changed via postMessage
let currentStrategy: string = 'stale-while-revalidate';

// Strategy factory
function getStrategy(strategyName: string) {
  const cacheExpiration = new ExpirationPlugin({
    maxEntries: 50,
    maxAgeSeconds: 60 * 60 * 24 // 24 hours
  });

  switch (strategyName) {
    case 'cache-first':
      return new CacheFirst({
        cacheName: 'api-cache-first',
        plugins: [cacheExpiration]
      });
    case 'network-first':
      return new NetworkFirst({
        cacheName: 'api-network-first',
        networkTimeoutSeconds: 3,
        plugins: [cacheExpiration]
      });
    case 'stale-while-revalidate':
      return new StaleWhileRevalidate({
        cacheName: 'api-swr',
        plugins: [cacheExpiration]
      });
    case 'network-only':
      return new NetworkOnly();
    case 'cache-only':
      return new CacheOnly({
        cacheName: 'api-cache-only'
      });
    default:
      return new StaleWhileRevalidate({
        cacheName: 'api-default',
        plugins: [cacheExpiration]
      });
  }
}

// Register route for API calls
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  ({ request, url, event }) => {
    const strategy = getStrategy(currentStrategy);

    // Log metrics for research
    const startTime = performance.now();

    return strategy.handle({ request, url, event }).then(response => {
      const endTime = performance.now();

      // Send metrics to main thread
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'CACHE_METRICS',
            data: {
              url: url.pathname,
              strategy: currentStrategy,
              duration: endTime - startTime,
              fromCache: response.headers.get('x-sw-cache') === 'true',
              timestamp: Date.now()
            }
          });
        });
      });

      return response;
    });
  }
);

// Listen for strategy change messages
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SET_STRATEGY') {
    currentStrategy = event.data.strategy;
    console.log(`[SW] Strategy changed to: ${currentStrategy}`);
  }
});

// Log service worker lifecycle events
self.addEventListener('install', () => {
  console.log('[SW] Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  console.log('[SW] Activated');
  self.clients.claim();
});
