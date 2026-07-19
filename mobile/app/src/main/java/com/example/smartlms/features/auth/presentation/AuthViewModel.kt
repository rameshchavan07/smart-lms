package com.example.smartlms.features.auth.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.smartlms.data.local.TokenManager
import com.example.smartlms.data.network.SmartLmsApi
import com.example.smartlms.data.network.dto.LoginRequest
import com.example.smartlms.data.network.dto.RegisterRequest
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class AuthState {
    object Idle : AuthState()
    object Loading : AuthState()
    object Success : AuthState()
    data class Error(val message: String) : AuthState()
}

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val api: SmartLmsApi,
    private val tokenManager: TokenManager
) : ViewModel() {

    private val _authState = MutableStateFlow<AuthState>(AuthState.Idle)
    val authState: StateFlow<AuthState> = _authState.asStateFlow()

    fun login(instituteCode: String, request: LoginRequest) {
        viewModelScope.launch {
            _authState.value = AuthState.Loading
            try {
                val response = api.login(instituteCode, request)
                if (response.isSuccessful && response.body() != null) {
                    val authResponse = response.body()!!
                    if (authResponse.success && authResponse.token != null && authResponse.user != null) {
                        tokenManager.saveToken(authResponse.token, authResponse.user.role, instituteCode, authResponse.user.id)
                        _authState.value = AuthState.Success
                    } else {
                        _authState.value = AuthState.Error(authResponse.message ?: "Login failed")
                    }
                } else {
                    _authState.value = AuthState.Error("HTTP Error: ${response.code()}")
                }
            } catch (e: Exception) {
                _authState.value = AuthState.Error(e.localizedMessage ?: "Unknown error occurred")
            }
        }
    }



    fun googleLogin(instituteCode: String, idToken: String) {
        viewModelScope.launch {
            _authState.value = AuthState.Loading
            try {
                val request = com.example.smartlms.data.network.dto.GoogleLoginRequest(idToken, instituteCode)
                val response = api.googleLogin(request)
                if (response.isSuccessful && response.body() != null) {
                    val authResponse = response.body()!!
                    if (authResponse.success && authResponse.token != null && authResponse.user != null) {
                        tokenManager.saveToken(authResponse.token, authResponse.user.role, instituteCode, authResponse.user.id)
                        _authState.value = AuthState.Success
                    } else {
                        _authState.value = AuthState.Error(authResponse.message ?: "Google Login failed")
                    }
                } else {
                    _authState.value = AuthState.Error("HTTP Error: ${response.code()}")
                }
            } catch (e: Exception) {
                _authState.value = AuthState.Error(e.localizedMessage ?: "Unknown error occurred")
            }
        }
    }

    fun resetState() {
        _authState.value = AuthState.Idle
    }
}
