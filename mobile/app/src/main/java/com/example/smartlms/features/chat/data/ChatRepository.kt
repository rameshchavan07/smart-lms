package com.example.smartlms.features.chat.data

import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ChatRepository @Inject constructor(
    private val api: ChatApi
) {
    suspend fun getContacts() = runCatching {
        val response = api.getContacts()
        if (response.isSuccessful) {
            response.body()?.contacts ?: throw Exception("Empty contacts response")
        } else {
            throw Exception(response.message())
        }
    }

    suspend fun getMessages(targetId: String) = runCatching {
        val response = api.getMessages(targetId)
        if (response.isSuccessful) {
            response.body()?.messages ?: emptyList()
        } else {
            throw Exception(response.message())
        }
    }

    suspend fun sendMessage(content: String, targetId: String, isGroup: Boolean) = runCatching {
        val request = if (isGroup) {
            SendMessageRequest(content = content, groupId = targetId)
        } else {
            SendMessageRequest(content = content, receiverId = targetId)
        }
        val response = api.sendMessage(request)
        if (response.isSuccessful) {
            response.body()?.data ?: throw Exception("Empty send message response")
        } else {
            throw Exception(response.message())
        }
    }
}
