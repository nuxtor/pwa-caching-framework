const http = require('http');

// Simulated data
const generateData = () => {
  return Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    title: `Item ${i + 1}`,
    description: `Description for item ${i + 1}`,
    timestamp: new Date().toISOString(),
    value: Math.random() * 100
  }));
};

// Configurable latency (ms)
let simulatedLatency = 0;

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API routes
  if (req.url === '/api/data') {
    setTimeout(() => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(generateData()));
    }, simulatedLatency);
    return;
  }

  if (req.url?.startsWith('/api/latency/')) {
    const latency = parseInt(req.url.split('/').pop() || '0');
    simulatedLatency = Math.min(latency, 10000); // Max 10s
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ latency: simulatedLatency }));
    return;
  }

  if (req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', latency: simulatedLatency }));
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
  console.log('Endpoints:');
  console.log('  GET /api/data - Get sample data');
  console.log('  GET /api/latency/:ms - Set simulated latency');
  console.log('  GET /api/health - Health check');
});
