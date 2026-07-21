package com.example.smartlms.features.quiz.presentation

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.selection.selectable
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.smartlms.features.quiz.data.QuizQuestionDto

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QuizScreen(
    onNavigateBack: () -> Unit,
    viewModel: QuizViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    val answers by viewModel.answers.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Quiz") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = MaterialTheme.colorScheme.onPrimary,
                    navigationIconContentColor = MaterialTheme.colorScheme.onPrimary
                )
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when (val currentState = state) {
                is QuizState.Loading -> {
                    CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
                }
                is QuizState.Error -> {
                    Column(
                        modifier = Modifier.align(Alignment.Center),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(text = currentState.message, color = MaterialTheme.colorScheme.error)
                    }
                }
                is QuizState.Submitted -> {
                    Column(
                        modifier = Modifier.align(Alignment.Center).padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "Quiz Submitted!",
                            style = MaterialTheme.typography.headlineMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = currentState.message,
                            style = MaterialTheme.typography.bodyLarge
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "Score: ${currentState.score} / ${currentState.total}",
                            style = MaterialTheme.typography.titleLarge,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Spacer(modifier = Modifier.height(32.dp))
                        Button(onClick = onNavigateBack) {
                            Text("Back to Course")
                        }
                    }
                }
                is QuizState.Success -> {
                    val quiz = currentState.quiz
                    Column(modifier = Modifier.fillMaxSize()) {
                        // Header
                        Surface(
                            modifier = Modifier.fillMaxWidth(),
                            color = MaterialTheme.colorScheme.surfaceVariant
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text(
                                    text = quiz.title,
                                    style = MaterialTheme.typography.titleLarge,
                                    fontWeight = FontWeight.Bold
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "Total Marks: ${quiz.totalMarks} | Duration: ${quiz.durationMins ?: "N/A"} Mins",
                                    style = MaterialTheme.typography.labelMedium
                                )
                            }
                        }

                        // Questions
                        LazyColumn(
                            modifier = Modifier.weight(1f),
                            contentPadding = PaddingValues(16.dp),
                            verticalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            items(quiz.questions) { question ->
                                QuestionItem(
                                    question = question,
                                    selectedOptionId = answers[question.id],
                                    onOptionSelected = { optionId ->
                                        viewModel.selectOption(question.id, optionId)
                                    }
                                )
                            }
                        }

                        // Submit Button
                        Button(
                            onClick = { viewModel.submitQuiz() },
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp)
                        ) {
                            Text("Submit Quiz")
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun QuestionItem(
    question: QuizQuestionDto,
    selectedOptionId: String?,
    onOptionSelected: (String) -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = question.text,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "Marks: ${question.marks}",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.primary
            )
            Spacer(modifier = Modifier.height(12.dp))

            question.options.forEach { option ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .selectable(
                            selected = (option.id == selectedOptionId),
                            onClick = { onOptionSelected(option.id) },
                            role = Role.RadioButton
                        )
                        .padding(vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    RadioButton(
                        selected = (option.id == selectedOptionId),
                        onClick = null // handled by selectable modifier
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = option.text,
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }
        }
    }
}
