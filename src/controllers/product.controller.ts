import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { asyncHandler } from '../middleware/asyncHandler';
import {
  paginationQuerySchema,
  createProductSchema,
  updateProductSchema,
  setBomSchema,
  PaginationQuery,
  CreateProductInput,
  UpdateProductInput,
  SetBomInput,
} from '../schemas/product.schema';

// List products with BOM summary
export const listProducts = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 20 } = paginationQuerySchema.parse(req.query) as PaginationQuery;
  const skip = (page - 1) * limit;

  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      skip,
      take: limit,
      orderBy: { name: 'asc' },
      include: {
        bomItems: {
          include: { material: true },
        },
      },
    }),
    prisma.product.count(),
  ]);

  const data = products.map((p) => ({
    id: p.id,
    name: p.name,
    bom: p.bomItems.map((bi) => ({
      id: bi.id,
      materialId: bi.materialId,
      materialName: bi.material.name,
      quantityPerPortion: bi.quantityPerPortion,
    })),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }));

  res.json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  });
});

// Create product
export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const payload = createProductSchema.parse(req.body) as CreateProductInput;
  const product = await prisma.product.create({ data: { name: payload.name } });
  res.status(201).json({ success: true, data: product });
});

// Update product
export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = updateProductSchema.parse(req.body) as UpdateProductInput;
  const product = await prisma.product.update({ where: { id }, data: payload });
  res.json({ success: true, data: product });
});

// Delete product
export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  // Block deletion if there are active orders (status = CONFIRMED) containing this product
  const activeOrderItemsCount = await (prisma as any).orderItem.count({
    where: { productId: id, order: { status: 'CONFIRMED' } },
  });
  if (activeOrderItemsCount > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete product with active orders. Please cancel or complete related orders first.',
    });
  }

  // Safe delete: remove BOM entries; do NOT touch existing orders/items (they keep name snapshot)
  await prisma.bOMItem.deleteMany({ where: { productId: id } });
  await prisma.product.delete({ where: { id } });
  return res.json({ success: true });
});

// Get product by id with BOM
export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { bomItems: { include: { material: true } } },
  });
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  return res.json({ success: true, data: product });
});

// Set/replace BOM for a product
export const setProductBom = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = setBomSchema.parse(req.body) as SetBomInput;

  const result = await prisma.$transaction(async (tx) => {
    // Ensure product exists
    const product = await tx.product.findUnique({ where: { id } });
    if (!product) throw new Error('Product not found');

    // Remove existing BOM
    await tx.bOMItem.deleteMany({ where: { productId: id } });

    // Create new BOM items
    await tx.bOMItem.createMany({
      data: payload.items.map((item) => ({
        productId: id,
        materialId: item.materialId,
        quantityPerPortion: item.quantityPerPortion,
      })),
    });

    return tx.product.findUnique({
      where: { id },
      include: { bomItems: { include: { material: true } } },
    });
  });

  res.json({ success: true, data: result });
});