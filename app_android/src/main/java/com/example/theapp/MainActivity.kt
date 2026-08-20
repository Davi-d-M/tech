package com.example.theapp

import android.app.Activity
import android.content.Context
import android.content.Intent
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
import com.example.theapp.ui.theme.TheAppTheme
import java.util.concurrent.Executor

class MainActivity : FragmentActivity() {
    private lateinit var executor: Executor
    private lateinit var biometricPrompt: BiometricPrompt
    private lateinit var promptInfo: BiometricPrompt.PromptInfo
    private var titanWebView: WebView? = null

    private val scannerLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        if (result.resultCode == RESULT_OK) {
            val barcode = result.data?.getStringExtra("SCAN_RESULT")
            barcode?.let {
                titanWebView?.evaluateJavascript("javascript:if(window.onTitanScan) window.onTitanScan('$it');", null)
                Toast.makeText(this, "SKU Captured: $it", Toast.LENGTH_SHORT).show()
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
                        TitanHubWebBridge("https://tech-paxv.onrender.com/admin", onWebViewCreated = { titanWebView = it })
                        
                        // Handle Intent after WebView is ready or via URL change
                        LaunchedEffect(intent) {
                            handleIntent(intent)
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

    fun launchScanner() {
        val intent = Intent(this, ScannerActivity::class.java)
        scannerLauncher.launch(intent)
    }
}

class TitanBridge(private val activity: MainActivity, private val webView: WebView) {
    @JavascriptInterface
    fun triggerScanner() {
        activity.runOnUiThread {
            activity.launchScanner()
        }
    }

    @JavascriptInterface
    fun toggleTracking(active: Boolean) {
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

                if (WebViewFeature.isFeatureSupported(WebViewFeature.FORCE_DARK)) {
                    WebSettingsCompat.setForceDark(settings, WebSettingsCompat.FORCE_DARK_OFF)
                }

                addJavascriptInterface(TitanBridge(context as MainActivity, this), "TitanNode")
                onWebViewCreated(this)
                loadUrl(url)
            }
        }
    )
}
