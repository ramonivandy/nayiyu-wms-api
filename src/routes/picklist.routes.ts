import { Router } from 'express';
import { 
  getNextAssignedPicklist,
  verifyPick,
  getPicklists,
  getPicklistById
} from '../controllers/picklist.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All picklist routes require authentication
router.use(authenticate);

// GET /api/v1/picklists/assigned/next - Get next assigned picklist (OUT-001)
// Required Role: Picker
router.get(
  '/assigned/next',
  authorize('Picker', 'Admin'),
  getNextAssignedPicklist
);

// POST /api/v1/picklists/verify-pick - Verify pick action (OUT-002)
// Required Role: Picker
router.post(
  '/verify-pick',
  authorize('Picker', 'Admin'),
  verifyPick
);

// GET /api/v1/picklists - Get all picklists with filters
// Required Role: Warehouse Manager, Picker
router.get(
  '/',
  authorize('Warehouse Manager', 'Picker', 'Admin'),
  getPicklists
);

// GET /api/v1/picklists/:id - Get specific picklist
// Required Role: Warehouse Manager, Picker
router.get(
  '/:id',
  authorize('Warehouse Manager', 'Picker', 'Admin'),
  getPicklistById
);

export default router;