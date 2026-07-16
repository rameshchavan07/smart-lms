# Detailed Implementation Roadmap (Student Learning App)

This roadmap outlines the production-ready software development process to build the Smart LMS Flutter application. We will strictly follow these phases sequentially, ensuring each phase passes its testing criteria before moving to the next.

## 🚀 Phase 1: Foundation & Core Infrastructure
**Objective:** Scaffold the Flutter project, establish the core architecture, and configure the base routing and API communication layers.

### Tasks
- [ ] Initialize Flutter Android project and clean default code.
- [ ] Install core dependencies (`flutter_riverpod`, `go_router`, `dio`, `flutter_secure_storage`).
- [ ] Create Feature-First folder architecture.
- [ ] Implement `AppTheme` with custom typography and colors.
- [ ] Configure `ApiClient` with Dio and interceptors for JWT cookies.
- [ ] Set up basic `GoRouter` configuration.

**Expected Functionality:** The app boots to a blank screen or basic mockup, seamlessly applying the global theme and successfully initializing the Riverpod scope and routing engine.
**Testing Criteria:** 
- App compiles successfully for Android.
- API client can inject a dummy cookie into request headers.
- Router can navigate between two test screens.
**Deliverables:** Base project structure, `app_theme.dart`, `api_client.dart`, `app_router.dart`.
**Acceptance Criteria:** Code compiles with zero errors or warnings; architecture strictly follows the Feature-First pattern.

---

## 🔐 Phase 2: Authentication Flow
**Objective:** Implement secure login and user session management.

### Tasks
- [ ] Create `AuthRepository` to map to backend `/auth/login` and `/auth/me`.
- [ ] Create `AuthNotifier` (Riverpod) to handle loading, success, and error states.
- [ ] Build `LoginScreen` UI with animated inputs and validation.
- [ ] Configure router redirection (redirect to login if unauthenticated).

**Expected Functionality:** Users can input credentials, view loading states, and upon success, are redirected to the Dashboard. Invalid credentials yield a user-friendly error.
**Testing Criteria:** 
- Form validation prevents empty submissions.
- Invalid login displays a SnackBar error.
- Valid login successfully stores the JWT cookie locally and redirects to `/`.
- App maintains session upon restart.
**Deliverables:** `LoginScreen`, `AuthRepository`, `AuthNotifier`.
**Acceptance Criteria:** End-to-end authentication works against the real Node.js backend.

---

## 📊 Phase 3: Dashboard & Progress Tracking
**Objective:** Build the student home screen, displaying a personalized overview and progress tracking.

### Tasks
- [ ] Create `DashboardRepository` connecting to `/analytics/student/performance`.
- [ ] Build `DashboardScreen` UI (Welcome header, Progress Stats Cards).
- [ ] Build "Recent Courses" horizontal carousel.
- [ ] Implement `flutter_animate` micro-animations on load.

**Expected Functionality:** The student sees an animated dashboard displaying their exact progress metrics and recently accessed courses pulled directly from the API.
**Testing Criteria:**
- Animations fire only once upon screen load.
- Metrics accurately reflect backend analytics data.
- Tapping a recent course navigates to the Course Details route.
**Deliverables:** `DashboardScreen`, `DashboardRepository`.
**Acceptance Criteria:** UI matches the web dashboard's features with smooth performance (60fps on emulator).

---

## 📚 Phase 4: Course Hub & Materials
**Objective:** Enable students to browse their courses, view details, watch recorded lectures, and access materials.

### Tasks
- [ ] Create `CourseRepository` connecting to `/courses/my-courses` and `/lectures/course/:id`.
- [ ] Build `CourseListScreen` UI.
- [ ] Build `CourseDetailsScreen` with a sticky tab bar (Overview, Lectures, Materials).
- [ ] Integrate native video player for recorded lectures.
- [ ] Integrate `url_launcher` for downloading/opening study materials (PDFs).

**Expected Functionality:** Students can browse enrolled courses. Tapping a course reveals its curriculum. Students can watch past recordings directly in the app and open attached documents.
**Testing Criteria:**
- Video player buffers and plays cleanly without crashing.
- Material links successfully trigger the native OS browser/PDF viewer.
- Tab bar maintains state when switching between tabs.
**Deliverables:** `CourseListScreen`, `CourseDetailsScreen`, Video Player Integration.
**Acceptance Criteria:** Full feature parity with the web's "My Courses" and "Lectures" tabs.

---

## 🎥 Phase 5: Live Video Classrooms
**Objective:** Enable students to join live, interactive video classes seamlessly.

### Tasks
- [ ] Implement `jitsi_meet_wrapper` in the project.
- [ ] Configure Android Native Permissions (Camera, Microphone) in `AndroidManifest.xml`.
- [ ] Build the "Join Live Class" floating button in `CourseDetailsScreen`.
- [ ] Pass the student's name, email, and room ID into the Jitsi options.

**Expected Functionality:** If a class is live, the student taps "Join" and is instantly dropped into a native video conferencing UI with their mic and camera controls.
**Testing Criteria:**
- App requests camera/mic permissions properly.
- Jitsi launches in a new native activity overlay.
- Hanging up the call returns the user gracefully to the Course Details screen.
**Deliverables:** Jitsi Integration, Native permission configs.
**Acceptance Criteria:** Successful, stable multi-party video call initialization from the app.

---

> [!IMPORTANT]
> Please review this phased roadmap. If you approve of the deliverables, testing criteria, and flow, click **Proceed** and I will immediately begin executing **Phase 1**!
