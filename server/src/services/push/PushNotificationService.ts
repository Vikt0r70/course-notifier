import { User } from '../../models';

class PushNotificationService {
  private ntfyUrl = process.env.NTFY_URL || 'http://course-notifier-ntfy:80';

  /**
   * Send a push notification to a user via ntfy
   */
  async sendPushNotification(
    user: User,
    title: string,
    message: string,
    type: 'opened' | 'closed' | 'similar'
  ): Promise<boolean> {
    if (!user.notifyByPhone) {
      console.log(`📱 [PUSH] Skipped - user ${user.id} has phone notifications disabled`);
      return false;
    }

    if (!user.pushTopicSecret) {
      console.log(`📱 [PUSH] Skipped - user ${user.id} has no push topic secret`);
      return false;
    }

    const topic = `cn-${user.pushTopicSecret}`;
    const tags = this.getTagsForType(type);
    const priority = type === 'opened' ? 'high' : 'default';

    try {
      const response = await fetch(`${this.ntfyUrl}/${topic}`, {
        method: 'POST',
        headers: {
          'Title': title,
          'Tags': tags,
          'Priority': priority,
        },
        body: message,
      });

      if (!response.ok) {
        console.error(`📱 [PUSH] Failed for user ${user.id}: HTTP ${response.status}`);
        return false;
      }

      console.log(`📱 [PUSH] Sent to user ${user.id}: ${title}`);
      return true;
    } catch (error) {
      console.error(`📱 [PUSH] Failed for user ${user.id}:`, error);
      return false;
    }
  }

  /**
   * Send a course status notification
   */
  async sendCourseNotification(
    user: User,
    courseCode: string,
    courseName: string,
    section: string,
    type: 'opened' | 'closed'
  ): Promise<boolean> {
    const emoji = type === 'opened' ? '🟢' : '🔴';
    const statusAr = type === 'opened' ? 'فتحت' : 'أغلقت';
    const title = `${emoji} ${type === 'opened' ? 'Course Opened!' : 'Course Closed'}`;
    const message = `${courseName} (${courseCode} - شعبة ${section}) ${statusAr}`;

    return this.sendPushNotification(user, title, message, type);
  }

  /**
   * Send a similar course notification
   */
  async sendSimilarCourseNotification(
    user: User,
    courseCode: string,
    courseName: string,
    section: string
  ): Promise<boolean> {
    const title = 'ℹ️ Similar Section Available';
    const message = `شعبة مشابهة متاحة: ${courseName} (${courseCode} - شعبة ${section}) فتحت الآن!`;

    return this.sendPushNotification(user, title, message, 'similar');
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
    const message = `${changeLabels[changeType]}: ${courseName} (${courseCode} - شعبة ${section})`;

    const type = changeType === 'added' || changeType === 'opened' ? 'opened' : 'closed';
    return this.sendPushNotification(user, title, message, type);
  }

  private getTagsForType(type: 'opened' | 'closed' | 'similar'): string {
    switch (type) {
      case 'opened':
        return 'white_check_mark,bell';
      case 'closed':
        return 'x,bell';
      case 'similar':
        return 'information_source,bell';
      default:
        return 'bell';
    }
  }
}

export default new PushNotificationService();
