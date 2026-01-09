import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { User } from '../models';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    username: string;
    isAdmin: boolean;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, config.jwt.secret) as any;
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      isAdmin: user.isAdmin,
    };

    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

export const optionalAuthenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, config.jwt.secret) as any;
      const user = await User.findByPk(decoded.id);
      
      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          username: user.username,
          isAdmin: user.isAdmin,
        };
      }
    }
    // Don't throw error if no token, just continue
    next();
  } catch (error) {
    // Token invalid but don't block request
    next();
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};
