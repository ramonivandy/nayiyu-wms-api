import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { listMaterials, createMaterial, updateMaterial, deleteMaterial } from '../controllers/materials.controller';

const router = Router();

// Admin-only for MVP
router.use(authenticate, authorize('Admin'));

router.get('/', listMaterials);
router.post('/', createMaterial);
router.put('/:id', updateMaterial);
router.delete('/:id', deleteMaterial);

export default router;

