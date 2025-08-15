import { z } from 'zod';

export const orderItemInputSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().positive('Quantity must be positive'),
});

export const createOrderSchema = z.object({
  orderDate: z.string().transform((v) => new Date(v)),
  items: z.array(orderItemInputSchema).min(1, 'At least one item is required'),
});

export const listOrdersQuerySchema = z.object({
  page: z.string().optional().transform((v) => parseInt(v || '1', 10)),
  limit: z.string().optional().transform((v) => parseInt(v || '20', 10)),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;

export const updateOrderQuantitySchema = z.object({
  quantity: z.number().int().positive('Quantity must be positive'),
});

export type UpdateOrderQuantityInput = z.infer<typeof updateOrderQuantitySchema>;

