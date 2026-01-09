import nodemailer from 'nodemailer';
import config from '../../config';
import { SystemSetting } from '../../models';

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  private async getTransporter(): Promise<nodemailer.Transporter> {
    // Try to get SMTP settings from database first
    const settings = await SystemSetting.findAll();
    const settingsMap: Record<string, string> = {};
    settings.forEach(s => { settingsMap[s.key] = s.value; });

    const host = settingsMap['smtp_host'] || config.smtp.host;
    const port = parseInt(settingsMap['smtp_port'] || String(config.smtp.port), 10);
    const user = settingsMap['smtp_user'] || config.smtp.user;
    const pass = settingsMap['smtp_pass'] || config.smtp.pass;
    const from = settingsMap['smtp_from'] || config.smtp.from;
    const secure = settingsMap['smtp_secure'] === 'true';

    // Create transporter with current settings
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });
  }

  private async getBackupTransporter(): Promise<nodemailer.Transporter | null> {
    // Get backup SMTP from environment variables
    const backupUser = process.env.SMTP_BACKUP_USER;
    const backupPass = process.env.SMTP_BACKUP_PASS;
    
    if (!backupUser || !backupPass) {
      console.warn('⚠️ Backup SMTP not configured (SMTP_BACKUP_USER/SMTP_BACKUP_PASS not set)');
      return null;
    }

    return nodemailer.createTransport({
      host: process.env.SMTP_BACKUP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_BACKUP_PORT || '587', 10),
      secure: process.env.SMTP_BACKUP_SECURE === 'true',
      auth: {
        user: backupUser,
        pass: backupPass,
      },
    });
  }

  private isGmailLimitError(error: any): boolean {
    const errorStr = String(error.message || error.response || error.responseCode || '');
    return (
      errorStr.includes('5.4.5') ||
      errorStr.includes('4.7.0') ||           // Too many login attempts
      errorStr.includes('454') ||              // 454 error code
      errorStr.includes('Daily user sending limit') ||
      errorStr.includes('sending limit exceeded') ||
      errorStr.includes('Too many login attempts') ||
      errorStr.includes('550-5.4.5') ||
      error.responseCode === 454 ||            // Numeric check
      error.code === 'EAUTH'                   // Authentication error (often rate limit)
    );
  }

  async getSmtpSettings(): Promise<Record<string, string>> {
    const settings = await SystemSetting.findAll();
    const settingsMap: Record<string, string> = {};
    settings.forEach(s => { settingsMap[s.key] = s.value; });

    return {
      smtp_host: settingsMap['smtp_host'] || config.smtp.host,
      smtp_port: settingsMap['smtp_port'] || String(config.smtp.port),
      smtp_user: settingsMap['smtp_user'] || config.smtp.user,
      smtp_pass: settingsMap['smtp_pass'] ? '********' : '', // Mask password
      smtp_from: settingsMap['smtp_from'] || config.smtp.from,
      smtp_secure: settingsMap['smtp_secure'] || 'false',
    };
  }

  async updateSmtpSettings(settings: Record<string, string>): Promise<void> {
    for (const [key, value] of Object.entries(settings)) {
      if (key.startsWith('smtp_') && value !== undefined) {
        // Don't update password if it's masked
        if (key === 'smtp_pass' && value === '********') continue;
        
        const [setting] = await SystemSetting.findOrCreate({
          where: { key },
          defaults: { key, value },
        });
        setting.value = value;
        await setting.save();
      }
    }
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.sendWithPrimarySmtp(to, subject, html);
    } catch (error: any) {
      // Check if it's a Gmail daily limit error
      if (this.isGmailLimitError(error)) {
        console.warn('⚠️ Primary SMTP limit exceeded, trying backup SMTP...');
        try {
          await this.sendWithBackupSmtp(to, subject, html);
          return;
        } catch (backupError: any) {
          console.error('❌ Backup SMTP also failed:', backupError.message);
          throw new Error('Email sending failed. Both primary and backup SMTP failed. Please try again later.');
        }
      }
      throw error;
    }
  }

  private async sendWithPrimarySmtp(to: string, subject: string, html: string): Promise<void> {
    try {
      const transporter = await this.getTransporter();
      const settings = await SystemSetting.findAll();
      const settingsMap: Record<string, string> = {};
      settings.forEach(s => { settingsMap[s.key] = s.value; });
      const from = settingsMap['smtp_from'] || config.smtp.from;

      await transporter.sendMail({
        from,
        to,
        subject,
        html,
      });
      console.log(`✅ Email sent to ${to}`);
    } catch (error: any) {
      console.error('❌ Primary SMTP failed:', JSON.stringify(error));
      throw error;
    }
  }

  private async sendWithBackupSmtp(to: string, subject: string, html: string): Promise<void> {
    const backupTransporter = await this.getBackupTransporter();
    
    if (!backupTransporter) {
      throw new Error('Backup SMTP not configured');
    }

    const backupFrom = process.env.SMTP_BACKUP_FROM || process.env.SMTP_BACKUP_USER;

    await backupTransporter.sendMail({
      from: backupFrom,
      to,
      subject,
      html,
    });
    console.log(`✅ Email sent via BACKUP SMTP to ${to}`);
  }

  async sendVerificationEmail(email: string, username: string, token: string): Promise<void> {
    const verificationUrl = `${config.client.url}/verify-email?token=${token}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Course Notifier!</h2>
        <p>Hello ${username},</p>
        <p>Please verify your email address by clicking the button below:</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #00d9ff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
          Verify Email
        </a>
        <p>Or copy this link: ${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
      </div>
    `;
    await this.sendEmail(email, 'Verify Your Email - Course Notifier', html);
  }

  async sendPasswordResetOtpEmail(email: string, username: string, otp: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Verification Code</h2>
        <p>Hello ${username},</p>
        <p>We received a request to reset your password. Use the verification code below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 5px; background-color: #f3f4f6; padding: 20px 40px; border-radius: 10px;">
            ${otp}
          </div>
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email or contact support if you're concerned.</p>
        <p>Best regards,<br/>Course Notifier Team</p>
      </div>
    `;

    await this.sendEmail(email, 'Password Reset Verification Code', html);
  }

  async sendCourseNotification(
    email: string,
    username: string,
    courseCode: string,
    courseName: string,
    section: string,
    type: 'opened' | 'closed',
    courseDetails?: {
      time?: string;
      days?: string;
      instructor?: string;
      room?: string;
      isSimilar?: boolean;
    }
  ): Promise<void> {
    const status = type === 'opened' ? '🟢 OPEN' : '🔴 CLOSED';
    const statusAr = type === 'opened' ? 'فتحت الآن!' : 'أغلقت';
    const color = type === 'opened' ? '#28a745' : '#dc3545';
    const isSimilar = courseDetails?.isSimilar || false;
    
    // Build subject line
    const subjectPrefix = isSimilar ? '[شعبة بديلة]' : '';
    const subject = `${subjectPrefix} ${type === 'opened' ? 'Course Opened' : 'Course Closed'}: ${courseCode} - ${courseName}`.trim();
    
    // Build course details section
    let detailsHtml = '';
    if (courseDetails) {
      detailsHtml = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          ${courseDetails.time ? `
            <tr>
              <td style="padding: 8px 0; color: #666; width: 100px;">⏰ Time:</td>
              <td style="padding: 8px 0; color: #333; font-weight: 500;">${courseDetails.time}</td>
            </tr>
          ` : ''}
          ${courseDetails.days ? `
            <tr>
              <td style="padding: 8px 0; color: #666;">📅 Days:</td>
              <td style="padding: 8px 0; color: #333; font-weight: 500;">${courseDetails.days}</td>
            </tr>
          ` : ''}
          ${courseDetails.instructor ? `
            <tr>
              <td style="padding: 8px 0; color: #666;">👨‍🏫 Instructor:</td>
              <td style="padding: 8px 0; color: #333; font-weight: 500;">${courseDetails.instructor}</td>
            </tr>
          ` : ''}
          ${courseDetails.room ? `
            <tr>
              <td style="padding: 8px 0; color: #666;">📍 Room:</td>
              <td style="padding: 8px 0; color: #333; font-weight: 500;">${courseDetails.room}</td>
            </tr>
          ` : ''}
        </table>
      `;
    }
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${isSimilar ? 'ℹ️ Alternative Section Available!' : '📢 Course Status Update'}</h2>
        <p>Hello ${username},</p>
        <p>${isSimilar ? 'An alternative section for a course on your watchlist is now available:' : 'A course on your watchlist has changed status:'}</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${color};">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
            <span style="display: inline-block; padding: 6px 12px; background-color: ${color}; color: white; border-radius: 4px; font-weight: bold; font-size: 12px;">
              ${status} - ${statusAr}
            </span>
          </div>
          <h3 style="margin: 10px 0 5px 0; color: #333;">${courseName}</h3>
          <p style="margin: 5px 0; color: #666; font-size: 14px;">${courseCode} - شعبة ${section}</p>
          ${detailsHtml}
        </div>
        <p>Visit Course Notifier to register for this course!</p>
        <a href="${config.client.url}" style="display: inline-block; padding: 12px 24px; background-color: #00d9ff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
          View Dashboard
        </a>
      </div>
    `;
    await this.sendEmail(email, subject, html);
  }

  async sendTestEmail(email: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>✅ Test Email Successful!</h2>
        <p>This is a test email from Course Notifier admin panel.</p>
        <p>If you're seeing this, your SMTP configuration is working correctly!</p>
        <hr style="border: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #888; font-size: 12px;">Sent from Course Notifier Admin Panel</p>
      </div>
    `;
    await this.sendEmail(email, 'Course Notifier - Test Email', html);
  }

  async sendOtpEmail(email: string, username: string, otp: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>📧 Email Verification</h2>
        <p>Hello ${username},</p>
        <p>Your verification code is:</p>
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; margin: 30px 0; border-radius: 12px;">
          <h1 style="margin: 0; font-size: 48px; letter-spacing: 12px; color: white; font-weight: bold;">${otp}</h1>
        </div>
        <p style="color: #666;">This code will expire in <strong>10 minutes</strong>.</p>
        <p style="color: #888; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
        <hr style="border: 1px solid #ddd; margin: 30px 0;">
        <p style="color: #888; font-size: 12px;">Course Notifier - Zarqa University</p>
      </div>
    `;
    await this.sendEmail(email, 'Email Verification Code - Course Notifier', html);
  }

  /**
   * Send a batched notification email with all course changes for a user
   */
  async sendBatchedCourseNotification(
    email: string,
    username: string,
    changes: Array<{
      courseCode: string;
      courseName: string;
      section: string;
      changeType: 'opened' | 'closed';
      triggerSources: Array<'direct_watch' | 'similar_course' | 'newly_opened'>;
      time?: string;
      days?: string;
      instructor?: string;
      room?: string;
    }>
  ): Promise<void> {
    const openedCourses = changes.filter(c => c.changeType === 'opened');
    const closedCourses = changes.filter(c => c.changeType === 'closed');
    
    // Trigger source badge styles
    const getBadges = (sources: Array<'direct_watch' | 'similar_course' | 'newly_opened'>) => {
      const badges: string[] = [];
      if (sources.includes('direct_watch')) {
        badges.push('<span style="display: inline-block; padding: 3px 8px; background-color: #3b82f6; color: white; border-radius: 4px; font-size: 11px; margin-right: 4px;">🎯 مراقبة مباشرة</span>');
      }
      if (sources.includes('similar_course')) {
        badges.push('<span style="display: inline-block; padding: 3px 8px; background-color: #8b5cf6; color: white; border-radius: 4px; font-size: 11px; margin-right: 4px;">🔄 شعبة بديلة</span>');
      }
      if (sources.includes('newly_opened')) {
        badges.push('<span style="display: inline-block; padding: 3px 8px; background-color: #10b981; color: white; border-radius: 4px; font-size: 11px; margin-right: 4px;">🆕 فتحت حديثاً</span>');
      }
      return badges.join('');
    };

    const renderCourseCard = (course: typeof changes[0], isOpened: boolean) => {
      const statusColor = isOpened ? '#28a745' : '#dc3545';
      const statusText = isOpened ? '🟢 فتحت' : '🔴 أغلقت';
      
      return `
        <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; margin-bottom: 15px; border-left: 4px solid ${statusColor};">
          <div style="margin-bottom: 8px;">
            ${getBadges(course.triggerSources)}
            <span style="display: inline-block; padding: 3px 8px; background-color: ${statusColor}; color: white; border-radius: 4px; font-size: 11px;">${statusText}</span>
          </div>
          <h4 style="margin: 8px 0 5px 0; color: #333;">${course.courseName}</h4>
          <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">${course.courseCode} - شعبة ${course.section}</p>
          <table style="width: 100%; font-size: 13px; color: #666;">
            <tr>
              <td style="padding: 2px 0;">⏰ ${course.time || '-'}</td>
              <td style="padding: 2px 0;">📅 ${course.days || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 2px 0;">👨‍🏫 ${course.instructor || '-'}</td>
              <td style="padding: 2px 0;">📍 ${course.room || '-'}</td>
            </tr>
          </table>
        </div>
      `;
    };

    const renderSection = (title: string, courses: typeof changes, isOpened: boolean, emoji: string, color: string) => {
      if (courses.length === 0) return '';
      return `
        <div style="margin-bottom: 25px;">
          <h3 style="margin: 0 0 15px 0; color: ${color}; border-bottom: 2px solid ${color}; padding-bottom: 8px;">
            ${emoji} ${title} (${courses.length})
          </h3>
          ${courses.map(c => renderCourseCard(c, isOpened)).join('')}
        </div>
      `;
    };

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #00d9ff 0%, #0099cc 100%); padding: 25px; border-radius: 12px 12px 0 0; color: white;">
          <h1 style="margin: 0 0 8px 0; font-size: 24px;">📢 تحديثات المواد الدراسية</h1>
          <p style="margin: 0; opacity: 0.9; font-size: 16px;">لديك ${changes.length} تحديث جديد</p>
        </div>
        
        <div style="background: white; padding: 25px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="color: #666; margin-bottom: 20px;">مرحباً ${username}،</p>
          <p style="color: #666; margin-bottom: 25px;">إليك ملخص التغييرات في المواد التي تراقبها:</p>
          
          ${renderSection('مواد فتحت', openedCourses, true, '🟢', '#28a745')}
          ${renderSection('مواد أغلقت', closedCourses, false, '🔴', '#dc3545')}
          
          <hr style="border: 1px solid #e5e7eb; margin: 25px 0;">
          
          <div style="text-align: center;">
            <a href="${config.client.url}/dashboard" style="display: inline-block; padding: 14px 28px; background-color: #00d9ff; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
              عرض لوحة التحكم
            </a>
          </div>
          
          <p style="color: #888; font-size: 12px; margin-top: 25px; text-align: center;">
            Course Notifier - جامعة الزرقاء
          </p>
        </div>
      </div>
    `;
    
    const subject = `📢 تحديثات المواد: ${openedCourses.length > 0 ? `${openedCourses.length} فتحت` : ''}${openedCourses.length > 0 && closedCourses.length > 0 ? '، ' : ''}${closedCourses.length > 0 ? `${closedCourses.length} أغلقت` : ''}`;
    await this.sendEmail(email, subject, html);
  }

  async sendAdminCourseAlert(
    email: string,
    username: string,
    courseCode: string,
    courseName: string,
    section: string,
    changeType: 'added' | 'opened' | 'closed' | 'removed',
    faculty?: string,
    instructor?: string
  ): Promise<void> {
    const changeLabels: Record<string, { emoji: string; text: string; color: string }> = {
      added: { emoji: '🆕', text: 'NEW COURSE ADDED', color: '#8b5cf6' },
      opened: { emoji: '🟢', text: 'COURSE OPENED', color: '#28a745' },
      closed: { emoji: '🔴', text: 'COURSE CLOSED', color: '#dc3545' },
      removed: { emoji: '🗑️', text: 'COURSE REMOVED', color: '#6c757d' },
    };

    const change = changeLabels[changeType];
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>🔔 Admin Course Alert</h2>
        <p>Hello ${username},</p>
        <p>A course change has been detected in the system:</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid ${change.color};">
          <p style="margin: 0 0 10px 0;">
            <span style="display: inline-block; padding: 6px 12px; background-color: ${change.color}; color: white; border-radius: 4px; font-weight: bold; font-size: 12px;">
              ${change.emoji} ${change.text}
            </span>
          </p>
          <h3 style="margin: 10px 0 5px 0; color: #333;">${courseCode} - Section ${section}</h3>
          <p style="margin: 5px 0; color: #666;">${courseName}</p>
          ${faculty ? `<p style="margin: 5px 0; color: #888; font-size: 14px;">Faculty: ${faculty}</p>` : ''}
          ${instructor ? `<p style="margin: 5px 0; color: #888; font-size: 14px;">Instructor: ${instructor}</p>` : ''}
        </div>
        <p style="color: #666; font-size: 14px;">You are receiving this because you have "Watch All Courses" enabled in your admin settings.</p>
        <a href="${config.client.url}/admin/settings" style="display: inline-block; padding: 12px 24px; background-color: #8b5cf6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
          View Admin Panel
        </a>
      </div>
    `;
    await this.sendEmail(email, `[Admin Alert] Course ${changeType}: ${courseCode}`, html);
  }

  /**
   * Send a batched summary email of all course changes to admin
   */
  async sendAdminCourseChangesSummary(
    email: string,
    username: string,
    changes: {
      added: Array<{ changeType: string; course: any }>;
      opened: Array<{ changeType: string; course: any }>;
      closed: Array<{ changeType: string; course: any }>;
      removed: Array<{ changeType: string; course: any }>;
    }
  ): Promise<void> {
    const totalChanges = changes.added.length + changes.opened.length + changes.closed.length + changes.removed.length;
    
    const renderCourseList = (courses: Array<{ course: any }>, emoji: string, color: string) => {
      if (courses.length === 0) return '';
      
      const rows = courses.map(c => `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 10px; color: #333; font-weight: 500;">${c.course.courseCode}</td>
          <td style="padding: 10px; color: #333;">${c.course.courseName}</td>
          <td style="padding: 10px; color: #666;">شعبة ${c.course.section}</td>
          <td style="padding: 10px; color: #666; font-size: 12px;">${c.course.time || '-'}</td>
          <td style="padding: 10px; color: #666; font-size: 12px;">${c.course.days || '-'}</td>
          <td style="padding: 10px; color: #888; font-size: 12px;">${c.course.instructor || '-'}</td>
        </tr>
      `).join('');
      
      return rows;
    };
    
    const renderSection = (title: string, courses: Array<{ course: any }>, emoji: string, color: string) => {
      if (courses.length === 0) return '';
      
      return `
        <div style="margin-bottom: 30px;">
          <h3 style="margin: 0 0 15px 0; color: ${color};">
            ${emoji} ${title} (${courses.length})
          </h3>
          <table style="width: 100%; border-collapse: collapse; background: #f9fafb; border-radius: 8px; overflow: hidden;">
            <thead>
              <tr style="background: ${color}15;">
                <th style="padding: 12px 10px; text-align: left; color: ${color}; font-size: 12px; text-transform: uppercase;">Code</th>
                <th style="padding: 12px 10px; text-align: left; color: ${color}; font-size: 12px; text-transform: uppercase;">Course Name</th>
                <th style="padding: 12px 10px; text-align: left; color: ${color}; font-size: 12px; text-transform: uppercase;">Section</th>
                <th style="padding: 12px 10px; text-align: left; color: ${color}; font-size: 12px; text-transform: uppercase;">Time</th>
                <th style="padding: 12px 10px; text-align: left; color: ${color}; font-size: 12px; text-transform: uppercase;">Days</th>
                <th style="padding: 12px 10px; text-align: left; color: ${color}; font-size: 12px; text-transform: uppercase;">Instructor</th>
              </tr>
            </thead>
            <tbody>
              ${renderCourseList(courses, emoji, color)}
            </tbody>
          </table>
        </div>
      `;
    };
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); padding: 30px; border-radius: 12px 12px 0 0; color: white;">
          <h1 style="margin: 0 0 10px 0;">🔔 Admin Course Changes Summary</h1>
          <p style="margin: 0; opacity: 0.9;">Total: ${totalChanges} course changes detected</p>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="color: #666;">Hello ${username},</p>
          <p style="color: #666; margin-bottom: 30px;">Here's a summary of all course changes from the latest scraper run:</p>
          
          ${renderSection('Courses Opened', changes.opened, '🟢', '#28a745')}
          ${renderSection('Courses Closed', changes.closed, '🔴', '#dc3545')}
          ${renderSection('New Courses Added', changes.added, '🆕', '#8b5cf6')}
          ${renderSection('Courses Removed', changes.removed, '🗑️', '#6c757d')}
          
          <hr style="border: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #888; font-size: 14px;">
            You are receiving this because you have "Watch All Courses" enabled in your admin settings.
          </p>
          
          <a href="${config.client.url}/admin/settings" style="display: inline-block; padding: 12px 24px; background-color: #8b5cf6; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px;">
            View Admin Panel
          </a>
        </div>
      </div>
    `;
    
    const subject = `[Admin] Course Changes Summary: ${totalChanges} changes (${changes.opened.length} opened, ${changes.closed.length} closed, ${changes.added.length} added, ${changes.removed.length} removed)`;
    await this.sendEmail(email, subject, html);
  }
}

export default new EmailService();
