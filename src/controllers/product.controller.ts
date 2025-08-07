import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { asyncHandler } from '../middleware/asyncHandler';
import { getProductsQuerySchema, GetProductsQuery } from '../schemas/product.schema';
import { logger } from '../utils/logger';

/**
 * Get a paginated list of all products and their stock levels
 * Story ID: INV-001
 * Required Role: Warehouse Manager
 */
export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  // Original code commented for debugging
  
  // Validate and parse query parameters
  const query = getProductsQuerySchema.parse(req.query) as GetProductsQuery;
  
  const {
    page = 1,
    limit = 20,
    search,
    category,
    active,
    sortBy = 'name',
    sortOrder = 'asc',
  } = query;

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {};
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
      { barcode: { contains: search, mode: 'insensitive' } },
    ];
  }
  
  if (category) {
    where.category = category;
  }
  
  if (active !== undefined) {
    where.active = active;
  }

  // Execute queries in parallel for better performance
  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        inventoryLevels: {
          include: {
            binLocation: true,
          },
        },
      },
    }),
    prisma.product.count({ where }),
  ]);

  // Calculate total stock for each product
  const productsWithStock = products.map(product => {
    const totalQuantityOnHand = product.inventoryLevels.reduce(
      (sum, level) => sum + level.quantityOnHand,
      0
    );
    const totalQuantityAvailable = product.inventoryLevels.reduce(
      (sum, level) => sum + level.quantityAvailable,
      0
    );
    const totalQuantityReserved = product.inventoryLevels.reduce(
      (sum, level) => sum + level.quantityReserved,
      0
    );

    return {
      id: product.id,
      sku: product.sku,
      barcode: product.barcode,
      name: product.name,
      description: product.description,
      unitOfMeasure: product.unitOfMeasure,
      weight: product.weight,
      dimensions: product.dimensions,
      category: product.category,
      active: product.active,
      totalQuantityOnHand,
      totalQuantityAvailable,
      totalQuantityReserved,
      locations: product.inventoryLevels.map(level => ({
        binLocationId: level.binLocationId,
        binLocationCode: level.binLocation.code,
        quantityOnHand: level.quantityOnHand,
        quantityAvailable: level.quantityAvailable,
        quantityReserved: level.quantityReserved,
        lastCountDate: level.lastCountDate,
      })),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  });

  // Calculate pagination metadata
  const totalPages = Math.ceil(totalCount / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  logger.info(`Retrieved ${products.length} products for user ${req.user?.email}`);

  res.json({
    success: true,
    data: productsWithStock,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages,
      hasNextPage,
      hasPrevPage,
    },
  });
});

/**
 * Get a single product by ID with full details
 */
export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      inventoryLevels: {
        include: {
          binLocation: true,
        },
      },
      adjustments: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          binLocation: true,
        },
      },
    },
  });

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found',
    });
  }

  // Calculate total stock
  const totalQuantityOnHand = product.inventoryLevels.reduce(
    (sum, level) => sum + level.quantityOnHand,
    0
  );
  const totalQuantityAvailable = product.inventoryLevels.reduce(
    (sum, level) => sum + level.quantityAvailable,
    0
  );
  const totalQuantityReserved = product.inventoryLevels.reduce(
    (sum, level) => sum + level.quantityReserved,
    0
  );

  const productWithDetails = {
    ...product,
    totalQuantityOnHand,
    totalQuantityAvailable,
    totalQuantityReserved,
  };

  return res.json({
    success: true,
    data: productWithDetails,
  });
});