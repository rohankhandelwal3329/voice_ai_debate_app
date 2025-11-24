"""
Starts both the backend (FastAPI) and frontend (Vite) servers.
Run from the project root: python run.py
"""

import subprocess
import sys
import os
import time
import signal

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
FRONTEND_DIR = os.path.join(ROOT_DIR, "Frontend")

processes = []


def cleanup(signum=None, frame=None):
    print("\n\nShutting down servers...")
    for proc in processes:
        try:
            proc.terminate()
            proc.wait(timeout=5)
        except Exception:
            proc.kill()
    sys.exit(0)


def main():
    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)

    # Check directories exist
    if not os.path.isdir(BACKEND_DIR):
        print(f"Error: Backend directory not found at {BACKEND_DIR}")
        sys.exit(1)
    if not os.path.isdir(FRONTEND_DIR):
        print(f"Error: Frontend directory not found at {FRONTEND_DIR}")
        sys.exit(1)

    # Check for .env file in backend
    env_file = os.path.join(BACKEND_DIR, ".env")
    if not os.path.isfile(env_file):
        print("Warning: No .env file found in backend/")
        print("Copy backend/env.example to backend/.env and add your GEMINI_API_KEY")
        print()

    print("=" * 50)
    print("Starting Assignment Authenticity Checker")
    print("=" * 50)

    # Start backend
    print("\n[1/2] Starting backend server (FastAPI)...")
    backend_cmd = [sys.executable, "-m", "uvicorn", "main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"]
    backend_proc = subprocess.Popen(
        backend_cmd,
        cwd=BACKEND_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )
    processes.append(backend_proc)
    time.sleep(2)

    # Start frontend
    print("[2/2] Starting frontend server (Vite)...")
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    frontend_cmd = [npm_cmd, "run", "dev"]
    frontend_proc = subprocess.Popen(
        frontend_cmd,
        cwd=FRONTEND_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )
    processes.append(frontend_proc)

    print("\n" + "=" * 50)
    print("Servers starting...")
    print("  Backend:  http://localhost:8000")
    print("  Frontend: http://localhost:5173")
    print("=" * 50)
    print("\nPress Ctrl+C to stop both servers\n")

    # Stream output from both processes
    while True:
        # Check if processes are still running
        if backend_proc.poll() is not None:
            print("\nBackend server stopped unexpectedly!")
            cleanup()
        if frontend_proc.poll() is not None:
            print("\nFrontend server stopped unexpectedly!")
            cleanup()

        # Read and print output
        backend_line = backend_proc.stdout.readline()
        if backend_line:
            print(f"[backend]  {backend_line.rstrip()}")

        frontend_line = frontend_proc.stdout.readline()
        if frontend_line:
            print(f"[frontend] {frontend_line.rstrip()}")

        if not backend_line and not frontend_line:
            time.sleep(0.1)


if __name__ == "__main__":
    main()

