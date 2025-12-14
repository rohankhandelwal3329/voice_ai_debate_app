# Docker Setup Verification Script for Windows PowerShell

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Docker Setup Verification Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
Write-Host "[1/5] Checking Docker installation..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Docker is installed: $dockerVersion" -ForegroundColor Green
    } else {
        Write-Host "❌ Docker is not installed or not in PATH" -ForegroundColor Red
        Write-Host "   Please install Docker Desktop from: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ Docker is not installed" -ForegroundColor Red
    Write-Host "   Please install Docker Desktop from: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    exit 1
}

# Check if Docker Compose is installed
Write-Host ""
Write-Host "[2/5] Checking Docker Compose installation..." -ForegroundColor Yellow
try {
    $composeVersion = docker-compose --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Docker Compose is installed: $composeVersion" -ForegroundColor Green
    } else {
        Write-Host "❌ Docker Compose is not installed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Docker Compose is not installed" -ForegroundColor Red
    exit 1
}

# Check if Docker daemon is running
Write-Host ""
Write-Host "[3/5] Checking if Docker daemon is running..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Docker daemon is running" -ForegroundColor Green
    } else {
        Write-Host "❌ Docker daemon is not running" -ForegroundColor Red
        Write-Host "   Please start Docker Desktop" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ Docker daemon is not running" -ForegroundColor Red
    Write-Host "   Please start Docker Desktop" -ForegroundColor Yellow
    exit 1
}

# Check if docker-compose.yml exists
Write-Host ""
Write-Host "[4/5] Checking project files..." -ForegroundColor Yellow
if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "❌ docker-compose.yml not found" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path "backend\Dockerfile")) {
    Write-Host "❌ backend\Dockerfile not found" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path "frontend\Dockerfile")) {
    Write-Host "❌ frontend\Dockerfile not found" -ForegroundColor Red
    exit 1
}
Write-Host "✅ All required files found" -ForegroundColor Green

# Try to validate docker-compose config
Write-Host ""
Write-Host "[5/5] Testing Docker Compose configuration..." -ForegroundColor Yellow
try {
    docker-compose config | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Docker Compose configuration is valid" -ForegroundColor Green
    } else {
        Write-Host "❌ Docker Compose configuration has errors" -ForegroundColor Red
        docker-compose config
        exit 1
    }
} catch {
    Write-Host "❌ Docker Compose configuration has errors" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ All checks passed! Docker setup looks good." -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Build images:    docker-compose build" -ForegroundColor White
Write-Host "  2. Start services:   docker-compose up" -ForegroundColor White
Write-Host "  3. Open browser:    http://localhost:3000" -ForegroundColor White
Write-Host ""

