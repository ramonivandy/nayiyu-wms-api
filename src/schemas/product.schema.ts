import { z } from 'zod';

export const paginationQuerySchema = z.object({
  page: z.string().optional().transform((v) => parseInt(v || '1', 10)),
  limit: z.string().optional().transform((v) => parseInt(v || '20', 10)),
});

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
});

export const updateProductSchema = createProductSchema.partial();

export const bomItemSchema = z.object({
  materialId: z.string().uuid('Invalid material ID'),
  quantityPerPortion: z.number().positive('Quantity per portion must be positive'),
});

export const setBomSchema = z.object({
  items: z.array(bomItemSchema).min(1, 'At least one BOM item is required'),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type SetBomInput = z.infer<typeof setBomSchema>;