# PowerShell setup script for Windows
Write-Host "🚀 Nexus WMS Core - Setup Script" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Check if Node.js is installed
Write-Host "`nChecking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Host "✅ Node.js is installed: $nodeVersion" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js from: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "After installation, run this script again." -ForegroundColor Yellow
    exit 1
}

# Check if Docker is installed (optional)
Write-Host "`nChecking Docker installation..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version 2>$null
    if ($dockerVersion) {
        Write-Host "✅ Docker is installed: $dockerVersion" -ForegroundColor Green
        $useDocker = $true
    }
} catch {
    Write-Host "⚠️  Docker is not installed (optional)" -ForegroundColor Yellow
    Write-Host "You'll need to set up PostgreSQL manually or install Docker Desktop" -ForegroundColor Yellow
    $useDocker = $false
}

# Install dependencies
Write-Host "`nInstalling npm dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green

# Create .env file if it doesn't exist
if (!(Test-Path ".env")) {
    Write-Host "`nCreating .env file..." -ForegroundColor Yellow
    @"
# Database Configuration
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nexus_wms?schema=public"

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=dev-secret-key-change-in-production-9f8b7c6d5e4a3b2c1d0e9f8a7b6c5d4e
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=debug
"@ | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "✅ .env file created" -ForegroundColor Green
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

# Database setup
if ($useDocker) {
    Write-Host "`nStarting PostgreSQL with Docker..." -ForegroundColor Yellow
    docker-compose -f docker-compose.dev.yml up -d
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PostgreSQL started in Docker" -ForegroundColor Green
        
        # Wait for database to be ready
        Write-Host "Waiting for database to be ready..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
        
        # Run migrations
        Write-Host "`nRunning database migrations..." -ForegroundColor Yellow
        npm run prisma:migrate -- --name init
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Database migrations completed" -ForegroundColor Green
            
            # Seed database
            Write-Host "`nSeeding database with sample data..." -ForegroundColor Yellow
            npm run prisma:seed
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Database seeded successfully" -ForegroundColor Green
            }
        }
    } else {
        Write-Host "⚠️  Could not start Docker. Please start PostgreSQL manually." -ForegroundColor Yellow
    }
} else {
    Write-Host "`n⚠️  Docker not available. Please:" -ForegroundColor Yellow
    Write-Host "  1. Install PostgreSQL manually" -ForegroundColor Yellow
    Write-Host "  2. Create a database named 'nexus_wms'" -ForegroundColor Yellow
    Write-Host "  3. Update the DATABASE_URL in .env file" -ForegroundColor Yellow
    Write-Host "  4. Run: npm run prisma:migrate" -ForegroundColor Yellow
    Write-Host "  5. Run: npm run prisma:seed" -ForegroundColor Yellow
}

Write-Host "`n✨ Setup complete!" -ForegroundColor Green
Write-Host "`nTo start the development server, run:" -ForegroundColor Cyan
Write-Host "  npm run dev" -ForegroundColor White
Write-Host "`nDefault login credentials:" -ForegroundColor Cyan
Write-Host "  Email: william@nexuswms.com" -ForegroundColor White
Write-Host "  Password: password123" -ForegroundColor White
Write-Host "`nAPI will be available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "API Documentation: see API_DOCUMENTATION.md" -ForegroundColor Cyan