# Course Notifier

> Real-time university course availability tracker with instant notifications

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)

Course Notifier helps university students track course availability in real-time. The system automatically scrapes course data from the university registration system, detects when courses open or close, and sends instant notifications via email, web push, or mobile.

## Features

- **Real-time Course Monitoring** - Automated scraping every 5 minutes
- **Smart Notifications** - Get notified via Email, Web Push, or Mobile (FCM)
- **Advanced Filtering** - Filter by faculty, study type, days, time shifts
- **Watchlist System** - Track specific courses with custom notification preferences
- **"Newly Opened" Detection** - Special alerts for courses that just opened
- **Instant Search** - Client-side filtering with 10ms latency
- **Responsive Design** - Works on desktop and mobile
- **Admin Dashboard** - Full system management and analytics
- **RTL Support** - Full Arabic language support
- [x] When Opening Multiple Things in the Mobile Side Web Like the Side Bar and the For Instance the Profile Drop Down it should close the other and not all Open In the same Time 
- [x] Making Sure that Filters are sticked after Rebuild and are triggered Right 
- [x] Making Sure that Remove from Watch List and Add Are Smooth In The website and do not need Refresh Web Page  For Both PC and Mobile One 
- [x] Adding a Fav Icon 
- [x] Making Sure That It is compatible With Chrome, Firefox , and Safari Browsers 
- [ ] CI/CD : GitHub Actions for automated deployment 
- [ ] Testing  :Add E2E tests with Playwright 
- [ ] Performance : Code splitting to reduce bundle size 
- [ ] Making an Android App 
- [ ] Making an PWA Enhancement (Free iOS Alternative)
		Add service worker for offline support
		Add web app manifest for install ability
		Add "Add to Home Screen" prompt
		Test on iOS Safari
		Optimize for mobile viewport
- [ ] Phase 3: Plugin Architecture
	    Design plugin interface/contract
	    Create plugin loader system
	    Refactor Zarqa scraper as first plugin
	    Database changes (data sources table)
	    Modify Course model for multi-source
	    Admin UI for plugin management
	    Documentation for creating plugins
- [ ] Phase 4: AI-Assisted Integration
	    AI tool to analyze university website structure
	    Auto-generate plugin scaffolding
	    Sandbox for testing generated scrapers
	    Admin review and approval workflow
- [ ] Phase 5: Multi-University Expansion
	    Docker Compose packaging for self-hosting
	    Installation documentation
	    Create plugins for each new university(Locally Maybe)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, TailwindCSS, Zustand |
| Backend | Node.js, Express, TypeScript, Sequelize ORM |
| Database | PostgreSQL 15, Redis 7 |
| Scraper | Puppeteer (Headless Chrome) |
| Notifications | Nodemailer (SMTP), Web Push API, Firebase Cloud Messaging |
| Infrastructure | Docker, Docker Compose, Nginx |
| Monitoring | Sentry (Error tracking & Performance) |

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Vikt0r70/course-notifier.git
cd course-notifier
```

### 2. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.docker.example .env.docker

# Edit with your values
nano .env.docker  # or use any text editor
```

Required variables:
- `POSTGRES_PASSWORD` - Database password
- `JWT_SECRET` - Secret for JWT tokens
- `SMTP_USER` / `SMTP_PASS` - Email credentials for notifications
- `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` - For web push notifications

### 3. Start with Docker

```bash
# Start all services
docker compose --env-file .env.docker up -d

# View logs
docker compose logs -f
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### 4. Create Admin User

```bash
# Access the server container
docker exec -it course-notifier-server sh

# Run the admin creation script (inside container)
npm run create-admin
```

## Project Structure

```
course-notifier/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Route pages
│   │   ├── services/      # API service layer
│   │   ├── store/         # Zustand state management
│   │   └── types/         # TypeScript definitions
│   └── Dockerfile.prod
│
├── server/                 # Node.js Backend
│   ├── src/
│   │   ├── config/        # Configuration
│   │   ├── models/        # Sequelize models
│   │   ├── routes/        # Express routes
│   │   ├── services/      # Business logic
│   │   └── middleware/    # Auth, validation, etc.
│   └── Dockerfile
│
├── docs/                   # Documentation
├── docker-compose.yml      # Production compose file
└── .env.docker.example     # Environment template
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and get JWT |
| POST | `/api/auth/refresh` | Refresh access token |

### Courses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courses` | List all courses (with filters) |
| GET | `/api/courses/:id` | Get course details |
| GET | `/api/courses/faculties` | List all faculties |

### Watchlist
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/watchlist` | Get user's watchlist |
| POST | `/api/watchlist` | Add course to watchlist |
| DELETE | `/api/watchlist/:id` | Remove from watchlist |
| PUT | `/api/watchlist/:id` | Update notification preferences |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get user's notifications |
| PUT | `/api/notifications/:id/read` | Mark as read |
| POST | `/api/notifications/subscribe` | Subscribe to push notifications |

## Development

### Local Development Setup

```bash
# Install dependencies
cd client && npm install
cd ../server && npm install

# Start PostgreSQL and Redis (using Docker)
docker compose up -d postgres redis

# Start backend (in server/)
npm run dev

# Start frontend (in client/)
npm run dev
```

### Environment Variables

See `.env.docker.example` for all available configuration options.

## Deployment

### Production Deployment

1. Set up a VPS with Docker installed
2. Clone the repository
3. Create `.env.docker` with production values
4. Run `docker compose --env-file .env.docker up -d`
5. Configure reverse proxy (Nginx/Caddy) for HTTPS

### SSL/HTTPS

The application is designed to work behind a reverse proxy. Configure your proxy (Caddy, Nginx, Traefik) to handle SSL termination.

## Extending for Other Universities

Course Notifier is designed with extensibility in mind. The scraper service can be adapted for different university systems:

1. Create a new scraper class implementing the `IScraper` interface
2. Configure the target URL and parsing logic
3. Map the scraped data to the standard course schema

See `docs/` for architecture documentation.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built for Zarqa University students
- Inspired by the need for better course registration tools
- Thanks to all contributors and testers

---

**Note:** This project was originally built for Zarqa University (Jordan) but can be adapted for other universities. The scraper module is designed to be replaceable for different university registration systems.
