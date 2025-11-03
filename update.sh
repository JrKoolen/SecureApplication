#!/bin/bash

echo "========================================"
echo "  Updating Secure Application"
echo "========================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "[ERROR] Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "[ERROR] Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "[INFO] Docker and Docker Compose are installed"
echo ""

# Step 1: Build TypeScript
echo "[1/3] Building TypeScript code..."
npm run build
if [ $? -ne 0 ]; then
    echo "[ERROR] TypeScript build failed!"
    exit 1
fi
echo "[SUCCESS] TypeScript build completed"
echo ""

# Step 2: Stop existing containers
echo "[2/3] Stopping existing containers..."
docker-compose down
echo "[SUCCESS] Containers stopped"
echo ""

# Step 3: Rebuild and start containers
echo "[3/3] Rebuilding and starting containers with new code..."
docker-compose up -d --build
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to start containers!"
    exit 1
fi
echo "[SUCCESS] Containers rebuilt and started"
echo ""

# Show container status
echo "========================================"
echo "  Container Status"
echo "========================================"
docker-compose ps
echo ""

echo "========================================"
echo "  Application Updated Successfully!"
echo "========================================"
echo "Access at: http://localhost:3000"
echo "Admin: admin@secureapp.com / Admin@123!Secure"
echo ""
echo "To view logs: docker-compose logs -f"
echo "To stop: docker-compose down"
echo ""

