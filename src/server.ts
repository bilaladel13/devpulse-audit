import { createApp } from './app';
import { config } from './config';
import { monitoringService } from './services/monitoring.service';

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`[DevPulse Server] Running on http://localhost:${config.port}`);
  console.log(`[DevPulse Server] Health check: http://localhost:${config.port}/health`);
  console.log(`[DevPulse Server] Mock endpoints: http://localhost:${config.port}/api/mock/{fast,slow,flaky,error,custom}`);
  console.log(`[DevPulse Server] Monitoring API: http://localhost:${config.port}/api/monitoring/{endpoints,stats,ping-all}`);

  // Start the automated monitoring service
  monitoringService.startAutomatedMonitoring(config.pingIntervalMs);
});

// Graceful shutdown
const handleShutdown = (signal: string) => {
  console.log(`\n[DevPulse Server] Received ${signal}. Shutting down gracefully...`);
  monitoringService.stopAutomatedMonitoring();
  server.close(() => {
    console.log('[DevPulse Server] Server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

export default server;
