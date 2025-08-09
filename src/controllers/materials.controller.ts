import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { asyncHandler } from '../middleware/asyncHandler';
import {
  listMaterialsQuerySchema,
  createMaterialSchema,
  updateMaterialSchema,
  ListMaterialsQuery,
  CreateMaterialInput,
  UpdateMaterialInput,
} from '../schemas/material.schema';

export const listMaterials = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 20, lowStock } = listMaterialsQuerySchema.parse(req.query) as ListMaterialsQuery;
  const skip = (page - 1) * limit;

  // Low stock means quantity < lowStockThreshold
  const [materials, totalCount] = await Promise.all([
    prisma.material.findMany({
      skip,
      take: limit,
      orderBy: { name: 'asc' },
    }),
    prisma.material.count(),
  ]);

  const data = lowStock
    ? materials.filter((m) => m.quantity < m.lowStockThreshold)
    : materials;

  res.json({
    success: true,
    data,
    pagination: { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit) },
  });
});

export const createMaterial = asyncHandler(async (req: Request, res: Response) => {
  const payload = createMaterialSchema.parse(req.body) as CreateMaterialInput;
  const material = await prisma.material.create({
    data: {
      name: payload.name,
      quantity: payload.quantity,
      unit: payload.unit,
      expiryDate: payload.expiryDate,
      lowStockThreshold: payload.lowStockThreshold,
    },
  });
  return res.status(201).json({ success: true, data: material });
});

export const updateMaterial = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = updateMaterialSchema.parse(req.body) as UpdateMaterialInput;
  const material = await prisma.material.update({ where: { id }, data: payload });
  return res.json({ success: true, data: material });
});

export const deleteMaterial = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  // Prevent delete if referenced by BOM
  const count = await prisma.bOMItem.count({ where: { materialId: id } });
  if (count > 0) {
    return res.status(400).json({ success: false, message: 'Material used in BOM; remove from BOM first' });
  }
  await prisma.material.delete({ where: { id } });
  return res.json({ success: true });
});

