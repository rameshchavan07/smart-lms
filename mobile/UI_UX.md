# UI & UX Design Guidelines (Student Learning App)

This document defines the user interface and experience guidelines for the Smart LMS Flutter mobile app, ensuring it feels modern, intuitive, and matches the premium experience of the web dashboard.

## 🎨 1. Design Language & Aesthetics

- **Style:** Modern, Clean, and "Glass-like".
- **Primary Color:** Vibrant Blue (`#2563EB`) - Used for primary actions, active tabs, and highlights.
- **Secondary Color:** Soft Blue (`#3B82F6`) - Used for gradients and secondary elements.
- **Background Color:** Off-white/Slate (`#F8FAFC`) - Used for app scaffold to make white cards pop.
- **Card Color:** Pure White (`#FFFFFF`) with subtle, very light shadows (elevation 0, with custom grey border).
- **Typography:** *Inter* or *Roboto* - Clean sans-serif fonts. Headings should be bold with slight negative tracking (letter-spacing: -0.5).

## 📱 2. Core User Flows

### A. Authentication Flow
- **Splash Screen:** Pure white with a centered, animated app icon (fade and scale).
- **Login Screen:** Clean form with rounded, lightly bordered inputs. The primary button should have a subtle scale-down animation on tap.
- **Feedback:** SnackBar or toast on invalid credentials; loading spinner replacing the button text during auth.

### B. Dashboard (Home)
- **Header:** Personalized greeting ("Welcome back, [Name]!") with a notification bell.
- **Progress Snapshot:** Two side-by-side metric cards (e.g., "Enrolled Courses", "Completed").
- **Recent Courses Carousel:** Horizontal scrolling list of recently accessed courses. Each card displays a thumbnail, course name, instructor, and a linear progress bar.

### C. Course Details & Learning
- **Tabbed Interface:** A sticky tab bar (Overview, Lectures, Materials).
- **Live Classes (Jitsi):** A prominent "Join Live Class" floating action button (FAB) or banner that appears when a class is currently active.
- **Recorded Lectures:** A vertical list of video tiles. Tapping opens a full-screen native video player.
- **Resources:** Downloadable PDFs and links. Tapping triggers a bottom sheet or directly downloads/opens the file using `url_launcher`.

## 💫 3. Micro-Animations & Interactions
We will use `flutter_animate` to bring the UI to life:
- **Screen Transitions:** Standard platform transitions (Slide from right on iOS, Zoom/Fade on Android).
- **List Items:** Staggered fade-in and slight slide-up (`slideY(0.2)`) when a list of courses or lectures loads.
- **Buttons:** Subtle haptic feedback and scale-down (`scale(0.95)`) when pressed.
- **Empty States:** Animated illustrations (e.g., Lottie files) for "No courses found" or "No upcoming live classes".

## ♿ 4. Accessibility
- **Contrast:** Ensure all text passes WCAG AA contrast ratios against backgrounds.
- **Touch Targets:** Minimum 48x48 logical pixels for all interactive elements (buttons, icons).
- **Dynamic Type:** Support OS-level font scaling without breaking the layout.
