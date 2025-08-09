import { Router } from 'express';
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
  setProductBom,
} from '../controllers/product.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Admin-only for MVP
router.use(authenticate, authorize('Admin'));

router.get('/', listProducts);
router.post('/', createProduct);
router.get('/:id', getProductById);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

// BOM endpoints
router.get('/:id/bom', getProductById);
router.post('/:id/bom', setProductBom);

export default router;