package com.example.theapp.data.model

import kotlinx.serialization.Serializable

@Serializable
data class DeviceProfile(
    val deviceId: String,
    val tenantId: String?,
    val hardware: HardwareInfo,
    val software: SoftwareInfo,
    val security: SecurityInfo,
    val network: NetworkInfo,
    val timestamp: Long = System.currentTimeMillis()
)

@Serializable
data class HardwareInfo(
    val model: String,
    val manufacturer: String,
    val totalRamGb: Double,
    val availableRamGb: Double,
    val totalStorageGb: Double,
    val availableStorageGb: Double,
    val cpuArch: String,
    val screenResolution: String
)

@Serializable
data class SoftwareInfo(
    val osVersion: String,
    val apiLevel: Int,
    val securityPatch: String,
    val language: String
)

@Serializable
data class SecurityInfo(
    val isRooted: Boolean,
    val developerOptionsEnabled: Boolean,
    val mockLocationEnabled: Boolean,
    val adbEnabled: Boolean
)

@Serializable
data class NetworkInfo(
    val type: String, // WIFI, CELLULAR, NONE
    val isVpnActive: Boolean
)
