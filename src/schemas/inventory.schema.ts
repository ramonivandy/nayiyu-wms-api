import { z } from 'zod';
// import { AdjustmentType } from '@prisma/client';

export const inventoryAdjustmentSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  binLocationId: z.string().uuid('Invalid bin location ID'),
  adjustmentType: z.string(),
  quantityChange: z.number({
    required_error: 'Quantity change is required',
    invalid_type_error: 'Quantity change must be a number',
  }),
  reason: z.string().min(1, 'Reason is required'),
  notes: z.string().optional(),
});

export const getInventoryLevelsSchema = z.object({
  productId: z.string().uuid().optional(),
  binLocationId: z.string().uuid().optional(),
  lowStock: z.string().optional().transform(val => val === 'true'),
  page: z.string().optional().transform(val => parseInt(val || '1', 10)),
  limit: z.string().optional().transform(val => parseInt(val || '20', 10)),
});

export type InventoryAdjustmentInput = z.infer<typeof inventoryAdjustmentSchema>;
export type GetInventoryLevelsQuery = z.infer<typeof getInventoryLevelsSchema>;