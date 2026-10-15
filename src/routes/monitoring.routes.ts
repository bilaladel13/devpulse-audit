import { Router } from 'express';
import { MonitoringController } from '../controllers/monitoring.controller';

const router = Router();

// Endpoints CRUD & Toggle
router.get('/endpoints', MonitoringController.getEndpoints);
router.post('/endpoints', MonitoringController.addEndpoint);
router.get('/endpoints/:id', MonitoringController.getEndpointById);
router.put('/endpoints/:id', MonitoringController.updateEndpoint);
router.patch('/endpoints/:id/toggle', MonitoringController.toggleEndpoint);
router.delete('/endpoints/:id', MonitoringController.deleteEndpoint);

// Ping actions
router.post('/endpoints/:id/ping', MonitoringController.pingEndpoint);
router.post('/ping-all', MonitoringController.pingAll);
router.get('/endpoints/:id/history', MonitoringController.getHistory);
router.get('/endpoints/:id/diagnostic', MonitoringController.getLatestDiagnostic);

// Monitoring control, stats, incidents, settings, export/import
router.get('/stats', MonitoringController.getStats);
router.get('/incidents', MonitoringController.getIncidents);
router.get('/settings', MonitoringController.getSettings);
router.put('/settings', MonitoringController.updateSettings);
router.get('/export', MonitoringController.exportData);
router.post('/import', MonitoringController.importData);
router.post('/start', MonitoringController.startMonitoring);
router.post('/stop', MonitoringController.stopMonitoring);

export default router;
