#!/bin/bash

echo "🚀 Starting Secure Application..."
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Build and start containers
echo "📦 Building and starting containers..."
docker-compose up --build

echo ""
echo "✅ Application started successfully!"
echo "🌐 Access at: http://localhost:3000"
echo "🔐 Admin: admin@secureapp.com / Admin@123!Secure"
