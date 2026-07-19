package com.example.smartlms.features.chat.presentation

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.smartlms.features.chat.data.ChatGroupDto
import com.example.smartlms.features.chat.data.ContactUserDto

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatListScreen(
    viewModel: ChatViewModel = hiltViewModel(),
    onNavigateToRoom: (targetId: String, isGroup: Boolean, name: String) -> Unit,
    onNavigateBack: () -> Unit
) {
    val listState by viewModel.listState.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.fetchContacts()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Messages", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFFF8FAFF)
                )
            )
        },
        containerColor = Color(0xFFF8FAFF)
    ) { padding ->
        Box(modifier = Modifier.padding(padding).fillMaxSize()) {
            when (val state = listState) {
                is ChatListState.Loading -> {
                    CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
                }
                is ChatListState.Error -> {
                    Text(
                        text = "Error: ${state.message}",
                        color = MaterialTheme.colorScheme.error,
                        modifier = Modifier.align(Alignment.Center).padding(16.dp)
                    )
                }
                is ChatListState.Success -> {
                    LazyColumn(contentPadding = PaddingValues(16.dp)) {
                        val contacts = state.contactsData

                        if (contacts.groups.isNotEmpty()) {
                            item { SectionHeader("Groups") }
                            items(contacts.groups) { group ->
                                ChatListItem(
                                    name = group.name,
                                    subtitle = if (group.isCourseGroup) "Course Group" else "Group",
                                    onClick = { onNavigateToRoom(group.id, true, group.name) }
                                )
                            }
                            item { Spacer(modifier = Modifier.height(16.dp)) }
                        }

                        if (contacts.teachers.isNotEmpty()) {
                            item { SectionHeader("Teachers") }
                            items(contacts.teachers) { teacher ->
                                ChatListItem(
                                    name = "${teacher.firstName} ${teacher.lastName}",
                                    subtitle = "Teacher",
                                    onClick = { onNavigateToRoom(teacher.id, false, "${teacher.firstName} ${teacher.lastName}") }
                                )
                            }
                            item { Spacer(modifier = Modifier.height(16.dp)) }
                        }

                        if (contacts.peers.isNotEmpty()) {
                            item { SectionHeader("Peers") }
                            items(contacts.peers) { peer ->
                                ChatListItem(
                                    name = "${peer.firstName} ${peer.lastName}",
                                    subtitle = "Student",
                                    onClick = { onNavigateToRoom(peer.id, false, "${peer.firstName} ${peer.lastName}") }
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun SectionHeader(title: String) {
    Text(
        text = title,
        style = MaterialTheme.typography.titleMedium,
        fontWeight = FontWeight.SemiBold,
        color = Color(0xFF64748B),
        modifier = Modifier.padding(vertical = 8.dp)
    )
}

@Composable
fun ChatListItem(name: String, subtitle: String, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
            .clickable(onClick = onClick),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .background(Color(0xFFE2E8F0)),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = name.firstOrNull()?.uppercase() ?: "?",
                    style = MaterialTheme.typography.titleMedium,
                    color = Color(0xFF475569)
                )
            }
            Spacer(modifier = Modifier.width(16.dp))
            Column {
                Text(
                    text = name,
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Medium,
                    color = Color(0xFF1E293B)
                )
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = Color(0xFF64748B)
                )
            }
        }
    }
}
