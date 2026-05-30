import 'dotenv/config';
import sequelize from '../../database/connection';
import { getActiveScraper } from './ScraperFactory';

async function main() {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('🔗 DATABASE CONNECTION');
    console.log('='.repeat(60));
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');
    console.log(`📍 Host: ${process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'localhost'}`);
    console.log('='.repeat(60));

    const Scraper = await getActiveScraper();
    await Scraper.scrapeAll();
    
    console.log('\n🎉 Scraper process exiting successfully\n');
    process.exit(0);
  } catch (error: any) {
    console.error('\n' + '='.repeat(60));
    console.error('💥 FATAL ERROR');
    console.error('='.repeat(60));
    console.error(`❌ ${error.message}`);
    console.error(`📍 ${error.stack}`);
    console.error('='.repeat(60) + '\n');
    process.exit(1);
  }
}

main();
