import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { asyncHandler } from '../middleware/asyncHandler';
import { createOrderSchema, listOrdersQuerySchema, CreateOrderInput, updateOrderQuantitySchema, UpdateOrderQuantityInput } from '../schemas/order.schema';
import { AppError, NotFoundError } from '../utils/AppError';

export const listOrders = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 20 } = listOrdersQuerySchema.parse(req.query);
  const skip = (page - 1) * limit;

  const [orders, totalCount] = await Promise.all([
    (prisma as any).order.findMany({
      skip,
      take: limit,
      orderBy: { orderDate: 'desc' },
      include: { items: { include: { product: true } } },
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

  const order = await prisma.$transaction(async (tx) => {
    // Load all products with BOM+materials for the requested items
    const productIds = [...new Set(payload.items.map((i) => i.productId))];
    const products = await tx.product.findMany({
      where: { id: { in: productIds } },
      include: { bomItems: { include: { material: true } } },
    });
    const productById = new Map(products.map((p) => [p.id, p] as const));

    // Validate items
    for (const item of payload.items) {
      const p = productById.get(item.productId);
      if (!p) throw new NotFoundError(`Product not found: ${item.productId}`);
      if (!p.bomItems || p.bomItems.length === 0) {
        throw new AppError(`Product has no BOM defined: ${p.name}`, 400);
      }
    }

    // Aggregate required materials across all items
    const requiredByMaterial = new Map<string, number>();
    const materialAvailable = new Map<string, number>();
    for (const item of payload.items) {
      const p = productById.get(item.productId)!;
      for (const bi of p.bomItems) {
        const add = bi.quantityPerPortion * item.quantity;
        if (add > 0) {
          requiredByMaterial.set(bi.materialId, (requiredByMaterial.get(bi.materialId) || 0) + add);
          if (!materialAvailable.has(bi.materialId)) {
            materialAvailable.set(bi.materialId, bi.material.quantity);
          }
        }
      }
    }

    // Check stock
    const shortages: Array<{ materialId: string; required: number; available: number }> = [];
    for (const [mid, reqQty] of requiredByMaterial) {
      const avail = materialAvailable.get(mid) || 0;
      if (reqQty > avail) shortages.push({ materialId: mid, required: reqQty, available: avail });
    }
    if (shortages.length > 0) {
      throw new AppError('Insufficient stock for some materials', 400);
    }

    // Decrement materials
    for (const [mid, reqQty] of requiredByMaterial) {
      if (reqQty > 0) {
        await tx.material.update({ where: { id: mid }, data: { quantity: { decrement: reqQty } } });
      }
    }

    // Create order and items with product name snapshot
    const newOrder = await (tx.order as any).create({ data: { orderDate: payload.orderDate } });
    await (tx as any).orderItem.createMany({
      data: payload.items.map((it) => ({
        orderId: newOrder.id,
        productId: it.productId,
        productNameSnapshot: productById.get(it.productId)!.name,
        quantity: it.quantity,
      })),
    });

    return (tx.order as any).findUnique({
      where: { id: newOrder.id },
      include: { items: { include: { product: true } } },
    });
  });

  return res.status(201).json({ success: true, data: order });
});

export const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await prisma.$transaction(async (tx) => {
    const order = await (tx.order as any).findUnique({
      where: { id },
      include: { items: { include: { product: { include: { bomItems: { include: { material: true } } } } } } },
    });
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if ((order as any).status === 'CANCELLED') {
      throw new AppError('Order already cancelled', 400);
    }

    // Aggregate returns across all items
    const returnByMaterial = new Map<string, number>();
    for (const item of (order as any).items) {
      const product = item.product;
      if (!product || !product.bomItems || product.bomItems.length === 0) {
        throw new AppError('Cannot cancel: product or BOM missing for an order item', 400);
      }
      for (const bi of product.bomItems) {
        const add = bi.quantityPerPortion * item.quantity;
        if (add > 0) {
          returnByMaterial.set(bi.materialId, (returnByMaterial.get(bi.materialId) || 0) + add);
        }
      }
    }
    for (const [mid, qty] of returnByMaterial) {
      await tx.material.update({ where: { id: mid }, data: { quantity: { increment: qty } } });
    }

    const cancelled = await (tx.order.update as any)({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return cancelled;
  });

  return res.json({ success: true, data: result });
});

export const completeOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await prisma.$transaction(async (tx) => {
    const order = await (tx.order as any).findUnique({
      where: { id },
      include: { items: { include: { product: { include: { bomItems: { include: { material: true } } } } } } },
    });
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if ((order as any).status === 'COMPLETED') {
      throw new AppError('Order already completed', 400);
    }

    // Aggregate returns across all items
    const returnByMaterial = new Map<string, number>();
    for (const item of (order as any).items) {
      const product = item.product;
      if (!product || !product.bomItems || product.bomItems.length === 0) {
        throw new AppError('Cannot cancel: product or BOM missing for an order item', 400);
      }
      for (const bi of product.bomItems) {
        const add = bi.quantityPerPortion * item.quantity;
        if (add > 0) {
          returnByMaterial.set(bi.materialId, (returnByMaterial.get(bi.materialId) || 0) + add);
        }
      }
    }
    for (const [mid, qty] of returnByMaterial) {
      await tx.material.update({ where: { id: mid }, data: { quantity: { increment: qty } } });
    }

    const cancelled = await (tx.order.update as any)({
      where: { id },
      data: { status: 'COMPLETED' },
    });

    return cancelled;
  });

  return res.json({ success: true, data: result });
});

export const updateOrderItemQuantity = asyncHandler(async (req: Request, res: Response) => {
  const { orderId, itemId } = req.params as { orderId: string; itemId: string };
  const { quantity: newQuantity } = updateOrderQuantitySchema.parse(req.body) as UpdateOrderQuantityInput;

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundError('Order not found');

    const fiveMinutesMs = 5 * 60 * 1000;
    const createdAtMs = (order as any).createdAt ? new Date((order as any).createdAt).getTime() : 0;
    if (Date.now() - createdAtMs > fiveMinutesMs) {
      throw new AppError('Order can only be edited within 5 minutes of creation', 400);
    }
    if ((order as any).status === 'CANCELLED') {
      throw new AppError('Cannot edit a cancelled order', 400);
    }

    const item = await (tx as any).orderItem.findUnique({ where: { id: itemId }, include: { product: { include: { bomItems: { include: { material: true } } } } } });
    if (!item || item.orderId !== orderId) throw new NotFoundError('Order item not found');
    if (!item.product || !item.product.bomItems || item.product.bomItems.length === 0) {
      throw new AppError('Order item product or BOM missing', 400);
    }

    if (newQuantity === item.quantity) return item;

    const diff = newQuantity - item.quantity;
    if (diff > 0) {
      // Check material availability for increase
      const maxProduciblePortions = Math.floor(
        Math.min(
          ...(item.product.bomItems as any[]).map((bi: any) =>
            bi.quantityPerPortion > 0 ? bi.material.quantity / bi.quantityPerPortion : 0
          )
        )
      );
      if (diff > maxProduciblePortions) {
        throw new AppError(`Cannot increase order item by ${diff}; insufficient stock`, 400);
      }
      for (const bi of item.product.bomItems) {
        const required = bi.quantityPerPortion * diff;
        if (required > 0) {
          await tx.material.update({ where: { id: bi.materialId }, data: { quantity: { decrement: required } } });
        }
      }
    } else {
      const toReturnMultiplier = Math.abs(diff);
      for (const bi of item.product.bomItems) {
        const toReturn = bi.quantityPerPortion * toReturnMultiplier;
        if (toReturn > 0) {
          await tx.material.update({ where: { id: bi.materialId }, data: { quantity: { increment: toReturn } } });
        }
      }
    }

    return (tx as any).orderItem.update({ where: { id: itemId }, data: { quantity: newQuantity } });
  });

  return res.json({ success: true, data: result });
});

