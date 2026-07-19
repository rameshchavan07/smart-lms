package com.example.smartlms.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "smart_lms_prefs")

@Singleton
class TokenManager @Inject constructor(@ApplicationContext private val context: Context) {

    companion object {
        private val JWT_TOKEN_KEY = stringPreferencesKey("jwt_token")
        private val USER_ROLE_KEY = stringPreferencesKey("user_role")
        private val INSTITUTE_CODE_KEY = stringPreferencesKey("institute_code")
        private val USER_ID_KEY = stringPreferencesKey("user_id")
    }

    val tokenFlow: Flow<String?> = context.dataStore.data.map { preferences ->
        preferences[JWT_TOKEN_KEY]
    }

    val roleFlow: Flow<String?> = context.dataStore.data.map { preferences ->
        preferences[USER_ROLE_KEY]
    }

    val instituteCodeFlow: Flow<String?> = context.dataStore.data.map { preferences ->
        preferences[INSTITUTE_CODE_KEY]
    }

    val userIdFlow: Flow<String?> = context.dataStore.data.map { preferences ->
        preferences[USER_ID_KEY]
    }

    suspend fun saveToken(token: String, role: String, instituteCode: String? = null, userId: String? = null) {
        context.dataStore.edit { preferences ->
            preferences[JWT_TOKEN_KEY] = token
            preferences[USER_ROLE_KEY] = role
            if (instituteCode != null) {
                preferences[INSTITUTE_CODE_KEY] = instituteCode
            }
            if (userId != null) {
                preferences[USER_ID_KEY] = userId
            }
        }
    }

    suspend fun clearToken() {
        context.dataStore.edit { preferences ->
            preferences.remove(JWT_TOKEN_KEY)
            preferences.remove(USER_ROLE_KEY)
            preferences.remove(INSTITUTE_CODE_KEY)
            preferences.remove(USER_ID_KEY)
        }
    }
}
