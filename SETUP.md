# 🚀 Quick Setup Guide for Nexus WMS Core

## Prerequisites Check

Before starting, ensure you have Node.js installed:
```bash
node --version  # Should be v20 or higher
npm --version   # Should be v9 or higher
```

If Node.js is not installed, download it from: https://nodejs.org/

## Quick Start (Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Setup

#### Option A: Using Docker (Recommended)
```bash
# Start PostgreSQL in Docker
docker-compose -f docker-compose.dev.yml up -d

# Wait a few seconds for the database to start, then run migrations
npm run prisma:migrate

# Seed the database with sample data
npm run prisma:seed
```

#### Option B: Using Local PostgreSQL
1. Create a database named `nexus_wms`
2. Update the DATABASE_URL in your `.env` file
3. Run migrations: `npm run prisma:migrate`
4. Seed database: `npm run prisma:seed`

### 3. Start Development Server
```bash
npm run dev
```

The API will be available at: http://localhost:3000

## Test the API

### Health Check
```bash
curl http://localhost:3000/health
```

### Login (Get JWT Token)
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"william@nexuswms.com","password":"password123"}'
```

Save the token from the response and use it for authenticated requests.

### Get Products (Authenticated)
```bash
curl http://localhost:3000/api/v1/products \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

## Default Users

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@nexuswms.com | password123 |
| Warehouse Manager | william@nexuswms.com | password123 |
| Picker | peter@nexuswms.com | password123 |

## Useful Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run prisma:studio` - Open Prisma Studio (database GUI)
- `npm run lint` - Run ESLint
- `docker-compose logs -f` - View Docker logs

## Troubleshooting

### Port 3000 is already in use
Change the port in your `.env` file:
```
PORT=3001
```

### Database connection failed
1. Check if PostgreSQL is running
2. Verify DATABASE_URL in `.env`
3. For Docker: `docker-compose -f docker-compose.dev.yml ps`

### Migration issues
Reset the database and re-run migrations:
```bash
npm run prisma:migrate reset
npm run prisma:seed
```

## Next Steps

1. Review [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for endpoint details
2. Use Postman or similar tool to test the API
3. Explore the database with Prisma Studio: `npm run prisma:studio`
4. Check the logs in the console for debugging

## Support

For issues or questions, check the README.md or open an issue in the repository.