import sequelize from './connection';
import { User, Course, Watchlist, Notification, SystemSetting, ScraperLog } from '../models';

export const initializeDatabase = async () => {
  try {
    console.log('🔧 Initializing database...');

    await sequelize.authenticate();
    console.log('✅ Database connection established');

    await sequelize.sync({ alter: true });
    console.log('✅ Database models synchronized');

    const settingsCount = await SystemSetting.count();
    if (settingsCount === 0) {
      await SystemSetting.bulkCreate([
        { key: 'scraper_auto_sync', value: 'true' },
        { key: 'scraper_interval_minutes', value: '60' },
        { key: 'smtp_host', value: 'smtp.gmail.com' },
        { key: 'smtp_port', value: '587' },
      ]);
      console.log('✅ Default settings created');
    }

    console.log('✅ Database initialization complete');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

if (require.main === module) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
