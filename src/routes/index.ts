import { Router } from 'express';
import authRoutes from './auth.routes';
import productRoutes from './product.routes';
import materialsRoutes from './materials.routes';
import ordersRoutes from './orders.routes';
import calculationsRoutes from './calculations.routes';

const router = Router();

// Health check for API
router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Pesenin! API v1',
    timestamp: new Date().toISOString(),
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/materials', materialsRoutes);
router.use('/products', productRoutes);
router.use('/orders', ordersRoutes);
router.use('/calculations', calculationsRoutes);

export default router;