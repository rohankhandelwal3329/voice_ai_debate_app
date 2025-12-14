# Docker Setup Guide

## Installing Docker

### Windows

1. **Download Docker Desktop for Windows**
   - Go to: https://www.docker.com/products/docker-desktop/
   - Download "Docker Desktop for Windows"
   - Run the installer and follow the setup wizard

2. **System Requirements**
   - Windows 10 64-bit: Pro, Enterprise, or Education (Build 15063 or later)
   - Windows 11 64-bit
   - WSL 2 feature enabled
   - Virtualization enabled in BIOS

3. **After Installation**
   - Restart your computer if prompted
   - Open Docker Desktop
   - Wait for it to start (whale icon in system tray)
   - You should see "Docker Desktop is running" in the status

### macOS

1. **Download Docker Desktop for Mac**
   - Go to: https://www.docker.com/products/docker-desktop/
   - Choose Intel Chip or Apple Silicon version
   - Download and install

2. **After Installation**
   - Open Docker Desktop from Applications
   - Wait for it to start

### Linux (Ubuntu/Debian)

```bash
# Remove old versions
sudo apt-get remove docker docker-engine docker.io containerd runc

# Install Docker
sudo apt-get update
sudo apt-get install -y docker.io docker-compose

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to docker group (optional, to avoid sudo)
sudo usermod -aG docker $USER
# Log out and back in for this to take effect
```

---

## Verifying Docker Installation

Open a terminal/command prompt and run:

```bash
# Check Docker version
docker --version

# Check Docker Compose version
docker-compose --version

# Test Docker is running
docker ps
```

You should see output like:
```
Docker version 24.0.0, build ...
docker-compose version 1.29.0, build ...
CONTAINER ID   IMAGE   COMMAND   CREATED   STATUS   PORTS   NAMES
```

If you see errors, Docker Desktop might not be running. Start it from your applications.

---

## Testing the Docker Setup

Once Docker is installed, test the setup:

### Step 1: Navigate to Project Directory

```bash
cd C:\Users\rohan\Downloads\voice_assignment
```

### Step 2: Build and Start Containers

```bash
# Build images (first time only, takes a few minutes)
docker-compose build

# Start containers
docker-compose up
```

You should see:
- Backend starting on port 8000
- Frontend building, then serving on port 3000
- No errors in the output

### Step 3: Verify Services

Open a **new terminal** and run:

```bash
# Check if containers are running
docker-compose ps

# Check backend health
curl http://localhost:8000/api/health
# Should return: {"status":"ok"}

# Check frontend (in browser)
# Open: http://localhost:3000
```

### Step 4: Test the Application

1. Open http://localhost:3000 in Chrome
2. You should see the upload page
3. Settings modal should appear (for API key setup)
4. Try uploading a test file

### Step 5: View Logs

```bash
# View all logs
docker-compose logs

# View backend logs only
docker-compose logs backend

# View frontend logs only
docker-compose logs frontend

# Follow logs in real-time
docker-compose logs -f
```

---

## Common Issues

### "Cannot connect to Docker daemon"
- **Solution**: Make sure Docker Desktop is running
- Check system tray for Docker icon
- Restart Docker Desktop

### "Port already in use"
- **Solution**: Stop other services using ports 3000 or 8000
- Or change ports in `docker-compose.yml`:
  ```yaml
  ports:
    - "3001:80"  # Change frontend port
    - "8001:8000"  # Change backend port
  ```

### "Build failed"
- **Solution**: Check internet connection (needs to download images)
- Try: `docker-compose build --no-cache`

### Containers keep restarting
- **Solution**: Check logs: `docker-compose logs`
- Look for error messages
- Common: Missing dependencies or port conflicts

---

## Stopping and Cleaning Up

```bash
# Stop containers (keeps data)
docker-compose stop

# Stop and remove containers
docker-compose down

# Remove everything including volumes
docker-compose down -v

# Remove images too
docker-compose down --rmi all
```

---

## Development Mode

For development with hot reload:

```bash
docker-compose --profile dev up
```

This mounts your code as volumes so changes reflect immediately.

---

## Production Deployment

For production, use the regular compose (without `--profile dev`):

```bash
docker-compose up -d  # -d runs in background
```

The frontend will be built and served via nginx.

