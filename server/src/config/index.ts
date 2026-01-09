import dotenv from 'dotenv';
dotenv.config();

export default {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/coursenotifier',
    dialect: 'postgres' as const,
    logging: process.env.NODE_ENV === 'development',
  },
  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'noreply@coursenotifier.com',
  },
  
  client: {
    url: process.env.CLIENT_URL || 'http://localhost:3000',
  },
  
  scraper: {
    intervalMinutes: parseInt(process.env.SCRAPER_INTERVAL_MINUTES || '60', 10),
    autoSync: process.env.SCRAPER_AUTO_SYNC === 'true',
  },
};
