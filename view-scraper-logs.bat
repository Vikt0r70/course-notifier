@echo off
echo ========================================
echo   VIEWING SCRAPER LOGS
echo ========================================
echo.
echo Press Ctrl+C to stop viewing logs
echo.

docker logs -f course-notifier-server --tail 500
