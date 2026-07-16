import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/course.dart';

class CourseProvider with ChangeNotifier {
  final ApiService _apiService;
  
  bool _isLoading = false;
  String? _error;
  
  List<Lecture> _lectures = [];
  List<StudyMaterial> _materials = [];

  CourseProvider(this._apiService);

  bool get isLoading => _isLoading;
  String? get error => _error;
  List<Lecture> get lectures => _lectures;
  List<StudyMaterial> get materials => _materials;

  Future<void> fetchCourseDetails(String courseId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      // Fetch lectures
      final lecturesResponse = await _apiService.client.get('/lectures/course/$courseId');
      if (lecturesResponse.statusCode == 200) {
        final List<dynamic> lecturesData = lecturesResponse.data['lectures'] ?? [];
        _lectures = lecturesData.map((e) => Lecture.fromJson(e)).toList();
      }

      // Fetch materials
      final materialsResponse = await _apiService.client.get('/study-materials/course/$courseId');
      if (materialsResponse.statusCode == 200) {
        final dynamic data = materialsResponse.data;
        List<dynamic> materialsData = [];
        if (data is List) {
          materialsData = data;
        } else if (data is Map && data.containsKey('materials')) {
          materialsData = data['materials'];
        }
        _materials = materialsData.map((e) => StudyMaterial.fromJson(e)).toList();
      }
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }
}
