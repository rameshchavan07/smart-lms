package com.example.smartlms.features.quiz.data

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

interface QuizApi {
    @GET("quiz/course/{courseId}")
    suspend fun getCourseQuizzes(
        @Path("courseId") courseId: String
    ): Response<CourseQuizzesResponse>

    @GET("quiz/{id}")
    suspend fun getQuizById(
        @Path("id") id: String
    ): Response<QuizDetailResponse>

    @POST("quiz/{id}/submit")
    suspend fun submitQuiz(
        @Path("id") id: String,
        @Body request: QuizSubmitRequest
    ): Response<QuizSubmitResponse>
}
