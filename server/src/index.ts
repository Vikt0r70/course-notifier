// Sentry must be imported first
import * as Sentry from '@sentry/node';

// Initialize Sentry before other imports
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  integrations: [
    Sentry.httpIntegration(),
    Sentry.expressIntegration(),
  ],
  // Enable Sentry Logs
  _experiments: {
    enableLogs: true,
  },
});

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import config from './config';
import sequelize from './database/connection';
import { connectRedis } from './database/redis';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import ScraperScheduler from './services/scraper/ScraperScheduler';
import { ScraperLog } from './models';
import FirebaseService from './services/firebase/FirebaseService';

const app = express();

app.use(helmet());
app.use(cors({
  origin: config.client.url,
  credentials: true,
}));
app.use(compression());
app.use(morgan(config.env === 'development' ? 'dev' : 'combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // 200 requests per minute
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

app.use('/api', routes);

// Sentry error handler must be before other error handlers
Sentry.setupExpressErrorHandler(app);

app.use(errorHandler);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    await connectRedis();

    // Initialize Firebase for FCM push notifications
    FirebaseService.initialize();

    // Mark any incomplete scraper logs as failed on startup
    const incompleteLogs = await ScraperLog.findAll({
      where: { 
        status: 'running'
      } 
    });
    
    for (const log of incompleteLogs) {
      if (!log.completedAt) {
        await log.update({
          status: 'failed',
          errorMessage: 'Server restarted while scraper was running',
          completedAt: new Date()
        });
      }
    }
    
    if (incompleteLogs.length > 0) {
      console.log(`⚠️  Marked ${incompleteLogs.length} incomplete scraper log(s) as failed`);
    }

    await ScraperScheduler.start();
    console.log('✅ Scraper scheduler started');

    app.listen(config.port, () => {
      console.log(`✅ Server running on port ${config.port}`);
      console.log(`🌍 Environment: ${config.env}`);
      console.log(`🔗 API URL: http://localhost:${config.port}/api`);
    });
  } catch (error) {
    Sentry.captureException(error);
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
};

startServer();

process.on('SIGTERM', async () => {
  console.log('⏹️  SIGTERM received, shutting down gracefully...');
  ScraperScheduler.stop();
  await sequelize.close();
  process.exit(0);
});
