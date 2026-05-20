import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import config from '../config';

const googleClient = new OAuth2Client(
  config.google.clientId,
  config.google.clientSecret,
  config.google.redirectUri
);

const buildUserResponse = (user: User, token: string) => ({
  id: user.id,
  email: user.email,
  username: user.username,
  isAdmin: user.isAdmin,
  isEmailVerified: user.isEmailVerified,
  faculty: user.faculty || '',
  studyType: user.studyType || 'بكالوريوس',
  timeShift: user.timeShift || 'الكل',
  major: user.major || '',
  onboardingCompleted: user.onboardingCompleted,
  avatarUrl: user.avatarUrl || null,
  notifyOnOpen: user.notifyOnOpen ?? true,
  notifyOnClose: user.notifyOnClose ?? false,
  notifyOnSimilarCourse: user.notifyOnSimilarCourse ?? true,
  notifyByEmail: user.notifyByEmail ?? true,
  notifyByWeb: user.notifyByWeb ?? true,
});

const setAuthCookie = (res: Response, token: string) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: config.env === 'production' ? 'strict' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const signToken = (user: User): string => {
  return jwt.sign(
    { id: user.id, email: user.email, isAdmin: user.isAdmin },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'] }
  );
};

export const googleAuth = (req: Request, res: Response) => {
  if (!config.google.clientId) {
    return res.status(500).json({ success: false, message: 'Google OAuth is not configured' });
  }

  const url = googleClient.generateAuthUrl({
    access_type: 'offline',
    scope: ['profile', 'email'],
    prompt: 'select_account',
  });

  res.redirect(url);
};

export const googleCallback = async (req: Request, res: Response) => {
  try {
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ success: false, message: 'Missing authorization code' });
    }

    const { tokens } = await googleClient.getToken(code);

    if (!tokens.id_token) {
      return res.status(400).json({ success: false, message: 'No ID token received from Google' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: config.google.clientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ success: false, message: 'Invalid Google token payload' });
    }

    const email = payload.email.toLowerCase().trim();
    const googleId = payload.sub;
    const avatarUrl = payload.picture || null;
    const name = payload.name || email.split('@')[0];

    let user = await User.findOne({ where: { email } });

    if (!user) {
      user = await User.findOne({ where: { googleId } });
    }

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
      }
      if (!user.avatarUrl && avatarUrl) {
        user.avatarUrl = avatarUrl;
      }
      user.isEmailVerified = true;
      await user.save();

      const token = signToken(user);
      setAuthCookie(res, token);

      if (!user.onboardingCompleted) {
        user.onboardingCompleted = true;
        await user.save();
      }

      const redirectUrl = user.onboardingCompleted
        ? `${config.client.url}/dashboard`
        : `${config.client.url}/onboarding`;
      return res.redirect(redirectUrl);
    }

    user = await User.create({
      email,
      username: name,
      passwordHash: '',
      googleId,
      avatarUrl,
      isEmailVerified: true,
      isAdmin: false,
      onboardingCompleted: false,
      studyType: 'بكالوريوس',
      timeShift: 'الكل',
    });

    const token = signToken(user);
    setAuthCookie(res, token);

    res.redirect(`${config.client.url}/onboarding`);
  } catch (error: any) {
    console.error('Google OAuth callback error:', error);
    res.redirect(`${config.client.url}/login?error=google_auth_failed`);
  }
};
