import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { listOrders, createOrder, cancelOrder, updateOrderItemQuantity, completeOrder } from '../controllers/orders.controller';

const router = Router();

// Admin-only for MVP
router.use(authenticate, authorize('Admin'));

router.get('/', listOrders);
router.post('/', createOrder);
router.post('/:id/cancel', cancelOrder);
router.post('/:id/complete', completeOrder);
router.put('/:orderId/items/:itemId/quantity', updateOrderItemQuantity);

export default router;

