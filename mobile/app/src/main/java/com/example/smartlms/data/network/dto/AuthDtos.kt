package com.example.smartlms.data.network.dto

import kotlinx.serialization.Serializable

@Serializable
data class LoginRequest(
    val email: String,
    val password: String
)

@Serializable
data class RegisterRequest(
    val name: String,
    val email: String,
    val password: String,
    val role: String? = "STUDENT"
)

@Serializable
data class AuthResponse(
    val success: Boolean,
    val token: String? = null,
    val user: UserDto? = null,
    val message: String? = null
)

@Serializable
data class UserDto(
    val id: String,
    val name: String,
    val email: String,
    val role: String
)
