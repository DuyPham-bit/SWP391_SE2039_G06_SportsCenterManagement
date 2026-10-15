const assert = require('node:assert/strict');
const path = require('node:path');

(async () => {
  // A closed loopback port reproduces a stopped backend without interrupting the running API.
  process.env.SCMS_API_PROXY_TARGET = 'http://127.0.0.1:1';
  const { createServer } = await import('vite');
  const server = await createServer({
    root: path.resolve(__dirname, '..'),
    configFile: path.resolve(__dirname, '../vite.config.mjs'),
    logLevel: 'silent',
    server: { host: '127.0.0.1', port: 0, open: false }
  });
  try {
    await server.listen();
    const origin = `http://127.0.0.1:${server.httpServer.address().port}`;
    const response = await fetch(`${origin}/api/health`, { signal: AbortSignal.timeout(5000) });
    assert.equal(response.status, 503);
    assert.match(response.headers.get('content-type'), /application\/problem\+json/);
    const problem = await response.json();
    assert.equal(problem.code, 'API_UNAVAILABLE');
    assert.match(problem.message, /127\.0\.0\.1:1/);
    assert.ok(problem.proposedHandling);
    const frontend = await fetch(origin);
    assert.equal(frontend.status, 200);
    console.log('PASS: stopped backend returns actionable JSON 503; frontend remains reachable.');
  } finally { await server.close(); }
})().catch(error => { console.error(error.stack); process.exitCode = 1; });
