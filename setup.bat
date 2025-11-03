@echo off
echo ========================================
echo  Setting Up Secure Application
echo ========================================
echo.

REM Check if Docker is installed
where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker is not installed. Please install Docker first.
    echo Download from: https://www.docker.com/products/docker-desktop
    exit /b 1
)

REM Check if docker-compose is installed
where docker-compose >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker Compose is not installed. Please install Docker Compose first.
    exit /b 1
)

echo [INFO] Docker and Docker Compose are installed
echo.

REM Check if Node.js is installed (needed for building)
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Node.js is not installed. Installing dependencies will fail.
    echo Download from: https://nodejs.org/
    echo.
    set /p continue="Continue anyway? (y/n): "
    if /i not "%continue%"=="y" exit /b 1
)

echo [INFO] Installing Node.js dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install dependencies!
    exit /b 1
)
echo [SUCCESS] Dependencies installed
echo.

REM Build TypeScript
echo [INFO] Building TypeScript code...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] TypeScript build failed!
    exit /b 1
)
echo [SUCCESS] TypeScript build completed
echo.

REM Build and start containers
echo [INFO] Building and starting Docker containers...
docker-compose up -d --build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to start containers!
    exit /b 1
)
echo [SUCCESS] Containers started
echo.

REM Wait a moment for containers to be ready
timeout /t 3 /nobreak >nul

REM Show container status
echo ========================================
echo  Container Status
echo ========================================
docker-compose ps
echo.

echo ========================================
echo  Setup Complete!
echo ========================================
echo Application is running at: http://localhost:3000
echo Admin credentials:
echo   Email: admin@secureapp.com
echo   Password: Admin@123!Secure
echo.
echo Useful commands:
echo   View logs: docker-compose logs -f
echo   Stop containers: docker-compose down
echo   Update code: update.bat
echo.
pause

