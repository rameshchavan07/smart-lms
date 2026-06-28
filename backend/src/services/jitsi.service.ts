import jwt from 'jsonwebtoken';

export const generateJitsiToken = (user: { id: string, firstName: string, lastName: string, email: string, role: string }, roomName: string): string | null => {
  const appId = process.env.JITSI_APP_ID;
  const kid = process.env.JITSI_KID;
  let privateKey = process.env.JITSI_PRIVATE_KEY;

  if (!appId || !kid || !privateKey) {
    console.warn('Jitsi JaaS configuration missing. Jitsi iframe will be limited to 5 minutes.');
    return null;
  }

  // Ensure newlines in the private key are real newline characters
  privateKey = privateKey.replace(/\\n/g, '\n');

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: 'jitsi',
    iss: 'chat',
    sub: appId,
    room: '*', // Wildcard room prevents auth mismatch issues on JaaS
    nbf: now - 300, // 5 minutes ago to prevent clock drift issues
    iat: now,
    exp: now + 7200, // 2 hours
    context: {
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        avatar: "",
        affiliate: user.role === 'TEACHER' ? 'owner' : 'member',
        moderator: user.role === 'TEACHER', // Grant moderator rights to teachers
      },
      features: {
        recording: true,
        livestreaming: true,
        'screen-sharing': true,
      }
    }
  };

  const options: jwt.SignOptions = {
    algorithm: 'RS256',
    keyid: kid
  };

  try {
    return jwt.sign(payload, privateKey, options);
  } catch (error) {
    console.error('Failed to generate Jitsi token', error);
    return null;
  }
};
