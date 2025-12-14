#!/bin/bash

echo "=========================================="
echo "Docker Setup Verification Script"
echo "=========================================="
echo ""

# Check if Docker is installed
echo "[1/5] Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH"
    echo "   Please install Docker Desktop from: https://www.docker.com/products/docker-desktop/"
    exit 1
fi
echo "✅ Docker is installed: $(docker --version)"

# Check if Docker Compose is installed
echo ""
echo "[2/5] Checking Docker Compose installation..."
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed"
    exit 1
fi
echo "✅ Docker Compose is installed: $(docker-compose --version)"

# Check if Docker daemon is running
echo ""
echo "[3/5] Checking if Docker daemon is running..."
if ! docker ps &> /dev/null; then
    echo "❌ Docker daemon is not running"
    echo "   Please start Docker Desktop"
    exit 1
fi
echo "✅ Docker daemon is running"

# Check if docker-compose.yml exists
echo ""
echo "[4/5] Checking project files..."
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ docker-compose.yml not found"
    exit 1
fi
if [ ! -f "backend/Dockerfile" ]; then
    echo "❌ backend/Dockerfile not found"
    exit 1
fi
if [ ! -f "frontend/Dockerfile" ]; then
    echo "❌ frontend/Dockerfile not found"
    exit 1
fi
echo "✅ All required files found"

# Try to build (dry run check)
echo ""
echo "[5/5] Testing Docker Compose configuration..."
if docker-compose config &> /dev/null; then
    echo "✅ Docker Compose configuration is valid"
else
    echo "❌ Docker Compose configuration has errors"
    docker-compose config
    exit 1
fi

echo ""
echo "=========================================="
echo "✅ All checks passed! Docker setup looks good."
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Build images:    docker-compose build"
echo "  2. Start services:   docker-compose up"
echo "  3. Open browser:    http://localhost:3000"
echo ""

