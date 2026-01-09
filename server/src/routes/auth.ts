import { Router } from 'express';
import * as authController from '../controllers/authController';
import { validate, registerSchema, loginSchema, notificationSettingsSchema } from '../middleware/validator';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/verify-email', authController.verifyEmail);
router.post('/verify-otp', authController.verifyOtp);
router.post('/resend-otp', authController.resendOtp);
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-password-reset-otp', authController.verifyPasswordResetOtp);
router.post('/resend-password-reset-otp', authController.resendPasswordResetOtp);
router.post('/reset-password-otp', authController.resetPasswordWithOtp);
router.post('/reset-password', authController.resetPassword);
router.post('/logout', authController.logout);
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);
router.post('/change-password', authenticate, authController.changePassword);
router.post('/resend-verification', authenticate, authController.resendVerification);

// Global notification settings endpoints
router.get('/notification-settings', authenticate, authController.getNotificationSettings);
router.put('/notification-settings', authenticate, validate(notificationSettingsSchema), authController.updateNotificationSettings);

// Push notification topic for mobile app (legacy - ntfy)
router.get('/push-topic', authenticate, authController.getPushTopic);

// FCM device registration endpoints
router.post('/register-device', authenticate, authController.registerDevice);
router.delete('/unregister-device', authenticate, authController.unregisterDevice);

export default router;
