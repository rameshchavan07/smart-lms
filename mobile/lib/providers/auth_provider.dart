import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../services/api_service.dart';
import 'package:dio/dio.dart';

class AuthProvider with ChangeNotifier {
  final ApiService _apiService;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  
  bool _isLoading = false;
  String? _error;
  bool _isAuthenticated = false;
  Map<String, dynamic>? _user;
  String? _instituteSlug;

  AuthProvider(this._apiService) {
    _checkAuthStatus();
  }

  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _isAuthenticated;
  Map<String, dynamic>? get user => _user;

  Future<void> _checkAuthStatus() async {
    final token = await _storage.read(key: 'auth_token');
    if (token != null) {
      // Optimistically set authenticated; a real app might ping /me to verify
      _isAuthenticated = true;
      notifyListeners();
    }
  }

  Future<bool> login(String instituteSlug, String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.client.post('/institutes/$instituteSlug/auth/login', data: {
        'email': email,
        'password': password,
      });

      if (response.statusCode == 200) {
        _user = response.data;
        _instituteSlug = instituteSlug;
        _isAuthenticated = true;
        _isLoading = false;
        notifyListeners();
        return true;
      }
    } on DioException catch (e) {
      _error = e.response?.data?['message'] ?? e.message ?? 'Login failed';
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<void> logout() async {
    await _storage.delete(key: 'auth_token');
    await _storage.delete(key: 'refresh_token');
    _isAuthenticated = false;
    _user = null;
    notifyListeners();
  }
}
