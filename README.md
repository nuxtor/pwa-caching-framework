# PWA Caching Strategy Framework

A configurable Progressive Web Application framework for empirical comparison of service worker caching strategies. Developed as part of MSc dissertation research.

## Overview

This framework enables systematic testing and comparison of five service worker caching strategies under varying network conditions, measuring their impact on performance metrics and user experience.

## Caching Strategies

| Strategy | Description | Best For |
|----------|-------------|----------|
| Cache-First | Serves cached content, falls back to network | Static assets, fonts, images |
| Network-First | Fetches from network, falls back to cache | Dynamic content, APIs |
| Stale-While-Revalidate | Serves cache immediately, updates in background | Frequently updated content |
| Network-Only | Always fetches from network | Real-time data |
| Cache-Only | Serves only from cache | Pre-cached static content |

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Service Worker:** Workbox 7.x
- **Backend:** Node.js, Express
- **Testing:** Playwright, Lighthouse
- **Metrics:** Web Vitals API, Performance API

## Installation

```bash
cd pwa-caching-framework
npm install
```

## Usage

### Development Server

```bash
# Start the API server
npm run server

# Start the frontend (in another terminal)
npm run dev
```

Access the application at `http://localhost:5173`

### Running Performance Tests

```bash
# Run automated performance tests
npm run test:perf

# Run with browser visible
npm run test:perf:headed
```

### Build for Production

```bash
npm run build
npm run preview
```

## Features

- **Strategy Selector:** Switch between caching strategies in real-time
- **Web Vitals Panel:** Live display of FCP, LCP, CLS, TTI metrics
- **Performance Metrics:** Cache hit rate, load times, transfer sizes
- **User Survey:** Integrated SUS and PWA experience questionnaires
- **Data Export:** Export metrics as JSON/CSV for analysis
- **Network Simulation:** Test under 4G, 3G, Slow 3G, and offline conditions

## Project Structure

```
pwa-caching-framework/
├── src/
│   ├── components/       # React UI components
│   ├── hooks/            # Custom React hooks
│   ├── services/         # Web Vitals, survey services
│   ├── types/            # TypeScript type definitions
│   ├── sw.ts             # Service Worker implementation
│   ├── App.tsx           # Main application
│   └── main.tsx          # Entry point
├── server/
│   └── index.js          # Express API server
├── tests/
│   └── performanceTest.ts # Playwright test suite
└── package.json
```

## Test Matrix

The automated test suite covers:
- 5 caching strategies
- 4 network conditions (4G, 3G, Slow 3G, Offline)
- 3 browsers (Chrome, Firefox, Edge)
- 10 iterations per combination
- **Total: 600 test iterations**

## Metrics Collected

### Performance Metrics
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Time to Interactive (TTI)
- Cumulative Layout Shift (CLS)
- Total Page Load Time
- Cache Hit Rate

### User Experience Metrics
- System Usability Scale (SUS) scores
- Perceived speed ratings
- Data freshness confidence
- Offline experience quality

## License

This project is part of academic research. For inquiries, contact the author.
