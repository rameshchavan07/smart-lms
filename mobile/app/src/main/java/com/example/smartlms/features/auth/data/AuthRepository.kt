package com.example.smartlms.features.auth.data

import kotlinx.coroutines.delay
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor() {
    
    // Simulating a network login call
    suspend fun login(email: String, password: String): Result<Unit> {
        delay(1000) // fake network delay
        return if (email.isNotEmpty() && password.isNotEmpty()) {
            Result.success(Unit)
        } else {
            Result.failure(Exception("Invalid credentials"))
        }
    }
}
