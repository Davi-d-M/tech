package com.example.theapp

import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import org.json.JSONObject
import java.util.concurrent.TimeUnit

object SupabaseNode {
    private val client = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .build()

    private const val SUPABASE_URL = "https://tmnlcbzjhdjggbkgamor.supabase.co"
    private const val SUPABASE_KEY = "sb_publishable_A32ecbkKOs482Zkq_biWZA_PVoRroXf"

    fun fetchBridgeConfig(): Pair<String, String>? {
        val request = Request.Builder()
            .url("$SUPABASE_URL/rest/v1/settings?key=eq.bridge_config&select=value")
            .addHeader("apikey", SUPABASE_KEY)
            .addHeader("Authorization", "Bearer $SUPABASE_KEY")
            .build()

        return try {
            val response: Response = client.newCall(request).execute()
            if (response.isSuccessful) {
                val responseBody = response.body
                val bodyString = responseBody?.string()
                val jsonArray = org.json.JSONArray(bodyString)
                if (jsonArray.length() > 0) {
                    val value = jsonArray.getJSONObject(0).getJSONObject("value")
                    val domain = value.getString("trusted_domain")
                    val url = value.getString("production_url")
                    Pair(domain, url)
                } else null
            } else null
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
}
