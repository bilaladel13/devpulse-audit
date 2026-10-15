import { Router } from 'express';
import { MockController } from '../controllers/mock.controller';

const router = Router();

router.get('/fast', MockController.fast);
router.get('/slow', MockController.slow);
router.get('/flaky', MockController.flaky);
router.get('/error', MockController.error);
router.get('/custom', MockController.custom);
router.get('/corrupted', MockController.corrupted);

export default router;
