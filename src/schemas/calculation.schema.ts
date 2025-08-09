import { z } from 'zod';

export const productionCalculationSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  requestedQuantity: z.number().int().positive().optional(),
});

export type ProductionCalculationInput = z.infer<typeof productionCalculationSchema>;

