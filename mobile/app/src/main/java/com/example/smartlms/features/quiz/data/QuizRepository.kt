package com.example.smartlms.features.quiz.data

import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class QuizRepository @Inject constructor(
    private val api: QuizApi
) {
    suspend fun getCourseQuizzes(courseId: String): Result<List<QuizDto>> {
        return try {
            val response = api.getCourseQuizzes(courseId)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.quizzes)
            } else {
                Result.failure(Exception("Failed to fetch quizzes: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getQuizDetails(quizId: String): Result<QuizDetailDto> {
        return try {
            val response = api.getQuizById(quizId)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.quiz)
            } else {
                Result.failure(Exception("Failed to fetch quiz details: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun submitQuiz(quizId: String, request: QuizSubmitRequest): Result<QuizSubmitResponse> {
        return try {
            val response = api.submitQuiz(quizId, request)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to submit quiz: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
