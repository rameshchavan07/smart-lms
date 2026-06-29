# Development Context

This document tracks the recent development progress, decisions, bugs fixed, and next steps for the Smart LMS project to ensure seamless continuity in future sessions.

## 🚀 Features Completed
1. **Custom Automatic Lecture Recording Module**
   - Built a completely custom, native screen recorder that bypasses Jitsi's premium restrictions.
   - **Frontend**: Created `useScreenRecorder.ts` utilizing `navigator.mediaDevices.getDisplayMedia` (for screen and system audio), `getUserMedia` (for microphone), and `AudioContext` (to mix the streams). Used `MediaRecorder` to capture the output as `.webm`.
   - **UI**: Added `LectureRecorderUI.tsx`, a floating widget for Teachers in the `LiveClassRoom` to control recording (Start/Pause/Resume/Stop) with a live timer and upload progress bar.
   - **Backend**: Enhanced `lectureController.ts` (`uploadLectureRecording`) to capture `recordingDuration` and `recordingSize` from the multipart form data, saving it alongside the Google Drive `webViewLink`.
   - **Database**: Updated `schema.prisma` `Lecture` model to include `recordingDuration` and `recordingSize`.
2. **Google Drive Video Playback**
   - Replaced standard `ReactPlayer` with a smart iframe player in `LectureRecordingPlayer.tsx` for Google Drive links. 
   - Converted standard `/view` links to `/preview` automatically so students can stream Google Drive recordings natively without "Access Denied" or download prompts.

## 🚧 Features in Progress
- **Sprint 3: End-to-End Testing & Deployment Preparation**: The implementation plan is drafted and awaiting final execution.

## 🐛 Bugs Fixed
- **Google Drive Playback Failure**: `ReactPlayer` couldn't play Google Drive links. Fixed by using a native iframe for `drive.google.com` URLs.
- **Jitsi JaaS Premium Recording Lock**: Jitsi JaaS (8x8.vc) aggressively blocked local recordings in favor of their paid cloud tier. Bypassed entirely by building our own WebRTC screen recorder embedded in the frontend.
- **Google OAuth Callback Obfuscation**: Added explicit `console.error` logging to `googleCallback` in `authController.ts` so OAuth failures are visible in server logs instead of silently redirecting to the login page.
- **Prisma Windows Lock Issue**: Fixed `EPERM` issues during `npx prisma generate` by properly killing rogue Node processes holding the `query_engine` dll open.

## 📋 Pending Issues
- **Backend Memory/Socket Disconnects**: Nodemon occasionally exits with code 1 during intense websocket/API usage (noted during the recording uploads). Keep an eye on server stability and potentially switch from `ts-node` to built JS in production.

## 📝 Remaining Tasks
1. Execute the **E2E Testing Suite** (Sprint 3) using `jest` and `supertest` to simulate the full Admin -> Teacher -> Student -> Grading flow.
2. Build the **Deployment Configurations** (`Dockerfile` for backend, `vercel.json` for frontend).

## 🧠 Technical Decisions Made
- **Storage Strategy**: Decided to stick with **Google Drive** for video storage instead of migrating to Google Cloud Storage (GCS). This reuses our existing, robust 5TB OAuth integration and saved immense development time.
- **Recording Architecture**: Handled recording natively via the browser (`MediaRecorder`) rather than relying on heavy backend cloud recording infrastructure (like Jibri). The video file is processed on the client and uploaded in chunks/blob upon completion.

## 💡 Important Notes and Context
- **Google Drive Folder Structure**: The backend automatically manages the folder structure (`courses/lectures/recordings`) in the authenticated Google Drive account and sets public `reader` permissions on uploaded videos.
- **Role-Based Access**: The recording UI is strictly locked to the `TEACHER` role. Students only see the playback interface.
