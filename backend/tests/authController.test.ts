import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcrypt';

// ─── Mocks — factory functions used so Vitest hoisting works correctly ────────

vi.mock('../src/config/redis', () => ({
  default: {
    get:  vi.fn(async () => null),
    set:  vi.fn(async () => 'OK'),
    del:  vi.fn(async () => 1),
    scan: vi.fn(async () => ['0', []]),
  },
}));

vi.mock('../src/config/db', () => ({
  default: {
    user:         { findUnique: vi.fn() },
    refreshToken: { findUnique: vi.fn(), create: vi.fn(), deleteMany: vi.fn() },
    auditLog:     { create: vi.fn() },
  },
}));

vi.mock('../src/utils/jwt', () => ({
  generateToken:        vi.fn(() => 'mock-access-token'),
  generateRefreshToken: vi.fn(() => 'mock-refresh-token'),
  verifyRefreshToken:   vi.fn(() => ({ id: 'user-123' })),
}));

vi.mock('../src/services/otpService', () => ({
  createOtp:          vi.fn(() => '999999'),
  verifyOtp:          vi.fn(),
  deleteOtpsForEmail: vi.fn(),
}));

vi.mock('../src/services/emailService', () => ({
  sendEmailVerificationOtp: vi.fn(),
  sendPasswordResetOtp:     vi.fn(),
  sendWelcomeEmail:         vi.fn(),
}));

vi.mock('../src/utils/auditLogger', () => ({ logActivity: vi.fn() }));

// ─── Imports after mocks ──────────────────────────────────────────────────────
import prisma from '../src/config/db';
import { loginUser, logoutUser, refresh } from '../src/controllers/authController';

// ─── Build test app ───────────────────────────────────────────────────────────
const app = express();
app.use(express.json());
app.use(cookieParser());
app.post('/api/auth/login',   loginUser);
app.post('/api/auth/logout',  logoutUser);
app.post('/api/auth/refresh', refresh);

// ─── Shared data ──────────────────────────────────────────────────────────────
const HASHED_PASSWORD = bcrypt.hashSync('correctpassword', 1); // Use low rounds in tests for speed

const MOCK_USER = {
  id:              'user-123',
  firstName:       'Jane',
  lastName:        'Doe',
  email:           'jane@example.com',
  passwordHash:    HASHED_PASSWORD,
  role:            'STUDENT',
  isActive:        true,
  isEmailVerified: true,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Auth Controller — loginUser', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when user does not exist', async () => {
    (prisma.user.findUnique as any).mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'anything' });

    expect(res.status).toBe(401);
  });

  it('returns 401 when password is wrong', async () => {
    (prisma.user.findUnique as any).mockResolvedValueOnce(MOCK_USER);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: MOCK_USER.email, password: 'wrongpassword' });

    expect(res.status).toBe(401);
  });

  it('returns 403 when account is inactive', async () => {
    (prisma.user.findUnique as any).mockResolvedValueOnce({ ...MOCK_USER, isActive: false });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: MOCK_USER.email, password: 'correctpassword' });

    expect(res.status).toBe(403);
  });

  it('sets HttpOnly token and refreshToken cookies on success', async () => {
    (prisma.user.findUnique as any).mockResolvedValueOnce(MOCK_USER);
    (prisma.refreshToken.create as any).mockResolvedValueOnce({});

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: MOCK_USER.email, password: 'correctpassword' });

    expect(res.status).toBe(200);

    const cookies = (res.headers['set-cookie'] as unknown as string[]) ?? [];
    const tokenCookie   = cookies.find((c: string) => c.startsWith('token='));
    const refreshCookie = cookies.find((c: string) => c.startsWith('refreshToken='));

    expect(tokenCookie).toBeDefined();
    expect(tokenCookie).toContain('HttpOnly');
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toContain('HttpOnly');
  });

  it('does NOT expose raw tokens in the response body', async () => {
    (prisma.user.findUnique as any).mockResolvedValueOnce(MOCK_USER);
    (prisma.refreshToken.create as any).mockResolvedValueOnce({});

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: MOCK_USER.email, password: 'correctpassword' });

    expect(res.body).not.toHaveProperty('token');
    expect(res.body).not.toHaveProperty('refreshToken');
    expect(res.body).toHaveProperty('email', MOCK_USER.email);
    expect(res.body).toHaveProperty('role', MOCK_USER.role);
  });
});

describe('Auth Controller — logoutUser', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 and clears cookies on logout', async () => {
    (prisma.refreshToken.findUnique as any).mockResolvedValueOnce({
      token: 'mock-refresh-token', userId: MOCK_USER.id,
    });
    (prisma.refreshToken.deleteMany as any).mockResolvedValueOnce({});

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', ['refreshToken=mock-refresh-token']);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/logged out/i);
  });

  it('returns 200 even with no refresh token cookie', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(200);
  });
});

describe('Auth Controller — refresh', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when no refresh token cookie is sent', async () => {
    const res = await request(app).post('/api/auth/refresh');
    expect(res.status).toBe(401);
  });

  it('returns 401 when refresh token is not in DB', async () => {
    (prisma.refreshToken.findUnique as any).mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', ['refreshToken=invalid-token']);

    expect(res.status).toBe(401);
  });

  it('issues a new HttpOnly access token when refresh token is valid', async () => {
    (prisma.refreshToken.findUnique as any).mockResolvedValueOnce({
      token:     'mock-refresh-token',
      userId:    MOCK_USER.id,
      expiresAt: new Date(Date.now() + 86400000),
    });
    (prisma.user.findUnique as any).mockResolvedValueOnce(MOCK_USER);

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', ['refreshToken=mock-refresh-token']);

    expect(res.status).toBe(200);
    const cookies = (res.headers['set-cookie'] as unknown as string[]) ?? [];
    const newTokenCookie = cookies.find((c: string) => c.startsWith('token='));
    expect(newTokenCookie).toBeDefined();
    expect(newTokenCookie).toContain('HttpOnly');
  });
});
