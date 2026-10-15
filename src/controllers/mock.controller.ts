import { Request, Response } from 'express';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class MockController {
  // Fast endpoint: 10-30ms
  public static async fast(req: Request, res: Response): Promise<void> {
    const delay = Math.floor(Math.random() * 20) + 10;
    await sleep(delay);
    res.status(200).json({
      status: 'ok',
      message: 'Fast response received',
      simulatedLatencyMs: delay,
      timestamp: new Date().toISOString(),
    });
  }

  // Slow endpoint: 400-800ms
  public static async slow(req: Request, res: Response): Promise<void> {
    const delay = Math.floor(Math.random() * 400) + 400;
    await sleep(delay);
    res.status(200).json({
      status: 'ok',
      message: 'Slow response received',
      simulatedLatencyMs: delay,
      timestamp: new Date().toISOString(),
    });
  }

  // Flaky endpoint: 70% success, 30% failure, varying latency 50-300ms
  public static async flaky(req: Request, res: Response): Promise<void> {
    const delay = Math.floor(Math.random() * 250) + 50;
    await sleep(delay);

    const isFailure = Math.random() < 0.3;
    if (isFailure) {
      const errorStatus = Math.random() < 0.5 ? 500 : 503;
      res.status(errorStatus).json({
        status: 'error',
        message: 'Flaky endpoint simulated failure',
        statusCode: errorStatus,
        simulatedLatencyMs: delay,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(200).json({
      status: 'ok',
      message: 'Flaky endpoint simulated success',
      simulatedLatencyMs: delay,
      timestamp: new Date().toISOString(),
    });
  }

  // Error endpoint: always returns 500
  public static async error(req: Request, res: Response): Promise<void> {
    const delay = Math.floor(Math.random() * 20) + 5;
    await sleep(delay);
    res.status(500).json({
      status: 'error',
      message: 'Simulated internal server error',
      simulatedLatencyMs: delay,
      timestamp: new Date().toISOString(),
    });
  }

  // Custom mock endpoint with configurable delay and status
  public static async custom(req: Request, res: Response): Promise<void> {
    const delay = Math.max(0, parseInt((req.query.delay as string) || '0', 10));
    const status = parseInt((req.query.status as string) || '200', 10);

    if (delay > 0) {
      await sleep(delay);
    }

    res.status(status).json({
      status: status >= 200 && status < 300 ? 'ok' : 'error',
      message: `Simulated custom response with status ${status}`,
      simulatedLatencyMs: delay,
      timestamp: new Date().toISOString(),
    });
  }

  // Corrupted mock endpoint: returns HTTP 200 OK but payload contains an application-level failure
  public static async corrupted(req: Request, res: Response): Promise<void> {
    const delay = Math.floor(Math.random() * 25) + 15;
    await sleep(delay);
    res.status(200).json({
      status: 'error',
      message: 'Database connection pool exhausted: connection refused',
      code: 'ERR_DB_DISCONNECTED',
      service: 'mock-corrupted-api',
      data: null,
      simulatedLatencyMs: delay,
      timestamp: new Date().toISOString(),
    });
  }
}
