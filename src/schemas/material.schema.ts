import { z } from 'zod';

export const paginationQuerySchema = z.object({
  page: z.string().optional().transform((v) => parseInt(v || '1', 10)),
  limit: z.string().optional().transform((v) => parseInt(v || '20', 10)),
});

export const createMaterialSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  quantity: z.number({ invalid_type_error: 'Quantity must be a number' }),
  unit: z.string().min(1, 'Unit is required'),
  expiryDate: z.string().transform((v) => new Date(v)),
  lowStockThreshold: z.number({ invalid_type_error: 'Low stock threshold must be a number' }),
});

export const updateMaterialSchema = createMaterialSchema.partial();

export const listMaterialsQuerySchema = paginationQuerySchema.extend({
  lowStock: z.string().optional().transform((v) => v === 'true'),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type CreateMaterialInput = z.infer<typeof createMaterialSchema>;
export type UpdateMaterialInput = z.infer<typeof updateMaterialSchema>;
export type ListMaterialsQuery = z.infer<typeof listMaterialsQuerySchema>;

