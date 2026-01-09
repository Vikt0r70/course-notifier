import { Response } from 'express';
import { Op } from 'sequelize';

import { User, Course, Watchlist, Notification, ScraperLog, SystemSetting, ProblemReport } from '../models';
import { AuthRequest } from '../middleware/auth';
import ScraperService from '../services/scraper/ScraperService';
import ScraperScheduler from '../services/scraper/ScraperScheduler';
import EmailService from '../services/email/EmailService';
import NotificationService from '../services/notification/NotificationService';

// In-memory log buffer for real-time logs
const serverLogs: { timestamp: Date; level: string; message: string }[] = [];
const MAX_LOGS = 500;

export const addServerLog = (level: string, message: string) => {
  serverLogs.unshift({ timestamp: new Date(), level, message });
  if (serverLogs.length > MAX_LOGS) serverLogs.pop();
};

// Override console methods to capture logs
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.log = (...args) => {
  addServerLog('info', args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
  originalConsoleLog.apply(console, args);
};

console.error = (...args) => {
  addServerLog('error', args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
  originalConsoleError.apply(console, args);
};

console.warn = (...args) => {
  addServerLog('warn', args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
  originalConsoleWarn.apply(console, args);
};

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const totalUsers = await User.count();
    const verifiedUsers = await User.count({ where: { isEmailVerified: true } });
    const totalCourses = await Course.count();
    const openCourses = await Course.count({ where: { isOpen: true } });
    const closedCourses = await Course.count({ where: { isOpen: false } });
    const totalWatchlists = await Watchlist.count();

    const recentUsers = await User.findAll({
      attributes: ['id', 'username', 'email', 'isEmailVerified', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 5,
    });

    const lastLog = await ScraperLog.findOne({
      order: [['startedAt', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        verifiedUsers,
        unverifiedUsers: totalUsers - verifiedUsers,
        totalCourses,
        openCourses,
        closedCourses,
        totalWatchlists,
        recentUsers,
        lastScraperRun: lastLog?.completedAt || null,
      },
    });
  } catch (error: any) {
    console.error(error); res.status(500).json({ success: false, message: error.message });
  }
};

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const where: any = {};

    if (search) {
      where[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows } = await User.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['passwordHash', 'emailVerificationToken', 'passwordResetToken'] },
    });

    res.json({
      success: true,
      data: {
        users: rows,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error: any) {
    console.error(error); res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Cannot delete admin users' });
    }

    // Manually cascade delete dependent records
    // Delete Notifications first because they reference Watchlists
    await Notification.destroy({ where: { userId: id } });
    await Watchlist.destroy({ where: { userId: id } });
    await ProblemReport.destroy({ where: { userId: id } });

    await user.destroy();
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    console.error(error); res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleEmailVerification = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isEmailVerified = !user.isEmailVerified;
    await user.save();

    res.json({
      success: true,
      message: 'Email verification status updated',
      data: { isEmailVerified: user.isEmailVerified },
    });
  } catch (error: any) {
    console.error(error); res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllWatchlists = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows } = await Watchlist.findAndCountAll({
      limit: Number(limit),
      offset,
      order: [['addedAt', 'DESC']],
      include: [{ model: User, as: 'user', attributes: ['username', 'email'] }],
    });

    res.json({
      success: true,
      data: {
        watchlists: rows,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error: any) {
    console.error(error); res.status(500).json({ success: false, message: error.message });
  }
};

export const runScraper = async (req: AuthRequest, res: Response) => {
  try {
    ScraperService.scrapeAll()
      .then(() => console.log('✅ Manual scraper run completed'))
      .catch((error) => console.error('❌ Manual scraper run failed:', error));

    res.json({
      success: true,
      message: 'Scraper started. This will take approximately 40 minutes. Check back later for results.',
    });
  } catch (error: any) {
    console.error(error); res.status(500).json({ success: false, message: error.message });
  }
};

export const getScraperLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 10 } = req.query;

    const logs = await ScraperLog.findAll({
      limit: Number(limit),
      order: [['startedAt', 'DESC']],
    });

    res.json({ success: true, data: logs });
  } catch (error: any) {
    console.error(error); res.status(500).json({ success: false, message: error.message });
  }
};

export const getSettings = async (req: AuthRequest, res: Response) => {
  try {
    const settings = await SystemSetting.findAll();
    const settingsObj = settings.reduce((acc: any, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});

    res.json({ success: true, data: settingsObj });
  } catch (error: any) {
    console.error(error); res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSettings = async (req: AuthRequest, res: Response) => {
  try {
    const { key, value } = req.body;

    const [setting, created] = await SystemSetting.findOrCreate({
      where: { key },
      defaults: { key, value },
    });

    if (!created) {
      setting.value = value;
      await setting.save();
    }

    if (key === 'scraper_interval_minutes') {
      ScraperScheduler.schedule(parseInt(value, 10));
    } else if (key === 'scraper_auto_sync') {
      if (value === 'false') {
        ScraperScheduler.stop();
      } else {
        await ScraperScheduler.start();
      }
    }

    res.json({ success: true, message: 'Setting updated', data: setting });
  } catch (error: any) {
    console.error(error); res.status(500).json({ success: false, message: error.message });
  }
};

export const sendTestEmail = async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address required' });
    }

    await EmailService.sendTestEmail(email);

    res.json({ success: true, message: `Test email sent to ${email}` });
  } catch (error: any) {
    console.error(error); res.status(500).json({ success: false, message: error.message });
  }
};

export const triggerNotificationCheck = async (req: AuthRequest, res: Response) => {
  try {
    NotificationService.checkAndNotify()
      .then(() => console.log('✅ Notification check completed'))
      .catch((error) => console.error('❌ Notification check failed:', error));

    res.json({ success: true, message: 'Notification check triggered' });
  } catch (error: any) {
    console.error(error); res.status(500).json({ success: false, message: error.message });
  }
};

// SMTP Settings
export const getSmtpSettings = async (req: AuthRequest, res: Response) => {
  try {
    const settings = await EmailService.getSmtpSettings();
    res.json({ success: true, data: settings });
  } catch (error: any) {
    console.error(error); res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSmtpSettings = async (req: AuthRequest, res: Response) => {
  try {
    const settings = req.body;
    await EmailService.updateSmtpSettings(settings);
    res.json({ success: true, message: 'SMTP settings updated' });
  } catch (error: any) {
    console.error(error); res.status(500).json({ success: false, message: error.message });
  }
};

// Server Logs
export const getServerLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 100, level } = req.query;
    let logs = serverLogs.slice(0, Number(limit));
    
    if (level && level !== 'all') {
      logs = logs.filter(l => l.level === level);
    }
    
    res.json({ success: true, data: logs });
  } catch (error: any) {
    console.error(error); res.status(500).json({ success: false, message: error.message });
  }
};

export const clearServerLogs = async (req: AuthRequest, res: Response) => {
  try {
    serverLogs.length = 0;
    res.json({ success: true, message: 'Logs cleared' });
  } catch (error: any) {
    console.error(error); res.status(500).json({ success: false, message: error.message });
  }
};

// Database Logs (PostgreSQL)
export const getDatabaseLogs = async (req: AuthRequest, res: Response) => {
  try {
    // Get database stats and recent activity
    const stats = {
      totalUsers: await User.count(),
      totalCourses: await Course.count(),
      totalWatchlists: await Watchlist.count(),
      totalNotifications: await Notification.count(),
    };

    // Get recent database activity
    const recentUsers = await User.findAll({
      order: [['createdAt', 'DESC']],
      limit: 5,
      attributes: ['id', 'username', 'email', 'createdAt'],
    });

    const recentWatchlists = await Watchlist.findAll({
      order: [['addedAt', 'DESC']],
      limit: 5,
    });

    res.json({
      success: true,
      data: {
        stats,
        recentActivity: {
          users: recentUsers,
          watchlists: recentWatchlists,
        },
      },
    });
  } catch (error: any) {
    console.error(error); res.status(500).json({ success: false, message: error.message });
  }
};

// Scraper Status (real-time)
export const getScraperStatus = async (req: AuthRequest, res: Response) => {
  try {
    const isRunning = ScraperService.isCurrentlyRunning();
    const lastLog = await ScraperLog.findOne({
      order: [['startedAt', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        isRunning,
        lastRun: lastLog ? {
          status: lastLog.status,
          startedAt: lastLog.startedAt,
          completedAt: lastLog.completedAt,
          coursesScraped: lastLog.coursesScraped,
          coursesAdded: lastLog.coursesAdded,
          coursesUpdated: lastLog.coursesUpdated,
          coursesRemoved: lastLog.coursesRemoved,
          error: lastLog.errorMessage,
        } : null,
      },
    });
  } catch (error: any) {
    console.error(error); res.status(500).json({ success: false, message: error.message });
  }
};

// Watch All Courses - Admin feature
export const getWatchAllCoursesStatus = async (req: AuthRequest, res: Response) => {
  try {
    const admin = await User.findByPk(req.user!.id);
    
    if (!admin || !admin.isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    res.json({ 
      success: true, 
      data: { watchAllCourses: admin.watchAllCourses }
    });
  } catch (error: any) {
    console.error(error); res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleWatchAllCourses = async (req: AuthRequest, res: Response) => {
  try {
    const admin = await User.findByPk(req.user!.id);
    
    if (!admin || !admin.isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    admin.watchAllCourses = !admin.watchAllCourses;
    await admin.save();

    res.json({ 
      success: true, 
      message: `Watch all courses ${admin.watchAllCourses ? 'enabled' : 'disabled'}`,
      data: { watchAllCourses: admin.watchAllCourses }
    });
  } catch (error: any) {
    console.error(error); res.status(500).json({ success: false, message: error.message });
  }
};
