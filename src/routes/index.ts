import { Router } from 'express';
import authRoutes from './auth.routes';
import productRoutes from './product.routes';
import inventoryRoutes from './inventory.routes';
import picklistRoutes from './picklist.routes';

const router = Router();

// Health check for API
router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Nexus WMS Core API v1.0',
    timestamp: new Date().toISOString(),
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/picklists', picklistRoutes);

export default router;