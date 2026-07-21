package com.example.smartlms.features.dashboard.data

import kotlinx.serialization.Serializable
import retrofit2.Response
import retrofit2.http.GET

@Serializable
data class CourseDto(
    val id: String,
    val title: String,
    val description: String? = null,
    val thumbnailUrl: String? = null,
    val teacher: TeacherDto? = null,
    val _count: CourseCountDto? = null
)

@Serializable
data class TeacherDto(
    val user: TeacherUserDto? = null
)

@Serializable
data class TeacherUserDto(
    val firstName: String,
    val lastName: String
)

@Serializable
data class CourseCountDto(
    val lectures: Int? = 0
)

@Serializable
data class EnrollmentDto(
    val course: CourseDto
)

@Serializable
data class EnrollmentsResponse(
    val enrollments: List<EnrollmentDto>
)

@Serializable
data class StudentMetricsDto(
    val totalEnrollments: Int,
    val totalCompleted: Int,
    val quizAverage: Double? = null,
    val badgesEarned: Int,
    val overallProgress: Double? = null,
    val xpPoints: Int? = null,
    val currentStreak: Int? = null
)

@Serializable
data class StudentMetricsResponse(
    val metrics: StudentMetricsDto
)

@Serializable
data class TaskDto(
    val id: String,
    val title: String,
    val courseTitle: String,
    val dueDate: String,
    val priority: String,
    val completed: Boolean
)

@Serializable
data class TasksResponse(
    val tasks: List<TaskDto>
)

@Serializable
data class AnnouncementDto(
    val id: String,
    val title: String,
    val message: String? = null,
    val createdAt: String,
    val isNew: Boolean? = null
)

@Serializable
data class AnnouncementsResponse(
    val announcements: List<AnnouncementDto>
)

interface DashboardApi {
    @GET("enrollments/my-courses")
    suspend fun getMyCourses(): Response<EnrollmentsResponse>

    @GET("analytics/student")
    suspend fun getStudentMetrics(): Response<StudentMetricsResponse>

    @GET("assignments/my-tasks")
    suspend fun getMyTasks(): Response<TasksResponse>

    @GET("communications/my-announcements")
    suspend fun getMyAnnouncements(): Response<AnnouncementsResponse>

    @retrofit2.http.Multipart
    @retrofit2.http.POST("assignments/{id}/submit")
    suspend fun submitAssignment(
        @retrofit2.http.Path("id") id: String,
        @retrofit2.http.Part file: okhttp3.MultipartBody.Part
    ): Response<Unit>
}
