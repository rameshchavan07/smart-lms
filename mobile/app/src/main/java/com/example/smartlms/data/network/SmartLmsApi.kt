package com.example.smartlms.data.network

import com.example.smartlms.data.network.dto.AuthResponse
import com.example.smartlms.data.network.dto.LoginRequest
import com.example.smartlms.data.network.dto.RegisterRequest
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST
import retrofit2.http.Path

interface SmartLmsApi {

    @POST("institutes/{instituteCode}/auth/login")
    suspend fun login(
        @Path("instituteCode") instituteCode: String,
        @Body request: LoginRequest
    ): Response<AuthResponse>

    @POST("institutes/{instituteCode}/auth/register")
    suspend fun register(
        @Path("instituteCode") instituteCode: String,
        @Body request: RegisterRequest
    ): Response<AuthResponse>
}
