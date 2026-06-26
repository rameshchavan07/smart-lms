import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const APP_NAME = 'OpenLearnX';

// ─── HTML Templates ───────────────────────────────────────────────────────────

const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${APP_NAME}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1 0%,#4f46e5 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">
                ◆ ${APP_NAME}
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">
                This email was sent by ${APP_NAME}. If you didn't request this, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const otpBlock = (otp: string) => `
  <div style="background:linear-gradient(135deg,#eef2ff,#e0e7ff);border:2px dashed #a5b4fc;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
    <p style="margin:0 0 8px 0;color:#6366f1;font-size:13px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Your One-Time Password</p>
    <p style="margin:0;font-size:42px;font-weight:800;letter-spacing:12px;color:#4338ca;font-family:'Courier New',monospace;">${otp}</p>
    <p style="margin:8px 0 0 0;color:#64748b;font-size:12px;">Valid for <strong>10 minutes</strong></p>
  </div>
`;

// ─── Email Senders ────────────────────────────────────────────────────────────

export const sendEmailVerificationOtp = async (email: string, firstName: string, otp: string): Promise<void> => {
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px 0;color:#0f172a;font-size:22px;font-weight:700;">Verify your email</h2>
    <p style="margin:0 0 20px 0;color:#475569;font-size:15px;line-height:1.6;">
      Hi <strong>${firstName}</strong>, welcome to ${APP_NAME}! 🎉<br/>
      Use the OTP below to verify your email address and complete your registration.
    </p>
    ${otpBlock(otp)}
    <p style="margin:0;color:#94a3b8;font-size:13px;">
      Never share this OTP with anyone. The ${APP_NAME} team will never ask for your OTP.
    </p>
  `);

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `${otp} — Verify your ${APP_NAME} account`,
      html,
    });

    if (error) {
      console.error('Resend sendEmailVerificationOtp error:', error);
      if (process.env.NODE_ENV !== 'production' || !process.env.RESEND_API_KEY) {
        console.log('\n==================================================');
        console.log(`[DEV FALLBACK] Verification OTP for ${email}: ${otp}`);
        console.log('==================================================\n');
        return;
      }
      throw new Error(`Email delivery failed: ${error.message}`);
    }
  } catch (err: any) {
    console.error('Resend sendEmailVerificationOtp exception:', err);
    if (process.env.NODE_ENV !== 'production' || !process.env.RESEND_API_KEY) {
      console.log('\n==================================================');
      console.log(`[DEV FALLBACK] Verification OTP for ${email}: ${otp}`);
      console.log('==================================================\n');
      return;
    }
    throw err;
  }
};

export const sendPasswordResetOtp = async (email: string, firstName: string, otp: string): Promise<void> => {
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px 0;color:#0f172a;font-size:22px;font-weight:700;">Reset your password</h2>
    <p style="margin:0 0 20px 0;color:#475569;font-size:15px;line-height:1.6;">
      Hi <strong>${firstName}</strong>, we received a request to reset your password.<br/>
      Use the OTP below to proceed. If you didn't request this, ignore this email — your password won't change.
    </p>
    ${otpBlock(otp)}
    <p style="margin:0;color:#94a3b8;font-size:13px;">
      For your security, never share this OTP with anyone.
    </p>
  `);

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `${otp} — Reset your ${APP_NAME} password`,
      html,
    });

    if (error) {
      console.error('Resend sendPasswordResetOtp error:', error);
      if (process.env.NODE_ENV !== 'production' || !process.env.RESEND_API_KEY) {
        console.log('\n==================================================');
        console.log(`[DEV FALLBACK] Password Reset OTP for ${email}: ${otp}`);
        console.log('==================================================\n');
        return;
      }
      throw new Error(`Email delivery failed: ${error.message}`);
    }
  } catch (err: any) {
    console.error('Resend sendPasswordResetOtp exception:', err);
    if (process.env.NODE_ENV !== 'production' || !process.env.RESEND_API_KEY) {
      console.log('\n==================================================');
      console.log(`[DEV FALLBACK] Password Reset OTP for ${email}: ${otp}`);
      console.log('==================================================\n');
      return;
    }
    throw err;
  }
};

export const sendWelcomeEmail = async (email: string, firstName: string): Promise<void> => {
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px 0;color:#0f172a;font-size:22px;font-weight:700;">Welcome to ${APP_NAME}! 🎓</h2>
    <p style="margin:0 0 20px 0;color:#475569;font-size:15px;line-height:1.6;">
      Hi <strong>${firstName}</strong>, your account has been verified and is ready to use.<br/>
      Start exploring your courses and learning materials.
    </p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${process.env.FRONTEND_URL}/login"
        style="display:inline-block;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
        Go to Dashboard →
      </a>
    </div>
  `);

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Welcome to ${APP_NAME} — You're all set!`,
      html,
    });

    if (error) {
      console.error('Resend sendWelcomeEmail error:', error);
      if (process.env.NODE_ENV !== 'production' || !process.env.RESEND_API_KEY) {
        console.log(`[DEV FALLBACK] Welcome email to ${email} simulated successfully.`);
        return;
      }
      throw new Error(`Email delivery failed: ${error.message}`);
    }
  } catch (err: any) {
    console.error('Resend sendWelcomeEmail exception:', err);
    if (process.env.NODE_ENV !== 'production' || !process.env.RESEND_API_KEY) {
      console.log(`[DEV FALLBACK] Welcome email to ${email} simulated successfully.`);
      return;
    }
    throw err;
  }
};

