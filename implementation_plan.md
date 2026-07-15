# Flutter App Development Roadmap (Staged Plan)

Since the Node.js backend is already built and fully functional, the mobile app development becomes a pure frontend integration task. This detailed roadmap breaks down the development of the Flutter app into manageable, sequential stages (sprints).

## User Review Required

> [!IMPORTANT]
> This is a comprehensive roadmap to build the entire student application from scratch. We will execute these stages one by one. Once you approve this roadmap, we will begin executing **Stage 1: Foundation & Scaffold**. 

---

## 🛠️ Stage 1: Foundation & Scaffold (The Setup)
**Goal:** Initialize the project, configure the architecture, and ensure the app can run on your emulator/device.

1. **Project Initialization:**
   - Run `flutter create mobile_app`.
   - Configure native project names, bundle identifiers (e.g., `com.smartlms.app`), and icons.
2. **Architecture & Folder Structure:**
   - Create directories for `screens/`, `widgets/`, `services/`, `models/`, and `providers/`.
3. **Core Dependencies:**
   - Install `dio` (Networking), `provider` (State Management), `go_router` (Navigation), and `flutter_secure_storage` (Token management).
4. **Theme Configuration:**
   - Implement Material 3 design tokens. Set up a global `AppTheme` that matches the web platform's styling.

---

## 🔐 Stage 2: Authentication & Networking Layer
**Goal:** Connect the app to the Node.js backend and establish a secure login session.

1. **API Client (`api_service.dart`):**
   - Configure a Dio client pointing to the backend (`http://10.0.2.2:5000/api` for the Android emulator).
   - Create a global error handler for timeouts and 401 Unauthorized responses.
2. **Auth Provider (`auth_provider.dart`):**
   - Create the state logic for logging in, storing the JWT token, and logging out.
3. **Login Screen (`login_screen.dart`):**
   - Build the UI: Logo, Institute Slug input, Email, Password, and a Login button.
   - Wire it up to the Auth Provider. On success, route to the Dashboard.

---

## 📊 Stage 3: The Student Dashboard
**Goal:** Give the student a home screen displaying their progress and enrolled courses.

1. **Data Models:**
   - Create Dart models (`User.dart`, `Course.dart`) matching the backend Prisma schema.
2. **Dashboard Provider:**
   - Fetch the student's profile (XP, streak) and their active enrollments from the backend.
3. **Dashboard UI (`dashboard_screen.dart`):**
   - **Header:** Welcome message + User Avatar.
   - **Stats Cards:** Display current XP points and Learning Streak.
   - **Course List:** A horizontal or vertical list of `CourseCard` widgets showing enrolled courses, thumbnails, and progress bars.

---

## 📚 Stage 4: Course Details & Materials
**Goal:** Allow students to view the syllabus and access study materials for a specific course.

1. **Course Provider:**
   - Fetch detailed course information, including the list of `Lectures`, `StudyMaterials`, and `Assignments`.
2. **Course Screen (`course_details_screen.dart`):**
   - **Tabs:** Implement a `TabBar` to switch between "Overview", "Lectures", and "Materials".
3. **Materials Integration:**
   - Build a list view for study materials. Allow tapping to open Google Drive links directly in the mobile browser.

---

## 📹 Stage 5: Live Video Classroom
**Goal:** Enable native mobile video conferencing for live lectures.

1. **Jitsi Meet Plugin Setup:**
   - Install `jitsi_meet_wrapper`.
   - Configure `AndroidManifest.xml` (Camera, Audio, Internet permissions) and iOS `Info.plist`.
2. **Classroom UI Logic:**
   - In the "Lectures" tab of the course screen, identify which lecture is currently live.
   - Show a prominent "Join Live Class" button.
3. **Video Invocation:**
   - When clicked, extract the `meetingUrl` from the lecture object.
   - Initialize Jitsi with the student's name and email, and launch the native video conferencing room within the app.

---

## 🚀 Stage 6: Polish & Deployment Prep
**Goal:** Finalize the app for real-world usage.

1. **Offline Handling:** Add "No Internet" screens and graceful degradation.
2. **Push Notifications:** (Optional) Integrate Firebase Cloud Messaging (FCM) to receive alerts when a class goes live.
3. **App Icon & Splash Screen:** Use `flutter_launcher_icons` and `flutter_native_splash` to finalize branding.
4. **Release Builds:** Generate the Android `.apk` / `.aab` for testing on physical devices.
