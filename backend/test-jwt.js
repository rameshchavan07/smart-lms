require('dotenv').config();
const jwt = require('jsonwebtoken');

const appId = process.env.JITSI_APP_ID;
const kid = process.env.JITSI_KID;
let privateKey = process.env.JITSI_PRIVATE_KEY;
privateKey = privateKey.replace(/\\n/g, '\n');

console.log("App ID:", appId);
console.log("KID:", kid);
console.log("Private Key starts with:", privateKey.substring(0, 30));

const payload = {
  aud: 'jitsi',
  iss: 'chat',
  sub: appId,
  room: '*',
  context: {
    user: {
      id: '123',
      name: 'Test User',
      email: 'test@example.com',
      moderator: true,
    },
    features: {
      recording: true,
      livestreaming: true,
      'screen-sharing': true,
    }
  }
};

try {
  const token = jwt.sign(payload, privateKey, { algorithm: 'RS256', keyid: kid, expiresIn: '2h' });
  console.log("Token Generated:", token);
} catch (e) {
  console.error("Error signing:", e);
}
