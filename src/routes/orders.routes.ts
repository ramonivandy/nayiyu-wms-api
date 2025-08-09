import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { listOrders, createOrder } from '../controllers/orders.controller';

const router = Router();

// Admin-only for MVP
router.use(authenticate, authorize('Admin'));

router.get('/', listOrders);
router.post('/', createOrder);

export default router;

