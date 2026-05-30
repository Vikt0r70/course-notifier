import ScraperService from './ScraperService';
import PortalScraperService from './PortalScraperService';
import { SystemSetting } from '../../models';

export interface IScraper {
  scrapeAll(): Promise<void>;
  isCurrentlyRunning(): boolean;
}

export async function getActiveScraper(): Promise<IScraper> {
  const sourceSetting = await SystemSetting.findOne({
    where: { key: 'scraper_source' }
  });
  const source = sourceSetting?.value || 'public';

  if (source === 'portal') {
    return PortalScraperService;
  }
  return ScraperService;
}

export async function getActiveScraperSource(): Promise<'public' | 'portal'> {
  const sourceSetting = await SystemSetting.findOne({
    where: { key: 'scraper_source' }
  });
  return (sourceSetting?.value as 'public' | 'portal') || 'public';
}
