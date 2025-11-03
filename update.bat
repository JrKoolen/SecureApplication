@echo off
echo ========================================
echo  Updating Secure Application
echo ========================================
echo.

REM Check if Docker is installed
where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker is not installed. Please install Docker first.
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

REM Step 1: Build TypeScript
echo [1/3] Building TypeScript code...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] TypeScript build failed!
    exit /b 1
)
echo [SUCCESS] TypeScript build completed
echo.

REM Step 2: Stop existing containers
echo [2/3] Stopping existing containers...
docker-compose down
echo [SUCCESS] Containers stopped
echo.

REM Step 3: Rebuild and start containers
echo [3/3] Rebuilding and starting containers with new code...
docker-compose up -d --build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to start containers!
    exit /b 1
)
echo [SUCCESS] Containers rebuilt and started
echo.

REM Show container status
echo ========================================
echo  Container Status
echo ========================================
docker-compose ps
echo.

echo ========================================
echo  Application Updated Successfully!
echo ========================================
echo Access at: http://localhost:3000
echo Admin: admin@secureapp.com / Admin@123!Secure
echo.
echo To view logs: docker-compose logs -f
echo To stop: docker-compose down
echo.
pause

