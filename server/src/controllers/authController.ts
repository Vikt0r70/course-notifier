import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models';
import config from '../config';
import EmailService from '../services/email/EmailService';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, username, password, major, age, faculty, studyType, timeShift } = req.body;

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    // Generate 6-digit OTP instead of token
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const user = await User.create({
      email: normalizedEmail,
      username,
      passwordHash,
      major,
      age,
      faculty: studyType === 'دراسات عليا' ? faculty : faculty, // For postgraduate, faculty stores ماجستير/دبلوم عالي
      studyType,
      timeShift: studyType === 'بكالوريوس' ? (timeShift || 'الكل') : null, // No timeShift for postgraduate
      emailOtpCode: otp,
      emailOtpExpiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      isEmailVerified: false,
      isAdmin: false,
    });

    // Send OTP email - wrapped in try-catch so registration still succeeds even if email fails
    let emailSent = true;
    try {
      await EmailService.sendOtpEmail(normalizedEmail, username, otp);
    } catch (emailError: any) {
      console.error('Failed to send OTP email during registration:', emailError.message);
      emailSent = false;
    }

    res.status(201).json({
      success: true,
      message: emailSent 
        ? 'Registration successful! Please verify your email with the code sent.'
        : 'Registration successful! Verification code could not be sent - please use "Resend Code" option.',
      data: {
        userId: user.id,
        email: user.email,
        requiresOtp: true,
        emailSent
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    console.error('Error details:', error.errors); // Log validation errors
    
    // Handle unique constraint violation
    if (error.name === 'SequelizeUniqueConstraintError' || error.original?.code === '23505') {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already registered. Please use a different email or try logging in.' 
      });
    }

    // Handle validation errors
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map((err: any) => err.message).join(', ');
      return res.status(400).json({ 
        success: false,
        message: `Validation failed: ${validationErrors}`
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Registration failed. Please try again.' 
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password. Please check your credentials and try again.' 
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password. Please check your credentials and try again.' 
      });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      // Generate new OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.emailOtpCode = otp;
      user.emailOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      user.otpAttemptsCount = 0;
      user.otpAttemptsResetAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();

      // Send OTP email - wrapped in try-catch so login flow continues
      let emailSent = true;
      try {
        await EmailService.sendOtpEmail(user.email, user.username, otp);
      } catch (emailError: any) {
        console.error('Failed to send OTP email during login:', emailError.message);
        emailSent = false;
      }

      return res.status(403).json({
        success: false,
        requiresOtp: true,
        message: emailSent 
          ? 'Email not verified. Verification code sent to your email.'
          : 'Email not verified. Could not send code - please use "Resend Code" option.',
        data: {
          userId: user.id,
          email: user.email,
          emailSent
        }
      });
    }

    const token = jwt.sign({ id: user.id, email: user.email, isAdmin: user.isAdmin }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: config.env === 'production',
      sameSite: config.env === 'production' ? 'strict' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          isAdmin: user.isAdmin,
          isEmailVerified: user.isEmailVerified,
          faculty: user.faculty || '',
          studyType: user.studyType || 'بكالوريوس',
          timeShift: user.timeShift || 'الكل',
          major: user.major || '',
          // Global notification settings
          notifyOnOpen: user.notifyOnOpen ?? true,
          notifyOnClose: user.notifyOnClose ?? false,
          notifyOnSimilarCourse: user.notifyOnSimilarCourse ?? true,
          notifyByEmail: user.notifyByEmail ?? true,
          notifyByWeb: user.notifyByWeb ?? true,
          notifyByPhone: user.notifyByPhone ?? false,
        },
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    const user = await User.findOne({ where: { emailVerificationToken: token } });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid verification token' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID and OTP code are required' 
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check if OTP exists
    if (!user.emailOtpCode) {
      return res.status(400).json({ 
        success: false, 
        message: 'No OTP found. Please request a new code.' 
      });
    }

    // Check if OTP expired
    if (user.emailOtpExpiresAt && user.emailOtpExpiresAt < new Date()) {
      return res.status(400).json({ 
        success: false, 
        message: 'OTP has expired. Please request a new code.' 
      });
    }

    // Check if OTP matches
    if (user.emailOtpCode !== otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid OTP code. Please try again.' 
      });
    }

    // Mark email as verified and clear OTP fields
    user.isEmailVerified = true;
    user.emailOtpCode = undefined;
    user.emailOtpExpiresAt = undefined;
    user.otpAttemptsCount = 0;
    user.otpAttemptsResetAt = undefined;
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, isAdmin: user.isAdmin }, 
      config.jwt.secret, 
      { expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'] }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: config.env === 'production',
      sameSite: config.env === 'production' ? 'strict' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: 'Email verified successfully',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          isAdmin: user.isAdmin,
          isEmailVerified: user.isEmailVerified,
          faculty: user.faculty || '',
          studyType: user.studyType || 'بكالوريوس',
          timeShift: user.timeShift || 'الكل',
          major: user.major || '',
          // Global notification settings
          notifyOnOpen: user.notifyOnOpen ?? true,
          notifyOnClose: user.notifyOnClose ?? false,
          notifyOnSimilarCourse: user.notifyOnSimilarCourse ?? true,
          notifyByEmail: user.notifyByEmail ?? true,
          notifyByWeb: user.notifyByWeb ?? true,
          notifyByPhone: user.notifyByPhone ?? false,
        },
      },
    });
  } catch (error: any) {
    console.error('OTP verification error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resendOtp = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required' 
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check rate limiting
    const now = new Date();
    if (user.otpAttemptsResetAt && user.otpAttemptsResetAt > now) {
      // Within the 1-hour window
      if (user.otpAttemptsCount && user.otpAttemptsCount >= 5) {
        const minutesLeft = Math.ceil((user.otpAttemptsResetAt.getTime() - now.getTime()) / 60000);
        return res.status(429).json({ 
          success: false, 
          message: `Too many OTP requests. Please try again in ${minutesLeft} minutes.` 
        });
      }
    } else {
      // Reset the counter if the window has passed
      user.otpAttemptsCount = 0;
      user.otpAttemptsResetAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.emailOtpCode = otp;
    user.emailOtpExpiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes
    user.otpAttemptsCount = (user.otpAttemptsCount || 0) + 1;
    await user.save();

    // Send OTP email
    await EmailService.sendOtpEmail(user.email, user.username, otp);

    const attemptsRemaining = 5 - (user.otpAttemptsCount || 0);
    res.json({
      success: true,
      message: 'New verification code sent to your email',
      data: {
        attemptsRemaining
      }
    });
  } catch (error: any) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with that email address' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.emailOtpCode = otp;
    user.emailOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    await EmailService.sendPasswordResetOtpEmail(normalizedEmail, user.username, otp);

    res.json({ 
      success: true, 
      message: 'Verification code sent to your email',
      data: { userId: user.id, email: normalizedEmail }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyPasswordResetOtp = async (req: Request, res: Response) => {
  try {
    const { userId, otp } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.emailOtpCode || !user.emailOtpExpiresAt) {
      return res.status(400).json({ success: false, message: 'No verification code found. Please request a new one.' });
    }

    if (user.emailOtpExpiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new one.' });
    }

    if (user.emailOtpCode !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }

    // OTP verified successfully - don't clear it yet, we need it for password reset
    res.json({ success: true, message: 'Code verified successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resendPasswordResetOtp = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate new 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.emailOtpCode = otp;
    user.emailOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await EmailService.sendPasswordResetOtpEmail(user.email, user.username, otp);

    res.json({ success: true, message: 'New verification code sent' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resetPasswordWithOtp = async (req: Request, res: Response) => {
  try {
    const { userId, newPassword } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify OTP is still valid (should have been verified in previous step)
    if (!user.emailOtpCode || !user.emailOtpExpiresAt) {
      return res.status(400).json({ success: false, message: 'Verification expired. Please start over.' });
    }

    if (user.emailOtpExpiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Verification expired. Please start over.' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.passwordHash = hashedPassword;
    
    // Clear OTP fields
    user.emailOtpCode = undefined;
    user.emailOtpExpiresAt = undefined;
    
    await user.save();

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({ where: { passwordResetToken: token } });
    if (!user || !user.passwordResetTokenExpiry || user.passwordResetTokenExpiry < new Date()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    user.passwordHash = await bcrypt.hash(password, 10);
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpiry = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successful' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const logout = async (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully' });
};

export const getProfile = async (req: any, res: Response) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['passwordHash', 'emailVerificationToken', 'passwordResetToken', 'emailOtpCode'] },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ 
      success: true, 
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        faculty: user.faculty || '',
        major: user.major || '',
        studyType: user.studyType || 'بكالوريوس',
        timeShift: user.timeShift || 'الكل',
        isEmailVerified: user.isEmailVerified,
        isAdmin: user.isAdmin,
        // Global notification settings
        notifyOnOpen: user.notifyOnOpen ?? true,
        notifyOnClose: user.notifyOnClose ?? false,
        notifyOnSimilarCourse: user.notifyOnSimilarCourse ?? true,
        notifyByEmail: user.notifyByEmail ?? true,
        notifyByWeb: user.notifyByWeb ?? true,
        notifyByPhone: user.notifyByPhone ?? false,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req: any, res: Response) => {
  try {
    const { username, email, faculty, major, studyType, timeShift } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let normalizedNewEmail: string | undefined;

    // Check if email is being changed
    if (email && email.toLowerCase().trim() !== user.email.toLowerCase()) {
      // Normalize new email to lowercase
      normalizedNewEmail = email.toLowerCase().trim();
      
      // Check if new email already exists
      const existingUser = await User.findOne({ where: { email: normalizedNewEmail } });
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email already in use' 
        });
      }

      // Generate OTP for new email
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.email = normalizedNewEmail!;
      user.isEmailVerified = false;
      user.emailOtpCode = otp;
      user.emailOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      user.otpAttemptsCount = 0;
      user.otpAttemptsResetAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Send OTP to new email
      await EmailService.sendOtpEmail(normalizedNewEmail!, user.username, otp);
    }

    // Update other fields
    if (username) user.username = username;
    if (faculty !== undefined) user.faculty = faculty;
    if (major !== undefined) user.major = major;
    if (studyType) user.studyType = studyType;
    
    // Handle timeShift based on studyType
    if (studyType === 'بكالوريوس') {
      user.timeShift = timeShift || 'الكل';
    } else if (studyType && studyType !== 'بكالوريوس') {
      user.timeShift = 'الكل';
    }

    await user.save();

    // If email changed, return requiresOtp flag
    if (normalizedNewEmail) {
      return res.json({
        success: true,
        requiresOtp: true,
        message: 'Email updated. Verification code sent to your new email.',
        data: {
          userId: user.id,
          email: normalizedNewEmail
        }
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        faculty: user.faculty || '',
        major: user.major || '',
        studyType: user.studyType || 'بكالوريوس',
        timeShift: user.timeShift || 'الكل',
        isEmailVerified: user.isEmailVerified,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const changePassword = async (req: any, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    // Hash and save new password
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error: any) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resendVerification = async (req: any, res: Response) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ success: false, message: 'Email is already verified' });
    }

    // Rate limiting: Check last verification email sent time
    const now = new Date();
    const lastSent = user.lastVerificationEmailSent;
    
    if (lastSent) {
      const timeSinceLastSent = now.getTime() - new Date(lastSent).getTime();
      const cooldownMs = 30 * 1000; // 30 seconds
      
      if (timeSinceLastSent < cooldownMs) {
        const remainingSeconds = Math.ceil((cooldownMs - timeSinceLastSent) / 1000);
        return res.status(429).json({ 
          success: false, 
          message: `Please wait ${remainingSeconds} seconds before requesting another verification email` 
        });
      }
    }

    // Check daily limit (max 4 per day)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const verificationEmailsToday = user.verificationEmailsToday || 0;
    const lastCountReset = user.verificationEmailCountResetDate;

    let emailsSentToday = verificationEmailsToday;
    
    if (!lastCountReset || new Date(lastCountReset) < todayStart) {
      // Reset counter for new day
      emailsSentToday = 0;
    }

    if (emailsSentToday >= 4) {
      return res.status(429).json({ 
        success: false, 
        message: 'Maximum verification emails reached for today. Please try again tomorrow.' 
      });
    }

    // Generate new token and send email
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = emailVerificationToken;
    user.lastVerificationEmailSent = now;
    user.verificationEmailsToday = emailsSentToday + 1;
    user.verificationEmailCountResetDate = now;
    await user.save();

    await EmailService.sendVerificationEmail(user.email, user.username, emailVerificationToken);

    res.json({ 
      success: true, 
      message: 'Verification email sent successfully',
      data: {
        remainingAttempts: 4 - (emailsSentToday + 1)
      }
    });
  } catch (error: any) {
    console.error('Resend verification error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get global notification settings
export const getNotificationSettings = async (req: any, res: Response) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      data: {
        notifyOnOpen: user.notifyOnOpen ?? true,
        notifyOnClose: user.notifyOnClose ?? false,
        notifyOnSimilarCourse: user.notifyOnSimilarCourse ?? true,
        notifyByEmail: user.notifyByEmail ?? true,
        notifyByWeb: user.notifyByWeb ?? true,
        notifyByPhone: user.notifyByPhone ?? false,
      }
    });
  } catch (error: any) {
    console.error('Get notification settings error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update global notification settings
export const updateNotificationSettings = async (req: any, res: Response) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const {
      notifyOnOpen,
      notifyOnClose,
      notifyOnSimilarCourse,
      notifyByEmail,
      notifyByWeb,
      notifyByPhone
    } = req.body;

    // Update only provided fields
    if (notifyOnOpen !== undefined) user.notifyOnOpen = notifyOnOpen;
    if (notifyOnClose !== undefined) user.notifyOnClose = notifyOnClose;
    if (notifyOnSimilarCourse !== undefined) user.notifyOnSimilarCourse = notifyOnSimilarCourse;
    if (notifyByEmail !== undefined) user.notifyByEmail = notifyByEmail;
    if (notifyByWeb !== undefined) user.notifyByWeb = notifyByWeb;
    if (notifyByPhone !== undefined) user.notifyByPhone = notifyByPhone;

    await user.save();

    res.json({
      success: true,
      message: 'Notification settings updated successfully',
      data: {
        notifyOnOpen: user.notifyOnOpen,
        notifyOnClose: user.notifyOnClose,
        notifyOnSimilarCourse: user.notifyOnSimilarCourse,
        notifyByEmail: user.notifyByEmail,
        notifyByWeb: user.notifyByWeb,
        notifyByPhone: user.notifyByPhone,
      }
    });
  } catch (error: any) {
    console.error('Update notification settings error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get push notification topic for mobile app
export const getPushTopic = async (req: any, res: Response) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate push topic secret if doesn't exist
    if (!user.pushTopicSecret) {
      user.pushTopicSecret = crypto.randomBytes(16).toString('hex');
      await user.save();
    }

    const ntfyPublicUrl = process.env.NTFY_PUBLIC_URL || 'https://ntfy.coursenotifier.studenthub.dedyn.io';

    res.json({
      success: true,
      data: {
        topic: `cn-${user.pushTopicSecret}`,
        serverUrl: ntfyPublicUrl,
        subscribeUrl: `${ntfyPublicUrl}/cn-${user.pushTopicSecret}`,
      }
    });
  } catch (error: any) {
    console.error('Get push topic error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Register FCM device token for push notifications
export const registerDevice = async (req: any, res: Response) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({ 
        success: false, 
        message: 'FCM token is required' 
      });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.fcmToken = fcmToken;
    await user.save();

    console.log(`📱 [FCM] Device registered for user ${user.id}`);

    res.json({
      success: true,
      message: 'Device registered successfully'
    });
  } catch (error: any) {
    console.error('Register device error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Unregister FCM device token (on logout)
export const unregisterDevice = async (req: any, res: Response) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.fcmToken = undefined;
    await user.save();

    console.log(`📱 [FCM] Device unregistered for user ${user.id}`);

    res.json({
      success: true,
      message: 'Device unregistered successfully'
    });
  } catch (error: any) {
    console.error('Unregister device error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
