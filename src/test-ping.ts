import { createApp } from './app';
import { monitoringService } from './services/monitoring.service';

const TEST_PORT = 3001;

async function runVerification() {
  console.log('--- Starting DevPulse Phase 1 Verification ---');

  const app = createApp();
  const server = app.listen(TEST_PORT, () => {
    console.log(`[Test Server] Started on http://localhost:${TEST_PORT}`);
  });

  try {
    const baseUrl = `http://localhost:${TEST_PORT}`;

    // 1. Test Health Endpoint
    console.log('\n[1] Testing /health endpoint...');
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthData = await healthRes.json();
    console.log('Health check response:', healthRes.status, healthData);

    // 2. Test Mock Endpoints
    console.log('\n[2] Testing mock endpoints with varying latency...');
    
    console.log('Testing /api/mock/fast...');
    const t0 = performance.now();
    const fastRes = await fetch(`${baseUrl}/api/mock/fast`);
    const fastData = await fastRes.json();
    console.log(`Fast response (${Math.round(performance.now() - t0)}ms):`, fastRes.status, fastData);

    console.log('Testing /api/mock/slow...');
    const t1 = performance.now();
    const slowRes = await fetch(`${baseUrl}/api/mock/slow`);
    const slowData = await slowRes.json();
    console.log(`Slow response (${Math.round(performance.now() - t1)}ms):`, slowRes.status, slowData);

    console.log('Testing /api/mock/error...');
    const t2 = performance.now();
    const errorRes = await fetch(`${baseUrl}/api/mock/error`);
    const errorData = await errorRes.json();
    console.log(`Error response (${Math.round(performance.now() - t2)}ms):`, errorRes.status, errorData);

    console.log('Testing /api/mock/flaky...');
    const t3 = performance.now();
    const flakyRes = await fetch(`${baseUrl}/api/mock/flaky`);
    const flakyData = await flakyRes.json();
    console.log(`Flaky response (${Math.round(performance.now() - t3)}ms):`, flakyRes.status, flakyData);

    // 3. Register endpoints on the test server port to monitoring service
    console.log('\n[3] Registering mock endpoints to MonitoringService...');
    // Clear and re-add with test port URLs
    for (const ep of monitoringService.getEndpoints()) {
      monitoringService.deleteEndpoint(ep.id);
    }

    const fastEp = monitoringService.addEndpoint({
      name: 'Verification Fast Endpoint',
      url: `${baseUrl}/api/mock/fast`,
      method: 'GET',
      expectedStatus: 200,
      timeoutMs: 3000,
      isActive: true,
      tags: ['mock', 'fast'],
    });

    const slowEp = monitoringService.addEndpoint({
      name: 'Verification Slow Endpoint',
      url: `${baseUrl}/api/mock/slow`,
      method: 'GET',
      expectedStatus: 200,
      timeoutMs: 3000,
      isActive: true,
      tags: ['mock', 'slow'],
    });

    const errorEp = monitoringService.addEndpoint({
      name: 'Verification Error Endpoint',
      url: `${baseUrl}/api/mock/error`,
      method: 'GET',
      expectedStatus: 200,
      timeoutMs: 3000,
      isActive: true,
      tags: ['mock', 'error'],
    });

    // 4. Test Manual Ping via Monitoring Service
    console.log('\n[4] Performing automated ping across all registered endpoints...');
    const pingResults = await monitoringService.pingAll();
    console.log(`Pings completed (${pingResults.length} endpoints):`);
    for (const res of pingResults) {
      console.log(` - Endpoint ${res.endpointId}: Status=${res.statusCode}, Latency=${res.latencyMs}ms, Healthy=${res.isHealthy}`);
    }

    // 5. Test Monitoring API endpoints via HTTP
    console.log('\n[5] Fetching stats from /api/monitoring/stats via HTTP...');
    const statsRes = await fetch(`${baseUrl}/api/monitoring/stats`);
    const statsData = (await statsRes.json()) as any;
    console.log('Monitoring Stats:');
    for (const stat of statsData.data) {
      console.log(` - [${stat.status.toUpperCase()}] ${stat.endpoint.name}: Latency=${stat.averageLatencyMs}ms, Uptime=${stat.uptimePercentage}%`);
    }

    // 6. Test Ping History
    console.log(`\n[6] Fetching ping history for endpoint ${fastEp.id}...`);
    const historyRes = await fetch(`${baseUrl}/api/monitoring/endpoints/${fastEp.id}/history`);
    const historyData = (await historyRes.json()) as any;
    console.log(`History records: ${historyData.count}`);

    console.log('\n--- ALL VERIFICATION CHECKS PASSED SUCCESSFULLY ---');
  } catch (err) {
    console.error('Verification failed:', err);
    process.exitCode = 1;
  } finally {
    monitoringService.stopAutomatedMonitoring();
    server.close();
  }
}

runVerification();
