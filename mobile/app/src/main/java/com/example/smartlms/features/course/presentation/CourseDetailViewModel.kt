package com.example.smartlms.features.course.presentation

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.smartlms.features.course.data.CourseDetailDto
import com.example.smartlms.features.course.data.CourseRepository
import com.example.smartlms.features.course.data.LectureDto
import com.example.smartlms.features.course.data.StudyMaterialDto
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class CourseDetailState {
    object Loading : CourseDetailState()
    data class Success(
        val course: CourseDetailDto,
        val lectures: List<LectureDto>,
        val materials: List<StudyMaterialDto>,
        val quizzes: List<com.example.smartlms.features.quiz.data.QuizDto>
    ) : CourseDetailState()
    data class Error(val message: String) : CourseDetailState()
}

@HiltViewModel
class CourseDetailViewModel @Inject constructor(
    private val repository: CourseRepository,
    private val quizRepository: com.example.smartlms.features.quiz.data.QuizRepository,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val courseId: String = checkNotNull(savedStateHandle["courseId"])

    private val _state = MutableStateFlow<CourseDetailState>(CourseDetailState.Loading)
    val state: StateFlow<CourseDetailState> = _state.asStateFlow()

    init {
        loadCourseData()
    }

    private fun loadCourseData() {
        viewModelScope.launch {
            _state.value = CourseDetailState.Loading
            try {
                // Fetch in parallel using coroutines could be done, but sequentially is simpler for now
                val courseResult = repository.getCourseDetails(courseId)
                val lecturesResult = repository.getLectures(courseId)
                val materialsResult = repository.getStudyMaterials(courseId)
                val quizzesResult = quizRepository.getCourseQuizzes(courseId)

                if (courseResult.isSuccess && lecturesResult.isSuccess && materialsResult.isSuccess && quizzesResult.isSuccess) {
                    _state.value = CourseDetailState.Success(
                        course = courseResult.getOrThrow(),
                        lectures = lecturesResult.getOrThrow(),
                        materials = materialsResult.getOrThrow(),
                        quizzes = quizzesResult.getOrThrow()
                    )
                } else {
                    val errorMsg = courseResult.exceptionOrNull()?.message 
                        ?: lecturesResult.exceptionOrNull()?.message
                        ?: materialsResult.exceptionOrNull()?.message
                        ?: quizzesResult.exceptionOrNull()?.message
                        ?: "Failed to load course details"
                    _state.value = CourseDetailState.Error(errorMsg)
                }
            } catch (e: Exception) {
                _state.value = CourseDetailState.Error(e.localizedMessage ?: "Unknown error")
            }
        }
    }
    
    fun refresh() {
        loadCourseData()
    }
}
