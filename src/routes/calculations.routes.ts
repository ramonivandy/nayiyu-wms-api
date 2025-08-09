import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { calculateProduction } from '../controllers/calculations.controller';

const router = Router();

// Admin-only for MVP
router.use(authenticate, authorize('Admin'));

router.post('/production', calculateProduction);

export default router;

