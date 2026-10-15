export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD';

export type HealthStatus = 'healthy' | 'degraded' | 'down' | 'corrupted' | 'unknown';

export type AssertionType = 'contains' | 'not_contains' | 'json_key_value' | 'regex';

export interface ResponseAssertion {
  id?: string;
  type: AssertionType;
  property?: string; // Optional: JSON key/path (e.g. 'status' or 'data.healthy')
  expectedValue: string; // The expected substring, value, or regex pattern
}

export type FailureReason = 'NONE' | 'ASSERTION_FAILED' | 'HTTP_ERROR' | 'TIMEOUT' | 'NETWORK_ERROR';

export interface TimingBreakdown {
  dnsMs: number;
  tcpMs: number;
  ttfbMs: number;
  totalMs: number;
}

export interface AssertionResultItem {
  type: AssertionType;
  property?: string;
  expectedValue: string;
  passed: boolean;
  actualValue?: string;
  message: string;
}

export interface DiagnosticSnapshot {
  failureReason: FailureReason;
  rootCause: string;
  timingBreakdown: TimingBreakdown;
  request: {
    method: HttpMethod;
    url: string;
    headers: Record<string, string>;
  };
  response?: {
    statusCode: number;
    statusText: string;
    headers: Record<string, string>;
    bodySnippet: string;
    contentType?: string;
  };
  assertionResults?: AssertionResultItem[];
  curlCommand: string;
}

export interface MonitoredEndpoint {
  id: string;
  name: string;
  url: string;
  method: HttpMethod;
  expectedStatus: number;
  timeoutMs: number;
  intervalMs?: number;
  isActive: boolean;
  tags?: string[];
  assertions?: ResponseAssertion[];
  createdAt: string;
}

export interface PingResult {
  id: string;
  endpointId: string;
  timestamp: string;
  statusCode: number | null;
  statusText: string;
  latencyMs: number;
  isHealthy: boolean;
  failureReason?: FailureReason;
  errorMessage?: string;
  diagnosticSnapshot?: DiagnosticSnapshot;
}

export interface EndpointStats {
  endpoint: MonitoredEndpoint;
  status: HealthStatus;
  lastPing?: PingResult;
  uptimePercentage: number;
  averageLatencyMs: number;
  totalChecks: number;
  successfulChecks: number;
}

export interface AggregateMetrics {
  overallHealthPercentage: number | null;
  healthStatus: 'optimal' | 'degraded' | 'critical' | 'paused';
  averageLatencyMs: number;
  totalEndpoints: number;
  activeEndpoints: number;
  pausedEndpoints: number;
  activeIncidentsCount: number;
}

export interface MonitoringSettings {
  pingIntervalMs: number;
  latencyThresholdMs: number;
  historyLimit: number;
  isMonitoringRunning?: boolean;
}

export type IncidentType = 'down' | 'degraded' | 'corrupted' | 'recovered';

export interface IncidentEvent {
  id: string;
  endpointId: string;
  endpointName: string;
  type: IncidentType;
  message: string;
  timestamp: string;
  resolvedAt?: string;
}

export interface ExportData {
  version: string;
  exportedAt: string;
  settings: Omit<MonitoringSettings, 'isMonitoringRunning'>;
  endpoints: Array<Omit<MonitoredEndpoint, 'id' | 'createdAt'>>;
}
