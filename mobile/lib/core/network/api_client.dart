import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'dart:io';

// Provide Secure Storage
final secureStorageProvider = Provider((ref) => const FlutterSecureStorage());

// Provide Dio Client
final dioProvider = Provider<Dio>((ref) {
  final storage = ref.watch(secureStorageProvider);
  
  final dio = Dio(
    BaseOptions(
      baseUrl: 'http://10.0.2.2:5000/api', // Emulator localhost
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {
        'Content-Type': 'application/json',
      },
    ),
  );

  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) async {
        // Read auth cookie and attach it
        final cookie = await storage.read(key: 'auth_cookie');
        if (cookie != null) {
          options.headers['cookie'] = cookie;
        }
        return handler.next(options);
      },
      onResponse: (response, handler) async {
        // Save auth cookie if present
        final setCookie = response.headers['set-cookie'];
        if (setCookie != null && setCookie.isNotEmpty) {
          final cookieString = setCookie.first.split(';').first;
          await storage.write(key: 'auth_cookie', value: cookieString);
        }
        return handler.next(response);
      },
      onError: (DioException e, handler) {
        // Global error handling could go here
        return handler.next(e);
      }
    ),
  );

  return dio;
});
