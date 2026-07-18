package com.example.smartlms.features.course.presentation

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.smartlms.features.course.data.CourseRepository
import com.example.smartlms.features.course.data.LectureDto
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class LectureState {
    object Loading : LectureState()
    data class Success(val lecture: LectureDto) : LectureState()
    data class Error(val message: String) : LectureState()
}

@HiltViewModel
class LectureViewModel @Inject constructor(
    private val repository: CourseRepository,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val lectureId: String = checkNotNull(savedStateHandle["lectureId"])

    private val _state = MutableStateFlow<LectureState>(LectureState.Loading)
    val state: StateFlow<LectureState> = _state.asStateFlow()

    init {
        loadLecture()
    }

    private fun loadLecture() {
        viewModelScope.launch {
            _state.value = LectureState.Loading
            try {
                val result = repository.getLectureDetails(lectureId)
                if (result.isSuccess) {
                    _state.value = LectureState.Success(result.getOrThrow())
                } else {
                    _state.value = LectureState.Error(result.exceptionOrNull()?.message ?: "Failed to load lecture")
                }
            } catch (e: Exception) {
                _state.value = LectureState.Error(e.localizedMessage ?: "Unknown error")
            }
        }
    }

    fun refresh() {
        loadLecture()
    }
}
