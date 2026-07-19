package com.example.smartlms.features.dashboard.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.smartlms.features.dashboard.data.CourseDto
import com.example.smartlms.features.dashboard.data.DashboardRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.async
import kotlinx.coroutines.launch
import javax.inject.Inject
import com.example.smartlms.features.dashboard.data.StudentMetricsDto
import com.example.smartlms.features.dashboard.data.TaskDto
import com.example.smartlms.features.dashboard.data.AnnouncementDto

sealed class DashboardState {
    object Loading : DashboardState()
    data class Success(
        val courses: List<CourseDto>,
        val metrics: StudentMetricsDto? = null,
        val tasks: List<TaskDto> = emptyList(),
        val announcements: List<AnnouncementDto> = emptyList(),
        val instituteCode: String? = null
    ) : DashboardState()
    data class Error(val message: String) : DashboardState()
}

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val repository: DashboardRepository,
    private val tokenManager: com.example.smartlms.data.local.TokenManager
) : ViewModel() {

    private val _state = MutableStateFlow<DashboardState>(DashboardState.Loading)
    val state: StateFlow<DashboardState> = _state.asStateFlow()

    init {
        fetchDashboardData()
    }

    fun fetchDashboardData() {
        viewModelScope.launch {
            _state.value = DashboardState.Loading
            
            val coursesDeferred = async { repository.getMyCourses() }
            val metricsDeferred = async { repository.getStudentMetrics() }
            val tasksDeferred = async { repository.getMyTasks() }
            val announcementsDeferred = async { repository.getMyAnnouncements() }
            val instituteCode = tokenManager.instituteCodeFlow.firstOrNull()

            val coursesResult = coursesDeferred.await()
            val metricsResult = metricsDeferred.await()
            val tasksResult = tasksDeferred.await()
            val announcementsResult = announcementsDeferred.await()

            if (coursesResult.isSuccess) {
                _state.value = DashboardState.Success(
                    courses = coursesResult.getOrDefault(emptyList()),
                    metrics = metricsResult.getOrNull(),
                    tasks = tasksResult.getOrDefault(emptyList()),
                    announcements = announcementsResult.getOrDefault(emptyList()),
                    instituteCode = instituteCode
                )
            } else {
                _state.value = DashboardState.Error(coursesResult.exceptionOrNull()?.message ?: "Unknown error")
            }
        }
    }
}
