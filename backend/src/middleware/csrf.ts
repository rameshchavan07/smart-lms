import { doubleCsrf } from 'csrf-csrf';
import { Request } from 'express';

export const {
  invalidCsrfTokenError,
  generateCsrfToken,
  validateRequest,
  doubleCsrfProtection,
} = doubleCsrf({
  getSecret: (req?: Request) => process.env.SESSION_SECRET || 'open-learn-x-session-secret',
  cookieName: 'x-csrf-token',
  cookieOptions: {
    sameSite: 'strict',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  getCsrfTokenFromRequest: (req: Request) => {
    const token = req.headers['x-csrf-token'];
    if (Array.isArray(token)) {
      return token[0];
    }
    return token;
  },
  getSessionIdentifier: (req: Request) => req.cookies?.token || 'session',
});
