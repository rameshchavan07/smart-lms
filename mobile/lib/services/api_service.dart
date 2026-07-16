import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:connectivity_plus/connectivity_plus.dart';

class ApiService {
  final Dio _dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  
  // Use 10.0.2.2 for Android emulator to access local host
  static const String baseUrl = 'http://10.0.2.2:5000/api';

  ApiService() : _dio = Dio(BaseOptions(
    baseUrl: baseUrl,
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
  )) {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final connectivityResult = await Connectivity().checkConnectivity();
          if (connectivityResult.contains(ConnectivityResult.none)) {
            return handler.reject(
              DioException(
                requestOptions: options,
                error: 'No Internet Connection',
                type: DioExceptionType.connectionError,
              ),
            );
          }

          // Add cookies if exist
          final token = await _storage.read(key: 'auth_token');
          final refreshToken = await _storage.read(key: 'refresh_token');
          
          List<String> cookies = [];
          if (token != null) cookies.add('token=$token');
          if (refreshToken != null) cookies.add('refreshToken=$refreshToken');
          
          if (cookies.isNotEmpty) {
            options.headers['cookie'] = cookies.join('; ');
          }
          return handler.next(options);
        },
        onResponse: (response, handler) async {
          // Extract cookies from set-cookie header
          var setCookie = response.headers['set-cookie'];
          if (setCookie != null) {
            for (var cookieStr in setCookie) {
              if (cookieStr.startsWith('token=')) {
                final tokenValue = cookieStr.split(';')[0].substring(6);
                await _storage.write(key: 'auth_token', value: tokenValue);
              } else if (cookieStr.startsWith('refreshToken=')) {
                final tokenValue = cookieStr.split(';')[0].substring(13);
                await _storage.write(key: 'refresh_token', value: tokenValue);
              }
            }
          }
          return handler.next(response);
        },
        onError: (DioException e, handler) async {
          if (e.response?.statusCode == 401) {
            // Unauthorized, clear tokens
            await _storage.delete(key: 'auth_token');
            await _storage.delete(key: 'refresh_token');
          }
          return handler.next(e);
        },
      ),
    );
  }

  Dio get client => _dio;
}
