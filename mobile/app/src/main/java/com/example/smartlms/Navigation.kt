package com.example.smartlms

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.example.smartlms.features.auth.presentation.LoginScreen
import com.example.smartlms.features.dashboard.presentation.MainDashboardShell
import com.example.smartlms.data.local.TokenManager

import com.example.smartlms.features.course.presentation.CourseDetailScreen
import com.example.smartlms.features.course.presentation.LectureScreen
import com.example.smartlms.features.classroom.presentation.ClassroomScreen
import com.example.smartlms.features.chat.presentation.ChatListScreen
import com.example.smartlms.features.chat.presentation.ChatRoomScreen
import androidx.navigation.NavType
import androidx.navigation.navArgument
import java.net.URLDecoder
import java.nio.charset.StandardCharsets

@Composable
fun MainNavigation() {
    val navController = rememberNavController()

    NavHost(navController = navController, startDestination = "splash") {
        composable("splash") {
            SplashScreen(
                onNavigateToLogin = { 
                    navController.navigate("login") {
                        popUpTo("splash") { inclusive = true }
                    } 
                },
                onNavigateToDashboard = {
                    navController.navigate("dashboard") {
                        popUpTo("splash") { inclusive = true }
                    }
                }
            )
        }
        composable("login") {
            LoginScreen(
                onLoginSuccess = { 
                    navController.navigate("dashboard") {
                        popUpTo("login") { inclusive = true }
                    } 
                }
            )
        }
        composable("dashboard") {
            MainDashboardShell(
                onNavigateToCourseDetail = { courseId ->
                    navController.navigate("course_detail/$courseId")
                },
                onNavigateToLiveClass = { meetingUrl ->
                    val encodedUrl = java.net.URLEncoder.encode(meetingUrl, StandardCharsets.UTF_8.toString())
                    navController.navigate("classroom/$encodedUrl")
                },
                onNavigateToChat = {
                    navController.navigate("chat_list")
                }
            )
        }
        composable(
            route = "course_detail/{courseId}",
            arguments = listOf(navArgument("courseId") { type = NavType.StringType })
        ) {
            CourseDetailScreen(
                onNavigateBack = { navController.popBackStack() },
                onNavigateToLecture = { lectureId ->
                    navController.navigate("lecture/$lectureId")
                }
            )
        }
        composable(
            route = "lecture/{lectureId}",
            arguments = listOf(navArgument("lectureId") { type = NavType.StringType })
        ) {
            LectureScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }
        composable(
            route = "classroom/{meetingUrl}",
            arguments = listOf(navArgument("meetingUrl") { type = NavType.StringType })
        ) { backStackEntry ->
            val encodedUrl = backStackEntry.arguments?.getString("meetingUrl") ?: ""
            val meetingUrl = URLDecoder.decode(encodedUrl, StandardCharsets.UTF_8.toString())
            ClassroomScreen(
                meetingUrl = meetingUrl,
                onNavigateBack = { navController.popBackStack() }
            )
        }
        composable("chat_list") {
            ChatListScreen(
                onNavigateToRoom = { targetId, isGroup, name ->
                    val encodedName = java.net.URLEncoder.encode(name, StandardCharsets.UTF_8.toString())
                    navController.navigate("chat_room/$targetId/$isGroup/$encodedName")
                },
                onNavigateBack = { navController.popBackStack() }
            )
        }
        composable(
            route = "chat_room/{targetId}/{isGroup}/{roomName}",
            arguments = listOf(
                navArgument("targetId") { type = NavType.StringType },
                navArgument("isGroup") { type = NavType.BoolType },
                navArgument("roomName") { type = NavType.StringType }
            )
        ) { backStackEntry ->
            val targetId = backStackEntry.arguments?.getString("targetId") ?: ""
            val isGroup = backStackEntry.arguments?.getBoolean("isGroup") ?: false
            val encodedName = backStackEntry.arguments?.getString("roomName") ?: ""
            val roomName = URLDecoder.decode(encodedName, StandardCharsets.UTF_8.toString())
            ChatRoomScreen(
                targetId = targetId,
                isGroup = isGroup,
                roomName = roomName,
                onNavigateBack = { navController.popBackStack() }
            )
        }
    }
}

@Composable
fun SplashScreen(
    onNavigateToLogin: () -> Unit,
    onNavigateToDashboard: () -> Unit,
    tokenManager: TokenManager = androidx.compose.ui.platform.LocalContext.current.let { 
        // Note: Better to inject via ViewModel, doing this inline for brevity
        dagger.hilt.android.EntryPointAccessors.fromApplication(it, TokenManagerEntryPoint::class.java).tokenManager()
    }
) {
    val token by tokenManager.tokenFlow.collectAsState(initial = null)
    
    LaunchedEffect(token) {
        // Wait a tiny bit just to prevent flash if it's already there, or skip wait
        kotlinx.coroutines.delay(500)
        if (token.isNullOrEmpty()) {
            onNavigateToLogin()
        } else {
            onNavigateToDashboard()
        }
    }

    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        CircularProgressIndicator()
    }
}

// Defining EntryPoint for TokenManager to access it inside Composable without a ViewModel
@dagger.hilt.EntryPoint
@dagger.hilt.InstallIn(dagger.hilt.components.SingletonComponent::class)
interface TokenManagerEntryPoint {
    fun tokenManager(): TokenManager
}

