/**
 * ONE-TIME SETUP SCRIPT - Run this once to get your Google OAuth2 refresh token
 * This lets the app upload files to YOUR personal Google Drive (5TB storage)
 * 
 * Usage:
 *   1. Download OAuth2 credentials from Google Cloud Console as 'oauth_credentials.json'
 *   2. Place 'oauth_credentials.json' in the backend/ folder
 *   3. Run: node getGoogleToken.js
 *   4. Visit the URL shown, authorize, paste the code back
 *   5. Copy the GOOGLE_REFRESH_TOKEN value to your .env file
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const OAUTH_CREDS_FILE = path.join(__dirname, 'oauth_credentials.json');

if (!fs.existsSync(OAUTH_CREDS_FILE)) {
  console.error('\n❌ oauth_credentials.json not found!');
  console.error('   Please download it from Google Cloud Console:');
  console.error('   → APIs & Services → Credentials → OAuth 2.0 Client IDs → Download JSON');
  console.error('   Save it as "oauth_credentials.json" in the backend/ folder\n');
  process.exit(1);
}

const creds = JSON.parse(fs.readFileSync(OAUTH_CREDS_FILE, 'utf8'));
const { client_id, client_secret, redirect_uris } = creds.installed || creds.web;

const oauth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  'urn:ietf:wg:oauth:2.0:oob' // Desktop app redirect
);

const SCOPES = ['https://www.googleapis.com/auth/drive'];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent', // Force to always get refresh_token
});

console.log('\n🔐 === Google OAuth2 Token Setup ===\n');
console.log('Step 1: Open this URL in your browser:\n');
console.log('  ' + authUrl);
console.log('\nStep 2: Sign in with your Google account (Rutu chavan)');
console.log('Step 3: Grant access to Google Drive');
console.log('Step 4: Copy the authorization code shown on screen\n');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question('Paste the authorization code here: ', async (code) => {
  rl.close();
  try {
    const { tokens } = await oauth2Client.getToken(code.trim());
    
    console.log('\n✅ SUCCESS! Your tokens:\n');
    console.log('─────────────────────────────────────────');
    console.log('GOOGLE_CLIENT_ID=' + client_id);
    console.log('GOOGLE_CLIENT_SECRET=' + client_secret);
    console.log('GOOGLE_REFRESH_TOKEN=' + tokens.refresh_token);
    console.log('─────────────────────────────────────────');
    console.log('\n📋 Copy all 3 lines above and add them to your backend/.env file\n');
    
    // Also save to a file for convenience
    const envLines = `\n# Google OAuth2 (for personal Drive uploads)\nGOOGLE_CLIENT_ID=${client_id}\nGOOGLE_CLIENT_SECRET=${client_secret}\nGOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`;
    fs.appendFileSync(path.join(__dirname, '.env.google_tokens'), envLines);
    console.log('✅ Tokens also saved to .env.google_tokens for reference\n');
    
  } catch (err) {
    console.error('\n❌ Failed to get token:', err.message);
    if (err.message.includes('invalid_grant')) {
      console.error('   The code may have expired. Please run the script again and use the code quickly.\n');
    }
  }
});
