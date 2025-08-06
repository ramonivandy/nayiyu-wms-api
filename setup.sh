#!/bin/bash

# Bash setup script for Linux/Mac
echo -e "\033[36m🚀 Nexus WMS Core - Setup Script\033[0m"
echo -e "\033[36m=================================\033[0m"

# Check if Node.js is installed
echo -e "\n\033[33mChecking Node.js installation...\033[0m"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "\033[32m✅ Node.js is installed: $NODE_VERSION\033[0m"
else
    echo -e "\033[31m❌ Node.js is not installed!\033[0m"
    echo -e "\033[33mPlease install Node.js from: https://nodejs.org/\033[0m"
    echo -e "\033[33mAfter installation, run this script again.\033[0m"
    exit 1
fi

# Check if Docker is installed (optional)
echo -e "\n\033[33mChecking Docker installation...\033[0m"
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo -e "\033[32m✅ Docker is installed: $DOCKER_VERSION\033[0m"
    USE_DOCKER=true
else
    echo -e "\033[33m⚠️  Docker is not installed (optional)\033[0m"
    echo -e "\033[33mYou'll need to set up PostgreSQL manually or install Docker\033[0m"
    USE_DOCKER=false
fi

# Install dependencies
echo -e "\n\033[33mInstalling npm dependencies...\033[0m"
npm install

if [ $? -ne 0 ]; then
    echo -e "\033[31m❌ Failed to install dependencies\033[0m"
    exit 1
fi
echo -e "\033[32m✅ Dependencies installed successfully\033[0m"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "\n\033[33mCreating .env file...\033[0m"
    cat > .env << EOF
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
EOF
    echo -e "\033[32m✅ .env file created\033[0m"
else
    echo -e "\033[32m✅ .env file already exists\033[0m"
fi

# Database setup
if [ "$USE_DOCKER" = true ]; then
    echo -e "\n\033[33mStarting PostgreSQL with Docker...\033[0m"
    docker-compose -f docker-compose.dev.yml up -d
    
    if [ $? -eq 0 ]; then
        echo -e "\033[32m✅ PostgreSQL started in Docker\033[0m"
        
        # Wait for database to be ready
        echo -e "\033[33mWaiting for database to be ready...\033[0m"
        sleep 5
        
        # Run migrations
        echo -e "\n\033[33mRunning database migrations...\033[0m"
        npm run prisma:migrate -- --name init
        
        if [ $? -eq 0 ]; then
            echo -e "\033[32m✅ Database migrations completed\033[0m"
            
            # Seed database
            echo -e "\n\033[33mSeeding database with sample data...\033[0m"
            npm run prisma:seed
            
            if [ $? -eq 0 ]; then
                echo -e "\033[32m✅ Database seeded successfully\033[0m"
            fi
        fi
    else
        echo -e "\033[33m⚠️  Could not start Docker. Please start PostgreSQL manually.\033[0m"
    fi
else
    echo -e "\n\033[33m⚠️  Docker not available. Please:\033[0m"
    echo -e "\033[33m  1. Install PostgreSQL manually\033[0m"
    echo -e "\033[33m  2. Create a database named 'nexus_wms'\033[0m"
    echo -e "\033[33m  3. Update the DATABASE_URL in .env file\033[0m"
    echo -e "\033[33m  4. Run: npm run prisma:migrate\033[0m"
    echo -e "\033[33m  5. Run: npm run prisma:seed\033[0m"
fi

echo -e "\n\033[32m✨ Setup complete!\033[0m"
echo -e "\n\033[36mTo start the development server, run:\033[0m"
echo -e "  npm run dev"
echo -e "\n\033[36mDefault login credentials:\033[0m"
echo -e "  Email: william@nexuswms.com"
echo -e "  Password: password123"
echo -e "\n\033[36mAPI will be available at: http://localhost:3000\033[0m"
echo -e "\033[36mAPI Documentation: see API_DOCUMENTATION.md\033[0m"