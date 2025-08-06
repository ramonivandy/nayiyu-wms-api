import { Router } from 'express';
import { getProducts, getProductById } from '../controllers/product.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All product routes require authentication
router.use(authenticate);

// GET /api/v1/products - Get paginated list of products (INV-001)
// Required Role: Warehouse Manager
router.get('/', authorize('Warehouse Manager', 'Admin'), getProducts);

// GET /api/v1/products/:id - Get single product details
// Required Role: Warehouse Manager, Picker
router.get('/:id', authorize('Warehouse Manager', 'Picker', 'Admin'), getProductById);

export default router;