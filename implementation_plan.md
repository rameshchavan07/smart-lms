# Smart LMS Android App Development Plan

This document outlines the end-to-end plan for developing the Android client for the Smart LMS platform, connecting the existing Compose UI skeleton to the backend REST API and WebSocket services.

## User Review Required

> [!IMPORTANT]
> This is a comprehensive plan covering multiple phases of development. Please review the proposed architecture, dependencies to be added, and the phased approach. 

## Open Questions

> [!WARNING]
> 1. **Live Classes**: Do you have a preferred SDK (e.g. Jitsi Meet SDK for Android), or should we use a standard WebRTC wrapper/WebView approach?
> 2. **Dependency Additions**: We will need to add a few more libraries to `libs.versions.toml` (e.g., DataStore for token management, Socket.IO client for chat). Are you okay with adding these?
> 3. **Institute Handling**: How does an Android user specify their institute? Is it via a subdomain-like entry on login (e.g., entering an institute code), or is it handled behind the scenes via a user's invite link?

## Proposed Changes

### Phase 1: Core Architecture & Authentication Networking
We will establish the networking layer and connect the existing Login/Register screens.

#### [MODIFY] `mobile/gradle/libs.versions.toml`
- Add dependencies for Android DataStore (Preferences) to store JWT tokens securely.

#### [NEW] `mobile/app/src/main/java/com/example/smartlms/data/network/`
- `SmartLmsApi.kt`: Retrofit interface defining REST endpoints for `/auth/login`, `/auth/register`, etc.
- `NetworkModule.kt`: Hilt module providing OkHttpClient, Retrofit, and interceptors (for adding JWT tokens to requests).

#### [NEW] `mobile/app/src/main/java/com/example/smartlms/data/local/`
- `TokenManager.kt`: DataStore implementation for saving and retrieving the JWT access token and user role.

#### [MODIFY] `mobile/app/src/main/java/com/example/smartlms/features/auth/`
- Add `AuthViewModel.kt` utilizing Hilt to interact with `SmartLmsApi` and `TokenManager`.
- Update `LoginScreen.kt` and `RegisterScreen.kt` to observe state from `AuthViewModel` and trigger network requests.

#### [MODIFY] `mobile/app/src/main/java/com/example/smartlms/Navigation.kt`
- Introduce a splash screen or initial load state to check for an existing token and navigate either to Login or Dashboard automatically.

---

### Phase 2: Student Dashboard & Course Management
Fetching and displaying real data on the dashboard based on the logged-in user.

#### [NEW] `mobile/app/src/main/java/com/example/smartlms/features/dashboard/data/`
- `DashboardApi.kt`: Retrofit interface for fetching enrolled courses, upcoming classes, and assignments.
- `DashboardRepository.kt`: Repository pattern for mapping network DTOs to UI models.

#### [MODIFY] `mobile/app/src/main/java/com/example/smartlms/features/dashboard/presentation/`
- `DashboardViewModel.kt`: Fetches data and provides it to the UI.
- Update `StudentDashboardScreen.kt` and `MainDashboardShell.kt` to consume real data and handle Loading/Error/Success states.

---

### Phase 3: Live Classes (WebRTC / Jitsi)
Integrating the virtual classroom experience.

#### [NEW] `mobile/app/src/main/java/com/example/smartlms/features/classroom/`
- Implementation of the Jitsi Meet Android SDK for joining live classrooms.
- `ClassroomScreen.kt`: The Compose wrapper for the Jitsi view or custom WebRTC renderer.

---

### Phase 4: Real-Time Features (Socket.IO)
Adding real-time chat and notifications.

#### [MODIFY] `mobile/gradle/libs.versions.toml`
- Add Socket.IO Android Client dependency.

#### [NEW] `mobile/app/src/main/java/com/example/smartlms/data/socket/`
- `SocketManager.kt`: Manages the WebSocket connection lifecycle, handling reconnections and emitting/listening to events.

#### [NEW] `mobile/app/src/main/java/com/example/smartlms/features/chat/`
- `ChatScreen.kt` & `ChatViewModel.kt`: Real-time chat interface connected to `SocketManager`.

## Verification Plan

### Automated Tests
- Add Unit Tests for ViewModels using `kotlinx-coroutines-test`.
- Run UI Tests for navigation using `androidx-compose-ui-test`.

### Manual Verification
1. Launch the backend API locally.
2. Build and run the Android app on an emulator.
3. Perform a manual registration, verify the database entry.
4. Perform a login, verify the JWT is stored.
5. Restart the app, verify it bypasses login and goes straight to the Dashboard.
