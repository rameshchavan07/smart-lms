package com.example.smartlms.features.chat.data

import kotlinx.serialization.Serializable

@Serializable
data class ContactUserDto(
    val id: String,
    val firstName: String,
    val lastName: String,
    val role: String? = null,
    val profileImage: String? = null
)

@Serializable
data class ChatGroupDto(
    val id: String,
    val name: String,
    val isCourseGroup: Boolean
)

@Serializable
data class ContactsDataDto(
    val peers: List<ContactUserDto> = emptyList(),
    val teachers: List<ContactUserDto> = emptyList(),
    val students: List<ContactUserDto> = emptyList(),
    val groups: List<ChatGroupDto> = emptyList()
)

@Serializable
data class ContactsResponse(
    val contacts: ContactsDataDto
)

@Serializable
data class MessageDto(
    val id: String,
    val content: String,
    val senderId: String,
    val receiverId: String? = null,
    val groupId: String? = null,
    val createdAt: String,
    val sender: ContactUserDto? = null
)

@Serializable
data class MessagesResponse(
    val messages: List<MessageDto>
)

@Serializable
data class SendMessageRequest(
    val content: String,
    val receiverId: String? = null,
    val groupId: String? = null
)

@Serializable
data class SendMessageResponse(
    val message: String,
    val data: MessageDto
)
