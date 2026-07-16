# Application Architecture (Student Learning App)

This document outlines the architectural decisions and patterns used in the Smart LMS Flutter application.

## 🏗️ 1. Architectural Pattern
The application follows a **Feature-First (Modular) Architecture**. This ensures that all code related to a specific feature (like authentication or courses) is grouped together, rather than separating by technical layer (e.g., all models together).

```text
lib/
├── core/                  # App-wide shared code
│   ├── network/           # Dio client, interceptors
│   ├── routing/           # GoRouter configuration
│   ├── theme/             # AppTheme (colors, typography)
│   └── utils/             # Helper functions, constants
├── features/              # Feature modules
│   ├── auth/              # Login, Registration, Token logic
│   ├── dashboard/         # Main overview and stats
│   ├── courses/           # Course lists, Details, Jitsi integration
│   ├── assignments/       # Submissions and task tracking
│   └── settings/          # User profile and preferences
└── main.dart              # Entry point and ProviderScope
```

## 🧠 2. State Management
We use **Riverpod** (`flutter_riverpod`) for state management and dependency injection.
- **Providers:** Used for global dependencies like `Dio` or `FlutterSecureStorage`.
- **NotifierProviders / AsyncNotifierProviders:** Used for complex state (e.g., fetching a list of courses from the API).
- **ConsumerWidgets:** All UI widgets that need to read state extend `ConsumerWidget`.

## 🌐 3. Networking & API Integration
The app communicates with the Node.js backend using **Dio**.
- **Interceptors:** A custom interceptor automatically injects the HTTP-Only JWT Cookie (stored via `flutter_secure_storage`) into every request.
- **Error Handling:** Centralized error catching translates API errors into user-friendly UI messages (e.g., "Network Unreachable" or "Invalid Credentials").

## 🧭 4. Navigation
**GoRouter** is used for all routing.
- Supports deep-linking.
- Routes are defined declaratively in `lib/core/routing/app_router.dart`.
- Navigation uses path-based routing (e.g., `context.go('/course/123')`) to ensure proper stack management.

## 🎥 5. Video & Media Integrations
- **Live Classes:** Uses `jitsi_meet_wrapper` to embed native Jitsi Meet SDK for live classrooms.
- **Recorded Lectures:** Uses `video_player` / `chewie` for native video playback.
- **Document Downloads:** Uses `url_launcher` to open PDFs or external resources natively on the device.
