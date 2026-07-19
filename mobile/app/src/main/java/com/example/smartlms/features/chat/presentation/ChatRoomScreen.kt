package com.example.smartlms.features.chat.presentation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.smartlms.features.chat.data.MessageDto

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatRoomScreen(
    targetId: String,
    isGroup: Boolean,
    roomName: String,
    viewModel: ChatViewModel = hiltViewModel(),
    onNavigateBack: () -> Unit
) {
    val roomState by viewModel.roomState.collectAsState()
    var messageText by remember { mutableStateOf("") }
    val listState = rememberLazyListState()

    LaunchedEffect(targetId) {
        viewModel.loadChatRoom(targetId, isGroup)
    }

    LaunchedEffect(roomState) {
        if (roomState is ChatRoomState.Success) {
            val messages = (roomState as ChatRoomState.Success).messages
            if (messages.isNotEmpty()) {
                listState.animateScrollToItem(messages.size - 1)
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(roomName, fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color.White
                )
            )
        },
        containerColor = Color(0xFFF8FAFF)
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
        ) {
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
            ) {
                when (val state = roomState) {
                    is ChatRoomState.Loading -> {
                        CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
                    }
                    is ChatRoomState.Error -> {
                        Text(
                            text = "Error: ${state.message}",
                            color = MaterialTheme.colorScheme.error,
                            modifier = Modifier.align(Alignment.Center).padding(16.dp)
                        )
                    }
                    is ChatRoomState.Success -> {
                        LazyColumn(
                            state = listState,
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(16.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            items(state.messages) { message ->
                                val isMe = message.senderId == state.currentUserId
                                ChatMessageBubble(message = message, isMe = isMe)
                            }
                        }
                    }
                }
            }

            // Input Bar
            Surface(
                color = Color.White,
                shadowElevation = 8.dp,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .padding(16.dp)
                        .fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = messageText,
                        onValueChange = { messageText = it },
                        modifier = Modifier.weight(1f),
                        placeholder = { Text("Type a message...") },
                        shape = RoundedCornerShape(24.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            unfocusedBorderColor = Color(0xFFE2E8F0),
                            focusedBorderColor = MaterialTheme.colorScheme.primary,
                        ),
                        maxLines = 4,
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Default)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    IconButton(
                        onClick = {
                            if (messageText.isNotBlank()) {
                                viewModel.sendMessage(messageText)
                                messageText = ""
                            }
                        },
                        modifier = Modifier
                            .background(MaterialTheme.colorScheme.primary, CircleShape)
                            .size(48.dp)
                    ) {
                        Icon(
                            Icons.AutoMirrored.Filled.Send,
                            contentDescription = "Send",
                            tint = Color.White
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun ChatMessageBubble(message: MessageDto, isMe: Boolean) {
    val backgroundColor = if (isMe) MaterialTheme.colorScheme.primary else Color.White
    val textColor = if (isMe) Color.White else Color(0xFF1E293B)
    val alignment = if (isMe) Alignment.CenterEnd else Alignment.CenterStart
    val shape = if (isMe) {
        RoundedCornerShape(16.dp, 16.dp, 0.dp, 16.dp)
    } else {
        RoundedCornerShape(16.dp, 16.dp, 16.dp, 0.dp)
    }

    Box(
        modifier = Modifier.fillMaxWidth(),
        contentAlignment = alignment
    ) {
        Column(horizontalAlignment = if (isMe) Alignment.End else Alignment.Start) {
            if (!isMe && message.sender != null) {
                Text(
                    text = "${message.sender.firstName} ${message.sender.lastName}",
                    style = MaterialTheme.typography.labelSmall,
                    color = Color(0xFF64748B),
                    modifier = Modifier.padding(bottom = 2.dp, start = 4.dp)
                )
            }
            Surface(
                color = backgroundColor,
                shape = shape,
                shadowElevation = if (isMe) 0.dp else 1.dp
            ) {
                Text(
                    text = message.content,
                    color = textColor,
                    style = MaterialTheme.typography.bodyLarge,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp)
                )
            }
        }
    }
}
