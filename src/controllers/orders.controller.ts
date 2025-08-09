import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { asyncHandler } from '../middleware/asyncHandler';
import { createOrderSchema, listOrdersQuerySchema, CreateOrderInput } from '../schemas/order.schema';

export const listOrders = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 20 } = listOrdersQuerySchema.parse(req.query);
  const skip = (page - 1) * limit;

  const [orders, totalCount] = await Promise.all([
    prisma.order.findMany({
      skip,
      take: limit,
      orderBy: { orderDate: 'desc' },
      include: { product: true },
    }),
    prisma.order.count(),
  ]);

  res.json({
    success: true,
    data: orders,
    pagination: { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit) },
  });
});

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const payload = createOrderSchema.parse(req.body) as CreateOrderInput;
  const order = await prisma.order.create({ data: payload });
  res.status(201).json({ success: true, data: order });
});

