import { Router } from 'express';
import mockRoutes from './mock.routes';
import monitoringRoutes from './monitoring.routes';

const apiRouter = Router();

apiRouter.use('/mock', mockRoutes);
apiRouter.use('/monitoring', monitoringRoutes);

export default apiRouter;
