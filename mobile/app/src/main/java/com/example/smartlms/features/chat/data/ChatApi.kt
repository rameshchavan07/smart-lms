package com.example.smartlms.features.chat.data

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

interface ChatApi {
    @GET("communications/contacts")
    suspend fun getContacts(): Response<ContactsResponse>

    @GET("communications/messages/{id}")
    suspend fun getMessages(@Path("id") targetId: String): Response<MessagesResponse>

    @POST("communications/messages")
    suspend fun sendMessage(@Body request: SendMessageRequest): Response<SendMessageResponse>
}
