import { Request, Response } from 'express';
import { monitoringService } from '../services/monitoring.service';
import { HttpMethod } from '../types';

export class MonitoringController {
  // Get all monitored endpoints
  public static getEndpoints(req: Request, res: Response): void {
    const endpoints = monitoringService.getEndpoints();
    res.json({ success: true, count: endpoints.length, data: endpoints });
  }

  // Add a new endpoint to monitor
  public static addEndpoint(req: Request, res: Response): void {
    const {
      name,
      url,
      method = 'GET',
      expectedStatus = 200,
      timeoutMs = 5000,
      isActive = true,
      tags = [],
      assertions = [],
    } = req.body;

    if (!name || !url) {
      res.status(400).json({ success: false, error: 'Name and URL are required fields.' });
      return;
    }

    try {
      new URL(url);
    } catch {
      res.status(400).json({ success: false, error: 'Invalid URL format.' });
      return;
    }

    if (monitoringService.endpointExists(url, method as HttpMethod)) {
      res.status(409).json({ success: false, error: 'Target URL already being monitored' });
      return;
    }

    try {
      const endpoint = monitoringService.addEndpoint({
        name,
        url,
        method: method as HttpMethod,
        expectedStatus: Number(expectedStatus),
        timeoutMs: Number(timeoutMs),
        isActive: Boolean(isActive),
        tags,
        assertions,
      });

      res.status(201).json({ success: true, data: endpoint });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add endpoint';
      if (message.includes('already being monitored')) {
        res.status(409).json({ success: false, error: message });
        return;
      }
      res.status(400).json({ success: false, error: message });
    }
  }

  // Get endpoint by ID
  public static getEndpointById(req: Request, res: Response): void {
    const { id } = req.params;
    const endpoint = monitoringService.getEndpointById(id);
    if (!endpoint) {
      res.status(404).json({ success: false, error: 'Endpoint not found.' });
      return;
    }
    const stats = monitoringService.getEndpointStats(id);
    res.json({ success: true, data: { ...endpoint, stats } });
  }

  // Update endpoint
  public static updateEndpoint(req: Request, res: Response): void {
    const { id } = req.params;
    const { name, url, method, expectedStatus, timeoutMs, isActive, tags, assertions } = req.body;

    const existing = monitoringService.getEndpointById(id);
    if (!existing) {
      res.status(404).json({ success: false, error: 'Endpoint not found.' });
      return;
    }

    if (url) {
      try {
        new URL(url);
      } catch {
        res.status(400).json({ success: false, error: 'Invalid URL format.' });
        return;
      }

      const targetMethod = (method || existing.method) as HttpMethod;
      if (monitoringService.endpointExists(url, targetMethod, id)) {
        res.status(409).json({ success: false, error: 'Target URL already being monitored' });
        return;
      }
    }

    const updated = monitoringService.updateEndpoint(id, {
      ...(name !== undefined ? { name } : {}),
      ...(url !== undefined ? { url } : {}),
      ...(method !== undefined ? { method: method as HttpMethod } : {}),
      ...(expectedStatus !== undefined ? { expectedStatus: Number(expectedStatus) } : {}),
      ...(timeoutMs !== undefined ? { timeoutMs: Number(timeoutMs) } : {}),
      ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
      ...(tags !== undefined ? { tags } : {}),
      ...(assertions !== undefined ? { assertions } : {}),
    });

    res.json({ success: true, data: updated });
  }

  // Toggle endpoint active/paused state
  public static toggleEndpoint(req: Request, res: Response): void {
    const { id } = req.params;
    const toggled = monitoringService.toggleEndpointActive(id);
    if (!toggled) {
      res.status(404).json({ success: false, error: 'Endpoint not found.' });
      return;
    }
    res.json({
      success: true,
      message: `Endpoint ${toggled.isActive ? 'resumed' : 'paused'} successfully.`,
      data: toggled,
    });
  }

  // Delete endpoint
  public static deleteEndpoint(req: Request, res: Response): void {
    const { id } = req.params;
    const deleted = monitoringService.deleteEndpoint(id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Endpoint not found.' });
      return;
    }
    res.json({ success: true, message: 'Endpoint deleted successfully.' });
  }

  // Trigger manual ping for single endpoint
  public static async pingEndpoint(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    try {
      const result = await monitoringService.pingEndpoint(id);
      res.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Ping execution failed';
      res.status(404).json({ success: false, error: message });
    }
  }

  // Trigger manual ping for all active endpoints
  public static async pingAll(req: Request, res: Response): Promise<void> {
    try {
      const results = await monitoringService.pingAll();
      res.json({ success: true, count: results.length, data: results });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Ping all execution failed';
      res.status(500).json({ success: false, error: message });
    }
  }

  // Get ping history for an endpoint
  public static getHistory(req: Request, res: Response): void {
    const { id } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const endpoint = monitoringService.getEndpointById(id);
    if (!endpoint) {
      res.status(404).json({ success: false, error: 'Endpoint not found.' });
      return;
    }
    const history = monitoringService.getHistory(id, limit);
    res.json({ success: true, count: history.length, data: history });
  }

  // Get latest diagnostic snapshot for an endpoint
  public static getLatestDiagnostic(req: Request, res: Response): void {
    const { id } = req.params;
    const diagnosticInfo = monitoringService.getLatestDiagnostic(id);
    if (!diagnosticInfo) {
      res.status(404).json({ success: false, error: 'Endpoint not found.' });
      return;
    }
    res.json({ success: true, data: diagnosticInfo });
  }

  // Get all endpoints stats summary
  public static getStats(req: Request, res: Response): void {
    const stats = monitoringService.getAllStats();
    const isRunning = monitoringService.isMonitoringRunning();
    const metrics = monitoringService.getAggregateMetrics();
    res.json({ success: true, isMonitoringRunning: isRunning, count: stats.length, metrics, data: stats });
  }

  // Get settings
  public static getSettings(req: Request, res: Response): void {
    const settings = monitoringService.getSettings();
    res.json({ success: true, data: settings });
  }

  // Update settings
  public static updateSettings(req: Request, res: Response): void {
    const { pingIntervalMs, latencyThresholdMs, historyLimit } = req.body;
    const updated = monitoringService.updateSettings({
      pingIntervalMs: pingIntervalMs ? Number(pingIntervalMs) : undefined,
      latencyThresholdMs: latencyThresholdMs ? Number(latencyThresholdMs) : undefined,
      historyLimit: historyLimit ? Number(historyLimit) : undefined,
    });
    res.json({ success: true, message: 'Settings updated successfully.', data: updated });
  }

  // Get incident events
  public static getIncidents(req: Request, res: Response): void {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const incidents = monitoringService.getIncidents(limit);
    res.json({ success: true, count: incidents.length, data: incidents });
  }

  // Export configuration and endpoints
  public static exportData(req: Request, res: Response): void {
    const exported = monitoringService.exportData();
    res.json({ success: true, data: exported });
  }

  // Import configuration and endpoints
  public static importData(req: Request, res: Response): void {
    const { endpoints, settings, replaceExisting } = req.body;

    if (!endpoints || !Array.isArray(endpoints)) {
      res.status(400).json({ success: false, error: 'Invalid import data: "endpoints" array is required.' });
      return;
    }

    const result = monitoringService.importData({ endpoints, settings }, Boolean(replaceExisting));
    const skippedCount = result.skippedDuplicates.length;
    const skippedMsg = skippedCount > 0 ? ` ${skippedCount} duplicate(s) skipped.` : '';
    res.json({
      success: true,
      message: `Imported ${result.importedCount} endpoints successfully.${skippedMsg}`,
      importedCount: result.importedCount,
      skippedDuplicates: result.skippedDuplicates,
    });
  }

  // Start automated monitoring
  public static startMonitoring(req: Request, res: Response): void {
    const intervalMs = req.body.intervalMs ? parseInt(req.body.intervalMs, 10) : undefined;
    monitoringService.startAutomatedMonitoring(intervalMs);
    res.json({ success: true, message: 'Automated monitoring started.' });
  }

  // Stop automated monitoring
  public static stopMonitoring(req: Request, res: Response): void {
    monitoringService.stopAutomatedMonitoring();
    res.json({ success: true, message: 'Automated monitoring stopped.' });
  }
}
