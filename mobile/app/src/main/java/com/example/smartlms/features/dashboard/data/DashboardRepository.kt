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

    suspend fun getStudentMetrics(): Result<StudentMetricsDto> {
        return try {
            val response = api.getStudentMetrics()
            if (response.isSuccessful) {
                val body = response.body()
                if (body != null) {
                    Result.success(body.metrics)
                } else {
                    Result.failure(Exception("Empty response body"))
                }
            } else {
                Result.failure(Exception("Error fetching metrics: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getMyTasks(): Result<List<TaskDto>> {
        return try {
            val response = api.getMyTasks()
            if (response.isSuccessful) {
                val body = response.body()
                if (body != null) {
                    Result.success(body.tasks)
                } else {
                    Result.failure(Exception("Empty response body"))
                }
            } else {
                Result.failure(Exception("Error fetching tasks: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getMyAnnouncements(): Result<List<AnnouncementDto>> {
        return try {
            val response = api.getMyAnnouncements()
            if (response.isSuccessful) {
                val body = response.body()
                if (body != null) {
                    Result.success(body.announcements)
                } else {
                    Result.failure(Exception("Empty response body"))
                }
            } else {
                Result.failure(Exception("Error fetching announcements: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun submitAssignment(taskId: String, file: okhttp3.MultipartBody.Part): Result<Unit> {
        return try {
            val response = api.submitAssignment(taskId, file)
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Error submitting assignment: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
