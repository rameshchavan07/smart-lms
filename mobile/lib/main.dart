import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'app_theme.dart';
import 'services/api_service.dart';
import 'providers/auth_provider.dart';
import 'providers/dashboard_provider.dart';
import 'providers/course_provider.dart';
import 'models/course.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/course_details_screen.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        Provider<ApiService>(create: (_) => ApiService()),
        ChangeNotifierProxyProvider<ApiService, AuthProvider>(
          create: (context) => AuthProvider(context.read<ApiService>()),
          update: (context, api, previous) => previous ?? AuthProvider(api),
        ),
        ChangeNotifierProxyProvider<ApiService, DashboardProvider>(
          create: (context) => DashboardProvider(context.read<ApiService>()),
          update: (context, api, previous) => previous ?? DashboardProvider(api),
        ),
        ChangeNotifierProxyProvider<ApiService, CourseProvider>(
          create: (context) => CourseProvider(context.read<ApiService>()),
          update: (context, api, previous) => previous ?? CourseProvider(api),
        ),
      ],
      child: const SmartLmsApp(),
    ),
  );
}

class SmartLmsApp extends StatelessWidget {
  const SmartLmsApp({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();

    final GoRouter router = GoRouter(
      initialLocation: '/login',
      redirect: (context, state) {
        final isLoggedIn = authProvider.isAuthenticated;
        final isLoggingIn = state.matchedLocation == '/login';

        if (!isLoggedIn && !isLoggingIn) return '/login';
        if (isLoggedIn && isLoggingIn) return '/dashboard';
        return null;
      },
      routes: <RouteBase>[
        GoRoute(
          path: '/login',
          builder: (context, state) => const LoginScreen(),
        ),
        GoRoute(
          path: '/dashboard',
          builder: (context, state) => const DashboardScreen(),
        ),
        GoRoute(
          path: '/course',
          builder: (context, state) {
            final course = state.extra as Course;
            return CourseDetailsScreen(course: course);
          },
        ),
      ],
    );

    return MaterialApp.router(
      title: 'Smart LMS',
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
    );
  }
}
