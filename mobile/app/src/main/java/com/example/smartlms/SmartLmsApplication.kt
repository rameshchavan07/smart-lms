package com.example.smartlms

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class SmartLmsApplication : Application() {
    override fun onCreate() {
        super.onCreate()
    }
}
