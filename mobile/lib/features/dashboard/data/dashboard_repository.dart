import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/network/api_client.dart';

final dashboardRepositoryProvider = Provider<DashboardRepository>((ref) {
  return DashboardRepository(ref.watch(dioProvider));
});

// Provides raw dashboard state
final dashboardDataProvider = FutureProvider<DashboardData>((ref) async {
  final repository = ref.watch(dashboardRepositoryProvider);
  return repository.fetchDashboardData();
});

class DashboardData {
  final Map<String, dynamic> metrics;
  final List<dynamic> recentCourses;
  final List<dynamic> performance;

  DashboardData({
    required this.metrics,
    required this.recentCourses,
    required this.performance,
  });
}

class DashboardRepository {
  final Dio _dio;

  DashboardRepository(this._dio);

  Future<DashboardData> fetchDashboardData() async {
    try {
      final metricsFuture = _dio.get('/analytics/student');
      final coursesFuture = _dio.get('/enrollments/my-courses?limit=4');
      final performanceFuture = _dio.get('/analytics/student/performance');

      final responses = await Future.wait([
        metricsFuture,
        coursesFuture,
        performanceFuture,
      ]);

      return DashboardData(
        metrics: responses[0].data['metrics'] ?? {},
        recentCourses: responses[1].data['enrollments'] ?? [],
        performance: responses[2].data['data'] ?? [],
      );
    } catch (e) {
      throw Exception('Failed to load dashboard data: $e');
    }
  }
}
