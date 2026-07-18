package com.example.smartlms.features.course.data

import kotlinx.serialization.Serializable

@Serializable
data class CourseDetailDto(
    val id: String,
    val title: String,
    val description: String? = null,
    val thumbnailUrl: String? = null,
    val teacher: CourseTeacherDto? = null
)

@Serializable
data class CourseTeacherDto(
    val user: CourseTeacherUserDto? = null
)

@Serializable
data class CourseTeacherUserDto(
    val firstName: String,
    val lastName: String,
    val profileImage: String? = null
)

@Serializable
data class LectureDto(
    val id: String,
    val title: String,
    val description: String? = null,
    val meetingUrl: String? = null,
    val recordingUrl: String? = null,
    val thumbnailUrl: String? = null,
    val startTime: String,
    val endTime: String
)

@Serializable
data class StudyMaterialDto(
    val id: String,
    val title: String,
    val description: String? = null,
    val fileUrl: String,
    val fileType: String
)

@Serializable
data class CourseDataResponse(
    val course: CourseDetailDto
)

@Serializable
data class LecturesResponse(
    val lectures: List<LectureDto>
)

@Serializable
data class LectureDataResponse(
    val lecture: LectureDto
)

@Serializable
data class StudyMaterialsResponse(
    val materials: List<StudyMaterialDto> // Assuming standard list wrapping
)
