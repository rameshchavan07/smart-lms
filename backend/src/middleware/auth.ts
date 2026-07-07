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

/**
 * Middleware: Looks up institute by :slug param, verifies it's APPROVED,
 * and attaches it to req.institute.
 */
export const requireApprovedInstitute = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const slug = req.params.slug as string;
  if (!slug) {
    res.status(400).json({ message: 'Institute slug is required' });
    return;
  }

  const institute = await prisma.institute.findUnique({ where: { slug } });
  if (!institute) {
    res.status(404).json({ message: 'Institute not found' });
    return;
  }

  if (institute.status !== 'APPROVED') {
    res.status(403).json({
      message: 'This institute is not currently active',
      status: institute.status,
    });
    return;
  }

  (req as any).institute = institute;
  next();
};

/**
 * Middleware: Verifies the authenticated user belongs to the same institute
 * that was resolved by requireApprovedInstitute. SUPER_ADMINs bypass this check.
 */
export const requireSameInstitute = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role === 'SUPER_ADMIN') {
    next();
    return;
  }

  const institute = (req as any).institute;
  if (!institute) {
    res.status(500).json({ message: 'Institute context not found. Use requireApprovedInstitute first.' });
    return;
  }

  if (req.user?.instituteId !== institute.id) {
    res.status(403).json({ message: 'You do not belong to this institute' });
    return;
  }

  next();
};
