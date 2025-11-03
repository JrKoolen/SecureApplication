#!/bin/bash

echo "========================================"
echo "  Setting Up Secure Application"
echo "========================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "[ERROR] Docker is not installed. Please install Docker first."
    echo "Download from: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "[ERROR] Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "[INFO] Docker and Docker Compose are installed"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[WARNING] Node.js is not installed. Installing dependencies will fail."
    echo "Download from: https://nodejs.org/"
    echo ""
    read -p "Continue anyway? (y/n): " continue
    if [ "$continue" != "y" ]; then
        exit 1
    fi
fi

# Install dependencies
echo "[INFO] Installing Node.js dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to install dependencies!"
    exit 1
fi
echo "[SUCCESS] Dependencies installed"
echo ""

# Build TypeScript
echo "[INFO] Building TypeScript code..."
npm run build
if [ $? -ne 0 ]; then
    echo "[ERROR] TypeScript build failed!"
    exit 1
fi
echo "[SUCCESS] TypeScript build completed"
echo ""

# Build and start containers
echo "[INFO] Building and starting Docker containers..."
docker-compose up -d --build
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to start containers!"
    exit 1
fi
echo "[SUCCESS] Containers started"
echo ""

# Wait a moment for containers to be ready
sleep 3

# Show container status
echo "========================================"
echo "  Container Status"
echo "========================================"
docker-compose ps
echo ""

echo "========================================"
echo "  Setup Complete!"
echo "========================================"
echo "Application is running at: http://localhost:3000"
echo "Admin credentials:"
echo "  Email: admin@secureapp.com"
echo "  Password: Admin@123!Secure"
echo ""
echo "Useful commands:"
echo "  View logs: docker-compose logs -f"
echo "  Stop containers: docker-compose down"
echo "  Update code: ./update.sh"
echo ""

