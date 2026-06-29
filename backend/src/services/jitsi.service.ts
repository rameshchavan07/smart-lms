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

  const isModerator = user.role === 'TEACHER' || user.role === 'ADMIN';
  const now = Math.floor(Date.now() / 1000);

  // System time may be mocked to the future (e.g. 2026), which causes live Jitsi servers
  // to reject the token because 'nbf' is in the future.
  // Offset by 3 years to ensure it is valid on real-world servers.
  const pastOffset = 3 * 365 * 24 * 60 * 60;
  
  // JWT Payload for Jitsi as a Service (JaaS)
  const payload = {
    aud: 'jitsi',
    iss: 'chat',
    sub: appId,         // Must be the full AppID e.g. "vpaas-magic-cookie-..."
    room: '*',          // Wildcard: allows this token for any room under this AppID
    nbf: now - pastOffset, 
    iat: now - pastOffset,
    exp: now + 7200,    // Still valid for a few hours in the future
    context: {
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        avatar: '',
        // JaaS requires moderator as a STRING "true"/"false", not boolean
        moderator: isModerator ? 'true' : 'false',
      },
      features: {
        // JaaS requires feature flags as STRING "true"/"false", not booleans
        recording: isModerator ? 'true' : 'false',
        livestreaming: isModerator ? 'true' : 'false',
        'screen-sharing': 'true',
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

