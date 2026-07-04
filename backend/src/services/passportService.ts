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
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error('No email returned from Google'), undefined);
          }

          const firstName = profile.name?.givenName || profile.displayName || 'User';
          const lastName = profile.name?.familyName || '';

          // Check if user exists by googleId
          let user = await prisma.user.findFirst({ where: { googleId: profile.id } });

          if (!user) {
            // Check if email already registered (non-Google account)
            user = await prisma.user.findUnique({ where: { email } });

            if (user) {
              // Link Google to existing account
              user = await prisma.user.update({
                where: { id: user.id },
                data: { googleId: profile.id, isEmailVerified: true },
              });
            } else {
              // Brand-new user — create User + Student
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
                },
              });

              await prisma.student.create({
                data: {
                  userId: user.id,
                  enrollmentNumber: `STU-${Date.now()}`,
                },
              });
            }
          }

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
