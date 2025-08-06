import { Router } from 'express';
import { 
  createInventoryAdjustment, 
  getInventoryLevels,
  getAdjustmentHistory 
} from '../controllers/inventory.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All inventory routes require authentication
router.use(authenticate);

// POST /api/v1/inventory/adjustments - Create inventory adjustment (INV-002)
// Required Role: Warehouse Manager
router.post(
  '/adjustments', 
  authorize('Warehouse Manager', 'Admin'), 
  createInventoryAdjustment
);

// GET /api/v1/inventory/adjustments - Get adjustment history
// Required Role: Warehouse Manager
router.get(
  '/adjustments',
  authorize('Warehouse Manager', 'Admin'),
  getAdjustmentHistory
);

// GET /api/v1/inventory/levels - Get inventory levels
// Required Role: Warehouse Manager
router.get(
  '/levels',
  authorize('Warehouse Manager', 'Admin'),
  getInventoryLevels
);

export default router;