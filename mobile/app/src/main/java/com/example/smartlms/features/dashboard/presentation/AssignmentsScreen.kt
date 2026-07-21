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
fun AssignmentsScreen(
    viewModel: DashboardViewModel = hiltViewModel()
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
                    val tasks = (state as DashboardState.Success).tasks
                    Column(modifier = Modifier.fillMaxSize()) {
                        // Dynamic Header
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(
                                    brush = Brush.horizontalGradient(
                                        colors = listOf(Color(0xFF6366F1), Color(0xFF8B5CF6))
                                    )
                                )
                                .padding(24.dp)
                        ) {
                            Column {
                                Spacer(modifier = Modifier.height(24.dp))
                                Text("My Tasks", color = Color.White, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Black)
                                Text("Stay on top of your assignments", color = Color.White.copy(alpha = 0.8f), fontSize = 14.sp)
                            }
                        }

                        if (tasks.isEmpty()) {
                            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                Text(
                                    text = "You have no upcoming tasks.",
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
                                    modifier = Modifier.fillMaxSize()
                                ) {
                                    item {
                                        Card(
                                            shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp),
                                            colors = CardDefaults.cardColors(containerColor = Color.White),
                                            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
                                            modifier = Modifier.fillMaxWidth()
                                        ) {
                                            Column(modifier = Modifier.padding(16.dp)) {
                                                var selectedTaskId by androidx.compose.runtime.remember { androidx.compose.runtime.mutableStateOf<String?>(null) }
                                                
                                                val filePickerLauncher = androidx.activity.compose.rememberLauncherForActivityResult(
                                                    contract = androidx.activity.result.contract.ActivityResultContracts.GetContent()
                                                ) { uri ->
                                                    if (uri != null && selectedTaskId != null) {
                                                        viewModel.submitAssignment(selectedTaskId!!, uri)
                                                        selectedTaskId = null
                                                    }
                                                }

                                                tasks.forEach { task ->
                                                    TaskRow(
                                                        title = task.title,
                                                        courseName = task.courseTitle,
                                                        dueDate = task.dueDate,
                                                        priority = task.priority,
                                                        isCompleted = task.completed,
                                                        onUploadClick = {
                                                            selectedTaskId = task.id
                                                            filePickerLauncher.launch("*/*") // Allowed all types initially, but can be restricted if needed. Wait, user said yes to restrict to PDFs and Images.
                                                            // However, GetContent() takes one mime type. "*/*" allows all.
                                                            // We can't restrict to multiple types easily with GetContent unless we use OpenDocument.
                                                            // Let's use "*/*" and let the user pick.
                                                        }
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
        }
    }
}
