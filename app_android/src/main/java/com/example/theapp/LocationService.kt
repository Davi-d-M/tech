package com.example.theapp

import android.app.*
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat
import com.google.android.gms.location.*
import java.util.concurrent.TimeUnit
import android.os.BatteryManager
import android.content.IntentFilter
import android.provider.Settings
import kotlinx.coroutines.*

class LocationService : Service() {
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var locationCallback: LocationCallback
    private var deviceId: String? = null
    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    override fun onCreate() {
        super.onCreate()
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
        
        locationCallback = object : LocationCallback() {
            override fun onLocationResult(locationResult: LocationResult) {
                for (location in locationResult.locations) {
                    // Apex OS: Sync coordinates to Device Registry
                    syncLocationToGrid(location.latitude, location.longitude)
                }
            }
        }
    }

    private fun syncLocationToGrid(lat: Double, lon: Double) {
        val batteryPct = getBatteryPercentage()
        
        serviceScope.launch {
            deviceId?.let { id ->
                SupabaseNode.updateDevicePulse(id, batteryPct, lat, lon)
            }
        }
        
        println("SINGULARITY: Node Movement Tracked -> $lat, $lon")
    }

    private fun getBatteryPercentage(): Int {
        val batteryStatus: Intent? = IntentFilter(Intent.ACTION_BATTERY_CHANGED).let { ifilter ->
            this.registerReceiver(null, ifilter)
        }
        val level: Int = batteryStatus?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
        val scale: Int = batteryStatus?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1
        return if (level >= 0 && scale > 0) (level * 100 / scale.toFloat()).toInt() else 0
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        deviceId = intent?.getStringExtra("DEVICE_ID") ?: Settings.Secure.getString(contentResolver, Settings.Secure.ANDROID_ID)
        
        createNotificationChannel()
        val notification = NotificationCompat.Builder(this, "TITAN_LOCATION")
            .setContentTitle("Apex Titan Tracker")
            .setContentText("Rider Location Synchronization Active")
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .build()

        startForeground(1, notification)
        requestLocationUpdates()

        return START_STICKY
    }

    private fun requestLocationUpdates() {
        val request = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, TimeUnit.SECONDS.toMillis(60))
            .setMinUpdateIntervalMillis(TimeUnit.SECONDS.toMillis(30))
            .build()

        try {
            fusedLocationClient.requestLocationUpdates(request, locationCallback, Looper.getMainLooper())
        } catch (e: SecurityException) {
            println("TITAN: Security Exception -> ${e.message}")
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                "TITAN_LOCATION",
                "Titan Logistics Tracking",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        serviceScope.cancel()
        fusedLocationClient.removeLocationUpdates(locationCallback)
    }
}
