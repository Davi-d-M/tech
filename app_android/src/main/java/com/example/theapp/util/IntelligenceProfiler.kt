package com.example.theapp.util

import android.app.ActivityManager
import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Build
import android.os.Environment
import android.os.StatFs
import android.provider.Settings
import android.util.DisplayMetrics
import com.example.theapp.data.model.*
import java.io.File

object IntelligenceProfiler {

    fun collect(context: Context, tenantId: String?): DeviceProfile {
        val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        val memoryInfo = ActivityManager.MemoryInfo()
        activityManager.getMemoryInfo(memoryInfo)

        val statFs = StatFs(Environment.getDataDirectory().path)
        val totalStorage = (statFs.blockSizeLong * statFs.blockCountLong) / (1024.0 * 1024.0 * 1024.0)
        val availableStorage = (statFs.blockSizeLong * statFs.availableBlocksLong) / (1024.0 * 1024.0 * 1024.0)

        val displayMetrics = context.resources.displayMetrics
        val resolution = "${displayMetrics.widthPixels}x${displayMetrics.heightPixels}"

        val hardware = HardwareInfo(
            model = Build.MODEL,
            manufacturer = Build.MANUFACTURER,
            totalRamGb = memoryInfo.totalMem / (1024.0 * 1024.0 * 1024.0),
            availableRamGb = memoryInfo.availMem / (1024.0 * 1024.0 * 1024.0),
            totalStorageGb = totalStorage,
            availableStorageGb = availableStorage,
            cpuArch = Build.SUPPORTED_ABIS.firstOrNull() ?: "unknown",
            screenResolution = resolution
        )

        val software = SoftwareInfo(
            osVersion = Build.VERSION.RELEASE,
            apiLevel = Build.VERSION.SDK_INT,
            securityPatch = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) Build.VERSION.SECURITY_PATCH else "unknown",
            language = context.resources.configuration.locales[0].language
        )

        val security = SecurityInfo(
            isRooted = checkRootMethod(),
            developerOptionsEnabled = Settings.Global.getInt(context.contentResolver, Settings.Global.DEVELOPMENT_SETTINGS_ENABLED, 0) != 0,
            mockLocationEnabled = Settings.Secure.getString(context.contentResolver, Settings.Secure.ALLOW_MOCK_LOCATION) == "1",
            adbEnabled = Settings.Global.getInt(context.contentResolver, Settings.Global.ADB_ENABLED, 0) != 0
        )

        val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val activeNetwork = connectivityManager.activeNetwork
        val caps = connectivityManager.getNetworkCapabilities(activeNetwork)
        val networkType = when {
            caps?.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) == true -> "WIFI"
            caps?.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) == true -> "CELLULAR"
            else -> "NONE"
        }

        val network = NetworkInfo(
            type = networkType,
            isVpnActive = caps?.hasTransport(NetworkCapabilities.TRANSPORT_VPN) == true
        )

        return DeviceProfile(
            deviceId = Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID) ?: "unknown",
            tenantId = tenantId,
            hardware = hardware,
            software = software,
            security = security,
            network = network
        )
    }

    private fun checkRootMethod(): Boolean {
        val paths = arrayOf(
            "/system/app/Superuser.apk",
            "/sbin/su",
            "/system/bin/su",
            "/system/xbin/su",
            "/data/local/xbin/su",
            "/data/local/bin/su",
            "/system/sd/xbin/su",
            "/system/bin/failsafe/su",
            "/data/local/su"
        )
        for (path in paths) {
            if (File(path).exists()) return true
        }
        return false
    }
}
