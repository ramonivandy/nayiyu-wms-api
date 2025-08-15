# Pesenin! WMS MVP - Backend API

Warehouse Management System (MVP) for small, home-based businesses. Focused on simple inventory, BOM-based production calculation, and basic order tracking.

## Tech Stack
- Node.js 20, Express, TypeScript
- Prisma ORM with SQLite (file-based)
- Zod validation, JWT auth (Admin-only)
- Helmet, CORS, bcrypt

## Quick Start
1) Install deps
```bash
npm install
```
2) Environment
```bash
cp .env.example .env
# edit JWT_SECRET if needed
```
3) Init DB and seed
```bash
npx prisma migrate dev
npm run prisma:seed
```
4) Run
```bash
npm run dev
```
Base URL: `http://localhost:3000/api/v1`

Default Admin: `admin@pesenin.app` / `password123`

## Authentication
All endpoints below require JWT (except login/register).
Header: `Authorization: Bearer <token>`

### Auth
- POST `/auth/login` { email, password }
- POST `/auth/register` { email, password, firstName, lastName } (auto-Admin in MVP)
- GET `/auth/profile`
- POST `/auth/logout`

### Materials
- GET `/materials` (query: page, limit, lowStock)
- POST `/materials` { name, quantity, unit, expiryDate, lowStockThreshold }
- PUT `/materials/:id`
- DELETE `/materials/:id`

### Products & BOM
- GET `/products` (page, limit)
- POST `/products` { name }
- GET `/products/:id`
- PUT `/products/:id`
- DELETE `/products/:id` (safe delete; blocked if active orders exist; historical orders keep product name snapshot)
- GET `/products/:id/bom`
- POST `/products/:id/bom` { items: [{ materialId, quantityPerPortion }] }

### Orders
- GET `/orders` (page, limit) — returns orders with `items[]`
- POST `/orders` { orderDate, items: [{ productId, quantity }] } — multi-item order; decrements materials based on aggregated BOM
- POST `/orders/:id/cancel` — restores materials and sets status to CANCELLED
- POST `/orders/:id/complete` — sets status to COMPLETED
- PUT `/orders/:orderId/items/:itemId/quantity` { quantity } — edit within 5 minutes of order creation; adjusts materials accordingly

### Calculations
- POST `/calculations/production` { productId, requestedQuantity? }
  - Returns: `maxProduciblePortions`, `shortages[]`

## Docker
SQLite requires no external DB. A minimal compose file runs the API.
```bash
docker-compose up -d --build
```

## Scripts
- `npm run dev` development server
- `npm run build` compile TS
- `npm start` run compiled app
- `npm run prisma:seed` seed DB
- `npm test` run tests

## Project Structure
```
src/
  config/ controllers/ middleware/ routes/ schemas/ types/ utils/
  app.ts index.ts
prisma/
  schema.prisma seed.ts
```