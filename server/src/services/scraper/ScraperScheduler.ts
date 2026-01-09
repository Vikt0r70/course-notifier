import cron from 'node-cron';
import ScraperService from './ScraperService';
import { SystemSetting } from '../../models';

class ScraperScheduler {
  private task: cron.ScheduledTask | null = null;
  private isRunning = false;

  async start(): Promise<void> {
    const setting = await SystemSetting.findOne({ where: { key: 'scraper_auto_sync' } });
    const autoSync = setting?.value === 'true';

    if (!autoSync) {
      console.log('⚠️  Scraper auto-sync is disabled');
      return;
    }

    const intervalSetting = await SystemSetting.findOne({ where: { key: 'scraper_interval_minutes' } });
    const intervalMinutes = parseInt(intervalSetting?.value || '60', 10);

    this.schedule(intervalMinutes);
  }

  schedule(intervalMinutes: number): void {
    if (this.task) {
      this.task.stop();
    }

    if (intervalMinutes === 0) {
      console.log('⚠️  Scraper scheduler disabled');
      return;
    }

    const cronExpression = `*/${intervalMinutes} * * * *`;

    this.task = cron.schedule(cronExpression, async () => {
      if (this.isRunning) {
        console.log('⚠️ Skipping scheduled scraper run: Previous run still in progress');
        return;
      }

      this.isRunning = true;
      console.log(`⏰ Running scheduled scraper (every ${intervalMinutes} minutes)`);
      try {
        await ScraperService.scrapeAll();
      } catch (error) {
        console.error('Scheduled scraper failed:', error);
      } finally {
        this.isRunning = false;
      }
    });

    console.log(`✅ Scraper scheduled to run every ${intervalMinutes} minutes`);
  }

  stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      console.log('⏹️  Scraper scheduler stopped');
    }
  }
}

export default new ScraperScheduler();
