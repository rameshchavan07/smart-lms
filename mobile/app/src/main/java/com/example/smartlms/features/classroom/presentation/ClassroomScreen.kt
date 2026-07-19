package com.example.smartlms.features.classroom.presentation

import android.Manifest
import android.annotation.SuppressLint
import android.content.pm.PackageManager
import android.os.Build
import android.view.ViewGroup
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat

@SuppressLint("SetJavaScriptEnabled")
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ClassroomScreen(
    meetingUrl: String,
    onNavigateBack: () -> Unit
) {
    val context = LocalContext.current
    var hasPermissions by remember { mutableStateOf(false) }

    val permissionsToRequest = arrayOf(
        Manifest.permission.CAMERA,
        Manifest.permission.RECORD_AUDIO
    )

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions(),
        onResult = { permissions ->
            hasPermissions = permissions.values.all { it }
        }
    )

    LaunchedEffect(Unit) {
        val allGranted = permissionsToRequest.all {
            ContextCompat.checkSelfPermission(context, it) == PackageManager.PERMISSION_GRANTED
        }
        if (allGranted) {
            hasPermissions = true
        } else {
            permissionLauncher.launch(permissionsToRequest)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Live Class") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { innerPadding ->
        if (hasPermissions) {
            AndroidView(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding),
                factory = { ctx ->
                    WebView(ctx).apply {
                        layoutParams = ViewGroup.LayoutParams(
                            ViewGroup.LayoutParams.MATCH_PARENT,
                            ViewGroup.LayoutParams.MATCH_PARENT
                        )
                        settings.javaScriptEnabled = true
                        settings.mediaPlaybackRequiresUserGesture = false
                        settings.domStorageEnabled = true

                        webViewClient = WebViewClient()
                        webChromeClient = object : WebChromeClient() {
                            override fun onPermissionRequest(request: PermissionRequest) {
                                // Auto grant WebView permissions since we already checked Android permissions
                                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                                    request.grant(request.resources)
                                }
                            }
                        }
                        loadUrl(meetingUrl)
                    }
                },
                update = { webView ->
                    // Only load url if it's different from the current one to prevent reloads
                    if (webView.url != meetingUrl) {
                        webView.loadUrl(meetingUrl)
                    }
                }
            )
        } else {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("Camera and Microphone permissions are required for Live Classes.")
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(onClick = { permissionLauncher.launch(permissionsToRequest) }) {
                        Text("Grant Permissions")
                    }
                }
            }
        }
    }
}
