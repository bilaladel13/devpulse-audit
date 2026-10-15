import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { monitoringService } from '../src/services/monitoring.service';

describe('DevPulse REST API Integration Tests', () => {
  const app = createApp();

  beforeAll(() => {
    monitoringService.stopAutomatedMonitoring();
  });

  afterAll(() => {
    monitoringService.stopAutomatedMonitoring();
  });

  describe('Static & Health Routes', () => {
    it('GET / should serve the SPA index.html', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/html/);
      expect(res.text).toContain('DevPulse');
    });

    it('GET /health should return system health status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('uptime');
    });
  });

  describe('Mock Endpoints (/api/mock)', () => {
    it('GET /api/mock/fast should return 200 with low latency', async () => {
      const res = await request(app).get('/api/mock/fast');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.simulatedLatencyMs).toBeGreaterThanOrEqual(10);
      expect(res.body.simulatedLatencyMs).toBeLessThanOrEqual(40);
    });

    it('GET /api/mock/slow should return 200 with higher latency', async () => {
      const res = await request(app).get('/api/mock/slow');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.simulatedLatencyMs).toBeGreaterThanOrEqual(400);
    });

    it('GET /api/mock/error should return 500 status', async () => {
      const res = await request(app).get('/api/mock/error');
      expect(res.status).toBe(500);
      expect(res.body.status).toBe('error');
    });

    it('GET /api/mock/flaky should return either 200, 500, or 503', async () => {
      const res = await request(app).get('/api/mock/flaky');
      expect([200, 500, 503]).toContain(res.status);
    });

    it('GET /api/mock/custom should handle custom delay and status code', async () => {
      const res = await request(app).get('/api/mock/custom?delay=10&status=201');
      expect(res.status).toBe(201);
      expect(res.body.simulatedLatencyMs).toBe(10);
    });

    it('GET /api/mock/corrupted should return 200 with application error payload', async () => {
      const res = await request(app).get('/api/mock/corrupted');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('error');
      expect(res.body.code).toBe('ERR_DB_DISCONNECTED');
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('Monitoring API Endpoints (/api/monitoring)', () => {
    let createdEndpointId: string;

    it('GET /api/monitoring/endpoints should return list of endpoints', async () => {
      const res = await request(app).get('/api/monitoring/endpoints');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.count).toBeGreaterThanOrEqual(1);
    });

    it('POST /api/monitoring/endpoints should reject missing required fields', async () => {
      const res = await request(app).post('/api/monitoring/endpoints').send({
        name: 'Incomplete Target',
      });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/monitoring/endpoints should reject invalid URL', async () => {
      const res = await request(app).post('/api/monitoring/endpoints').send({
        name: 'Bad URL Target',
        url: 'not-a-valid-url',
      });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/monitoring/endpoints should create a new target successfully', async () => {
      const res = await request(app).post('/api/monitoring/endpoints').send({
        name: 'Integration Test API',
        url: 'http://localhost:3000/api/mock/custom',
        method: 'GET',
        expectedStatus: 200,
        timeoutMs: 3000,
        tags: ['integration', 'test'],
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe('Integration Test API');
      createdEndpointId = res.body.data.id;
    });

    it('POST /api/monitoring/endpoints should reject duplicate URL and method with 409 Conflict', async () => {
      const res = await request(app).post('/api/monitoring/endpoints').send({
        name: 'Duplicate Target',
        url: 'http://localhost:3000/api/mock/custom',
        method: 'GET',
        expectedStatus: 200,
        timeoutMs: 3000,
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Target URL already being monitored');
    });

    it('GET /api/monitoring/endpoints/:id should return endpoint details with stats', async () => {
      const res = await request(app).get(`/api/monitoring/endpoints/${createdEndpointId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(createdEndpointId);
      expect(res.body.data).toHaveProperty('stats');
    });

    it('PATCH /api/monitoring/endpoints/:id/toggle should pause and resume an endpoint', async () => {
      // Pause
      const pauseRes = await request(app).patch(`/api/monitoring/endpoints/${createdEndpointId}/toggle`);
      expect(pauseRes.status).toBe(200);
      expect(pauseRes.body.success).toBe(true);
      expect(pauseRes.body.data.isActive).toBe(false);

      // Resume
      const resumeRes = await request(app).patch(`/api/monitoring/endpoints/${createdEndpointId}/toggle`);
      expect(resumeRes.status).toBe(200);
      expect(resumeRes.body.success).toBe(true);
      expect(resumeRes.body.data.isActive).toBe(true);
    });

    it('PUT /api/monitoring/endpoints/:id should update endpoint configuration', async () => {
      const res = await request(app).put(`/api/monitoring/endpoints/${createdEndpointId}`).send({
        name: 'Updated Integration Target',
        expectedStatus: 204,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Integration Target');
      expect(res.body.data.expectedStatus).toBe(204);
    });

    it('POST /api/monitoring/endpoints/:id/ping should perform manual ping', async () => {
      const res = await request(app).post(`/api/monitoring/endpoints/${createdEndpointId}/ping`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('latencyMs');
      expect(res.body.data).toHaveProperty('isHealthy');
    });

    it('GET /api/monitoring/endpoints/:id/history should return ping records', async () => {
      const res = await request(app).get(`/api/monitoring/endpoints/${createdEndpointId}/history`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.count).toBeGreaterThanOrEqual(1);
    });

    it('GET /api/monitoring/endpoints/:id/diagnostic should return diagnostic snapshot and cURL command', async () => {
      const res = await request(app).get(`/api/monitoring/endpoints/${createdEndpointId}/diagnostic`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('endpoint');
      expect(res.body.data).toHaveProperty('diagnostic');
      expect(res.body.data.diagnostic).toHaveProperty('curlCommand');
      expect(res.body.data.diagnostic.curlCommand).toContain('curl -X GET');
      expect(res.body.data.diagnostic).toHaveProperty('timingBreakdown');
    });

    it('POST /api/monitoring/endpoints should support assertion rules', async () => {
      const res = await request(app).post('/api/monitoring/endpoints').send({
        name: 'Asserted Target API',
        url: 'http://localhost:3000/api/mock/asserted-target',
        method: 'GET',
        expectedStatus: 200,
        assertions: [
          { type: 'not_contains', expectedValue: 'ERR_FAIL' },
          { type: 'json_key_value', property: 'status', expectedValue: 'ok' },
        ],
      });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.assertions).toHaveLength(2);
    });

    it('POST /api/monitoring/ping-all should ping all active endpoints', async () => {
      const res = await request(app).post('/api/monitoring/ping-all');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/monitoring/stats should return aggregate stats array and metrics', async () => {
      const res = await request(app).get('/api/monitoring/stats');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('isMonitoringRunning');
      expect(res.body).toHaveProperty('metrics');
      expect(res.body.metrics).toHaveProperty('overallHealthPercentage');
      expect(res.body.metrics).toHaveProperty('activeEndpoints');
      expect(res.body.metrics).toHaveProperty('pausedEndpoints');
      expect(res.body.metrics).toHaveProperty('activeIncidentsCount');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/monitoring/settings and PUT /api/monitoring/settings should manage settings', async () => {
      const getRes = await request(app).get('/api/monitoring/settings');
      expect(getRes.status).toBe(200);
      expect(getRes.body.success).toBe(true);
      expect(getRes.body.data).toHaveProperty('latencyThresholdMs');

      const putRes = await request(app).put('/api/monitoring/settings').send({
        latencyThresholdMs: 650,
        pingIntervalMs: 12000,
      });
      expect(putRes.status).toBe(200);
      expect(putRes.body.success).toBe(true);
      expect(putRes.body.data.latencyThresholdMs).toBe(650);
      expect(putRes.body.data.pingIntervalMs).toBe(12000);
    });

    it('GET /api/monitoring/incidents should return recent incidents', async () => {
      const res = await request(app).get('/api/monitoring/incidents');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/monitoring/export and POST /api/monitoring/import should handle data portability with deduplication', async () => {
      const exportRes = await request(app).get('/api/monitoring/export');
      expect(exportRes.status).toBe(200);
      expect(exportRes.body.success).toBe(true);
      expect(exportRes.body.data).toHaveProperty('endpoints');

      // Import includes 1 brand new endpoint and 1 duplicate of an already existing endpoint
      const importRes = await request(app).post('/api/monitoring/import').send({
        endpoints: [
          {
            name: 'Import Target API New',
            url: 'http://localhost:3000/api/mock/new-target',
            method: 'GET',
            expectedStatus: 200,
            timeoutMs: 3000,
            isActive: true,
          },
          {
            name: 'Import Duplicate Fast API',
            url: 'http://localhost:3000/api/mock/fast',
            method: 'GET',
            expectedStatus: 200,
            timeoutMs: 3000,
            isActive: true,
          },
        ],
        settings: { latencyThresholdMs: 550 },
      });
      expect(importRes.status).toBe(200);
      expect(importRes.body.success).toBe(true);
      expect(importRes.body.importedCount).toBe(1);
      expect(importRes.body.skippedDuplicates).toHaveLength(1);
      expect(importRes.body.skippedDuplicates[0]).toContain('GET http://localhost:3000/api/mock/fast');
    });

    it('POST /api/monitoring/start and POST /api/monitoring/stop should control monitoring state', async () => {
      const startRes = await request(app).post('/api/monitoring/start').send({ intervalMs: 5000 });
      expect(startRes.status).toBe(200);
      expect(startRes.body.success).toBe(true);

      const stopRes = await request(app).post('/api/monitoring/stop');
      expect(stopRes.status).toBe(200);
      expect(stopRes.body.success).toBe(true);
    });

    it('DELETE /api/monitoring/endpoints/:id should remove the endpoint', async () => {
      const res = await request(app).delete(`/api/monitoring/endpoints/${createdEndpointId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const verifyRes = await request(app).get(`/api/monitoring/endpoints/${createdEndpointId}`);
      expect(verifyRes.status).toBe(404);
    });
  });

  describe('Unmatched API Routes', () => {
    it('GET /api/unknown-route should return 404 JSON', async () => {
      const res = await request(app).get('/api/unknown-route');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
