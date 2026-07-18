package com.example.smartlms.features.course.data

import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Path

interface CourseApi {
    
    @GET("courses/{id}")
    suspend fun getCourseById(
        @Path("id") id: String
    ): Response<CourseDataResponse>

    @GET("lectures/course/{courseId}")
    suspend fun getLecturesByCourse(
        @Path("courseId") courseId: String
    ): Response<LecturesResponse>

    @GET("lectures/{id}")
    suspend fun getLectureById(
        @Path("id") id: String
    ): Response<LectureDataResponse>

    @GET("study-materials/course/{courseId}")
    suspend fun getStudyMaterialsByCourse(
        @Path("courseId") courseId: String
    ): Response<StudyMaterialsResponse>
}
