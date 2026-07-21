package com.example.smartlms.features.quiz.data

import kotlinx.serialization.Serializable

@Serializable
data class QuizDto(
    val id: String,
    val courseId: String,
    val title: String,
    val description: String? = null,
    val durationMins: Int? = null,
    val totalMarks: Int
)

@Serializable
data class QuizQuestionDto(
    val id: String,
    val quizId: String,
    val text: String,
    val marks: Int,
    val options: List<QuizOptionDto>
)

@Serializable
data class QuizOptionDto(
    val id: String,
    val text: String
)

@Serializable
data class QuizDetailDto(
    val id: String,
    val title: String,
    val description: String? = null,
    val durationMins: Int? = null,
    val totalMarks: Int,
    val questions: List<QuizQuestionDto>
)

@Serializable
data class QuizSubmitAnswerDto(
    val questionId: String,
    val selectedOptionId: String
)

@Serializable
data class QuizSubmitRequest(
    val answers: List<QuizSubmitAnswerDto>
)

@Serializable
data class QuizSubmitResponse(
    val message: String,
    val score: Int,
    val totalMarks: Int
)

@Serializable
data class CourseQuizzesResponse(
    val quizzes: List<QuizDto>
)

@Serializable
data class QuizDetailResponse(
    val quiz: QuizDetailDto
)
