import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { asyncHandler } from '../middleware/asyncHandler';
import { inventoryAdjustmentSchema, InventoryAdjustmentInput } from '../schemas/inventory.schema';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

/**
 * Perform a manual inventory adjustment for a product in a specific bin
 * Story ID: INV-002
 * Required Role: Warehouse Manager
 * 
 * CRITICAL: Uses Prisma's interactive transactions API to ensure atomicity
 */
export const createInventoryAdjustment = asyncHandler(async (req: Request, res: Response) => {
  // Validate request body
  const validatedData = inventoryAdjustmentSchema.parse(req.body) as InventoryAdjustmentInput;
  
  const {
    productId,
    binLocationId,
    adjustmentType,
    quantityChange,
    reason,
    notes,
  } = validatedData as {
    productId: string;
    binLocationId: string;
    adjustmentType: string;
    quantityChange: number;
    reason: string;
    notes?: string | null;
  };

  // Use Prisma transaction to ensure atomicity
  const result = await prisma.$transaction(async (tx) => {
    // First, verify that the product and bin location exist
    const [product, binLocation] = await Promise.all([
      tx.product.findUnique({ where: { id: productId } }),
      tx.binLocation.findUnique({ where: { id: binLocationId } }),
    ]);

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    if (!binLocation) {
      throw new AppError('Bin location not found', 404);
    }

    // Create the inventory adjustment record
    const adjustment = await tx.inventoryAdjustment.create({
      data: {
        productId,
        binLocationId,
        adjustmentType,
        quantityChange,
        reason,
        notes,
        userId: req.user!.id,
      },
      include: {
        product: true,
        binLocation: true,
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Upsert the inventory level
    // This will create the record if it doesn't exist or update it if it does
    const inventoryLevel = await tx.inventoryLevel.upsert({
      where: {
        productId_binLocationId: {
          productId,
          binLocationId,
        },
      },
      create: {
        productId,
        binLocationId,
        quantityOnHand: Math.max(0, quantityChange), // Ensure non-negative
        quantityAvailable: Math.max(0, quantityChange),
        quantityReserved: 0,
        lastCountDate: new Date(),
      },
      update: {
        quantityOnHand: {
          increment: quantityChange,
        },
        quantityAvailable: {
          increment: quantityChange,
        },
        lastCountDate: new Date(),
      },
    });

    // Check if the inventory level would go negative
    if (inventoryLevel.quantityOnHand < 0) {
      throw new AppError(
        `Insufficient inventory. Current quantity: ${inventoryLevel.quantityOnHand + quantityChange}, Requested change: ${quantityChange}`,
        400
      );
    }

    // If quantity goes negative, update it to 0 (business rule)
    if (inventoryLevel.quantityOnHand < 0 || inventoryLevel.quantityAvailable < 0) {
      await tx.inventoryLevel.update({
        where: {
          id: inventoryLevel.id,
        },
        data: {
          quantityOnHand: Math.max(0, inventoryLevel.quantityOnHand),
          quantityAvailable: Math.max(0, inventoryLevel.quantityAvailable),
        },
      });
    }

    return {
      adjustment,
      inventoryLevel,
    };
  });

  logger.info(
    `Inventory adjustment created: Product ${productId} in bin ${binLocationId}, ` +
    `quantity change: ${quantityChange}, type: ${adjustmentType}, by user: ${req.user?.email}`
  );

  res.status(201).json({
    success: true,
    message: 'Inventory adjustment created successfully',
    data: {
      adjustment: result.adjustment,
      currentInventoryLevel: {
        quantityOnHand: result.inventoryLevel.quantityOnHand,
        quantityAvailable: result.inventoryLevel.quantityAvailable,
        quantityReserved: result.inventoryLevel.quantityReserved,
      },
    },
  });
});

/**
 * Get inventory levels with optional filters
 */
export const getInventoryLevels = asyncHandler(async (req: Request, res: Response) => {
  const { productId, binLocationId, lowStock } = req.query;

  const where: any = {};
  
  if (productId) {
    where.productId = productId;
  }
  
  if (binLocationId) {
    where.binLocationId = binLocationId;
  }

  const inventoryLevels = await prisma.inventoryLevel.findMany({
    where,
    include: {
      product: true,
      binLocation: true,
    },
    orderBy: [
      { product: { name: 'asc' } },
      { binLocation: { code: 'asc' } },
    ],
  });

  // Filter for low stock if requested
  let filteredLevels = inventoryLevels;
  if (lowStock === 'true') {
    // Consider low stock as items with available quantity less than 10
    filteredLevels = inventoryLevels.filter(level => level.quantityAvailable < 10);
  }

  res.json({
    success: true,
    data: filteredLevels,
    count: filteredLevels.length,
  });
});

/**
 * Get adjustment history for a product or bin location
 */
export const getAdjustmentHistory = asyncHandler(async (req: Request, res: Response) => {
  const { productId, binLocationId } = req.query;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const where: any = {};
  
  if (productId) {
    where.productId = productId;
  }
  
  if (binLocationId) {
    where.binLocationId = binLocationId;
  }

  const [adjustments, totalCount] = await Promise.all([
    prisma.inventoryAdjustment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        product: true,
        binLocation: true,
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
    prisma.inventoryAdjustment.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  res.json({
    success: true,
    data: adjustments,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
});