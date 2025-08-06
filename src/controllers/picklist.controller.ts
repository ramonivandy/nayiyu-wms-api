import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { asyncHandler } from '../middleware/asyncHandler';
import { verifyPickSchema, VerifyPickInput } from '../schemas/picklist.schema';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

/**
 * Get the next available picklist assigned to the picker
 * Story ID: OUT-001
 * Required Role: Picker
 * 
 * Returns a picklist with items sorted by bin location for optimized path
 */
export const getNextAssignedPicklist = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  // Find the first pending picklist assigned to this user
  const picklist = await prisma.picklist.findFirst({
    where: {
      assignedToId: userId,
      status: 'PENDING',
    },
    include: {
      items: {
        include: {
          product: true,
          sourceBinLocation: true,
        },
      },
    },
    orderBy: [
      { priority: 'desc' },
      { dueDate: 'asc' },
      { createdAt: 'asc' },
    ],
  });

  if (!picklist) {
    return res.status(404).json({
      success: false,
      message: 'No pending picklists assigned to you',
    });
  }

  // Sort items by bin location code for optimized warehouse path
  const sortedItems = picklist.items.sort((a, b) => {
    // Sort by zone, then aisle, then rack, then shelf, then bin
    const aLoc = a.sourceBinLocation;
    const bLoc = b.sourceBinLocation;
    
    if (aLoc.zone !== bLoc.zone) return aLoc.zone.localeCompare(bLoc.zone);
    if (aLoc.aisle !== bLoc.aisle) return aLoc.aisle.localeCompare(bLoc.aisle);
    if (aLoc.rack !== bLoc.rack) return aLoc.rack.localeCompare(bLoc.rack);
    if (aLoc.shelf !== bLoc.shelf) return aLoc.shelf.localeCompare(bLoc.shelf);
    return aLoc.bin.localeCompare(bLoc.bin);
  });

  // Update pick sequence based on optimized path
  sortedItems.forEach((item, index) => {
    item.pickSequence = index + 1;
  });

  // Format response with optimized path
  const formattedPicklist = {
    id: picklist.id,
    orderNumber: picklist.orderNumber,
    status: picklist.status,
    priority: picklist.priority,
    dueDate: picklist.dueDate,
    totalItems: picklist.items.length,
    completedItems: picklist.items.filter(item => item.isPicked).length,
    items: sortedItems.map(item => ({
      id: item.id,
      pickSequence: item.pickSequence,
      product: {
        id: item.product.id,
        sku: item.product.sku,
        barcode: item.product.barcode,
        name: item.product.name,
        unitOfMeasure: item.product.unitOfMeasure,
      },
      binLocation: {
        id: item.sourceBinLocation.id,
        code: item.sourceBinLocation.code,
        zone: item.sourceBinLocation.zone,
        aisle: item.sourceBinLocation.aisle,
        rack: item.sourceBinLocation.rack,
        shelf: item.sourceBinLocation.shelf,
        bin: item.sourceBinLocation.bin,
      },
      quantityRequested: item.quantityRequested,
      quantityPicked: item.quantityPicked,
      isPicked: item.isPicked,
    })),
    createdAt: picklist.createdAt,
    startedAt: picklist.startedAt,
  };

  // If this is the first time accessing the picklist, mark it as started
  if (!picklist.startedAt) {
    await prisma.picklist.update({
      where: { id: picklist.id },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
    });
  }

  logger.info(`Picker ${req.user?.email} retrieved picklist ${picklist.orderNumber}`);

  res.json({
    success: true,
    data: formattedPicklist,
  });
});

/**
 * Verify a pick action by scanning product and bin barcodes
 * Story ID: OUT-002
 * Required Role: Picker
 * 
 * Validates scanned barcodes and updates pick status
 */
export const verifyPick = asyncHandler(async (req: Request, res: Response) => {
  // Validate request body
  const validatedData = verifyPickSchema.parse(req.body) as VerifyPickInput;
  
  const {
    picklistItemId,
    scannedProductBarcode,
    scannedBinBarcode,
    quantityPicked,
  } = validatedData;

  // Use transaction to ensure data consistency
  const result = await prisma.$transaction(async (tx) => {
    // Fetch the picklist item with its relations
    const picklistItem = await tx.picklistItem.findUnique({
      where: { id: picklistItemId },
      include: {
        product: true,
        sourceBinLocation: true,
        picklist: true,
      },
    });

    if (!picklistItem) {
      throw new AppError('Picklist item not found', 404);
    }

    // Verify the picklist is assigned to the current user
    if (picklistItem.picklist.assignedToId !== req.user!.id) {
      throw new AppError('This picklist is not assigned to you', 403);
    }

    // Verify the picklist is in progress
    if (picklistItem.picklist.status !== 'IN_PROGRESS' && picklistItem.picklist.status !== 'PENDING') {
      throw new AppError('This picklist is not available for picking', 400);
    }

    // Compare scanned barcodes
    const productMatches = picklistItem.product.barcode === scannedProductBarcode;
    const binMatches = picklistItem.sourceBinLocation.code === scannedBinBarcode;

    if (!productMatches) {
      throw new AppError(
        `Product barcode mismatch. Expected: ${picklistItem.product.barcode}, Scanned: ${scannedProductBarcode}`,
        400
      );
    }

    if (!binMatches) {
      throw new AppError(
        `Bin location mismatch. Expected: ${picklistItem.sourceBinLocation.code}, Scanned: ${scannedBinBarcode}`,
        400
      );
    }

    // Update the picklist item
    const pickedQuantity = quantityPicked || picklistItem.quantityRequested;
    const updatedItem = await tx.picklistItem.update({
      where: { id: picklistItemId },
      data: {
        isPicked: true,
        quantityPicked: pickedQuantity,
        pickedAt: new Date(),
      },
    });

    // Check if all items in the picklist are picked
    const allItems = await tx.picklistItem.findMany({
      where: { picklistId: picklistItem.picklistId },
    });

    const allPicked = allItems.every(item => item.isPicked);

    // If all items are picked, mark the picklist as completed
    let updatedPicklist = picklistItem.picklist;
    if (allPicked) {
      updatedPicklist = await tx.picklist.update({
        where: { id: picklistItem.picklistId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      logger.info(`Picklist ${updatedPicklist.orderNumber} completed by ${req.user?.email}`);
    }

    // Update inventory levels
    await tx.inventoryLevel.update({
      where: {
        productId_binLocationId: {
          productId: picklistItem.productId,
          binLocationId: picklistItem.sourceBinLocationId,
        },
      },
      data: {
        quantityOnHand: {
          decrement: pickedQuantity,
        },
        quantityAvailable: {
          decrement: pickedQuantity,
        },
      },
    });

    return {
      picklistItem: updatedItem,
      picklist: updatedPicklist,
      allItemsPicked: allPicked,
    };
  });

  logger.info(
    `Pick verified: Item ${picklistItemId} picked by ${req.user?.email}, ` +
    `quantity: ${result.picklistItem.quantityPicked}`
  );

  res.json({
    success: true,
    message: 'Pick verified successfully',
    data: {
      picklistItemId: result.picklistItem.id,
      isPicked: result.picklistItem.isPicked,
      quantityPicked: result.picklistItem.quantityPicked,
      picklistCompleted: result.allItemsPicked,
      picklistStatus: result.picklist.status,
    },
  });
});

/**
 * Get all picklists with optional filters
 */
export const getPicklists = asyncHandler(async (req: Request, res: Response) => {
  const { status, assignedToMe } = req.query;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const where: any = {};
  
  if (status) {
    where.status = status;
  }
  
  if (assignedToMe === 'true') {
    where.assignedToId = req.user!.id;
  }

  const [picklists, totalCount] = await Promise.all([
    prisma.picklist.findMany({
      where,
      skip,
      take: limit,
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' },
      ],
      include: {
        assignedTo: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
    }),
    prisma.picklist.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  res.json({
    success: true,
    data: picklists,
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

/**
 * Get a specific picklist by ID
 */
export const getPicklistById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const picklist = await prisma.picklist.findUnique({
    where: { id },
    include: {
      assignedTo: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      items: {
        include: {
          product: true,
          sourceBinLocation: true,
        },
        orderBy: { pickSequence: 'asc' },
      },
    },
  });

  if (!picklist) {
    return res.status(404).json({
      success: false,
      message: 'Picklist not found',
    });
  }

  res.json({
    success: true,
    data: picklist,
  });
});