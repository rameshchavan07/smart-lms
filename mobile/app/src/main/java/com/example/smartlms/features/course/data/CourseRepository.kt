package com.example.smartlms.features.course.data

import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CourseRepository @Inject constructor(
    private val api: CourseApi
) {
    suspend fun getCourseDetails(courseId: String): Result<CourseDetailDto> {
        return try {
            val response = api.getCourseById(courseId)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.course)
            } else {
                Result.failure(Exception("Failed to fetch course details: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getLectureDetails(lectureId: String): Result<LectureDto> {
        return try {
            val response = api.getLectureById(lectureId)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.lecture)
            } else {
                Result.failure(Exception("Failed to fetch lecture details: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getLectures(courseId: String): Result<List<LectureDto>> {
        return try {
            val response = api.getLecturesByCourse(courseId)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.lectures)
            } else {
                Result.failure(Exception("Failed to fetch lectures: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getStudyMaterials(courseId: String): Result<List<StudyMaterialDto>> {
        return try {
            val response = api.getStudyMaterialsByCourse(courseId)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.materials)
            } else {
                Result.failure(Exception("Failed to fetch study materials: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
