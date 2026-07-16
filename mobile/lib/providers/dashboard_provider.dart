import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/course.dart';

class DashboardProvider with ChangeNotifier {
  final ApiService _apiService;
  
  bool _isLoading = true;
  String? _error;
  
  int _xpPoints = 0;
  int _currentStreak = 0;
  List<Course> _enrolledCourses = [];

  DashboardProvider(this._apiService) {
    fetchDashboardData();
  }

  bool get isLoading => _isLoading;
  String? get error => _error;
  int get xpPoints => _xpPoints;
  int get currentStreak => _currentStreak;
  List<Course> get enrolledCourses => _enrolledCourses;

  Future<void> fetchDashboardData() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      // Fetch stats
      final statsResponse = await _apiService.client.get('/analytics/student');
      if (statsResponse.statusCode == 200) {
        final metrics = statsResponse.data['metrics'];
        _xpPoints = metrics['xpPoints'] ?? 0;
        _currentStreak = metrics['currentStreak'] ?? 0;
      }

      // Fetch enrolled courses
      final coursesResponse = await _apiService.client.get('/enrollments/my-courses');
      if (coursesResponse.statusCode == 200) {
        final List<dynamic> enrollments = coursesResponse.data['enrollments'] ?? [];
        _enrolledCourses = enrollments.map((e) => Course.fromJson(e)).toList();
      }

    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }
}
