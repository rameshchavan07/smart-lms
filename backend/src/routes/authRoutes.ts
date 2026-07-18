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
  googleMobileLogin,
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
router.get('/google', (req, res, next) => {
  const state = req.query.state ? String(req.query.state) : undefined;
  passport.authenticate('google', { scope: ['profile', 'email'], session: false, state })(req, res, next);
});
router.get(
  '/google/callback',
  (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user) => {
      if (err || !user) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=auth_failed`);
      }
      req.user = user;
      next();
    })(req, res, next);
  },
  googleCallback
);

// Mobile Google ID Token verification
router.post('/google/token', googleMobileLogin);

export default router;
