package com.example.smartlms.features.dashboard.data

import javax.inject.Inject

class DashboardRepository @Inject constructor(
    private val api: DashboardApi
) {
    suspend fun getMyCourses(): Result<List<CourseDto>> {
        return try {
            val response = api.getMyCourses()
            if (response.isSuccessful) {
                val body = response.body()
                if (body != null) {
                    Result.success(body.enrollments.map { it.course })
                } else {
                    Result.failure(Exception("Empty response body"))
                }
            } else {
                Result.failure(Exception("Error fetching courses: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
