# Smart-LMS: 100% Free Complete Deployment Guide

This guide details the exact, step-by-step process for deploying the Smart-LMS platform to production for **free**, covering both the backend API and the frontend application. We are using a modern, decoupled stack.

---

## 1. The 100% Free Stack

To deploy this application completely for free without any expiring databases, we will use the following combination of services:

1. **Database (PostgreSQL):** [Neon.tech](https://neon.tech)
2. **Redis (Caching & WebSockets):** [Upstash](https://upstash.com)
3. **Backend API:** [Render](https://render.com) (Web Service)
4. **Frontend:** [Vercel](https://vercel.com)

---

## 2. Step 1: Provision your Databases

Before deploying your code, you need a live database and a Redis instance to connect to.

### A. Create PostgreSQL Database (Neon)

1. Go to [Neon.tech](https://neon.tech) and click **Sign Up** (using GitHub is easiest).
2. Once logged in, click **Create Project**.7JK3AlZF\nWgXBUZ1s+Q97uzHqiMTwp9O/SqK00v1dhp7eFZlPubZDB5uHEV2EqEw+H27TSHyp\n8P5WNjp8gWlHkdzt+bn7m6qITMg+ESEtg/sj/XxhHjx0jy5XB6/RPk6OX0ahrFzd\nbrcPqTEXVUECgYA+G7O0YErlcD61edmOPa9UAvgjoyNhBk6/MNuQ8bpIYW4ob/+e\naTMMjxals9nHpBn6z+hYkGL6mYAWcWMMxsY5HnSvhfp29uhWZT1NjWvsL9oYfvSJ\nIKm1iFalBLga3cT1TSVBExAe1vEFh0mpJeFPoVal9DfXEWpxmkHYvNu/cQKBgEo5\nEg5NAn+1MvfLHUFm1JQ9ZaWzNV4v0Ou6udyMZj4wPDeWXBZ30ll+EK4osjBYEVst\nQUUdIomy6KS5PesbR32wo0j43eomLFyhdwiofiCo8k3A4y5LfgHwUrv7w3kh1j6J\np3MEa33rrv8B5u1BpVVDzujX/rEwakrzStYYt/gBAoGBANyhM/OuQliBRqOmo5Kj\n1Shmu3rHf7ekmvWj+iqtml9YP7cknrYtZ7bHNomx9vL7Ul8NI0+bqhyKUH0KHcmF\nCqKI/yQNnsgDQPEfWtepZ6Dm2uEEdfyIjZMEUAC4xxWevHVkJlhZMMcR7ieeqEF5\nLBaepUc/DZbkPOxqbE2nD2HV\n-----END PRIVATE KEY-----"
3. Name your project (e.g., `smart-lms-db`), leave the Postgres version as default (v15/v16), select a region close to you, and click **Create Project**.
4. You will immediately be shown a connection string. It will look something like this:
   `postgresql://user:password@ep-cool-butterfly-123456.us-east-2.aws.neon.tech/neondb?sslmode=require`
5. **Copy this string and save it somewhere safe.** This is your `DATABASE_URL`.

### B. Create Redis Instance (Upstash)

1. Go to [Upstash.com](https://upstash.com) and click **Login** (Sign in with GitHub).
2. On the dashboard, click **Create Database** under the Redis section.
3. Name your database (e.g., `smart-lms-redis`), select the `Global` or `Primary` region that matches your Neon database region, and click **Create**.
4. Scroll down your newly created database page to the **Connect to your database** section.
5. Click on the **Node.js** tab, and switch the dropdown from `redis` to `ioredis`.
6. You will see a URL that looks like:
   `rediss://default:password123@us1-cool-butterfly-32132.upstash.io:32132`
7. **Copy this URL and save it somewhere safe.** This is your `REDIS_URL`.

---

## 3. Step 2: Deploying the Backend (Render)

Now that you have your databases, let's deploy the Node.js API.

1. Go to [Render.com](https://render.com) and sign in using GitHub.
2. Click the **New +** button in the top right and select **Web Service**.
3. Under "Connect a repository", find your Smart-LMS repository and click **Connect**.
4. Fill out the configuration form:
   - **Name:** `smart-lms-api`
   - **Region:** Choose the region closest to your databases.
   - **Branch:** `main`
   - **Root Directory:** `backend` (⚠️ **CRITICAL:** Make sure you type `backend` here).
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npx prisma generate && npm run build`
   - **Start Command:** `npm run start`
   - **Instance Type:** Free ($0/month)
5. Scroll down and click **Advanced**.
6. Click **Add Environment Variable**. You need to add all of these exactly:

| Key | Value |
| :--- | :--- |
| `PORT` | `5000` |
| `FRONTEND_URL` | *(Leave empty for now, we will come back to this in Step 4)* |
| `DATABASE_URL` | Paste your Neon Connection String from Step 1A here. |
| `REDIS_URL` | Paste your Upstash URL from Step 1B here. |
| `JWT_SECRET` | Generate a random 32-character string and paste it here. |
| `JWT_EXPIRES_IN` | `1d` |
| `OTP_RESET_SECRET` | Generate a random 32-character string and paste it here. |
| `SESSION_SECRET` | Generate a random 32-character string and paste it here. |
| `JITSI_APP_ID` | Your Jitsi App ID |
| `JITSI_KID` | Your Jitsi KID |
| `JITSI_PRIVATE_KEY` | Your Jitsi Private Key (including BEGIN and END tags) |
| `GOOGLE_DRIVE_FOLDER_ID` | Your Google Drive Folder ID |
| `GOOGLE_CLIENT_ID` | Your Google Client ID |
| `GOOGLE_CLIENT_SECRET` | Your Google Client Secret |
| `GOOGLE_REFRESH_TOKEN` | Your Google Refresh Token |
| `GOOGLE_LOGIN_CLIENT_ID` | Your Google Login Client ID |
| `GOOGLE_LOGIN_CLIENT_SECRET`| Your Google Login Client Secret |
| `GOOGLE_CALLBACK_URL` | `https://smart-lms-api.onrender.com/api/auth/google/callback` *(Change 'smart-lms-api' to whatever you named your Render app)* |
| `GMAIL_USER` | Your Gmail address (e.g., your-lms@gmail.com) |
| `GMAIL_PASS` | Your 16-character Gmail App Password |

1. Click **Create Web Service**.
2. Render will now build and deploy your app. Wait for it to say **Live** (this takes about 5 minutes).

### Crucial: Run Database Migrations

Before your app can work, you need to create the tables in your new Neon database.

1. Open your local VS Code terminal.
2. Open your local `backend/.env` file.
3. Temporarily change your local `DATABASE_URL` to the Neon `DATABASE_URL`.
4. In your terminal, run:

   ```bash
   cd backend
   npx prisma db push
   ```

5. You should see a message saying the database is now in sync. (You can change your local `DATABASE_URL` back to localhost afterwards).

---

## 4. Step 3: Deploying the Frontend (Vercel)

1. Go to [Vercel.com](https://vercel.com) and sign in using GitHub.
2. Click **Add New** -> **Project**.
3. Find your Smart-LMS repository and click **Import**.
4. Vercel usually auto-detects Vite, but ensure the configuration is exactly this:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click Edit, select the `frontend` folder, and click Continue.
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Expand the **Environment Variables** tab. You MUST add these before clicking deploy:

| Name | Value |
| :--- | :--- |
| `VITE_API_URL` | `https://smart-lms-api.onrender.com/api` *(Replace with your actual Render URL)* |
| `VITE_API_BASE_URL` | `https://smart-lms-api.onrender.com/api` *(Replace with your actual Render URL)* |

1. Click **Deploy**. Vercel will build your frontend. Wait for the confetti screen!

---

## 5. Step 4: Final Glue & Configuration

1. **Fix the Frontend URL on Render:**
   - Go to your Vercel dashboard and copy your new live frontend URL (e.g., `https://smart-lms-123.vercel.app`).
   - Go back to your Render dashboard for your Backend API.
   - Go to **Environment**, find the `FRONTEND_URL` variable we left blank earlier, paste your Vercel URL, and click **Save Changes**. Render will restart the API.

2. **Fix Google OAuth Configuration:**
   - Go to the [Google Cloud Console](https://console.cloud.google.com).
   - Go to **APIs & Services** -> **Credentials**.
   - Edit your Google OAuth Client.
   - Under **Authorized JavaScript origins**, add your Vercel URL: `https://smart-lms-123.vercel.app`
   - Under **Authorized redirect URIs**, add your Render callback URL: `https://smart-lms-api.onrender.com/api/auth/google/callback`
   - Click **Save**.

---

## 6. Verification Checklist

Go to your Vercel URL and check the following to ensure everything is perfect:

- [ ] Does the page load without errors?
- [ ] Try creating an account (Verifies Database and Gmail OTP Delivery).
- [ ] Try logging in with Google (Verifies Google OAuth setup).
- [ ] Go to settings and upload a Profile Image (Verifies Google Drive API & your new `getMediaUrl` fix).
- [ ] Open the Messages tab and send a chat (Verifies Upstash Redis & WebSockets).
