# Nexus WMS Core - Backend API

A robust Warehouse Management System (WMS) backend API built with Node.js, Express, TypeScript, and PostgreSQL. This system empowers small and medium-sized businesses to optimize their inventory management and streamline fulfillment operations.

## 🚀 Features

### Core Inventory Management
- **Real-time Inventory Tracking**: View current stock levels across all warehouse locations
- **Inventory Adjustments**: Perform manual adjustments with full audit trail
- **Multi-location Support**: Track products across multiple bin locations
- **Stock Level Monitoring**: Track on-hand, available, and reserved quantities

### Outbound Logistics
- **Smart Picklist Generation**: Optimized picking paths through the warehouse
- **Barcode Verification**: Scan validation for accurate order fulfillment
- **Pick Progress Tracking**: Real-time updates on picking status
- **Mobile-Ready**: Designed for handheld scanning devices

### Security & Authentication
- **JWT-based Authentication**: Secure token-based auth system
- **Role-based Access Control**: Warehouse Manager, Picker, and Admin roles
- **Protected Endpoints**: Granular permissions for each API endpoint

## 🛠️ Tech Stack

- **Runtime**: Node.js (v20 LTS)
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Validation**: Zod schema validation
- **Authentication**: JWT (jsonwebtoken)
- **Security**: Helmet, CORS, bcrypt
- **Containerization**: Docker & Docker Compose

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js v20 or higher
- PostgreSQL 15 or higher (or use Docker)
- npm or yarn package manager

## 🔧 Installation

### Option 1: Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/nayiyu-wms-api.git
   cd nayiyu-wms-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Create a .env file based on .env.example
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Start PostgreSQL**
   - Use the Docker Compose development file:
     ```bash
     docker-compose -f docker-compose.dev.yml up -d
     ```
   - Or use your local PostgreSQL installation

5. **Run database migrations**
   ```bash
   npm run prisma:migrate
   ```

6. **Seed the database** (optional, for development)
   ```bash
   npm run prisma:seed
   ```

7. **Start the development server**
   ```bash
   npm run dev
   ```

   The API will be available at `http://localhost:3000`

### Option 2: Docker Deployment

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/nayiyu-wms-api.git
   cd nayiyu-wms-api
   ```

2. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

   This will:
   - Start PostgreSQL database
   - Build and run the API server
   - Run database migrations automatically
   - Expose the API on port 3000

## 🗄️ Database Setup

### Running Migrations
```bash
# Create a new migration
npm run prisma:migrate dev -- --name your_migration_name

# Apply migrations
npm run prisma:migrate deploy

# Reset database (WARNING: This will delete all data)
npm run prisma:migrate reset
```

### Seeding Data
The seed script creates:
- 3 user roles (Admin, Warehouse Manager, Picker)
- 3 test users with default passwords
- 5 sample products
- 243 bin locations
- Initial inventory levels
- 2 sample picklists

```bash
npm run prisma:seed
```

## 📚 API Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for detailed endpoint documentation.

### Quick Start - Test the API

1. **Login as Warehouse Manager**
   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"william@nexuswms.com","password":"password123"}'
   ```

2. **Get Products List** (use the token from login response)
   ```bash
   curl http://localhost:3000/api/v1/products \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

## 🧪 Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run prisma:studio` - Open Prisma Studio GUI
- `npm run lint` - Run ESLint
- `npm test` - Run tests

### Project Structure

```
src/
├── config/           # Configuration files
├── controllers/      # Route controllers
├── middleware/       # Express middleware
├── routes/          # API routes
├── schemas/         # Zod validation schemas
├── services/        # Business logic services
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
├── app.ts           # Express app setup
└── index.ts         # Server entry point
```

## 🚢 Deployment

### Production Build

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set production environment variables**
   ```bash
   export NODE_ENV=production
   export DATABASE_URL=your_production_database_url
   export JWT_SECRET=your_secure_secret_key
   ```

3. **Run migrations**
   ```bash
   npm run prisma:migrate deploy
   ```

4. **Start the server**
   ```bash
   npm start
   ```

### Docker Production

The included Dockerfile is production-ready with:
- Multi-stage build for smaller image size
- Non-root user for security
- Health checks
- Signal handling for graceful shutdown

```bash
# Build and run with Docker
docker build -t nexus-wms-api .
docker run -p 3000:3000 --env-file .env nexus-wms-api
```

## 📝 License

This project is licensed under the ISC License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For support, email support@nexuswms.com or open an issue in the repository.