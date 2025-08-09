import { z } from 'zod';

export const createOrderSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().positive('Quantity must be positive'),
  orderDate: z.string().transform((v) => new Date(v)),
});

export const listOrdersQuerySchema = z.object({
  page: z.string().optional().transform((v) => parseInt(v || '1', 10)),
  limit: z.string().optional().transform((v) => parseInt(v || '20', 10)),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;

