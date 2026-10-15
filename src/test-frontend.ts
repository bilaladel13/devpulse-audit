import { createApp } from './app';

const TEST_PORT = 3002;

async function verifyFrontend() {
  console.log('--- Starting Phase 2 Frontend & Static Serving Verification ---');

  const app = createApp();
  const server = app.listen(TEST_PORT, () => {
    console.log(`[Test Server] Listening on http://localhost:${TEST_PORT}`);
  });

  try {
    const baseUrl = `http://localhost:${TEST_PORT}`;

    // 1. Verify Root Route (/) serves index.html
    console.log('\n[1] Testing GET / (SPA index.html)...');
    const rootRes = await fetch(`${baseUrl}/`);
    const rootText = await rootRes.text();
    const contentType = rootRes.headers.get('content-type') || '';

    console.log(`Status: ${rootRes.status}, Content-Type: ${contentType}`);
    if (rootRes.status === 200 && rootText.includes('DevPulse - API Monitoring Dashboard')) {
      console.log('PASS: Root route correctly serves DevPulse SPA dashboard.');
    } else {
      throw new Error(`FAIL: Root route failed to return index.html. Received status ${rootRes.status}`);
    }

    // 2. Verify Static CSS (/style.css)
    console.log('\n[2] Testing GET /style.css...');
    const cssRes = await fetch(`${baseUrl}/style.css`);
    const cssText = await cssRes.text();
    console.log(`Status: ${cssRes.status}, Size: ${cssText.length} bytes`);
    if (cssRes.status === 200 && cssText.includes('glass-panel')) {
      console.log('PASS: Static style.css served successfully.');
    } else {
      throw new Error('FAIL: Failed to serve style.css.');
    }

    // 3. Verify Static JS (/app.js)
    console.log('\n[3] Testing GET /app.js...');
    const jsRes = await fetch(`${baseUrl}/app.js`);
    const jsText = await jsRes.text();
    console.log(`Status: ${jsRes.status}, Size: ${jsText.length} bytes`);
    if (jsRes.status === 200 && jsText.includes('DevPulse - API Monitoring Dashboard')) {
      console.log('PASS: Static app.js served successfully.');
    } else {
      throw new Error('FAIL: Failed to serve app.js.');
    }

    // 4. Verify API route still works alongside static routing
    console.log('\n[4] Testing GET /api/monitoring/stats...');
    const statsRes = await fetch(`${baseUrl}/api/monitoring/stats`);
    const statsData = (await statsRes.json()) as any;
    console.log(`Status: ${statsRes.status}, Endpoints count: ${statsData.count}`);
    if (statsRes.status === 200 && statsData.success) {
      console.log('PASS: API stats endpoint functions properly alongside static files.');
    } else {
      throw new Error('FAIL: API stats failed.');
    }

    // 5. Verify Add Endpoint via POST /api/monitoring/endpoints
    console.log('\n[5] Testing POST /api/monitoring/endpoints...');
    const addRes = await fetch(`${baseUrl}/api/monitoring/endpoints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Frontend Test Target',
        url: `${baseUrl}/api/mock/fast`,
        method: 'GET',
        expectedStatus: 200,
        timeoutMs: 3000,
        tags: ['test', 'frontend'],
      }),
    });
    const addData = (await addRes.json()) as any;
    console.log(`Status: ${addRes.status}, Created Endpoint ID: ${addData.data?.id}`);
    if (addRes.status === 201 && addData.success) {
      console.log('PASS: Add endpoint API functions as expected.');
    } else {
      throw new Error('FAIL: Add endpoint API failed.');
    }

    console.log('\n--- ALL FRONTEND & STATIC ROUTING VERIFICATIONS PASSED ---');
  } catch (err) {
    console.error('Frontend verification failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

verifyFrontend();
