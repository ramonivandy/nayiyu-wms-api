import { z } from 'zod';

export const getProductsQuerySchema = z.object({
  page: z.string().optional().transform(val => parseInt(val || '1', 10)),
  limit: z.string().optional().transform(val => parseInt(val || '20', 10)),
  search: z.string().optional(),
  category: z.string().optional(),
  active: z.string().optional().transform(val => val === 'true'),
  sortBy: z.enum(['name', 'sku', 'createdAt', 'updatedAt']).optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export const createProductSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  barcode: z.string().min(1, 'Barcode is required'),
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  unitOfMeasure: z.string().min(1, 'Unit of measure is required'),
  weight: z.number().positive().optional(),
  dimensions: z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive(),
  }).optional(),
  category: z.string().optional(),
  active: z.boolean().optional().default(true),
});

export const updateProductSchema = createProductSchema.partial();

export type GetProductsQuery = z.infer<typeof getProductsQuerySchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;