package com.example.smartlms.features.dashboard.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.smartlms.features.dashboard.data.CourseDto
import com.example.smartlms.features.dashboard.data.DashboardRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class DashboardState {
    object Loading : DashboardState()
    data class Success(val courses: List<CourseDto>) : DashboardState()
    data class Error(val message: String) : DashboardState()
}

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val repository: DashboardRepository
) : ViewModel() {

    private val _state = MutableStateFlow<DashboardState>(DashboardState.Loading)
    val state: StateFlow<DashboardState> = _state.asStateFlow()

    init {
        fetchDashboardData()
    }

    fun fetchDashboardData() {
        viewModelScope.launch {
            _state.value = DashboardState.Loading
            val result = repository.getMyCourses()
            if (result.isSuccess) {
                _state.value = DashboardState.Success(result.getOrDefault(emptyList()))
            } else {
                _state.value = DashboardState.Error(result.exceptionOrNull()?.message ?: "Unknown error")
            }
        }
    }
}
