#!/bin/bash

echo "🚀 Course Notifier v2.0 - Production Deployment"
echo "================================================"

echo "📦 Building Docker images..."
docker-compose build

echo "🔧 Starting services..."
docker-compose up -d

echo "⏳ Waiting for services to be healthy..."
sleep 10

echo "✅ Deployment complete!"
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "🌐 Application URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:5000/api"
echo "   Database: localhost:5432"
echo ""
echo "📝 Useful Commands:"
echo "   View logs: docker-compose logs -f"
echo "   Stop services: docker-compose down"
echo "   Restart: docker-compose restart"
echo "   Run scraper: docker-compose exec server npm run scraper"
echo ""
echo "🎉 Happy coding!"
