import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { asyncHandler } from '../middleware/asyncHandler';
import { productionCalculationSchema, ProductionCalculationInput } from '../schemas/calculation.schema';

export const calculateProduction = asyncHandler(async (req: Request, res: Response) => {
  const payload = productionCalculationSchema.parse(req.body) as ProductionCalculationInput;
  const { productId, requestedQuantity } = payload;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { bomItems: { include: { material: true } } },
  });
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  if (product.bomItems.length === 0) {
    return res.json({ success: true, data: { maxProduciblePortions: 0, shortages: [] } });
  }

  // Compute max producible portions across all BOM materials
  const maxProduciblePortions = Math.floor(
    Math.min(
      ...product.bomItems.map((bi) =>
        bi.quantityPerPortion > 0 ? bi.material.quantity / bi.quantityPerPortion : 0
      )
    )
  );

  let shortages: Array<{
    materialId: string;
    materialName: string;
    required: number;
    available: number;
    deficit: number;
  }> = [];

  if (requestedQuantity && requestedQuantity > 0) {
    shortages = product.bomItems
      .map((bi) => {
        const required = bi.quantityPerPortion * requestedQuantity;
        const available = bi.material.quantity;
        const deficit = Math.max(0, required - available);
        return {
          materialId: bi.materialId,
          materialName: bi.material.name,
          required,
          available,
          deficit,
        };
      })
      .filter((s) => s.deficit > 0);
  }

  return res.json({ success: true, data: { maxProduciblePortions, shortages } });
});

