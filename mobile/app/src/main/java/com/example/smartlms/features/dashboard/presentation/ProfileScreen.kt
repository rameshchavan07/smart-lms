package com.example.smartlms.features.dashboard.presentation

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.HelpOutline
import androidx.compose.material.icons.filled.Logout
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.smartlms.theme.Brand500

import androidx.hilt.navigation.compose.hiltViewModel
import com.example.smartlms.features.auth.presentation.AuthViewModel
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.getValue
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.graphicsLayer

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    authViewModel: AuthViewModel = hiltViewModel(),
    onLogout: () -> Unit
) {
    Scaffold(
        containerColor = Color(0xFFF8FAFF)
    ) { paddingValues ->
        var visible by remember { mutableStateOf(false) }
        LaunchedEffect(Unit) { visible = true }
        
        val scale by animateFloatAsState(
            targetValue = if (visible) 1f else 0.8f,
            animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy, stiffness = Spring.StiffnessLow)
        )
        val alpha by animateFloatAsState(targetValue = if (visible) 1f else 0f)

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 16.dp)
                .graphicsLayer(scaleX = scale, scaleY = scale, alpha = alpha),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(24.dp))
            
            // Avatar
            Box(
                modifier = Modifier
                    .size(110.dp)
                    .background(
                        brush = Brush.sweepGradient(listOf(Color(0xFF3B82F6), Color(0xFF8B5CF6), Color(0xFFEC4899), Color(0xFF3B82F6))),
                        shape = CircleShape
                    )
                    .padding(4.dp), // gradient ring width
                contentAlignment = Alignment.Center
            ) {
                Box(
                    modifier = Modifier
                        .size(102.dp)
                        .clip(CircleShape)
                        .background(Color.White),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Person,
                        contentDescription = null,
                        tint = Brand500,
                        modifier = Modifier.size(60.dp)
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            Text(
                text = "Student User",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF0F172A)
            )
            Text(
                text = "student@example.com",
                style = MaterialTheme.typography.bodyMedium,
                color = Color.Gray
            )
            
            Spacer(modifier = Modifier.height(32.dp))
            
            // Menu Items
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column {
                    ProfileMenuItem(icon = Icons.Default.Person, title = "Edit Profile")
                    Divider(color = Color(0xFFF1F5F9))
                    ProfileMenuItem(icon = Icons.Default.Settings, title = "Settings")
                    Divider(color = Color(0xFFF1F5F9))
                    ProfileMenuItem(icon = Icons.Default.HelpOutline, title = "Help & Support")
                }
            }
            
            Spacer(modifier = Modifier.height(24.dp))
            
            Button(
                onClick = {
                    authViewModel.logout()
                    onLogout()
                },
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFEE2E2), contentColor = Color(0xFFDC2626)),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth().height(56.dp)
            ) {
                Icon(Icons.Default.Logout, contentDescription = null, modifier = Modifier.size(20.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("Log Out", fontWeight = FontWeight.Bold, fontSize = 16.sp)
            }
        }
    }
}

@Composable
fun ProfileMenuItem(icon: ImageVector, title: String, onClick: () -> Unit = {}) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .background(Color(0xFFF8FAFF), RoundedCornerShape(10.dp)),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, contentDescription = null, tint = Color(0xFF64748B), modifier = Modifier.size(20.dp))
        }
        Spacer(modifier = Modifier.width(16.dp))
        Text(
            text = title,
            style = MaterialTheme.typography.bodyLarge,
            fontWeight = FontWeight.SemiBold,
            color = Color(0xFF0F172A),
            modifier = Modifier.weight(1f)
        )
        Icon(Icons.Default.ChevronRight, contentDescription = null, tint = Color(0xFFCBD5E1))
    }
}
