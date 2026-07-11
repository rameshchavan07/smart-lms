import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import prisma from '../config/db';
import { generateUniqueSlug } from '../utils/slugify';
import { sendNewInstituteNotification } from './instituteEmailService';

export const configurePassport = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_LOGIN_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_LOGIN_CLIENT_SECRET!,
        callbackURL: process.env.GOOGLE_CALLBACK_URL!,
        scope: ['profile', 'email'],
        passReqToCallback: true,
      },
      async (req, _accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error('No email returned from Google'), undefined);
          }

          let stateData: { instituteSlug?: string; action?: string; instituteName?: string; phone?: string } | null = null;
          if (req.query.state) {
            try {
              stateData = JSON.parse(decodeURIComponent(req.query.state as string));
            } catch (err) {
              console.warn('Failed to parse state in Google OAuth', err);
            }
          }

          let targetInstituteId: string | undefined = undefined;

          if (stateData?.action === 'register_institute' && stateData.instituteName) {
            // Generating new institute on registration
            const existingUser = await prisma.user.findFirst({
              where: { OR: [{ googleId: profile.id }, { email }] }
            });

            if (existingUser && existingUser.instituteId) {
              return done(new Error('User already associated with an institute.'), undefined);
            }

            const slug = await generateUniqueSlug(stateData.instituteName);
            const institute = await prisma.institute.create({
              data: {
                name: stateData.instituteName,
                slug,
                email: email,
                phone: stateData.phone,
                status: 'PENDING'
              }
            });
            targetInstituteId = institute.id;

            const superAdmins = await prisma.user.findMany({
              where: { role: 'SUPER_ADMIN' },
              select: { email: true }
            });
            for (const sa of superAdmins) {
              sendNewInstituteNotification(sa.email, stateData.instituteName, email).catch(console.error);
            }
          } else if (stateData?.instituteSlug) {
            const institute = await prisma.institute.findUnique({
              where: { slug: stateData.instituteSlug },
            });
            if (institute) {
              targetInstituteId = institute.id;
            }
          }

          const firstName = profile.name?.givenName || profile.displayName || 'User';
          const lastName = profile.name?.familyName || '';

          // Check if user exists by googleId
          let user = await prisma.user.findFirst({ where: { googleId: profile.id } });

          if (!user) {
            // Check if email already registered (non-Google account)
            user = await prisma.user.findUnique({ where: { email } });

            if (user) {
              // Link Google account
              user = await prisma.user.update({
                where: { id: user.id },
                data: { 
                  googleId: profile.id, 
                  isEmailVerified: true,
                  ...(targetInstituteId && !user.instituteId ? { instituteId: targetInstituteId, role: stateData?.action === 'register_institute' ? 'ADMIN' : user.role } : {})
                },
              });
              
              if (targetInstituteId && user.role !== 'ADMIN') {
                const studentProfile = await prisma.student.findUnique({ where: { userId: user.id } });
                if (!studentProfile) {
                  await prisma.student.create({
                    data: {
                      userId: user.id,
                      enrollmentNumber: `STU-${Date.now()}`,
                    },
                  });
                }
              }
            } else {
              // Brand-new user
              const role = targetInstituteId && stateData?.action === 'register_institute' ? 'ADMIN' : 'STUDENT';
              user = await prisma.user.create({
                data: {
                  firstName,
                  lastName,
                  email,
                  passwordHash: null,
                  role,
                  googleId: profile.id,
                  isEmailVerified: true,
                  profileImage: profile.photos?.[0]?.value,
                  instituteId: targetInstituteId || null,
                },
              });

              if (role === 'STUDENT') {
                await prisma.student.create({
                  data: {
                    userId: user.id,
                    enrollmentNumber: `STU-${Date.now()}`,
                  },
                });
              }
            }
          } else if (targetInstituteId && !user.instituteId) {
             const newRole = stateData?.action === 'register_institute' ? 'ADMIN' : user.role;
             user = await prisma.user.update({
               where: { id: user.id },
               data: { instituteId: targetInstituteId, role: newRole }
             });
             if (newRole !== 'ADMIN') {
               const studentProfile = await prisma.student.findUnique({ where: { userId: user.id } });
               if (!studentProfile) {
                 await prisma.student.create({
                   data: {
                     userId: user.id,
                     enrollmentNumber: `STU-${Date.now()}`,
                   },
                 });
               }
             }
          }

          // We pass stateData through to the next middleware via the user object temporarily
          // so authController can read it.
          (user as any)._oauthState = stateData;

          return done(null, user);
        } catch (error) {
          return done(error as Error, undefined);
        }
      }
    )
  );

  // We use stateless JWT — no session serialization needed.
  // Passport still requires these to exist when session middleware is present.
  passport.serializeUser((user: Express.User | { id: string }, done) => done(null, (user as { id: string }).id));
  passport.deserializeUser(async (id: string, done) => {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  });
};
