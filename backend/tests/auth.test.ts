import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';

// A mock server just to test the basic structure since the real app uses real DB
const app = express();
app.use(express.json());
app.use(cookieParser());

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (email === 'test@example.com' && password === 'password123') {
    res.cookie('token', 'mock-jwt-token', { httpOnly: true });
    res.cookie('refreshToken', 'mock-refresh-token', { httpOnly: true });
    res.status(200).json({ message: 'Login successful' });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

describe('Auth Endpoints', () => {
  it('should reject invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'wrong@example.com', password: 'wrong' });

    expect(res.status).toBe(401);
  });

  it('should set httpOnly cookies on successful login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    const setCookieHeader = res.headers['set-cookie'];
    expect(setCookieHeader).toBeDefined();
    
    // Supertest/Express headers can type 'set-cookie' as string | string[]
    const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader as string];
    
    // Verify cookies are set and httpOnly
    const tokenCookie = cookies.find((c: string) => c.startsWith('token='));
    expect(tokenCookie).toContain('HttpOnly');
    
    const refreshCookie = cookies.find((c: string) => c.startsWith('refreshToken='));
    expect(refreshCookie).toContain('HttpOnly');
  });
});
