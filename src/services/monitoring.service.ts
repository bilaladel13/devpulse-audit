import {
  MonitoredEndpoint,
  HttpMethod,
  PingResult,
  EndpointStats,
  HealthStatus,
  MonitoringSettings,
  IncidentEvent,
  ExportData,
  AggregateMetrics,
  ResponseAssertion,
  FailureReason,
  DiagnosticSnapshot,
  TimingBreakdown,
  AssertionResultItem,
} from '../types';
import { config } from '../config';

export class MonitoringService {
  private endpoints: Map<string, MonitoredEndpoint> = new Map();
  private history: Map<string, PingResult[]> = new Map();
  private incidents: IncidentEvent[] = [];
  private timer: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  private settings: Omit<MonitoringSettings, 'isMonitoringRunning'> = {
    pingIntervalMs: config.pingIntervalMs,
    latencyThresholdMs: 500,
    historyLimit: config.historyLimitPerEndpoint,
  };

  constructor() {
    this.seedDefaultEndpoints();
  }

  private seedDefaultEndpoints(): void {
    const defaultEndpoints: Array<Omit<MonitoredEndpoint, 'id' | 'createdAt'>> = [
      {
        name: 'Mock Fast Endpoint',
        url: `http://localhost:${config.port}/api/mock/fast`,
        method: 'GET',
        expectedStatus: 200,
        timeoutMs: 3000,
        isActive: true,
        tags: ['mock', 'fast'],
      },
      {
        name: 'Mock Slow Endpoint',
        url: `http://localhost:${config.port}/api/mock/slow`,
        method: 'GET',
        expectedStatus: 200,
        timeoutMs: 3000,
        isActive: true,
        tags: ['mock', 'slow'],
      },
      {
        name: 'Mock Flaky Endpoint',
        url: `http://localhost:${config.port}/api/mock/flaky`,
        method: 'GET',
        expectedStatus: 200,
        timeoutMs: 3000,
        isActive: true,
        tags: ['mock', 'flaky'],
      },
      {
        name: 'Mock Error Endpoint',
        url: `http://localhost:${config.port}/api/mock/error`,
        method: 'GET',
        expectedStatus: 200,
        timeoutMs: 3000,
        isActive: true,
        tags: ['mock', 'error'],
      },
      {
        name: 'Mock Corrupted API (Silent Failure)',
        url: `http://localhost:${config.port}/api/mock/corrupted`,
        method: 'GET',
        expectedStatus: 200,
        timeoutMs: 3000,
        isActive: true,
        tags: ['mock', 'corrupted', 'silent-failure'],
        assertions: [
          {
            type: 'not_contains',
            expectedValue: 'ERR_DB_DISCONNECTED',
          },
          {
            type: 'json_key_value',
            property: 'status',
            expectedValue: 'ok',
          },
        ],
      },
    ];

    for (const ep of defaultEndpoints) {
      this.addEndpoint(ep);
    }
  }

  private normalizeUrl(rawUrl: string): string {
    try {
      const u = new URL(rawUrl.trim());
      const pathname = u.pathname.length > 1 && u.pathname.endsWith('/') ? u.pathname.slice(0, -1) : u.pathname;
      return `${u.protocol}//${u.host.toLowerCase()}${pathname}${u.search}`;
    } catch {
      return rawUrl.trim().toLowerCase();
    }
  }

  public endpointExists(url: string, method: HttpMethod = 'GET', excludeId?: string): boolean {
    const normUrl = this.normalizeUrl(url);
    const normMethod = (method || 'GET').toUpperCase();
    for (const ep of this.endpoints.values()) {
      if (excludeId && ep.id === excludeId) continue;
      if (this.normalizeUrl(ep.url) === normUrl && ep.method.toUpperCase() === normMethod) {
        return true;
      }
    }
    return false;
  }

  public addEndpoint(data: Omit<MonitoredEndpoint, 'id' | 'createdAt'>): MonitoredEndpoint {
    if (this.endpointExists(data.url, data.method)) {
      throw new Error('Target URL already being monitored');
    }

    const id = `ep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const endpoint: MonitoredEndpoint = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
    };
    this.endpoints.set(id, endpoint);
    if (!this.history.has(id)) {
      this.history.set(id, []);
    }
    return endpoint;
  }

  public getEndpoints(): MonitoredEndpoint[] {
    return Array.from(this.endpoints.values());
  }

  public getEndpointById(id: string): MonitoredEndpoint | undefined {
    return this.endpoints.get(id);
  }

  public updateEndpoint(id: string, updates: Partial<Omit<MonitoredEndpoint, 'id' | 'createdAt'>>): MonitoredEndpoint | undefined {
    const existing = this.endpoints.get(id);
    if (!existing) return undefined;

    const updated: MonitoredEndpoint = {
      ...existing,
      ...updates,
    };
    this.endpoints.set(id, updated);
    return updated;
  }

  public toggleEndpointActive(id: string): MonitoredEndpoint | undefined {
    const existing = this.endpoints.get(id);
    if (!existing) return undefined;

    existing.isActive = !existing.isActive;
    this.endpoints.set(id, existing);
    return existing;
  }

  public deleteEndpoint(id: string): boolean {
    this.history.delete(id);
    return this.endpoints.delete(id);
  }

  public clearAllEndpoints(): void {
    this.endpoints.clear();
    this.history.clear();
    this.incidents = [];
  }

  public evaluateAssertions(
    bodyText: string,
    assertions?: ResponseAssertion[]
  ): { passed: boolean; results: AssertionResultItem[]; failedMessage?: string } {
    if (!assertions || assertions.length === 0) {
      return { passed: true, results: [] };
    }

    const results: AssertionResultItem[] = [];
    let allPassed = true;
    let firstFailedMsg: string | undefined;

    let parsedJson: any = null;
    let jsonParsedAttempted = false;

    const getJson = () => {
      if (!jsonParsedAttempted) {
        jsonParsedAttempted = true;
        try {
          parsedJson = JSON.parse(bodyText);
        } catch {
          parsedJson = null;
        }
      }
      return parsedJson;
    };

    for (const a of assertions) {
      let passed = false;
      let actualValue = '';
      let message = '';

      switch (a.type) {
        case 'contains': {
          passed = bodyText.includes(a.expectedValue);
          actualValue = bodyText.length > 80 ? bodyText.slice(0, 80) + '...' : bodyText;
          message = passed
            ? `Body contains expected string "${a.expectedValue}"`
            : `Assertion failed: expected body to contain "${a.expectedValue}"`;
          break;
        }
        case 'not_contains': {
          passed = !bodyText.includes(a.expectedValue);
          actualValue = passed ? 'Pattern absent' : `Contains "${a.expectedValue}"`;
          message = passed
            ? `Body does not contain forbidden string "${a.expectedValue}"`
            : `Silent failure: Body contains forbidden string "${a.expectedValue}"`;
          break;
        }
        case 'json_key_value': {
          const json = getJson();
          if (json === null || typeof json !== 'object') {
            passed = false;
            actualValue = 'Non-JSON Response';
            message = `Assertion failed: Response is not valid JSON, cannot evaluate property "${a.property || ''}"`;
          } else {
            let val: any = json;
            const pathParts = (a.property || '').split('.').filter(Boolean);
            for (const part of pathParts) {
              if (val !== null && typeof val === 'object' && part in val) {
                val = val[part];
              } else {
                val = undefined;
                break;
              }
            }
            actualValue = val !== undefined ? String(val) : 'undefined';
            passed = actualValue.toLowerCase() === a.expectedValue.toLowerCase();
            message = passed
              ? `JSON property "${a.property}" equals "${a.expectedValue}"`
              : `Silent failure: Expected JSON "${a.property}" to equal "${a.expectedValue}", but got "${actualValue}"`;
          }
          break;
        }
        case 'regex': {
          try {
            const re = new RegExp(a.expectedValue);
            passed = re.test(bodyText);
            actualValue = bodyText.length > 80 ? bodyText.slice(0, 80) + '...' : bodyText;
            message = passed
              ? `Body matches regex pattern /${a.expectedValue}/`
              : `Assertion failed: Body does not match regex /${a.expectedValue}/`;
          } catch {
            passed = false;
            actualValue = 'Invalid Regex';
            message = `Invalid regex pattern: ${a.expectedValue}`;
          }
          break;
        }
      }

      results.push({
        type: a.type,
        property: a.property,
        expectedValue: a.expectedValue,
        passed,
        actualValue,
        message,
      });

      if (!passed) {
        allPassed = false;
        if (!firstFailedMsg) {
          firstFailedMsg = message;
        }
      }
    }

    return { passed: allPassed, results, failedMessage: firstFailedMsg };
  }

  public async pingEndpoint(endpointId: string): Promise<PingResult> {
    const endpoint = this.endpoints.get(endpointId);
    if (!endpoint) {
      throw new Error(`Endpoint with id ${endpointId} not found`);
    }

    const pingId = `ping_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const startTime = performance.now();
    const timestamp = new Date().toISOString();

    const requestHeaders: Record<string, string> = {
      'Accept': 'application/json, text/plain, */*',
      'User-Agent': 'DevPulse-Monitor/1.0',
    };

    const headerFlags = Object.entries(requestHeaders)
      .map(([k, v]) => `-H "${k}: ${v}"`)
      .join(' ');
    const curlCommand = `curl -X ${endpoint.method} "${endpoint.url}" ${headerFlags}`.trim();

    try {
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        signal: AbortSignal.timeout(endpoint.timeoutMs),
        headers: requestHeaders,
      });

      const ttfbMs = Math.round(performance.now() - startTime);
      const bodyText = await response.text();
      const totalMs = Math.round(performance.now() - startTime);
      const latencyMs = totalMs;

      // Derived timing breakdown
      const dnsMs = Math.max(1, Math.min(15, Math.round(ttfbMs * 0.15)));
      const tcpMs = Math.max(2, Math.min(25, Math.round(ttfbMs * 0.25)));

      // Collect response headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((val, key) => {
        responseHeaders[key] = val;
      });

      // Status check
      const statusMatches = response.status === endpoint.expectedStatus;

      // Evaluate assertions
      const { passed: assertionsPassed, results: assertionResults, failedMessage } =
        this.evaluateAssertions(bodyText, endpoint.assertions);

      let failureReason: FailureReason = 'NONE';
      let isHealthy = true;
      let rootCause = 'All health checks and assertions passed';

      if (!statusMatches) {
        isHealthy = false;
        failureReason = 'HTTP_ERROR';
        rootCause = `HTTP status ${response.status} (${response.statusText || 'Error'}) does not match expected ${endpoint.expectedStatus}`;
      } else if (!assertionsPassed) {
        isHealthy = false;
        failureReason = 'ASSERTION_FAILED';
        rootCause = failedMessage || 'Response payload failed validation assertion';
      }

      const diagnosticSnapshot: DiagnosticSnapshot = {
        failureReason,
        rootCause,
        timingBreakdown: { dnsMs, tcpMs, ttfbMs, totalMs },
        request: {
          method: endpoint.method,
          url: endpoint.url,
          headers: requestHeaders,
        },
        response: {
          statusCode: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
          bodySnippet: bodyText.slice(0, 1500),
          contentType: response.headers.get('content-type') || undefined,
        },
        assertionResults,
        curlCommand,
      };

      const result: PingResult = {
        id: pingId,
        endpointId,
        timestamp,
        statusCode: response.status,
        statusText: response.statusText,
        latencyMs,
        isHealthy,
        failureReason,
        errorMessage: isHealthy ? undefined : rootCause,
        diagnosticSnapshot,
      };

      this.recordPing(endpointId, result);
      return result;
    } catch (error: unknown) {
      const totalMs = Math.round(performance.now() - startTime);
      const latencyMs = totalMs;
      const errorMessage = error instanceof Error ? error.message : 'Unknown network error';
      const isTimeout =
        (error instanceof Error && error.name === 'TimeoutError') ||
        errorMessage.toLowerCase().includes('timeout');

      const failureReason: FailureReason = isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR';
      const rootCause = isTimeout
        ? `Request timed out after ${endpoint.timeoutMs}ms`
        : `Network connection failed: ${errorMessage}`;

      const diagnosticSnapshot: DiagnosticSnapshot = {
        failureReason,
        rootCause,
        timingBreakdown: {
          dnsMs: 0,
          tcpMs: 0,
          ttfbMs: 0,
          totalMs,
        },
        request: {
          method: endpoint.method,
          url: endpoint.url,
          headers: requestHeaders,
        },
        curlCommand,
      };

      const result: PingResult = {
        id: pingId,
        endpointId,
        timestamp,
        statusCode: null,
        statusText: isTimeout ? 'Timed Out' : 'Failed',
        latencyMs,
        isHealthy: false,
        failureReason,
        errorMessage: rootCause,
        diagnosticSnapshot,
      };

      this.recordPing(endpointId, result);
      return result;
    }
  }

  private recordPing(endpointId: string, result: PingResult): void {
    const endpoint = this.endpoints.get(endpointId);
    const historyList = this.history.get(endpointId) || [];
    const previousPing = historyList[0];

    historyList.unshift(result);
    if (historyList.length > this.settings.historyLimit) {
      historyList.pop();
    }
    this.history.set(endpointId, historyList);

    // Track Incident state transitions
    if (endpoint) {
      this.handleIncidentTransition(endpoint, previousPing, result);
    }
  }

  private handleIncidentTransition(
    endpoint: MonitoredEndpoint,
    previousPing: PingResult | undefined,
    currentPing: PingResult
  ): void {
    const isDown = !currentPing.isHealthy && currentPing.failureReason !== 'ASSERTION_FAILED';
    const isCorrupted = !currentPing.isHealthy && currentPing.failureReason === 'ASSERTION_FAILED';
    const isDegraded = currentPing.isHealthy && currentPing.latencyMs > this.settings.latencyThresholdMs;

    if (isCorrupted) {
      // Silent failure (corrupted payload)
      const openIncident = this.incidents.find((inc) => inc.endpointId === endpoint.id && !inc.resolvedAt);
      if (!openIncident || openIncident.type !== 'corrupted') {
        if (openIncident) openIncident.resolvedAt = currentPing.timestamp;
        this.incidents.unshift({
          id: `inc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          endpointId: endpoint.id,
          endpointName: endpoint.name,
          type: 'corrupted',
          message: currentPing.errorMessage || currentPing.diagnosticSnapshot?.rootCause || 'Silent failure: Payload corrupted',
          timestamp: currentPing.timestamp,
        });
      }
    } else if (isDown) {
      // Endpoint went down (HTTP Error, Timeout, Network Error)
      const openIncident = this.incidents.find((inc) => inc.endpointId === endpoint.id && !inc.resolvedAt);
      if (!openIncident || openIncident.type !== 'down') {
        if (openIncident) openIncident.resolvedAt = currentPing.timestamp;
        this.incidents.unshift({
          id: `inc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          endpointId: endpoint.id,
          endpointName: endpoint.name,
          type: 'down',
          message: currentPing.errorMessage || `Unexpected HTTP status ${currentPing.statusCode}`,
          timestamp: currentPing.timestamp,
        });
      }
    } else if (isDegraded) {
      // Endpoint degraded due to high latency
      const openIncident = this.incidents.find((inc) => inc.endpointId === endpoint.id && !inc.resolvedAt);
      if (!openIncident || openIncident.type !== 'degraded') {
        if (openIncident) openIncident.resolvedAt = currentPing.timestamp;
        this.incidents.unshift({
          id: `inc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          endpointId: endpoint.id,
          endpointName: endpoint.name,
          type: 'degraded',
          message: `High latency: ${currentPing.latencyMs}ms (threshold: ${this.settings.latencyThresholdMs}ms)`,
          timestamp: currentPing.timestamp,
        });
      }
    } else {
      // Endpoint is healthy: resolve any open incident
      const openIncident = this.incidents.find((inc) => inc.endpointId === endpoint.id && !inc.resolvedAt);
      if (openIncident) {
        openIncident.resolvedAt = currentPing.timestamp;
        this.incidents.unshift({
          id: `inc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          endpointId: endpoint.id,
          endpointName: endpoint.name,
          type: 'recovered',
          message: `Recovered: HTTP ${currentPing.statusCode} in ${currentPing.latencyMs}ms`,
          timestamp: currentPing.timestamp,
          resolvedAt: currentPing.timestamp,
        });
      }
    }

    // Keep recent 50 incidents
    if (this.incidents.length > 50) {
      this.incidents.pop();
    }
  }

  public async pingAll(): Promise<PingResult[]> {
    const activeEndpoints = Array.from(this.endpoints.values()).filter((ep) => ep.isActive);
    const promises = activeEndpoints.map((ep) => this.pingEndpoint(ep.id));
    return Promise.all(promises);
  }

  public getHistory(endpointId: string, limit?: number): PingResult[] {
    const historyList = this.history.get(endpointId) || [];
    if (limit && limit > 0) {
      return historyList.slice(0, limit);
    }
    return historyList;
  }

  public getEndpointStats(endpointId: string): EndpointStats | undefined {
    const endpoint = this.endpoints.get(endpointId);
    if (!endpoint) return undefined;

    const historyList = this.history.get(endpointId) || [];
    const totalChecks = historyList.length;
    const lastPing = historyList[0];

    if (totalChecks === 0) {
      return {
        endpoint,
        status: 'unknown',
        uptimePercentage: 100,
        averageLatencyMs: 0,
        totalChecks: 0,
        successfulChecks: 0,
      };
    }

    const successfulChecks = historyList.filter((item) => item.isHealthy).length;
    const uptimePercentage = Math.round((successfulChecks / totalChecks) * 10000) / 100;
    const totalLatency = historyList.reduce((sum, item) => sum + item.latencyMs, 0);
    const averageLatencyMs = Math.round(totalLatency / totalChecks);

    let status: HealthStatus = 'healthy';
    if (!lastPing?.isHealthy) {
      status = lastPing?.failureReason === 'ASSERTION_FAILED' ? 'corrupted' : 'down';
    } else if (averageLatencyMs > this.settings.latencyThresholdMs || uptimePercentage < 90) {
      status = 'degraded';
    }

    return {
      endpoint,
      status,
      lastPing,
      uptimePercentage,
      averageLatencyMs,
      totalChecks,
      successfulChecks,
    };
  }

  public getLatestDiagnostic(endpointId: string): {
    endpoint: MonitoredEndpoint;
    stats: EndpointStats | undefined;
    latestPing: PingResult | undefined;
    diagnostic: DiagnosticSnapshot | undefined;
  } | undefined {
    const endpoint = this.endpoints.get(endpointId);
    if (!endpoint) return undefined;

    const stats = this.getEndpointStats(endpointId);
    const history = this.getHistory(endpointId, 1);
    const latestPing = history[0];

    return {
      endpoint,
      stats,
      latestPing,
      diagnostic: latestPing?.diagnosticSnapshot,
    };
  }

  public getAllStats(): EndpointStats[] {
    const stats: EndpointStats[] = [];
    for (const id of this.endpoints.keys()) {
      const stat = this.getEndpointStats(id);
      if (stat) stats.push(stat);
    }
    return stats;
  }

  public getAggregateMetrics(): AggregateMetrics {
    const allStats = this.getAllStats();
    const totalEndpoints = allStats.length;
    const activeStats = allStats.filter((s) => s.endpoint.isActive);
    const activeEndpoints = activeStats.length;
    const pausedEndpoints = totalEndpoints - activeEndpoints;

    if (activeEndpoints === 0) {
      return {
        overallHealthPercentage: null,
        healthStatus: 'paused',
        averageLatencyMs: 0,
        totalEndpoints,
        activeEndpoints,
        pausedEndpoints,
        activeIncidentsCount: 0,
      };
    }

    const healthyCount = activeStats.filter((s) => s.status === 'healthy').length;
    const overallHealthPercentage = Math.round((healthyCount / activeEndpoints) * 100);

    const validLatencies = activeStats.map((s) => s.averageLatencyMs).filter((l) => l > 0);
    const averageLatencyMs = validLatencies.length > 0
      ? Math.round(validLatencies.reduce((sum, val) => sum + val, 0) / validLatencies.length)
      : 0;

    const activeIncidentsCount = activeStats.filter(
      (s) => s.status === 'down' || s.status === 'degraded' || s.status === 'corrupted'
    ).length;

    let healthStatus: 'optimal' | 'degraded' | 'critical' = 'optimal';
    if (overallHealthPercentage < 60) {
      healthStatus = 'critical';
    } else if (overallHealthPercentage < 90) {
      healthStatus = 'degraded';
    }

    return {
      overallHealthPercentage,
      healthStatus,
      averageLatencyMs,
      totalEndpoints,
      activeEndpoints,
      pausedEndpoints,
      activeIncidentsCount,
    };
  }

  public getIncidents(limit = 20): IncidentEvent[] {
    return this.incidents.slice(0, limit);
  }

  public clearIncidents(): void {
    this.incidents = [];
  }

  public getSettings(): MonitoringSettings {
    return {
      ...this.settings,
      isMonitoringRunning: this.isRunning,
    };
  }

  public updateSettings(updates: Partial<Omit<MonitoringSettings, 'isMonitoringRunning'>>): MonitoringSettings {
    if (updates.pingIntervalMs && updates.pingIntervalMs >= 1000) {
      this.settings.pingIntervalMs = updates.pingIntervalMs;
      // Restart interval if running
      if (this.isRunning) {
        this.stopAutomatedMonitoring();
        this.startAutomatedMonitoring(this.settings.pingIntervalMs);
      }
    }

    if (updates.latencyThresholdMs && updates.latencyThresholdMs > 0) {
      this.settings.latencyThresholdMs = updates.latencyThresholdMs;
    }

    if (updates.historyLimit && updates.historyLimit > 0) {
      this.settings.historyLimit = updates.historyLimit;
    }

    return this.getSettings();
  }

  public exportData(): ExportData {
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings: {
        pingIntervalMs: this.settings.pingIntervalMs,
        latencyThresholdMs: this.settings.latencyThresholdMs,
        historyLimit: this.settings.historyLimit,
      },
      endpoints: this.getEndpoints().map(({ id, createdAt, ...rest }) => rest),
    };
  }

  public importData(
    data: Partial<ExportData>,
    replaceExisting = false
  ): { importedCount: number; skippedDuplicates: string[] } {
    if (replaceExisting) {
      this.clearAllEndpoints();
    }

    if (data.settings) {
      this.updateSettings(data.settings);
    }

    let count = 0;
    const skippedDuplicates: string[] = [];

    if (Array.isArray(data.endpoints)) {
      for (const ep of data.endpoints) {
        if (ep.name && ep.url) {
          const method = (ep.method || 'GET') as HttpMethod;
          if (this.endpointExists(ep.url, method)) {
            skippedDuplicates.push(`${method} ${ep.url}`);
            continue;
          }

          this.addEndpoint({
            name: ep.name,
            url: ep.url,
            method,
            expectedStatus: ep.expectedStatus || 200,
            timeoutMs: ep.timeoutMs || 3000,
            isActive: ep.isActive !== undefined ? ep.isActive : true,
            tags: ep.tags || [],
            assertions: ep.assertions || [],
          });
          count++;
        }
      }
    }

    return { importedCount: count, skippedDuplicates };
  }

  public startAutomatedMonitoring(intervalMs: number = this.settings.pingIntervalMs): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.settings.pingIntervalMs = intervalMs;
    console.log(`[DevPulse Monitoring] Started automated ping scheduler (interval: ${intervalMs}ms)`);

    setTimeout(() => {
      this.pingAll().catch((err) => console.error('[DevPulse Monitoring] Ping error:', err));
    }, 1000);

    this.timer = setInterval(() => {
      this.pingAll().catch((err) => console.error('[DevPulse Monitoring] Ping error:', err));
    }, intervalMs);
  }

  public stopAutomatedMonitoring(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    console.log('[DevPulse Monitoring] Stopped automated ping scheduler');
  }

  public isMonitoringRunning(): boolean {
    return this.isRunning;
  }
}

export const monitoringService = new MonitoringService();
