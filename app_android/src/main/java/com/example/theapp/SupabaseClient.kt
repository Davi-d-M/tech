package com.example.theapp

import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
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
            client.newCall(request).execute().use { response ->
                if (response.isSuccessful) {
                    val bodyString = response.body?.string()
                    val jsonArray = org.json.JSONArray(bodyString)
                    if (jsonArray.length() > 0) {
                        val value = jsonArray.getJSONObject(0).getJSONObject("value")
                        val domain = value.getString("trusted_domain")
                        val url = value.getString("production_url")
                        Pair(domain, url)
                    } else null
                } else null
            }
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    fun claimInvitation(token: String): Triple<String, String, String>? {
        val request = Request.Builder()
            .url("$SUPABASE_URL/rest/v1/invitations?token=eq.$token&status=eq.Unused&select=tenant_id,role,tenants(name)")
            .addHeader("apikey", SUPABASE_KEY)
            .addHeader("Authorization", "Bearer $SUPABASE_KEY")
            .build()

        return try {
            client.newCall(request).execute().use { response ->
                if (response.isSuccessful) {
                    val bodyString = response.body?.string()
                    val jsonArray = org.json.JSONArray(bodyString)
                    if (jsonArray.length() > 0) {
                        val obj = jsonArray.getJSONObject(0)
                        val tenantId = obj.getString("tenant_id")
                        val role = obj.getString("role")
                        val tenantName = obj.getJSONObject("tenants").getString("name")
                        
                        // 2. Mark as Claimed
                        val updatePayload = JSONObject().apply { put("status", "Claimed") }
                        val updateRequest = Request.Builder()
                            .url("$SUPABASE_URL/rest/v1/invitations?token=eq.$token")
                            .patch(updatePayload.toString().toRequestBody("application/json".toMediaType()))
                            .addHeader("apikey", SUPABASE_KEY)
                            .addHeader("Authorization", "Bearer $SUPABASE_KEY")
                            .build()
                        
                        client.newCall(updateRequest).execute().use { updateResponse ->
                            if (updateResponse.isSuccessful) {
                                Triple(tenantId, role, tenantName)
                            } else null
                        }
                    } else null
                } else null
            }
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    fun registerDevice(tenantId: String, deviceId: String, model: String, osVersion: String): Boolean {
        val payload = JSONObject().apply {
            put("tenant_id", tenantId)
            put("device_id", deviceId)
            put("model", model)
            put("os_version", osVersion)
            put("status", "Active")
        }
        
        val request = Request.Builder()
            .url("$SUPABASE_URL/rest/v1/device_registry")
            .post(payload.toString().toRequestBody("application/json".toMediaType()))
            .addHeader("apikey", SUPABASE_KEY)
            .addHeader("Authorization", "Bearer $SUPABASE_KEY")
            .addHeader("Prefer", "resolution=merge-duplicates")
            .build()

        return try {
            client.newCall(request).execute().use { it.isSuccessful }
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }

    fun updateDevicePulse(deviceId: String, battery: Int, lat: Double? = null, lon: Double? = null): Boolean {
        val payload = JSONObject().apply {
            put("battery_level", battery)
            if (lat != null && lon != null) {
                put("last_gps", JSONObject().apply {
                    put("lat", lat)
                    put("lng", lon)
                })
            }
            put("last_sync_at", "now()")
        }

        val request = Request.Builder()
            .url("$SUPABASE_URL/rest/v1/device_registry?device_id=eq.$deviceId")
            .patch(payload.toString().toRequestBody("application/json".toMediaType()))
            .addHeader("apikey", SUPABASE_KEY)
            .addHeader("Authorization", "Bearer $SUPABASE_KEY")
            .build()

        return try {
            client.newCall(request).execute().use { it.isSuccessful }
        } catch (e: Exception) {
            false
        }
    }
}
