package com.example.smartlms.features.dashboard.presentation

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.smartlms.features.dashboard.data.CourseDto
import com.example.smartlms.theme.Brand50
import com.example.smartlms.theme.Brand500

@Composable
fun TeacherDashboardScreen(
    viewModel: DashboardViewModel = hiltViewModel(), // We can use DashboardViewModel for my-courses
    onNavigateToCourseDetail: (String) -> Unit = {},
    onNavigateToLiveClass: (String) -> Unit = {}
) {
    val state by viewModel.state.collectAsState()

    when (state) {
        is DashboardState.Loading -> {
            Box(modifier = Modifier.fillMaxSize().background(Color(0xFFF8FAFF)), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Brand500)
            }
        }
        is DashboardState.Error -> {
            Box(modifier = Modifier.fillMaxSize().background(Color(0xFFF8FAFF)), contentAlignment = Alignment.Center) {
                Text(
                    text = "Error: ${(state as DashboardState.Error).message}",
                    color = MaterialTheme.colorScheme.error
                )
            }
        }
        is DashboardState.Success -> {
            val successState = state as DashboardState.Success
            val courses = successState.courses

            Scaffold(
                floatingActionButton = {
                    FloatingActionButton(
                        onClick = { /* TODO: Show Create Announcement Dialog */ },
                        containerColor = Brand500,
                        contentColor = Color.White
                    ) {
                        Icon(Icons.Default.Campaign, contentDescription = "New Announcement")
                    }
                }
            ) { padding ->
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color(0xFFF8FAFF))
                        .padding(padding),
                    contentPadding = PaddingValues(bottom = 80.dp)
                ) {
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(
                                    brush = Brush.verticalGradient(
                                        colors = listOf(Brand500.copy(alpha = 0.15f), Color(0xFFF8FAFF))
                                    )
                                )
                                .padding(16.dp)
                        ) {
                            Column {
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = "Teacher Dashboard 🎓",
                                    style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.ExtraBold),
                                    color = Color(0xFF0F172A)
                                )
                                Spacer(modifier = Modifier.height(12.dp))
                                Text("Manage your courses and students efficiently.", color = Color(0xFF64748B))
                            }
                        }
                    }

                    item {
                        SectionHeader(
                            title = "My Courses",
                            action = "View all",
                            modifier = Modifier.padding(16.dp)
                        )
                    }

                    if (courses.isEmpty()) {
                        item {
                            Box(modifier = Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                                Text("No courses assigned yet.", color = Color.Gray)
                            }
                        }
                    } else {
                        items(courses) { course ->
                            TeacherCourseCard(
                                course = course,
                                onClick = { onNavigateToCourseDetail(course.id) }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun TeacherCourseCard(course: CourseDto, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp)
            .clickable { onClick() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(64.dp)
                    .background(Brand50, RoundedCornerShape(12.dp)),
                contentAlignment = Alignment.Center
            ) {
                // Course Thumbnail Placeholder
            }
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = course.title,
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    color = Color(0xFF0F172A)
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "${course._count?.lectures ?: 0} Lectures",
                    fontSize = 12.sp,
                    color = Color(0xFF64748B)
                )
            }
        }
    }
}
