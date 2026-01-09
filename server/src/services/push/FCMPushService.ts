import FirebaseService from '../firebase/FirebaseService';
import { User } from '../../models';

class FCMPushService {
  /**
   * Send a push notification to a user via FCM
   */
  async sendPushNotification(
    user: User,
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<boolean> {
    if (!user.notifyByPhone) {
      console.log(`📱 [FCM] Skipped - user ${user.id} has phone notifications disabled`);
      return false;
    }

    if (!user.fcmToken) {
      console.log(`📱 [FCM] Skipped - user ${user.id} has no FCM token registered`);
      return false;
    }

    const messaging = FirebaseService.getMessaging();
    if (!messaging) {
      console.log(`📱 [FCM] Skipped - Firebase not initialized`);
      return false;
    }

    try {
      const message = {
        token: user.fcmToken,
        notification: {
          title,
          body,
        },
        data: data || {},
        android: {
          priority: 'high' as const,
          notification: {
            channelId: 'course_notifications',
            priority: 'high' as const,
          },
        },
      };

      const response = await messaging.send(message);
      console.log(`📱 [FCM] Sent to user ${user.id}: ${title} (messageId: ${response})`);
      return true;
    } catch (error: any) {
      // Handle invalid/expired token
      if (error.code === 'messaging/invalid-registration-token' ||
          error.code === 'messaging/registration-token-not-registered') {
        console.log(`📱 [FCM] Invalid token for user ${user.id}, clearing token`);
        user.fcmToken = undefined;
        await user.save();
      } else {
        console.error(`📱 [FCM] Failed for user ${user.id}:`, error);
      }
      return false;
    }
  }

  /**
   * Send a course status notification with full details
   */
  async sendCourseNotification(
    user: User,
    courseCode: string,
    courseName: string,
    section: string,
    type: 'opened' | 'closed',
    courseDetails?: {
      time?: string;
      days?: string;
      instructor?: string;
      room?: string;
    }
  ): Promise<boolean> {
    const emoji = type === 'opened' ? '🟢' : '🔴';
    const statusAr = type === 'opened' ? 'فتحت الآن!' : 'أغلقت';
    const statusEn = type === 'opened' ? 'OPENED' : 'CLOSED';
    
    const title = `${emoji} ${courseName} - ${statusEn}`;
    
    // Build detailed body
    let body = `${courseCode} - شعبة ${section} ${statusAr}`;
    if (courseDetails) {
      const details: string[] = [];
      if (courseDetails.time) details.push(`⏰ ${courseDetails.time}`);
      if (courseDetails.days) details.push(`📅 ${courseDetails.days}`);
      if (courseDetails.instructor) details.push(`👨‍🏫 ${courseDetails.instructor}`);
      if (details.length > 0) {
        body += `\n${details.join(' | ')}`;
      }
    }

    return this.sendPushNotification(user, title, body, {
      courseCode,
      section,
      status: type,
      type: 'course_status',
    });
  }

  /**
   * Send a similar course notification with full details
   */
  async sendSimilarCourseNotification(
    user: User,
    courseCode: string,
    courseName: string,
    section: string,
    courseDetails?: {
      time?: string;
      days?: string;
      instructor?: string;
      room?: string;
    }
  ): Promise<boolean> {
    const title = `ℹ️ ${courseName} - شعبة بديلة متاحة!`;
    
    // Build detailed body
    let body = `شعبة ${section} (${courseCode}) فتحت الآن`;
    if (courseDetails) {
      const details: string[] = [];
      if (courseDetails.time) details.push(`⏰ ${courseDetails.time}`);
      if (courseDetails.days) details.push(`📅 ${courseDetails.days}`);
      if (courseDetails.instructor) details.push(`👨‍🏫 ${courseDetails.instructor}`);
      if (details.length > 0) {
        body += `\n${details.join(' | ')}`;
      }
    }

    return this.sendPushNotification(user, title, body, {
      courseCode,
      section,
      status: 'similar',
      type: 'similar_course',
    });
  }

  /**
   * Send a batched notification summary (single push with count)
   */
  async sendBatchedNotification(
    user: User,
    changeCount: number
  ): Promise<boolean> {
    const title = `📢 تحديثات المواد الدراسية`;
    const body = `لديك ${changeCount} تحديث جديد في المواد التي تراقبها`;

    return this.sendPushNotification(user, title, body, {
      type: 'batched_notification',
      count: String(changeCount),
    });
  }

  /**
   * Send an admin alert for course changes
   */
  async sendAdminAlert(
    user: User,
    courseCode: string,
    courseName: string,
    section: string,
    changeType: 'added' | 'opened' | 'closed' | 'removed'
  ): Promise<boolean> {
    const changeLabels: Record<string, string> = {
      added: '➕ تمت إضافة مادة',
      opened: '🟢 تم فتح المادة',
      closed: '🔴 تم إغلاق المادة',
      removed: '❌ تم حذف المادة',
    };

    const title = `Admin Alert: ${changeType.toUpperCase()}`;
    const body = `${changeLabels[changeType]}: ${courseName} (${courseCode} - شعبة ${section})`;

    return this.sendPushNotification(user, title, body, {
      courseCode,
      section,
      status: changeType,
    });
  }

  /**
   * Send to multiple users at once (batch)
   */
  async sendToMultipleUsers(
    users: User[],
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<{ success: number; failed: number }> {
    const messaging = FirebaseService.getMessaging();
    if (!messaging) {
      console.log(`📱 [FCM] Batch send skipped - Firebase not initialized`);
      return { success: 0, failed: users.length };
    }

    // Filter users who have FCM tokens and phone notifications enabled
    const eligibleUsers = users.filter(u => u.notifyByPhone && u.fcmToken);
    
    if (eligibleUsers.length === 0) {
      return { success: 0, failed: 0 };
    }

    const tokens = eligibleUsers.map(u => u.fcmToken!);

    try {
      const message = {
        notification: {
          title,
          body,
        },
        data: data || {},
        android: {
          priority: 'high' as const,
          notification: {
            channelId: 'course_notifications',
            priority: 'high' as const,
          },
        },
        tokens,
      };

      const response = await messaging.sendEachForMulticast(message);
      
      // Handle failed tokens
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp: any, idx: number) => {
          if (!resp.success && resp.error) {
            if (resp.error.code === 'messaging/invalid-registration-token' ||
                resp.error.code === 'messaging/registration-token-not-registered') {
              failedTokens.push(tokens[idx]);
            }
          }
        });

        // Clear invalid tokens
        if (failedTokens.length > 0) {
          for (const user of eligibleUsers) {
            if (user.fcmToken && failedTokens.includes(user.fcmToken)) {
              user.fcmToken = undefined;
              await user.save();
            }
          }
        }
      }

      console.log(`📱 [FCM] Batch sent: ${response.successCount} success, ${response.failureCount} failed`);
      return { success: response.successCount, failed: response.failureCount };
    } catch (error) {
      console.error(`📱 [FCM] Batch send failed:`, error);
      return { success: 0, failed: eligibleUsers.length };
    }
  }
}

export default new FCMPushService();
