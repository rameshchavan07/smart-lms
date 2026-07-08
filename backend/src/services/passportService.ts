import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import prisma from '../config/db';

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

          let stateData: { instituteSlug?: string; action?: string } | null = null;
          if (req.query.state) {
            try {
              stateData = JSON.parse(decodeURIComponent(req.query.state as string));
            } catch (err) {
              console.warn('Failed to parse state in Google OAuth', err);
            }
          }

          let targetInstituteId: string | undefined = undefined;
          if (stateData?.instituteSlug) {
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
              // If we are logging into a specific institute, optionally check/assign it.
              // For now, just link Google account.
              user = await prisma.user.update({
                where: { id: user.id },
                data: { 
                  googleId: profile.id, 
                  isEmailVerified: true,
                  ...(targetInstituteId && !user.instituteId ? { instituteId: targetInstituteId } : {})
                },
              });
              
              // If user didn't have a student profile but is joining an institute, create it.
              if (targetInstituteId) {
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
              user = await prisma.user.create({
                data: {
                  firstName,
                  lastName,
                  email,
                  passwordHash: null,
                  role: 'STUDENT',
                  googleId: profile.id,
                  isEmailVerified: true,
                  profileImage: profile.photos?.[0]?.value,
                  instituteId: targetInstituteId || null,
                },
              });

              await prisma.student.create({
                data: {
                  userId: user.id,
                  enrollmentNumber: `STU-${Date.now()}`,
                },
              });
            }
          } else if (targetInstituteId && !user.instituteId) {
             // If user logged in before via Google (no institute), and now logs into an institute
             user = await prisma.user.update({
               where: { id: user.id },
               data: { instituteId: targetInstituteId }
             });
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
