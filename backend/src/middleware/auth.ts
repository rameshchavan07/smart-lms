import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

import { UserRole } from '@prisma/client';
import prisma from '../config/db';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  firstName: string | null;
  lastName: string | null;
  isActive: boolean;
  profileImage: string | null;
  instituteId: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
    interface User extends AuthUser {}
  }
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

// Simple in-memory cache for user sessions to reduce DB hits
// Key: userId, Value: { user, expiresAt }
const userCache = new Map<string, { user: AuthUser; expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  let token = req.cookies?.token;

  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = verifyToken(token) as { id: string };

      // Check cache first
      const cached = userCache.get(decoded.id);
      if (cached && cached.expiresAt > Date.now()) {
        req.user = cached.user;
      } else {
        const user = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: { id: true, email: true, role: true, firstName: true, lastName: true, isActive: true, profileImage: true, instituteId: true },
        });
        req.user = user || undefined;
        
        if (req.user) {
          userCache.set(decoded.id, { user: req.user, expiresAt: Date.now() + CACHE_TTL });
        }
      }

      if (!req.user || !req.user.isActive) {
        res.status(401).json({ message: 'Not authorized, user disabled or not found' });
        return;
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const allowedRoles = roles.includes('ADMIN') && !roles.includes('SUPER_ADMIN') 
      ? [...roles, 'SUPER_ADMIN'] 
      : roles;
      
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({ message: 'User role not authorized to access this route' });
      return;
    }
    next();
  };
};
