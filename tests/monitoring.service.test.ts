import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MonitoringService } from '../src/services/monitoring.service';

describe('MonitoringService Unit Tests', () => {
  let service: MonitoringService;

  beforeEach(() => {
    service = new MonitoringService();
    // Stop any timer initiated
    service.stopAutomatedMonitoring();
  });

  afterEach(() => {
    service.stopAutomatedMonitoring();
  });

  describe('Endpoint Management', () => {
    it('should seed default mock endpoints', () => {
      const endpoints = service.getEndpoints();
      expect(endpoints.length).toBeGreaterThanOrEqual(4);
      expect(endpoints.some((e) => e.name.includes('Mock Fast'))).toBe(true);
    });

    it('should add a new endpoint correctly', () => {
      const newEp = service.addEndpoint({
        name: 'Test Endpoint',
        url: 'https://example.com/api',
        method: 'GET',
        expectedStatus: 200,
        timeoutMs: 3000,
        isActive: true,
        tags: ['test'],
      });

      expect(newEp.id).toBeDefined();
      expect(newEp.createdAt).toBeDefined();
      expect(service.getEndpointById(newEp.id)).toEqual(newEp);
    });

    it('should update an existing endpoint', () => {
      const newEp = service.addEndpoint({
        name: 'Update Target',
        url: 'https://example.com/update',
        method: 'GET',
        expectedStatus: 200,
        timeoutMs: 3000,
        isActive: true,
      });

      const updated = service.updateEndpoint(newEp.id, {
        name: 'Updated Target Name',
        expectedStatus: 204,
      });

      expect(updated).toBeDefined();
      expect(updated?.name).toBe('Updated Target Name');
      expect(updated?.expectedStatus).toBe(204);
      expect(service.getEndpointById(newEp.id)?.name).toBe('Updated Target Name');
    });

    it('should toggle endpoint active/paused state', () => {
      const ep = service.addEndpoint({
        name: 'Toggle Target',
        url: 'https://example.com/toggle',
        method: 'GET',
        expectedStatus: 200,
        timeoutMs: 3000,
        isActive: true,
      });

      expect(ep.isActive).toBe(true);
      const paused = service.toggleEndpointActive(ep.id);
      expect(paused?.isActive).toBe(false);

      const resumed = service.toggleEndpointActive(ep.id);
      expect(resumed?.isActive).toBe(true);
    });

    it('should return undefined when toggling non-existent endpoint', () => {
      const result = service.toggleEndpointActive('non_existent_id');
      expect(result).toBeUndefined();
    });

    it('should delete an endpoint and its history', () => {
      const ep = service.addEndpoint({
        name: 'To Delete',
        url: 'https://example.com/delete',
        method: 'GET',
        expectedStatus: 200,
        timeoutMs: 3000,
        isActive: true,
      });

      const deleted = service.deleteEndpoint(ep.id);
      expect(deleted).toBe(true);
      expect(service.getEndpointById(ep.id)).toBeUndefined();
      expect(service.getHistory(ep.id)).toEqual([]);
    });
  });

  describe('Calculation Logic & Health Classification', () => {
    it('should report unknown status and 100% uptime when no pings exist', () => {
      const ep = service.addEndpoint({
        name: 'No Pings',
        url: 'https://example.com/no-pings',
        method: 'GET',
        expectedStatus: 200,
        timeoutMs: 3000,
        isActive: true,
      });

      const stats = service.getEndpointStats(ep.id);
      expect(stats).toBeDefined();
      expect(stats?.status).toBe('unknown');
      expect(stats?.uptimePercentage).toBe(100);
      expect(stats?.averageLatencyMs).toBe(0);
      expect(stats?.totalChecks).toBe(0);
    });

    it('should classify endpoint as healthy when all pings succeed with low latency', () => {
      const ep = service.addEndpoint({
        name: 'Healthy Target',
        url: 'https://example.com/healthy',
        method: 'GET',
        expectedStatus: 200,
        timeoutMs: 3000,
        isActive: true,
      });

      for (let i = 0; i < 5; i++) {
        (service as any).recordPing(ep.id, {
          id: `p_${i}`,
          endpointId: ep.id,
          timestamp: new Date().toISOString(),
          statusCode: 200,
          statusText: 'OK',
          latencyMs: 50,
          isHealthy: true,
        });
      }

      const stats = service.getEndpointStats(ep.id);
      expect(stats?.status).toBe('healthy');
      expect(stats?.uptimePercentage).toBe(100);
      expect(stats?.averageLatencyMs).toBe(50);
      expect(stats?.totalChecks).toBe(5);
      expect(stats?.successfulChecks).toBe(5);
    });

    it('should classify endpoint as degraded when average latency exceeds threshold', () => {
      const ep = service.addEndpoint({
        name: 'Slow Target',
        url: 'https://example.com/slow',
        method: 'GET',
        expectedStatus: 200,
        timeoutMs: 3000,
        isActive: true,
      });

      // Default threshold is 500ms
      for (let i = 0; i < 5; i++) {
        (service as any).recordPing(ep.id, {
          id: `p_slow_${i}`,
          endpointId: ep.id,
          timestamp: new Date().toISOString(),
          statusCode: 200,
          statusText: 'OK',
          latencyMs: 650,
          isHealthy: true,
        });
      }

      const stats = service.getEndpointStats(ep.id);
      expect(stats?.status).toBe('degraded');
      expect(stats?.uptimePercentage).toBe(100);
      expect(stats?.averageLatencyMs).toBe(650);

      // Now customize threshold to 800ms
      service.updateSettings({ latencyThresholdMs: 800 });
      const updatedStats = service.getEndpointStats(ep.id);
      expect(updatedStats?.status).toBe('healthy');
    });

    it('should classify endpoint as degraded when uptime is below 90% but last ping is healthy', () => {
      const ep = service.addEndpoint({
        name: 'Flaky Target',
        url: 'https://example.com/flaky',
        method: 'GET',
        expectedStatus: 200,
        timeoutMs: 3000,
        isActive: true,
      });

      for (let i = 0; i < 8; i++) {
        (service as any).recordPing(ep.id, {
          id: `p_fail_${i}`,
          endpointId: ep.id,
          timestamp: new Date().toISOString(),
          statusCode: 500,
          statusText: 'Error',
          latencyMs: 80,
          isHealthy: false,
        });
      }

      (service as any).recordPing(ep.id, {
        id: 'p_last_healthy',
        endpointId: ep.id,
        timestamp: new Date().toISOString(),
        statusCode: 200,
        statusText: 'OK',
        latencyMs: 80,
        isHealthy: true,
      });

      const stats = service.getEndpointStats(ep.id);
      expect(stats?.status).toBe('degraded');
      expect(stats?.uptimePercentage).toBeLessThan(90);
    });

    it('should classify endpoint as down when last ping is unhealthy', () => {
      const ep = service.addEndpoint({
        name: 'Down Target',
        url: 'https://example.com/down',
        method: 'GET',
        expectedStatus: 200,
        timeoutMs: 3000,
        isActive: true,
      });

      for (let i = 0; i < 4; i++) {
        (service as any).recordPing(ep.id, {
          id: `p_ok_${i}`,
          endpointId: ep.id,
          timestamp: new Date().toISOString(),
          statusCode: 200,
          statusText: 'OK',
          latencyMs: 40,
          isHealthy: true,
        });
      }

      (service as any).recordPing(ep.id, {
        id: 'p_fail_latest',
        endpointId: ep.id,
        timestamp: new Date().toISOString(),
        statusCode: 500,
        statusText: 'Internal Server Error',
        latencyMs: 45,
        isHealthy: false,
        errorMessage: 'Server crashed',
      });

      const stats = service.getEndpointStats(ep.id);
      expect(stats?.status).toBe('down');
      expect(stats?.lastPing?.isHealthy).toBe(false);
    });

    it('should log incident events on failure and recovery', () => {
      const ep = service.addEndpoint({
        name: 'Incident Target',
        url: 'https://example.com/incident',
        method: 'GET',
        expectedStatus: 200,
        timeoutMs: 3000,
        isActive: true,
      });

      // Fail ping -> logs down incident
      (service as any).recordPing(ep.id, {
        id: 'p_fail',
        endpointId: ep.id,
        timestamp: new Date().toISOString(),
        statusCode: 500,
        statusText: 'Internal Server Error',
        latencyMs: 50,
        isHealthy: false,
      });

      const incidentsAfterFail = service.getIncidents();
      expect(incidentsAfterFail.length).toBe(1);
      expect(incidentsAfterFail[0].type).toBe('down');

      // Recover ping -> logs recovery and resolves previous incident
      (service as any).recordPing(ep.id, {
        id: 'p_recover',
        endpointId: ep.id,
        timestamp: new Date().toISOString(),
        statusCode: 200,
        statusText: 'OK',
        latencyMs: 40,
        isHealthy: true,
      });

      const incidentsAfterRecovery = service.getIncidents();
      expect(incidentsAfterRecovery.some((inc) => inc.type === 'recovered')).toBe(true);
    });

    it('should calculate aggregate metrics evaluating only active targets', () => {
      service.clearAllEndpoints();

      // Add 2 healthy active endpoints
      const ep1 = service.addEndpoint({
        name: 'Active 1',
        url: 'https://example.com/1',
        method: 'GET',
        expectedStatus: 200,
        timeoutMs: 3000,
        isActive: true,
      });
      (service as any).recordPing(ep1.id, {
        id: 'p1',
        endpointId: ep1.id,
        timestamp: new Date().toISOString(),
        statusCode: 200,
        statusText: 'OK',
        latencyMs: 50,
        isHealthy: true,
      });

      const ep2 = service.addEndpoint({
        name: 'Active 2',
        url: 'https://example.com/2',
        method: 'GET',
        expectedStatus: 200,
        timeoutMs: 3000,
        isActive: true,
      });
      (service as any).recordPing(ep2.id, {
        id: 'p2',
        endpointId: ep2.id,
        timestamp: new Date().toISOString(),
        statusCode: 200,
        statusText: 'OK',
        latencyMs: 60,
        isHealthy: true,
      });

      // Add 3 paused endpoints with failed pings
      for (let i = 1; i <= 3; i++) {
        const pausedEp = service.addEndpoint({
          name: `Paused ${i}`,
          url: `https://example.com/paused/${i}`,
          method: 'GET',
          expectedStatus: 200,
          timeoutMs: 3000,
          isActive: false,
        });
        (service as any).recordPing(pausedEp.id, {
          id: `p_paused_${i}`,
          endpointId: pausedEp.id,
          timestamp: new Date().toISOString(),
          statusCode: 500,
          statusText: 'Error',
          latencyMs: 700,
          isHealthy: false,
        });
      }

      const metrics = service.getAggregateMetrics();
      expect(metrics.totalEndpoints).toBe(5);
      expect(metrics.activeEndpoints).toBe(2);
      expect(metrics.pausedEndpoints).toBe(3);
      expect(metrics.overallHealthPercentage).toBe(100);
      expect(metrics.healthStatus).toBe('optimal');
      expect(metrics.activeIncidentsCount).toBe(0);
      expect(metrics.averageLatencyMs).toBe(55);
    });

    it('should return neutral paused state when all targets are paused', () => {
      service.clearAllEndpoints();

      service.addEndpoint({
        name: 'Paused Solo',
        url: 'https://example.com/solo',
        method: 'GET',
        expectedStatus: 200,
        timeoutMs: 3000,
        isActive: false,
      });

      const metrics = service.getAggregateMetrics();
      expect(metrics.totalEndpoints).toBe(1);
      expect(metrics.activeEndpoints).toBe(0);
      expect(metrics.pausedEndpoints).toBe(1);
      expect(metrics.overallHealthPercentage).toBeNull();
      expect(metrics.healthStatus).toBe('paused');
      expect(metrics.activeIncidentsCount).toBe(0);
      expect(metrics.averageLatencyMs).toBe(0);
    });
  });

  describe('Settings & Data Portability', () => {
    it('should update and retrieve global settings', () => {
      const updated = service.updateSettings({
        pingIntervalMs: 15000,
        latencyThresholdMs: 600,
        historyLimit: 30,
      });

      expect(updated.pingIntervalMs).toBe(15000);
      expect(updated.latencyThresholdMs).toBe(600);
      expect(updated.historyLimit).toBe(30);

      const current = service.getSettings();
      expect(current.pingIntervalMs).toBe(15000);
      expect(current.latencyThresholdMs).toBe(600);
    });

    it('should export and import data correctly', () => {
      const exported = service.exportData();
      expect(exported.version).toBe('1.0');
      expect(Array.isArray(exported.endpoints)).toBe(true);
      expect(exported.endpoints.length).toBeGreaterThan(0);

      // Import with replacement
      const importPayload = {
        settings: { latencyThresholdMs: 750, pingIntervalMs: 8000, historyLimit: 40 },
        endpoints: [
          {
            name: 'Imported Service',
            url: 'https://imported.com/api',
            method: 'GET' as const,
            expectedStatus: 200,
            timeoutMs: 4000,
            isActive: true,
            tags: ['imported'],
          },
        ],
      };
      const result = service.importData(importPayload, true);
      expect(result.importedCount).toBe(1);
      expect(service.getEndpoints().length).toBe(1);
      expect(service.getEndpoints()[0].name).toBe('Imported Service');
      expect(service.getSettings().latencyThresholdMs).toBe(750);
    });

    it('should reject duplicate endpoint with same URL and Method', () => {
      service.addEndpoint({
        name: 'Original Endpoint',
        url: 'https://unique-domain.com/check',
        method: 'GET',
        expectedStatus: 200,
        timeoutMs: 3000,
        isActive: true,
      });

      expect(() => {
        service.addEndpoint({
          name: 'Duplicate Endpoint',
          url: 'https://unique-domain.com/check',
          method: 'GET',
          expectedStatus: 200,
          timeoutMs: 3000,
          isActive: true,
        });
      }).toThrow('Target URL already being monitored');

      // Different HTTP method with same URL should be allowed
      const postEndpoint = service.addEndpoint({
        name: 'POST Endpoint',
        url: 'https://unique-domain.com/check',
        method: 'POST',
        expectedStatus: 201,
        timeoutMs: 3000,
        isActive: true,
      });
      expect(postEndpoint.id).toBeDefined();
    });

    it('should skip duplicates on import and report skippedDuplicates', () => {
      service.clearAllEndpoints();

      // Add existing endpoint
      service.addEndpoint({
        name: 'Pre-existing Endpoint',
        url: 'https://existing.com/api',
        method: 'GET',
        expectedStatus: 200,
        timeoutMs: 3000,
        isActive: true,
      });

      const importPayload = {
        endpoints: [
          {
            name: 'Duplicate in Import',
            url: 'https://existing.com/api',
            method: 'GET' as const,
            expectedStatus: 200,
            timeoutMs: 3000,
            isActive: true,
          },
          {
            name: 'Brand New Endpoint',
            url: 'https://brand-new.com/api',
            method: 'GET' as const,
            expectedStatus: 200,
            timeoutMs: 3000,
            isActive: true,
          },
          {
            name: 'Duplicate within batch',
            url: 'https://brand-new.com/api',
            method: 'GET' as const,
            expectedStatus: 200,
            timeoutMs: 3000,
            isActive: true,
          },
        ],
      };

      const result = service.importData(importPayload, false);
      expect(result.importedCount).toBe(1);
      expect(result.skippedDuplicates.length).toBe(2);
      expect(result.skippedDuplicates).toContain('GET https://existing.com/api');
      expect(result.skippedDuplicates).toContain('GET https://brand-new.com/api');
    });
  });

  describe('Smart API Diagnostics & Assertion Validation', () => {
    it('should evaluate contains and not_contains assertions accurately', () => {
      const validBody = JSON.stringify({ status: 'ok', data: 'operational' });
      const corruptedBody = JSON.stringify({ status: 'error', code: 'ERR_DATABASE_DOWN' });

      // Contains assertion
      const containsPass = service.evaluateAssertions(validBody, [
        { type: 'contains', expectedValue: 'operational' },
      ]);
      expect(containsPass.passed).toBe(true);
      expect(containsPass.results[0].passed).toBe(true);

      const containsFail = service.evaluateAssertions(corruptedBody, [
        { type: 'contains', expectedValue: 'operational' },
      ]);
      expect(containsFail.passed).toBe(false);
      expect(containsFail.results[0].passed).toBe(false);

      // Not contains assertion (Silent Failure detector)
      const notContainsPass = service.evaluateAssertions(validBody, [
        { type: 'not_contains', expectedValue: 'ERR_DATABASE_DOWN' },
      ]);
      expect(notContainsPass.passed).toBe(true);

      const notContainsFail = service.evaluateAssertions(corruptedBody, [
        { type: 'not_contains', expectedValue: 'ERR_DATABASE_DOWN' },
      ]);
      expect(notContainsFail.passed).toBe(false);
      expect(notContainsFail.results[0].passed).toBe(false);
      expect(notContainsFail.failedMessage).toContain('Silent failure');
    });

    it('should evaluate json_key_value assertion including dotted paths and type conversion', () => {
      const payload = JSON.stringify({
        status: 'ok',
        service: {
          database: { connected: true, poolSize: 10 },
        },
      });

      const rootPropCheck = service.evaluateAssertions(payload, [
        { type: 'json_key_value', property: 'status', expectedValue: 'ok' },
      ]);
      expect(rootPropCheck.passed).toBe(true);

      const nestedDottedCheck = service.evaluateAssertions(payload, [
        { type: 'json_key_value', property: 'service.database.connected', expectedValue: 'true' },
        { type: 'json_key_value', property: 'service.database.poolSize', expectedValue: '10' },
      ]);
      expect(nestedDottedCheck.passed).toBe(true);

      const missingPropCheck = service.evaluateAssertions(payload, [
        { type: 'json_key_value', property: 'service.database.missingProp', expectedValue: 'ok' },
      ]);
      expect(missingPropCheck.passed).toBe(false);

      const nonJsonCheck = service.evaluateAssertions('<html><body>502 Bad Gateway</body></html>', [
        { type: 'json_key_value', property: 'status', expectedValue: 'ok' },
      ]);
      expect(nonJsonCheck.passed).toBe(false);
      expect(nonJsonCheck.results[0].actualValue).toBe('Non-JSON Response');
    });

    it('should evaluate regex assertion', () => {
      const payload = JSON.stringify({ version: 'v2.10.4-beta', token: 'AUTH_987654' });

      const regexPass = service.evaluateAssertions(payload, [
        { type: 'regex', expectedValue: 'v\\d+\\.\\d+\\.\\d+' },
        { type: 'regex', expectedValue: 'AUTH_\\d{6}' },
      ]);
      expect(regexPass.passed).toBe(true);

      const regexFail = service.evaluateAssertions(payload, [
        { type: 'regex', expectedValue: '^ERROR' },
      ]);
      expect(regexFail.passed).toBe(false);
    });

    it('should detect silent failure and create diagnostic snapshot on corrupted payload', async () => {
      // Mock global fetch for this test
      const originalFetch = global.fetch;
      try {
        global.fetch = async () => {
          return {
            status: 200,
            statusText: 'OK',
            headers: new Map([['content-type', 'application/json'], ['server', 'MockServer']]),
            text: async () =>
              JSON.stringify({
                status: 'error',
                message: 'Database connection failed',
                code: 'ERR_DB_DISCONNECTED',
              }),
          } as unknown as Response;
        };

        const ep = service.addEndpoint({
          name: 'Silent Failure Test Target',
          url: 'https://test-silent-failure.io/api/health',
          method: 'GET',
          expectedStatus: 200,
          timeoutMs: 3000,
          isActive: true,
          assertions: [
            { type: 'not_contains', expectedValue: 'ERR_DB_DISCONNECTED' },
            { type: 'json_key_value', property: 'status', expectedValue: 'ok' },
          ],
        });

        const pingResult = await service.pingEndpoint(ep.id);

        // Health should be false despite HTTP 200
        expect(pingResult.statusCode).toBe(200);
        expect(pingResult.isHealthy).toBe(false);
        expect(pingResult.failureReason).toBe('ASSERTION_FAILED');

        // Diagnostic snapshot
        expect(pingResult.diagnosticSnapshot).toBeDefined();
        expect(pingResult.diagnosticSnapshot?.failureReason).toBe('ASSERTION_FAILED');
        expect(pingResult.diagnosticSnapshot?.curlCommand).toContain('curl -X GET "https://test-silent-failure.io/api/health"');
        expect(pingResult.diagnosticSnapshot?.timingBreakdown).toHaveProperty('totalMs');
        expect(pingResult.diagnosticSnapshot?.response?.bodySnippet).toContain('ERR_DB_DISCONNECTED');
        expect(pingResult.diagnosticSnapshot?.assertionResults).toHaveLength(2);
        expect(pingResult.diagnosticSnapshot?.assertionResults?.[0].passed).toBe(false);

        // Stats classification should be corrupted
        const stats = service.getEndpointStats(ep.id);
        expect(stats?.status).toBe('corrupted');

        // Incident tracking
        const incidents = service.getIncidents();
        const corruptedIncident = incidents.find((i) => i.endpointId === ep.id);
        expect(corruptedIncident).toBeDefined();
        expect(corruptedIncident?.type).toBe('corrupted');
        expect(corruptedIncident?.message).toContain('Silent failure');

        // Latest diagnostic retrieval
        const latestDiag = service.getLatestDiagnostic(ep.id);
        expect(latestDiag).toBeDefined();
        expect(latestDiag?.endpoint.id).toBe(ep.id);
        expect(latestDiag?.stats?.status).toBe('corrupted');
        expect(latestDiag?.diagnostic?.failureReason).toBe('ASSERTION_FAILED');
      } finally {
        global.fetch = originalFetch;
      }
    });
  });
});
