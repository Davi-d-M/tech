package com.example.theapp

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkRequest
import android.os.BatteryManager
import android.os.Build
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.webkit.WebSettingsCompat
import androidx.webkit.WebViewFeature
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.biometric.BiometricPrompt
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.lifecycleScope
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.example.theapp.ui.theme.TheAppTheme
import java.util.concurrent.Executor

import android.graphics.Bitmap
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class MainActivity : FragmentActivity() {
    private lateinit var executor: Executor
    private lateinit var biometricPrompt: BiometricPrompt
    private lateinit var promptInfo: BiometricPrompt.PromptInfo
    private var titanWebView: WebView? = null
    
    private var appUrl by mutableStateOf("https://tech-wb1o.onrender.com/admin")

    private var memberPassBitmap by mutableStateOf<Bitmap?>(null)

    private val scannerLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        if (result.resultCode == RESULT_OK) {
            val barcode = result.data?.getStringExtra("SCAN_RESULT")
            val triage = result.data?.getStringExtra("TRIAGE_RESULT")

            barcode?.let {
                titanWebView?.evaluateJavascript("javascript:if(window.onTitanScan) window.onTitanScan('$it');", null)
                Toast.makeText(this, "SKU Captured: $it", Toast.LENGTH_SHORT).show()
            }

            triage?.let {
                titanWebView?.evaluateJavascript("javascript:if(window.onTitanTriage) window.onTitanTriage('$it');", null)
                Toast.makeText(this, "AI Triage: $it", Toast.LENGTH_LONG).show()
            }

            val shelfLabels = result.data?.getStringArrayExtra("SHELF_LABELS")
            shelfLabels?.let { labels ->
                val labelsJson = labels.joinToString(",")
                titanWebView?.evaluateJavascript("javascript:if(window.onTitanShelfAudit) window.onTitanShelfAudit('$labelsJson');", null)
                Toast.makeText(this, "Shelf Data Synced", Toast.LENGTH_SHORT).show()
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        
        executor = ContextCompat.getMainExecutor(this)
        
        var isAuthorized by mutableStateOf(false)
        var isAuthenticating by mutableStateOf(true)

        biometricPrompt = BiometricPrompt(this, executor,
            object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                    super.onAuthenticationError(errorCode, errString)
                    isAuthenticating = false
                    Toast.makeText(applicationContext, "Authentication error: $errString", Toast.LENGTH_SHORT).show()
                    if (errorCode == BiometricPrompt.ERROR_NEGATIVE_BUTTON) {
                        finish()
                    }
                }

                override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                    super.onAuthenticationSucceeded(result)
                    isAuthorized = true
                    isAuthenticating = false
                }

                override fun onAuthenticationFailed() {
                    super.onAuthenticationFailed()
                    Toast.makeText(applicationContext, "Authentication failed", Toast.LENGTH_SHORT).show()
                }
            })

        promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle("Apex Titan Shield")
            .setSubtitle("Biometric authorization required for Command Access")
            .setNegativeButtonText("Exit")
            .build()

        biometricPrompt.authenticate(promptInfo)

        lifecycleScope.launch(Dispatchers.IO) {
            val config = SupabaseNode.fetchBridgeConfig()
            if (config != null) {
                val (domain, url) = config
                val masterKey = MasterKey.Builder(this@MainActivity)
                    .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                    .build()
                val securePrefs = EncryptedSharedPreferences.create(
                    this@MainActivity,
                    "titan_secure_storage",
                    masterKey,
                    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
                )
                securePrefs.edit().putString("bridge_domain", domain).apply()
                
                withContext(Dispatchers.Main) {
                    appUrl = "$url/admin"
                    titanWebView?.loadUrl(appUrl)
                }
            }
        }

        val connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val networkRequest = NetworkRequest.Builder().build()
        connectivityManager.registerNetworkCallback(networkRequest, object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                runOnUiThread {
                    syncOfflineDrops()
                }
            }
        })

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (titanWebView?.canGoBack() == true) {
                    titanWebView?.goBack()
                } else {
                    finish()
                }
            }
        })

        setContent {
            TheAppTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background,
                ) {
                    if (isAuthorized) {
                        TitanHubWebBridge(appUrl, onWebViewCreated = { titanWebView = it })

                        // Handle Intent after WebView is ready or via URL change
                        LaunchedEffect(intent) {
                            handleIntent(intent)
                        }

                        // Phase 10: Titan Member Pass Overlay
                        memberPassBitmap?.let { bitmap ->
                            Dialog(onDismissRequest = { memberPassBitmap = null }) {
                                Box(
                                    modifier = Modifier
                                        .size(320.dp)
                                        .background(MaterialTheme.colorScheme.surface, shape = MaterialTheme.shapes.extraLarge)
                                        .padding(24.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text(
                                            "Titan Member Pass",
                                            style = MaterialTheme.typography.headlineSmall,
                                            color = MaterialTheme.colorScheme.primary,
                                            modifier = Modifier.padding(bottom = 16.dp)
                                        )
                                        Image(
                                            bitmap = bitmap.asImageBitmap(),
                                            contentDescription = "Member QR",
                                            modifier = Modifier.size(200.dp)
                                        )
                                        Text(
                                            "Scan for Secure Handover",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.secondary,
                                            modifier = Modifier.padding(top = 16.dp)
                                        )
                                    }
                                }
                            }
                        }
                    } else if (isAuthenticating) {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                        }
                    } else {
                        // Fallback or retry UI
                    }
                }
            }
        }
    }

    private fun handleIntent(intent: Intent?) {
        val shortcutId = intent?.getStringExtra("shortcut_id")
        when (shortcutId) {
            "scan_sku" -> {
                launchScanner()
            }
            "new_order" -> {
                titanWebView?.loadUrl("https://tech-paxv.onrender.com/admin/orders?action=new")
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleIntent(intent)
    }

    fun launchScanner(mode: String = "BARCODE") {
        val intent = Intent(this, ScannerActivity::class.java).apply {
            putExtra("SCAN_MODE", mode)
        }
        scannerLauncher.launch(intent)
    }

    fun setMemberPass(bitmap: Bitmap) {
        memberPassBitmap = bitmap
    }

    fun triggerStepUpAuth() {
        val stepUpBiometricPrompt = BiometricPrompt(this, executor,
            object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                    super.onAuthenticationSucceeded(result)
                    titanWebView?.evaluateJavascript("javascript:if(window.onTitanStepUpSuccess) window.onTitanStepUpSuccess();", null)
                }
            })

        val stepUpPromptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle("Identity Re-Verification")
            .setSubtitle("Authorized Shield required for sensitive action")
            .setNegativeButtonText("Cancel")
            .build()

        stepUpBiometricPrompt.authenticate(stepUpPromptInfo)
    }

    private fun syncOfflineDrops() {
        val masterKey = MasterKey.Builder(this)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
        val prefs = EncryptedSharedPreferences.create(
            this,
            "titan_secure_storage",
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
        val queue = prefs.getStringSet("offline_drops", mutableSetOf())?.toList() ?: emptyList()
        
        if (queue.isNotEmpty()) {
            Toast.makeText(this, "Singularity: Syncing ${queue.size} Secure Drops...", Toast.LENGTH_SHORT).show()
            queue.forEach { orderId ->
                titanWebView?.evaluateJavascript("javascript:if(window.onTitanSyncOrder) window.onTitanSyncOrder('$orderId');", null)
            }
            prefs.edit().remove("offline_drops").apply()
        }

        // Sync Node Health (Battery)
        val batteryPct = getBatteryPercentage()
        titanWebView?.evaluateJavascript("javascript:if(window.onTitanNodePulse) window.onTitanNodePulse($batteryPct);", null)
    }

    private fun getBatteryPercentage(): Int {
        val batteryStatus: Intent? = IntentFilter(Intent.ACTION_BATTERY_CHANGED).let { ifilter ->
            this.registerReceiver(null, ifilter)
        }
        val level: Int = batteryStatus?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
        val scale: Int = batteryStatus?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1
        return if (level >= 0 && scale > 0) (level * 100 / scale.toFloat()).toInt() else 0
    }
}

class TitanBridge(private val activity: MainActivity, private val webView: WebView) {
    private val masterKey = MasterKey.Builder(activity)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()
    private val prefs = EncryptedSharedPreferences.create(
        activity,
        "titan_secure_storage",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    private fun isTrustedOrigin(): Boolean {
        val url = webView.url ?: ""
        val savedDomain = prefs.getString("bridge_domain", "tech-wb1o.onrender.com") ?: "tech-wb1o.onrender.com"
        return url.startsWith("https://$savedDomain")
    }

    @JavascriptInterface
    fun triggerScanner(mode: String = "BARCODE") {
        if (!isTrustedOrigin()) return
        activity.runOnUiThread {
            activity.launchScanner(mode)
        }
    }

    @JavascriptInterface
    fun generateMemberPass(token: String) {
        if (!isTrustedOrigin()) return
        // Phase 10: Dynamic QR Node
        activity.runOnUiThread {
            try {
                val bitmap = QRCodeGenerator.generate("TITAN-PASS|$token")
                activity.setMemberPass(bitmap)
            } catch (e: Exception) {
                Toast.makeText(activity, "Encryption Error", Toast.LENGTH_SHORT).show()
            }
        }
    }

    @JavascriptInterface
    fun queueMissionCompletion(orderId: Int) {
        if (!isTrustedOrigin()) return
        // Phase 13: Fortified Offline Persistence
        activity.runOnUiThread {
            val queue = prefs.getStringSet("offline_drops", mutableSetOf())?.toMutableSet() ?: mutableSetOf()
            queue.add(orderId.toString())
            prefs.edit().putStringSet("offline_drops", queue).apply()
            
            Toast.makeText(activity, "Secure Drop Saved. Syncing on Uplink...", Toast.LENGTH_LONG).show()
        }
    }

    @JavascriptInterface
    fun toggleTracking(active: Boolean) {
        if (!isTrustedOrigin()) return
        activity.runOnUiThread {
            val intent = Intent(activity, LocationService::class.java)
            if (active) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    activity.startForegroundService(intent)
                } else {
                    activity.startService(intent)
                }
                Toast.makeText(activity, "Titan Tracker Engaged", Toast.LENGTH_SHORT).show()
            } else {
                activity.stopService(intent)
                Toast.makeText(activity, "Titan Tracker Offline", Toast.LENGTH_SHORT).show()
            }
        }
    }

    @JavascriptInterface
    fun reAuthenticate() {
        if (!isTrustedOrigin()) return
        activity.runOnUiThread {
            activity.triggerStepUpAuth()
        }
    }

    @JavascriptInterface
    fun sendNotification(title: String, body: String) {
        // Native notification can be triggered directly here or via a utility
    }
}

@Composable
fun TitanHubWebBridge(url: String, onWebViewCreated: (WebView) -> Unit) {
    AndroidView(
        modifier = Modifier.fillMaxSize(),
        factory = { context ->
            WebView(context).apply {
                webViewClient = WebViewClient()
                settings.apply {
                    javaScriptEnabled = true
                    domStorageEnabled = true
                    loadWithOverviewMode = true
                    useWideViewPort = true
                    cacheMode = WebSettings.LOAD_DEFAULT
                    setSupportMultipleWindows(true)
                }

                if (WebViewFeature.isFeatureSupported(WebViewFeature.ALGORITHMIC_DARKENING)) {
                    WebSettingsCompat.setAlgorithmicDarkeningAllowed(settings, false)
                } else if (WebViewFeature.isFeatureSupported(WebViewFeature.FORCE_DARK)) {
                    @Suppress("DEPRECATION")
                    WebSettingsCompat.setForceDark(settings, WebSettingsCompat.FORCE_DARK_OFF)
                }

                addJavascriptInterface(TitanBridge(context as MainActivity, this), "TitanNode")
                onWebViewCreated(this)
                loadUrl(url)
            }
        }
    )
}
