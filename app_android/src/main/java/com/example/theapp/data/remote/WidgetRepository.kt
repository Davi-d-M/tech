package com.example.theapp.data.remote

import android.content.Context
import com.example.theapp.data.model.RemoteWidget
import kotlinx.coroutines.Dispatchers
import kotlinx.serialization.json.Json
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.IOException

class WidgetRepository(context: Context) {
    private val client = OkHttpClient()
    private val json = Json { ignoreUnknownKeys = true }
    
    // In a real app, this would be your production URL
    private val baseUrl = "https://tech-paxv.onrender.com/api/widgets/current"

    suspend fun fetchCurrentWidget(): RemoteWidget? = withContext(Dispatchers.IO) {
        val request = Request.Builder()
            .url(baseUrl)
            .build()

        try {
            val response = client.newCall(request).execute()
            if (response.isSuccessful) {
                val body = response.body?.string()
                body?.let { json.decodeFromString<RemoteWidget>(it) }
            } else {
                null
            }
        } catch (e: IOException) {
            e.printStackTrace()
            null
        }
    }
}
