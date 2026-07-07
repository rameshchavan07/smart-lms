import { sendEmail } from './emailService';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ─── Institute Approval Email ────────────────────────────────────────────────
export const sendInstituteApprovalEmail = async (
  email: string,
  firstName: string,
  instituteName: string,
  slug: string
): Promise<void> => {
  const instituteUrl = `${FRONTEND_URL}/i/${slug}`;
  const adminUrl = `${FRONTEND_URL}/i/${slug}/admin`;

  const content = `
    <h2 style="margin:0 0 8px 0;color:#0f172a;font-size:22px;font-weight:700;">Your institute has been approved! 🎉</h2>
    <p style="margin:0 0 20px 0;color:#475569;font-size:15px;line-height:1.6;">
      Hi <strong>${firstName}</strong>, great news!<br/>
      <strong>${instituteName}</strong> has been reviewed and approved by the platform administrator.
      You now have full access to manage your institute.
    </p>
    <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:20px;margin:24px 0;">
      <p style="margin:0 0 8px 0;color:#166534;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Your Institute URL</p>
      <p style="margin:0;font-size:16px;font-weight:600;">
        <a href="${instituteUrl}" style="color:#4f46e5;text-decoration:none;">${instituteUrl}</a>
      </p>
      <p style="margin:8px 0 0 0;color:#64748b;font-size:12px;">Share this URL with your teachers and students to get started.</p>
    </div>
    <div style="text-align:center;margin:24px 0;">
      <a href="${adminUrl}"
        style="display:inline-block;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
        Go to Admin Dashboard →
      </a>
    </div>
  `;

  await sendEmail(email, `✅ ${instituteName} — Approved!`, content);
};

// ─── Institute Rejection Email ───────────────────────────────────────────────
export const sendInstituteRejectionEmail = async (
  email: string,
  firstName: string,
  instituteName: string,
  reason: string
): Promise<void> => {
  const content = `
    <h2 style="margin:0 0 8px 0;color:#0f172a;font-size:22px;font-weight:700;">Institute Registration Update</h2>
    <p style="margin:0 0 20px 0;color:#475569;font-size:15px;line-height:1.6;">
      Hi <strong>${firstName}</strong>,<br/>
      After careful review, the registration for <strong>${instituteName}</strong> was not approved at this time.
    </p>
    <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:12px;padding:20px;margin:24px 0;">
      <p style="margin:0 0 8px 0;color:#991b1b;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Reason</p>
      <p style="margin:0;color:#7f1d1d;font-size:15px;line-height:1.6;">${reason}</p>
    </div>
    <p style="margin:0;color:#94a3b8;font-size:13px;">
      If you believe this was an error, please contact the platform administrator for more information.
    </p>
  `;

  await sendEmail(email, `${instituteName} — Registration Update`, content);
};

// ─── Institute Suspension Email ──────────────────────────────────────────────
export const sendInstituteSuspensionEmail = async (
  email: string,
  firstName: string,
  instituteName: string
): Promise<void> => {
  const content = `
    <h2 style="margin:0 0 8px 0;color:#0f172a;font-size:22px;font-weight:700;">Institute Temporarily Deactivated</h2>
    <p style="margin:0 0 20px 0;color:#475569;font-size:15px;line-height:1.6;">
      Hi <strong>${firstName}</strong>,<br/>
      <strong>${instituteName}</strong> has been temporarily deactivated by the platform administrator.
      Access to the institute portal is suspended until further notice.
    </p>
    <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:12px;padding:20px;margin:24px 0;">
      <p style="margin:0;color:#92400e;font-size:14px;line-height:1.6;">
        All teachers and students will be unable to access the institute's portal during this period. 
        Your data remains safe and will be fully restored once the institute is reactivated.
      </p>
    </div>
    <p style="margin:0;color:#94a3b8;font-size:13px;">
      Please contact the platform administrator if you need more information.
    </p>
  `;

  await sendEmail(email, `⚠️ ${instituteName} — Temporarily Deactivated`, content);
};

// ─── Institute Reactivation Email ────────────────────────────────────────────
export const sendInstituteReactivationEmail = async (
  email: string,
  firstName: string,
  instituteName: string,
  slug: string
): Promise<void> => {
  const adminUrl = `${FRONTEND_URL}/i/${slug}/admin`;

  const content = `
    <h2 style="margin:0 0 8px 0;color:#0f172a;font-size:22px;font-weight:700;">Your institute is back online! 🎉</h2>
    <p style="margin:0 0 20px 0;color:#475569;font-size:15px;line-height:1.6;">
      Hi <strong>${firstName}</strong>,<br/>
      <strong>${instituteName}</strong> has been reactivated by the platform administrator.
      Full access has been restored for you, your teachers, and your students.
    </p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${adminUrl}"
        style="display:inline-block;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
        Go to Admin Dashboard →
      </a>
    </div>
  `;

  await sendEmail(email, `✅ ${instituteName} — Reactivated!`, content);
};

// ─── New Institute Registration Notification (to Super Admin) ────────────────
export const sendNewInstituteNotification = async (
  superAdminEmail: string,
  instituteName: string,
  adminEmail: string
): Promise<void> => {
  const superAdminUrl = `${FRONTEND_URL}/super-admin/institutes`;

  const content = `
    <h2 style="margin:0 0 8px 0;color:#0f172a;font-size:22px;font-weight:700;">New Institute Registration 🏫</h2>
    <p style="margin:0 0 20px 0;color:#475569;font-size:15px;line-height:1.6;">
      A new institute has been registered and is awaiting your approval.
    </p>
    <div style="background:#eef2ff;border:1px solid #a5b4fc;border-radius:12px;padding:20px;margin:24px 0;">
      <p style="margin:0 0 4px 0;color:#4338ca;font-size:13px;font-weight:600;">Institute Name</p>
      <p style="margin:0 0 12px 0;color:#0f172a;font-size:16px;font-weight:600;">${instituteName}</p>
      <p style="margin:0 0 4px 0;color:#4338ca;font-size:13px;font-weight:600;">Admin Email</p>
      <p style="margin:0;color:#0f172a;font-size:16px;font-weight:600;">${adminEmail}</p>
    </div>
    <div style="text-align:center;margin:24px 0;">
      <a href="${superAdminUrl}"
        style="display:inline-block;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
        Review Pending Requests →
      </a>
    </div>
  `;

  await sendEmail(superAdminEmail, `🏫 New Institute Pending: ${instituteName}`, content);
};

// ─── Registration Pending Confirmation (to Institute Admin) ──────────────────
export const sendRegistrationPendingEmail = async (
  email: string,
  firstName: string,
  instituteName: string
): Promise<void> => {
  const content = `
    <h2 style="margin:0 0 8px 0;color:#0f172a;font-size:22px;font-weight:700;">Registration Submitted ✅</h2>
    <p style="margin:0 0 20px 0;color:#475569;font-size:15px;line-height:1.6;">
      Hi <strong>${firstName}</strong>,<br/>
      Your institute <strong>${instituteName}</strong> has been registered successfully and is now pending review by the platform administrator.
    </p>
    <div style="background:#eef2ff;border:1px solid #a5b4fc;border-radius:12px;padding:20px;margin:24px 0;">
      <p style="margin:0;color:#4338ca;font-size:14px;line-height:1.6;">
        You will receive an email notification once your institute has been reviewed.
        This usually takes 1-2 business days.
      </p>
    </div>
    <p style="margin:0;color:#94a3b8;font-size:13px;">
      If you have any questions, please contact the platform administrator.
    </p>
  `;

  await sendEmail(email, `${instituteName} — Registration Pending Review`, content);
};
