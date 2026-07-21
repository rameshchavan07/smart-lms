package com.example.smartlms.features.dashboard.presentation

import androidx.compose.foundation.layout.padding
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.Assignment
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Email
import androidx.compose.ui.graphics.vector.ImageVector

sealed class BottomNavItem(val title: String, val icon: ImageVector, val route: String) {
    object Home : BottomNavItem("Home", Icons.Default.Home, "dashboard_home")
    object Courses : BottomNavItem("Courses", Icons.Default.List, "dashboard_courses")
    object Assignments : BottomNavItem("Tasks", Icons.Default.Assignment, "dashboard_assignments")
    object Profile : BottomNavItem("Profile", Icons.Default.Person, "dashboard_profile")
}

@Composable
fun MainDashboardShell(
    onNavigateToCourseDetail: (String) -> Unit = {},
    onNavigateToLiveClass: (String) -> Unit = {},
    onNavigateToChat: () -> Unit = {},
    onLogout: () -> Unit = {},
    tokenManager: com.example.smartlms.data.local.TokenManager = androidx.compose.ui.platform.LocalContext.current.let { 
        dagger.hilt.android.EntryPointAccessors.fromApplication(it, com.example.smartlms.TokenManagerEntryPoint::class.java).tokenManager()
    }
) {
    val navController = rememberNavController()
    val role by tokenManager.roleFlow.collectAsState(initial = null)
    
    val items = listOf(
        BottomNavItem.Home,
        BottomNavItem.Courses,
        BottomNavItem.Assignments,
        BottomNavItem.Profile
    )

    Scaffold(
        bottomBar = {
            NavigationBar {
                val navBackStackEntry by navController.currentBackStackEntryAsState()
                val currentRoute = navBackStackEntry?.destination?.route
                items.forEach { item ->
                    // Hide Assignments tab for Teachers
                    if (role == "TEACHER" && item == BottomNavItem.Assignments) return@forEach
                    
                    NavigationBarItem(
                        icon = { Icon(item.icon, contentDescription = item.title) },
                        label = { Text(item.title) },
                        selected = currentRoute == item.route,
                        onClick = {
                            navController.navigate(item.route) {
                                navController.graph.startDestinationRoute?.let { route ->
                                    popUpTo(route) {
                                        saveState = true
                                    }
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        }
                    )
                }
            }
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = onNavigateToChat,
                containerColor = com.example.smartlms.theme.Brand500,
                contentColor = androidx.compose.ui.graphics.Color.White
            ) {
                Icon(
                    imageVector = Icons.Default.Email,
                    contentDescription = "Chat"
                )
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = BottomNavItem.Home.route,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(BottomNavItem.Home.route) {
                if (role == "TEACHER") {
                    TeacherDashboardScreen(
                        onNavigateToCourseDetail = onNavigateToCourseDetail,
                        onNavigateToLiveClass = onNavigateToLiveClass
                    )
                } else {
                    StudentDashboardScreen(
                        onNavigateToCourseDetail = onNavigateToCourseDetail,
                        onNavigateToLiveClass = onNavigateToLiveClass
                    )
                }
            }
            composable(BottomNavItem.Courses.route) {
                CoursesScreen(
                    onNavigateToCourseDetail = onNavigateToCourseDetail
                )
            }
            composable(BottomNavItem.Assignments.route) {
                AssignmentsScreen()
            }
            composable(BottomNavItem.Profile.route) {
                ProfileScreen(
                    onLogout = onLogout
                )
            }
        }
    }
}
