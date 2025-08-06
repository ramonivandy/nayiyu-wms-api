import { z } from 'zod';
import { PicklistStatus } from '@prisma/client';

export const verifyPickSchema = z.object({
  picklistItemId: z.string().uuid('Invalid picklist item ID'),
  scannedProductBarcode: z.string().min(1, 'Product barcode is required'),
  scannedBinBarcode: z.string().min(1, 'Bin barcode is required'),
  quantityPicked: z.number().positive('Quantity must be positive').optional(),
});

export const updatePicklistStatusSchema = z.object({
  status: z.nativeEnum(PicklistStatus),
  notes: z.string().optional(),
});

export const createPicklistSchema = z.object({
  orderNumber: z.string().min(1, 'Order number is required'),
  priority: z.number().int().min(0).max(10).optional().default(0),
  dueDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    sourceBinLocationId: z.string().uuid(),
    quantityRequested: z.number().positive(),
    pickSequence: z.number().int().positive(),
  })).min(1, 'At least one item is required'),
});

export type VerifyPickInput = z.infer<typeof verifyPickSchema>;
export type UpdatePicklistStatusInput = z.infer<typeof updatePicklistStatusSchema>;
export type CreatePicklistInput = z.infer<typeof createPicklistSchema>;