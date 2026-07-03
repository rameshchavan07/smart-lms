import jwt, { SignOptions } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'fallback_refresh_secret';

export const generateToken = (userId: string, role: string, instituteId?: string | null): string => {
  return jwt.sign({ id: userId, role, instituteId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ id: userId }, REFRESH_SECRET, {
    expiresIn: '7d', // Refresh token lives for 7 days
  });
};

export const verifyToken = (token: string): jwt.JwtPayload | string => {
  return jwt.verify(token, JWT_SECRET);
};

export const verifyRefreshToken = (token: string): jwt.JwtPayload | string => {
  return jwt.verify(token, REFRESH_SECRET);
};
