# Nexus WMS Core API Documentation

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication
All endpoints except login/register require JWT authentication.
Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Default Credentials (Development)
- Admin: `admin@nexuswms.com` / `password123`
- Warehouse Manager: `william@nexuswms.com` / `password123`
- Picker: `peter@nexuswms.com` / `password123`

## Endpoints

### Authentication

#### POST /auth/login
Login to the system
```json
{
  "email": "william@nexuswms.com",
  "password": "password123"
}
```

#### POST /auth/register
Register a new user
```json
{
  "email": "newuser@example.com",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe",
  "roleId": "uuid-of-role"
}
```

#### GET /auth/profile
Get current user profile (requires authentication)

### Products (Requires: Warehouse Manager role)

#### GET /products
Get paginated list of products with stock levels
Query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `search`: Search by name, SKU, or barcode
- `category`: Filter by category
- `active`: Filter by active status (true/false)
- `sortBy`: Sort field (name, sku, createdAt, updatedAt)
- `sortOrder`: Sort order (asc, desc)

#### GET /products/:id
Get single product with full details

### Inventory (Requires: Warehouse Manager role)

#### POST /inventory/adjustments
Create inventory adjustment
```json
{
  "productId": "product-uuid",
  "binLocationId": "bin-uuid",
  "adjustmentType": "PHYSICAL_COUNT",
  "quantityChange": 10,
  "reason": "Physical count correction",
  "notes": "Optional notes"
}
```

Adjustment Types:
- PHYSICAL_COUNT
- DAMAGED
- LOST
- FOUND
- RECEIVED
- RETURNED
- CYCLE_COUNT
- OTHER

#### GET /inventory/adjustments
Get adjustment history
Query parameters:
- `productId`: Filter by product
- `binLocationId`: Filter by bin location
- `page`: Page number
- `limit`: Items per page

#### GET /inventory/levels
Get current inventory levels
Query parameters:
- `productId`: Filter by product
- `binLocationId`: Filter by bin location
- `lowStock`: Show only low stock items (true/false)

### Picklists

#### GET /picklists/assigned/next (Requires: Picker role)
Get next assigned picklist with optimized picking path

#### POST /picklists/verify-pick (Requires: Picker role)
Verify pick by scanning barcodes
```json
{
  "picklistItemId": "item-uuid",
  "scannedProductBarcode": "1234567890123",
  "scannedBinBarcode": "A-01-1-A-1",
  "quantityPicked": 2
}
```

#### GET /picklists (Requires: Warehouse Manager or Picker role)
Get all picklists
Query parameters:
- `status`: Filter by status (PENDING, IN_PROGRESS, COMPLETED, CANCELLED)
- `assignedToMe`: Show only picklists assigned to current user (true/false)
- `page`: Page number
- `limit`: Items per page

#### GET /picklists/:id (Requires: Warehouse Manager or Picker role)
Get specific picklist details

## Error Responses

All error responses follow this format:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // Optional, for validation errors
}
```

Common HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request (validation error)
- 401: Unauthorized
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 409: Conflict (duplicate entry)
- 500: Internal Server Error