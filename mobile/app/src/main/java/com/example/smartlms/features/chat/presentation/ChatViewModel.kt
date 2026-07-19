package com.example.smartlms.features.chat.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.smartlms.data.local.TokenManager
import com.example.smartlms.data.network.SocketManager
import com.example.smartlms.features.chat.data.ChatRepository
import com.example.smartlms.features.chat.data.ContactsDataDto
import com.example.smartlms.features.chat.data.MessageDto
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json
import javax.inject.Inject

sealed class ChatListState {
    object Loading : ChatListState()
    data class Success(val contactsData: ContactsDataDto) : ChatListState()
    data class Error(val message: String) : ChatListState()
}

sealed class ChatRoomState {
    object Loading : ChatRoomState()
    data class Success(val messages: List<MessageDto>, val currentUserId: String) : ChatRoomState()
    data class Error(val message: String) : ChatRoomState()
}

@HiltViewModel
class ChatViewModel @Inject constructor(
    private val repository: ChatRepository,
    private val socketManager: SocketManager,
    private val tokenManager: TokenManager,
    private val json: Json
) : ViewModel() {

    private val _listState = MutableStateFlow<ChatListState>(ChatListState.Loading)
    val listState: StateFlow<ChatListState> = _listState.asStateFlow()

    private val _roomState = MutableStateFlow<ChatRoomState>(ChatRoomState.Loading)
    val roomState: StateFlow<ChatRoomState> = _roomState.asStateFlow()

    private var activeRoomTargetId: String? = null
    private var isActiveRoomGroup: Boolean = false

    init {
        observeSocketMessages()
        connectSocket()
    }

    private fun connectSocket() {
        viewModelScope.launch {
            val token = tokenManager.tokenFlow.firstOrNull()
            if (token != null) {
                socketManager.connect(token)
            }
        }
    }

    private fun observeSocketMessages() {
        viewModelScope.launch {
            socketManager.incomingMessages.collect { msgString ->
                try {
                    val newMessage = json.decodeFromString<MessageDto>(msgString)
                    // If we are currently in the room where this message belongs, append it
                    val currentState = _roomState.value
                    if (currentState is ChatRoomState.Success) {
                        val belongsToCurrentRoom = if (isActiveRoomGroup) {
                            newMessage.groupId == activeRoomTargetId
                        } else {
                            (newMessage.senderId == activeRoomTargetId || newMessage.receiverId == activeRoomTargetId)
                        }

                        if (belongsToCurrentRoom) {
                            _roomState.update { 
                                ChatRoomState.Success(
                                    messages = currentState.messages + newMessage,
                                    currentUserId = currentState.currentUserId
                                )
                            }
                        }
                    }
                } catch (e: Exception) {
                    // Ignore parse errors for irrelevant events
                }
            }
        }
    }

    fun fetchContacts() {
        viewModelScope.launch {
            _listState.value = ChatListState.Loading
            val result = repository.getContacts()
            if (result.isSuccess) {
                _listState.value = ChatListState.Success(result.getOrDefault(ContactsDataDto()))
            } else {
                _listState.value = ChatListState.Error(result.exceptionOrNull()?.message ?: "Unknown Error")
            }
        }
    }

    fun loadChatRoom(targetId: String, isGroup: Boolean) {
        activeRoomTargetId = targetId
        isActiveRoomGroup = isGroup
        
        if (isGroup) {
            socketManager.joinGroupRoom(targetId)
        }

        viewModelScope.launch {
            val currentUserId = tokenManager.userIdFlow.firstOrNull() ?: ""
            _roomState.value = ChatRoomState.Loading
            val result = repository.getMessages(targetId)
            if (result.isSuccess) {
                _roomState.value = ChatRoomState.Success(result.getOrDefault(emptyList()), currentUserId)
            } else {
                _roomState.value = ChatRoomState.Error(result.exceptionOrNull()?.message ?: "Unknown Error")
            }
        }
    }

    fun sendMessage(content: String) {
        val targetId = activeRoomTargetId ?: return
        val isGroup = isActiveRoomGroup
        viewModelScope.launch {
            val result = repository.sendMessage(content, targetId, isGroup)
            if (result.isSuccess) {
                // Sent successfully. The message will be echoed back via socket, 
                // but we can optionally optimistically append it here.
                // For now, let's rely on the socket echo or API response.
                val newMessage = result.getOrNull()
                val currentState = _roomState.value
                if (newMessage != null && currentState is ChatRoomState.Success) {
                     // Check if it's already there to avoid duplicates if socket echo is fast
                     if (currentState.messages.none { it.id == newMessage.id }) {
                         _roomState.update { 
                            ChatRoomState.Success(
                                messages = currentState.messages + newMessage,
                                currentUserId = currentState.currentUserId
                            )
                        }
                     }
                }
            }
        }
    }

    override fun onCleared() {
        super.onCleared()
        // We might not want to disconnect entirely here if other parts use the socket, 
        // but for now let's disconnect when chat VM is destroyed.
        // Wait, socketManager is singleton, it's fine to keep it connected.
    }
}
