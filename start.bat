@echo off
echo 🚀 Course Notifier - Docker Deployment
echo ======================================

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

echo 📦 Building Docker images...
docker-compose build --no-cache

echo 🧹 Cleaning up old containers...
docker-compose down -v

echo 🔧 Starting services...
docker-compose up -d

echo ⏳ Waiting for services to be ready...
timeout /t 15 /nobreak >nul

echo.
echo ✅ Deployment Complete!
echo.
echo 📊 Service Status:
docker-compose ps

echo.
echo 🌐 Access Points:
echo    Frontend:  http://localhost:3000
echo    Backend:   http://localhost:5000/api
echo    Database:  localhost:5432
echo.

echo 📝 Next Steps:
echo    1. Create admin user (register then run SQL):
echo       docker-compose exec db psql -U coursenotifier -d coursenotifier -c "UPDATE users SET is_admin = true WHERE email = 'your@email.com';"
echo.
echo    2. Run scraper manually:
echo       docker-compose exec server npm run scraper
echo.
echo    3. View logs:
echo       docker-compose logs -f
echo.
echo 🎉 Happy coding!
echo.
pause
