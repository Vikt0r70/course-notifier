import { Notification, Watchlist, User, Course } from '../../models';
import EmailService from '../email/EmailService';
import FCMPushService from '../push/FCMPushService';
import redisClient from '../../database/redis';
import { Op } from 'sequelize';

// Trigger source types for notification badges
export type TriggerSource = 
  | 'direct_watch'      // 🎯 User explicitly watches this course
  | 'similar_course'    // 🔄 Same course name, different section
  | 'newly_opened';     // 🆕 Course opened after watchlist was added

// Course change with trigger info
export interface CourseChange {
  course: Course;
  changeType: 'opened' | 'closed';
  triggerSources: TriggerSource[];
  watchlistId?: number;
}

// Batched notification for a user
export interface UserNotificationBatch {
  user: User;
  changes: CourseChange[];
}

// Type for queued admin course changes
interface AdminCourseChange {
  changeType: 'added' | 'opened' | 'closed' | 'removed';
  course: {
    courseCode: string;
    courseName: string;
    section: string;
    faculty?: string;
    instructor?: string;
    time?: string;
    days?: string;
    room?: string;
  };
}

class NotificationService {
  // Queue to collect admin course changes for batched email
  private adminCourseChangesQueue: AdminCourseChange[] = [];

  async createNotification(
    userId: number,
    watchlistId: number | undefined,
    courseCode: string,
    section: string,
    message: string,
    type: 'opened' | 'closed',
    triggerSources?: TriggerSource[]
  ): Promise<void> {
    await Notification.create({
      userId,
      watchlistId,
      courseCode,
      section,
      message,
      type,
      isRead: false,
      sentByWeb: true,
    });
  }

  /**
   * Main notification check - batches all changes per user
   */
  async checkAndNotify(): Promise<void> {
    try {
      const courses = await Course.findAll();
      const watchlists = await Watchlist.findAll({ include: [{ model: User, as: 'user' }] });

      // Map to collect changes per user
      const userBatches = new Map<number, UserNotificationBatch>();

      // First, cache the status of ALL courses (not just watched ones)
      for (const course of courses) {
        const cacheKey = `course_status:${course.courseCode}:${course.section}`;
        const previousStatus = await redisClient.get(cacheKey);
        
        if (previousStatus === null) {
          await redisClient.set(cacheKey, course.isOpen ? 'open' : 'closed');
        }
      }

      // Track which courses changed status this run
      const changedCourses = new Map<string, { course: Course; changeType: 'opened' | 'closed' }>();

      // Detect status changes for all courses
      for (const course of courses) {
        const cacheKey = `course_status:${course.courseCode}:${course.section}`;
        const previousStatus = await redisClient.get(cacheKey);
        
        if (previousStatus === null) continue;

        const wasOpen = previousStatus === 'open';
        const isNowOpen = course.isOpen;

        if (wasOpen !== isNowOpen) {
          const courseKey = `${course.courseCode}:${course.section}`;
          changedCourses.set(courseKey, {
            course,
            changeType: isNowOpen ? 'opened' : 'closed',
          });
          
          // Update cache immediately (at-most-once delivery)
          await redisClient.set(cacheKey, isNowOpen ? 'open' : 'closed');
        }
      }

      console.log(`📊 [NOTIFY] Found ${changedCourses.size} course status changes`);

      // Process each watchlist and batch changes per user
      for (const watchlist of watchlists) {
        const user = (watchlist as any).user;
        if (!user) {
          console.warn(`⚠️ Orphaned watchlist ${watchlist.id} (user_id: ${watchlist.userId}) - skipping`);
          continue;
        }

        // Initialize user batch if not exists
        if (!userBatches.has(user.id)) {
          userBatches.set(user.id, { user, changes: [] });
        }
        const batch = userBatches.get(user.id)!;

        // Check 1: Direct watch - did the watched course change?
        const directCourseKey = `${watchlist.courseCode}:${watchlist.section}`;
        const directChange = changedCourses.get(directCourseKey);
        
        if (directChange) {
          const shouldNotify = 
            (directChange.changeType === 'opened' && user.notifyOnOpen) ||
            (directChange.changeType === 'closed' && user.notifyOnClose);

          if (shouldNotify) {
            // Check if already in batch (from another watchlist)
            const existing = batch.changes.find(c => 
              c.course.courseCode === directChange.course.courseCode && 
              c.course.section === directChange.course.section
            );

            if (existing) {
              // Add trigger source if not already present
              if (!existing.triggerSources.includes('direct_watch')) {
                existing.triggerSources.push('direct_watch');
              }
            } else {
              batch.changes.push({
                course: directChange.course,
                changeType: directChange.changeType,
                triggerSources: ['direct_watch'],
                watchlistId: watchlist.id,
              });
            }
          }
        }

        // Check 2: Similar courses (if enabled)
        if (user.notifyOnSimilarCourse && watchlist.notifyOnSimilarCourse) {
          await this.checkSimilarCoursesForWatchlist(
            watchlist, 
            user, 
            courses, 
            changedCourses, 
            batch
          );
        }
      }

      // Send batched notifications for each user
      for (const [userId, batch] of userBatches) {
        if (batch.changes.length === 0) continue;

        try {
          await this.sendBatchedNotifications(batch);
          console.log(`📧 [BATCH] Sent ${batch.changes.length} changes to user ${userId}`);
        } catch (error) {
          console.error(`❌ Failed to send batch to user ${userId}:`, error);
        }
      }

      // Update ALL course statuses at the end (for next run's comparison)
      for (const course of courses) {
        const cacheKey = `course_status:${course.courseCode}:${course.section}`;
        await redisClient.set(cacheKey, course.isOpen ? 'open' : 'closed');
      }

      console.log('✅ Notification check completed');
    } catch (error) {
      console.error('❌ Notification check failed:', error);
    }
  }

  /**
   * Check for similar courses matching the watchlist filters
   */
  private async checkSimilarCoursesForWatchlist(
    watchlist: Watchlist,
    user: User,
    allCourses: Course[],
    changedCourses: Map<string, { course: Course; changeType: 'opened' | 'closed' }>,
    batch: UserNotificationBatch
  ): Promise<void> {
    // Find courses with same name but different section that are OPEN
    const similarCourses = allCourses.filter(course =>
      course.courseName === watchlist.courseName &&
      course.section !== watchlist.section &&
      course.isOpen
    );

    for (const similarCourse of similarCourses) {
      // Check if already notified this user about this similar course (Redis cache)
      const cacheKey = `similar_notified:user:${user.id}:${similarCourse.courseCode}:${similarCourse.section}`;
      const alreadyNotified = await redisClient.get(cacheKey);
      if (alreadyNotified) continue;

      // Apply filters if set
      if (!this.matchesSimilarFilters(watchlist, similarCourse)) {
        continue;
      }

      // Check "newly opened" filter
      const triggerSources: TriggerSource[] = ['similar_course'];
      
      if (watchlist.similarFilterNewlyOpened) {
        // Course must have opened AFTER the watchlist was added
        if (!similarCourse.firstOpenedAt || !watchlist.addedAt) {
          continue; // Can't determine, skip
        }
        if (new Date(similarCourse.firstOpenedAt) <= new Date(watchlist.addedAt)) {
          continue; // Course opened before watchlist was added
        }
        triggerSources.push('newly_opened');
      }

      // Check if already in batch
      const existing = batch.changes.find(c =>
        c.course.courseCode === similarCourse.courseCode &&
        c.course.section === similarCourse.section
      );

      if (existing) {
        // Add trigger sources
        for (const src of triggerSources) {
          if (!existing.triggerSources.includes(src)) {
            existing.triggerSources.push(src);
          }
        }
      } else {
        batch.changes.push({
          course: similarCourse,
          changeType: 'opened',
          triggerSources,
          watchlistId: watchlist.id,
        });
      }

      // Cache to avoid duplicate notifications (24 hours)
      await redisClient.setEx(cacheKey, 86400, 'true');
    }
  }

  /**
   * Check if a course matches the watchlist's similar course filters
   */
  private matchesSimilarFilters(watchlist: Watchlist, course: Course): boolean {
    const filters = watchlist.similarFilters;
    
    // If no filters set, match all similar courses
    if (!filters || filters.length === 0) {
      return true;
    }

    // Course must match AT LEAST ONE filter rule (OR logic between rules)
    for (const filter of filters) {
      // Check if course days match the filter's days pattern
      const courseDays = (course.days || '').trim();
      const filterDays = (filter.days || '').trim();
      
      if (courseDays !== filterDays) {
        continue; // Days don't match this filter, try next
      }

      // If filter has specific times, check if course time matches any
      if (filter.times && filter.times.length > 0) {
        const courseTime = (course.time || '').trim();
        const timeMatches = filter.times.some(t => t.trim() === courseTime);
        if (!timeMatches) {
          continue; // Time doesn't match this filter, try next
        }
      }

      // This filter matches!
      return true;
    }

    // No filter matched
    return false;
  }

  /**
   * Send batched notifications to a user
   */
  private async sendBatchedNotifications(batch: UserNotificationBatch): Promise<void> {
    const { user, changes } = batch;

    // Create web notifications for each change
    if (user.notifyByWeb) {
      for (const change of changes) {
        const triggerLabels = this.getTriggerLabels(change.triggerSources);
        const statusText = change.changeType === 'opened' ? '🟢 فتحت' : '🔴 أغلقت';
        const message = `${statusText} ${change.course.courseName} (${change.course.courseCode} - شعبة ${change.course.section})\n` +
          `${triggerLabels}\n` +
          `⏰ ${change.course.time} | 📅 ${change.course.days}\n` +
          `👨‍🏫 ${change.course.instructor}`;

        await this.createNotification(
          user.id,
          change.watchlistId,
          change.course.courseCode,
          change.course.section,
          message,
          change.changeType,
          change.triggerSources
        );
      }
      console.log(`🌐 [WEB] Created ${changes.length} notifications for user ${user.id}`);
    }

    // Send ONE batched email with all changes
    if (user.notifyByEmail && user.isEmailVerified) {
      try {
        await EmailService.sendBatchedCourseNotification(
          user.email,
          user.username,
          changes.map(c => ({
            courseCode: c.course.courseCode,
            courseName: c.course.courseName,
            section: c.course.section,
            changeType: c.changeType,
            triggerSources: c.triggerSources,
            time: c.course.time,
            days: c.course.days,
            instructor: c.course.instructor,
            room: c.course.room,
          }))
        );
        console.log(`📧 [EMAIL] Sent batched notification to ${user.email} (${changes.length} courses)`);
      } catch (error) {
        console.error(`Failed to send batched email to ${user.email}:`, error);
      }
    }

    // Send push notification with count
    if (user.notifyByPhone) {
      try {
        await FCMPushService.sendBatchedNotification(user, changes.length);
        console.log(`📱 [PUSH] Sent push to user ${user.id} (${changes.length} courses)`);
      } catch (error) {
        console.error(`Failed to send push to user ${user.id}:`, error);
      }
    }
  }

  /**
   * Get human-readable trigger labels in Arabic
   */
  private getTriggerLabels(sources: TriggerSource[]): string {
    const labels: string[] = [];
    
    if (sources.includes('direct_watch')) {
      labels.push('🎯 مراقبة مباشرة');
    }
    if (sources.includes('similar_course')) {
      labels.push('🔄 شعبة بديلة');
    }
    if (sources.includes('newly_opened')) {
      labels.push('🆕 فتحت حديثاً');
    }
    
    return labels.join(' | ');
  }

  // ============================================
  // Legacy methods for backward compatibility
  // ============================================

  async checkSimilarCourseNotifications(courses: Course[], watchlists: any[]): Promise<void> {
    // Now handled in checkAndNotify() batched flow
    console.log('⚠️ checkSimilarCourseNotifications called directly - use checkAndNotify instead');
  }

  private async sendSimilarCourseNotification(watchlist: any, course: Course): Promise<void> {
    // Legacy - no longer used, kept for compatibility
  }

  private async sendNotifications(watchlist: any, course: Course, type: 'opened' | 'closed'): Promise<void> {
    // Legacy - no longer used, kept for compatibility
  }

  // ============================================
  // Utility methods (unchanged)
  // ============================================

  async getUnreadNotifications(userId: number): Promise<Notification[]> {
    return await Notification.findAll({
      where: { userId, isRead: false },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });
  }

  async getAllNotifications(userId: number, includeRead: boolean = false): Promise<Notification[]> {
    const whereClause: any = { userId };
    if (!includeRead) {
      whereClause.isRead = false;
    }
    return await Notification.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: 100,
    });
  }

  async markAsRead(notificationId: number, userId: number): Promise<boolean> {
    const notification = await Notification.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) return false;

    notification.isRead = true;
    await notification.save();
    return true;
  }

  async markAllAsRead(userId: number): Promise<void> {
    await Notification.update({ isRead: true }, { where: { userId, isRead: false } });
  }

  // ============================================
  // Admin notification methods (unchanged)
  // ============================================

  queueAdminCourseChange(
    changeType: 'added' | 'opened' | 'closed' | 'removed',
    course: Course
  ): void {
    this.adminCourseChangesQueue.push({
      changeType,
      course: {
        courseCode: course.courseCode,
        courseName: course.courseName,
        section: course.section,
        faculty: course.faculty,
        instructor: course.instructor,
        time: course.time,
        days: course.days,
        room: course.room,
      },
    });
    console.log(`📋 [ADMIN] Queued ${changeType}: ${course.courseCode} - ${course.courseName.substring(0, 30)}`);
  }

  async notifyAdminsOfCourseChanges(
    changeType: 'added' | 'opened' | 'closed' | 'removed',
    course: Course
  ): Promise<void> {
    this.queueAdminCourseChange(changeType, course);
  }

  getQueuedAdminChangesCount(): number {
    return this.adminCourseChangesQueue.length;
  }

  async flushAdminNotifications(): Promise<void> {
    if (this.adminCourseChangesQueue.length === 0) {
      console.log('📋 [ADMIN] No queued changes to send');
      return;
    }

    try {
      const admins = await User.findAll({
        where: {
          isAdmin: true,
          watchAllCourses: true,
          isEmailVerified: true,
        },
      });

      if (admins.length === 0) {
        console.log('📋 [ADMIN] No admins with watchAllCourses enabled');
        this.adminCourseChangesQueue = [];
        return;
      }

      const changes = [...this.adminCourseChangesQueue];
      const added = changes.filter(c => c.changeType === 'added');
      const opened = changes.filter(c => c.changeType === 'opened');
      const closed = changes.filter(c => c.changeType === 'closed');
      const removed = changes.filter(c => c.changeType === 'removed');

      console.log(`📋 [ADMIN] Flushing ${changes.length} changes: ${added.length} added, ${opened.length} opened, ${closed.length} closed, ${removed.length} removed`);

      for (const admin of admins) {
        try {
          await EmailService.sendAdminCourseChangesSummary(
            admin.email,
            admin.username,
            { added, opened, closed, removed }
          );
          console.log(`📧 [ADMIN EMAIL] Sent summary to ${admin.email} (${changes.length} changes)`);
        } catch (error) {
          console.error(`❌ Failed to send admin summary email to ${admin.email}:`, error);
        }
      }

      this.adminCourseChangesQueue = [];
      console.log(`✅ Admin notifications sent to ${admins.length} admin(s)`);
    } catch (error) {
      console.error('❌ Failed to flush admin notifications:', error);
    }
  }

  clearAdminQueue(): void {
    this.adminCourseChangesQueue = [];
  }
}

export default new NotificationService();
