package com.example.smartlms.features.quiz.presentation

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.smartlms.features.quiz.data.QuizDetailDto
import com.example.smartlms.features.quiz.data.QuizRepository
import com.example.smartlms.features.quiz.data.QuizSubmitAnswerDto
import com.example.smartlms.features.quiz.data.QuizSubmitRequest
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class QuizState {
    object Loading : QuizState()
    data class Success(val quiz: QuizDetailDto) : QuizState()
    data class Error(val message: String) : QuizState()
    data class Submitted(val score: Int, val total: Int, val message: String) : QuizState()
}

@HiltViewModel
class QuizViewModel @Inject constructor(
    private val repository: QuizRepository,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val quizId: String = checkNotNull(savedStateHandle["quizId"])

    private val _state = MutableStateFlow<QuizState>(QuizState.Loading)
    val state: StateFlow<QuizState> = _state.asStateFlow()

    private val _answers = MutableStateFlow<Map<String, String>>(emptyMap())
    val answers: StateFlow<Map<String, String>> = _answers.asStateFlow()

    init {
        loadQuiz()
    }

    private fun loadQuiz() {
        viewModelScope.launch {
            _state.value = QuizState.Loading
            val result = repository.getQuizDetails(quizId)
            if (result.isSuccess) {
                _state.value = QuizState.Success(result.getOrThrow())
            } else {
                _state.value = QuizState.Error(result.exceptionOrNull()?.message ?: "Failed to load quiz")
            }
        }
    }

    fun selectOption(questionId: String, optionId: String) {
        val currentAnswers = _answers.value.toMutableMap()
        currentAnswers[questionId] = optionId
        _answers.value = currentAnswers
    }

    fun submitQuiz() {
        viewModelScope.launch {
            val currentState = _state.value
            if (currentState is QuizState.Success) {
                _state.value = QuizState.Loading
                
                val request = QuizSubmitRequest(
                    answers = _answers.value.map { (qId, optId) -> 
                        QuizSubmitAnswerDto(questionId = qId, selectedOptionId = optId) 
                    }
                )
                
                val result = repository.submitQuiz(quizId, request)
                if (result.isSuccess) {
                    val response = result.getOrThrow()
                    _state.value = QuizState.Submitted(
                        score = response.score,
                        total = response.totalMarks,
                        message = response.message
                    )
                } else {
                    _state.value = QuizState.Error(result.exceptionOrNull()?.message ?: "Submission failed")
                }
            }
        }
    }
}
