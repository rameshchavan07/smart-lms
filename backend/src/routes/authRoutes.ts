import { Router } from 'express';
import passport from 'passport';
import {
  registerUser,
  loginUser,
  verifyEmail,
  resendOtp,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  googleCallback,
  getMe,
  refresh,
  logoutUser,
} from '../controllers/authController';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  verifyResetOtpSchema,
  resetPasswordSchema,
} from '../utils/validationSchemas';

const router = Router();

// ─── Standard Auth ────────────────────────────────────────────────────────────
router.post('/register', validate(registerSchema), registerUser);
router.post('/login', validate(loginSchema), loginUser);
router.post('/refresh', refresh);
router.post('/logout', logoutUser);
router.get('/me', protect, getMe);

// ─── OTP Email Verification ───────────────────────────────────────────────────
router.post('/verify-email', validate(verifyOtpSchema), verifyEmail);
router.post('/resend-otp', validate(resendOtpSchema), resendOtp);

// ─── Forgot / Reset Password ──────────────────────────────────────────────────
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/verify-reset-otp', validate(verifyResetOtpSchema), verifyResetOtp);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

// ─── Google OAuth ─────────────────────────────────────────────────────────────
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  googleCallback
);

export default router;
