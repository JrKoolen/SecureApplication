@echo off
echo Starting Secure Application...
echo.

REM Check if Docker is installed
where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Docker is not installed. Please install Docker first.
    exit /b 1
)

REM Check if docker-compose is installed
where docker-compose >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Docker Compose is not installed. Please install Docker Compose first.
    exit /b 1
)

echo Docker and Docker Compose are installed
echo.

echo Building and starting containers...
docker-compose up --build

echo.
echo Application started successfully!
echo Access at: http://localhost:3000
echo Admin: admin@secureapp.com / Admin@123!Secure
pause
