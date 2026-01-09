@echo off
echo ========================================
echo   COURSE NOTIFIER - SCRAPER RUNNER
echo ========================================
echo.
echo Starting scraper in Docker container...
echo.

docker exec -it course-notifier-server npm run scraper

echo.
echo ========================================
echo   SCRAPER FINISHED
echo ========================================
pause
