package com.example.smartlms.features.dashboard.presentation

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.smartlms.features.dashboard.data.CourseDto
import com.example.smartlms.theme.*

@Composable
fun StudentDashboardScreen(
    viewModel: DashboardViewModel = hiltViewModel(),
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
                    color = SemanticDanger
                )
            }
        }
        is DashboardState.Success -> {
            val successState = state as DashboardState.Success
            val courses = successState.courses
            val metrics = successState.metrics
            val tasks = successState.tasks

            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color(0xFFF8FAFF)),
                contentPadding = PaddingValues(bottom = 80.dp)
            ) {
                // HEADER SECTION
                item {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "Welcome back! 👋",
                            style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.ExtraBold),
                            color = Color(0xFF0F172A)
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        if (metrics != null) {
                            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                item { Badge(icon = "⭐", text = "${metrics.xpPoints ?: 0} XP", color = SemanticWarning, bgColor = Color(0xFFFEF3C7)) }
                                item { Badge(icon = "🔥", text = "${metrics.currentStreak ?: 0} Day Streak", color = Color(0xFFEA580C), bgColor = Color(0xFFFFEDD5)) }
                                item { Badge(icon = "📱", text = "Code: demo", color = Brand500, bgColor = Brand50) }
                            }
                        }
                    }
                }

                // LIVE NOW CARD
                item {
                    Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onNavigateToLiveClass("https://meet.jit.si/SmartLMS_Demo_Room_123") },
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = SemanticWarning),
                            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
                        ) {
                            Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(48.dp)
                                        .background(Color.White, RoundedCornerShape(12.dp)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(Icons.Default.PlayArrow, contentDescription = null, tint = SemanticWarning, modifier = Modifier.size(24.dp))
                                }
                                Spacer(modifier = Modifier.width(16.dp))
                                Column {
                                    Text(text = "LIVE NOW", fontSize = 10.sp, fontWeight = FontWeight.ExtraBold, color = Color.White)
                                    Text(text = "Introduction to React Native", style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold), color = Color.White)
                                    Text(text = "Tap to join classroom", fontSize = 12.sp, color = Color.White.copy(alpha = 0.8f))
                                }
                            }
                        }
                    }
                }

                // CONTINUE LEARNING
                item {
                    val nextCourse = courses.firstOrNull()
                    if (nextCourse != null) {
                        Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
                            SectionHeader(title = "Continue Learning", action = "View all")
                            Spacer(modifier = Modifier.height(12.dp))
                            ContinueLearningCard(course = nextCourse, onClick = { onNavigateToCourseDetail(nextCourse.id) })
                        }
                    }
                }

                // STATS GRID
                item {
                    if (metrics != null) {
                        Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp)) {
                            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                StatCard(title = "Enrolled", value = "${metrics.totalEnrollments}", icon = Icons.Default.MenuBook, tint = Brand500, bg = Brand50, modifier = Modifier.weight(1f))
                                StatCard(title = "Completed", value = "${metrics.totalCompleted}", icon = Icons.Default.TrendingUp, tint = SemanticSuccess, bg = Color(0xFFD1FAE5), modifier = Modifier.weight(1f))
                            }
                            Spacer(modifier = Modifier.height(12.dp))
                            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                StatCard(title = "Quiz Avg", value = "${metrics.quizAverage}%", icon = Icons.Default.Star, tint = Accent500, bg = Color(0xFFEDE9FE), modifier = Modifier.weight(1f))
                                StatCard(title = "Badges", value = "${metrics.badgesEarned}", icon = Icons.Default.EmojiEvents, tint = SemanticWarning, bg = Color(0xFFFEF3C7), modifier = Modifier.weight(1f))
                            }
                        }
                    }
                }

                // ENROLLED COURSES (LazyRow)
                if (courses.isNotEmpty()) {
                    item {
                        Column(modifier = Modifier.padding(vertical = 12.dp)) {
                            SectionHeader(title = "Your Courses", action = "View all", modifier = Modifier.padding(horizontal = 16.dp))
                            Spacer(modifier = Modifier.height(12.dp))
                            LazyRow(
                                contentPadding = PaddingValues(horizontal = 16.dp),
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                items(courses) { course ->
                                    CourseMiniCard(course = course, onClick = { onNavigateToCourseDetail(course.id) })
                                }
                            }
                        }
                    }
                }

                // MY TASKS
                if (tasks.isNotEmpty()) {
                    item {
                        Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp)) {
                            SectionHeader(title = "My Tasks", action = "View all")
                            Spacer(modifier = Modifier.height(12.dp))
                            Card(
                                shape = RoundedCornerShape(16.dp),
                                colors = CardDefaults.cardColors(containerColor = Color.White),
                                elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    tasks.take(4).forEach { task ->
                                        TaskRow(title = task.title, courseName = task.courseTitle, dueDate = task.dueDate, priority = task.priority, isCompleted = task.completed)
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

@Composable
fun SectionHeader(title: String, action: String, modifier: Modifier = Modifier) {
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(text = title, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold), color = Color(0xFF0F172A))
        Text(text = action, style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold), color = Brand500)
    }
}

@Composable
fun Badge(icon: String, text: String, color: Color, bgColor: Color) {
    Row(
        modifier = Modifier
            .background(bgColor, RoundedCornerShape(8.dp))
            .padding(horizontal = 8.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(text = icon, fontSize = 12.sp)
        Spacer(modifier = Modifier.width(4.dp))
        Text(text = text, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = color)
    }
}

@Composable
fun ContinueLearningCard(course: CourseDto, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .background(Brand500, RoundedCornerShape(12.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.PlayArrow, contentDescription = null, tint = Color.White, modifier = Modifier.size(24.dp))
            }
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(text = "CONTINUE WHERE YOU LEFT OFF", fontSize = 10.sp, fontWeight = FontWeight.ExtraBold, color = SemanticSuccess)
                Text(text = course.title, style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold), maxLines = 1, overflow = TextOverflow.Ellipsis, color = Color(0xFF0F172A))
                Spacer(modifier = Modifier.height(4.dp))
                LinearProgressIndicator(progress = { 0.4f }, modifier = Modifier.fillMaxWidth().height(4.dp).clip(RoundedCornerShape(2.dp)), color = SemanticSuccess, trackColor = Color(0xFFF1F5F9))
            }
        }
    }
}

@Composable
fun StatCard(title: String, value: String, icon: ImageVector, tint: Color, bg: Color, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .background(bg, RoundedCornerShape(12.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size(20.dp))
            }
            Spacer(modifier = Modifier.height(12.dp))
            Text(text = value, style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold), color = Color(0xFF0F172A))
            Text(text = title, fontSize = 12.sp, color = Color(0xFF64748B), fontWeight = FontWeight.Medium)
        }
    }
}

@Composable
fun CourseMiniCard(course: CourseDto, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .width(200.dp)
            .clickable { onClick() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Column {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(100.dp)
                    .background(Brand50)
            )
            Column(modifier = Modifier.padding(12.dp)) {
                Text(text = course.title, style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold), maxLines = 1, overflow = TextOverflow.Ellipsis, color = Color(0xFF0F172A))
                Spacer(modifier = Modifier.height(4.dp))
                Text(text = "Instructor: ${course.teacher?.user?.firstName ?: "Unknown"}", fontSize = 12.sp, color = Color(0xFF64748B))
            }
        }
    }
}

@Composable
fun TaskRow(title: String, courseName: String, dueDate: String, priority: String, isCompleted: Boolean) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        verticalAlignment = Alignment.Top
    ) {
        Icon(
            if (isCompleted) Icons.Default.CheckCircle else Icons.Default.RadioButtonUnchecked,
            contentDescription = null,
            tint = if (isCompleted) SemanticSuccess else Color(0xFFCBD5E1),
            modifier = Modifier.size(20.dp)
        )
        Spacer(modifier = Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(text = title, style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold), color = if (isCompleted) Color(0xFF94A3B8) else Color(0xFF0F172A))
            Text(text = courseName, fontSize = 12.sp, color = Color(0xFF64748B))
        }
    }
}

// OTHER SCREENS
@Composable
fun CoursesScreen(viewModel: DashboardViewModel = hiltViewModel()) {
    Box(modifier = Modifier.fillMaxSize().background(Color(0xFFF8FAFF)), contentAlignment = Alignment.Center) {
        Text("All Enrolled Courses", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun AssignmentsScreen(viewModel: DashboardViewModel = hiltViewModel()) {
    Box(modifier = Modifier.fillMaxSize().background(Color(0xFFF8FAFF)), contentAlignment = Alignment.Center) {
        Text("My Tasks", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun ProfileScreen() {
    Column(modifier = Modifier.fillMaxSize().background(Color(0xFFF8FAFF)).padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        Icon(Icons.Default.Person, contentDescription = "Profile", modifier = Modifier.size(100.dp), tint = Brand500)
        Spacer(modifier = Modifier.height(16.dp))
        Text("Student Profile", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
    }
}
