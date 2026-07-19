package com.example.smartlms.data.network

import android.util.Log
import io.socket.client.IO
import io.socket.client.Socket
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SocketManager @Inject constructor() {
    private var socket: Socket? = null
    
    // Using a SharedFlow to emit messages to any active subscribers (like ChatViewModel)
    private val _incomingMessages = MutableSharedFlow<String>(extraBufferCapacity = 10)
    val incomingMessages: SharedFlow<String> = _incomingMessages.asSharedFlow()

    fun connect(token: String) {
        if (socket?.connected() == true) return

        try {
            // Options for Socket.IO connection
            val options = IO.Options.builder()
                .setAuth(mapOf("token" to token))
                .build()

            // In emulator, use 10.0.2.2:5000 (matching Retrofit base url)
            socket = IO.socket("http://10.0.2.2:5000", options)

            socket?.on(Socket.EVENT_CONNECT) {
                Log.d("SocketManager", "Connected to Socket.IO server!")
            }

            socket?.on(Socket.EVENT_CONNECT_ERROR) { args ->
                Log.e("SocketManager", "Connection error: ${args.contentToString()}")
            }

            socket?.on("receive_message") { args ->
                if (args.isNotEmpty()) {
                    val msgJson = args[0].toString()
                    Log.d("SocketManager", "Received message: $msgJson")
                    _incomingMessages.tryEmit(msgJson)
                }
            }

            socket?.connect()
        } catch (e: Exception) {
            Log.e("SocketManager", "Error connecting to Socket.IO", e)
        }
    }

    fun joinCourseRoom(courseId: String) {
        socket?.emit("join_course", courseId)
    }

    fun joinGroupRoom(groupId: String) {
        socket?.emit("join_group", groupId)
    }

    fun disconnect() {
        socket?.disconnect()
        socket = null
        Log.d("SocketManager", "Disconnected from Socket.IO server")
    }
}
