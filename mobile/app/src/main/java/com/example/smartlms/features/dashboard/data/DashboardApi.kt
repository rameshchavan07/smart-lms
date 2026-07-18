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

interface DashboardApi {
    @GET("enrollments/my-courses")
    suspend fun getMyCourses(): Response<EnrollmentsResponse>
}
