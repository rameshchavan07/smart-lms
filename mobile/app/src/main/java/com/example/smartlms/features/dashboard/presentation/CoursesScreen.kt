package com.example.smartlms.features.dashboard.presentation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.slideInVertically
import androidx.compose.ui.graphics.Brush
import com.example.smartlms.theme.Brand500

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CoursesScreen(
    viewModel: DashboardViewModel = hiltViewModel(),
    onNavigateToCourseDetail: (String) -> Unit
) {
    val state by viewModel.state.collectAsState()

    Scaffold(
        containerColor = Color(0xFFF8FAFF)
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when (state) {
                is DashboardState.Loading -> {
                    CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
                }
                is DashboardState.Error -> {
                    Text(
                        text = (state as DashboardState.Error).message,
                        color = MaterialTheme.colorScheme.error,
                        modifier = Modifier.align(Alignment.Center)
                    )
                }
                is DashboardState.Success -> {
                    val courses = (state as DashboardState.Success).courses
                    Column(modifier = Modifier.fillMaxSize()) {
                        // Dynamic Header
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(
                                    brush = Brush.horizontalGradient(
                                        colors = listOf(Brand500, Color(0xFF4361F0))
                                    )
                                )
                                .padding(24.dp)
                        ) {
                            Column {
                                Spacer(modifier = Modifier.height(24.dp))
                                Text("My Courses", color = Color.White, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Black)
                                Text("Continue your learning journey", color = Color.White.copy(alpha = 0.8f), fontSize = 14.sp)
                            }
                        }

                        if (courses.isEmpty()) {
                            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                Text(
                                    text = "You are not enrolled in any courses.",
                                    color = Color.Gray
                                )
                            }
                        } else {
                            AnimatedVisibility(
                                visible = true,
                                enter = fadeIn() + slideInVertically(initialOffsetY = { 50 })
                            ) {
                                LazyColumn(
                                    contentPadding = PaddingValues(16.dp),
                                    verticalArrangement = Arrangement.spacedBy(16.dp),
                                    modifier = Modifier.fillMaxSize()
                                ) {
                                    items(courses) { course ->
                                        CourseMiniCard(
                                            course = course,
                                            onClick = { onNavigateToCourseDetail(course.id) },
                                            modifier = Modifier.fillMaxWidth()
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
