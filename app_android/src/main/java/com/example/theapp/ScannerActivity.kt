package com.example.theapp

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.foundation.layout.padding
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.label.ImageLabeling
import com.google.mlkit.vision.label.defaults.ImageLabelerOptions
import java.util.concurrent.Executors

class ScannerActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        val mode = intent.getStringExtra("SCAN_MODE") ?: "BARCODE"

        setContent {
            MaterialTheme {
                Surface(modifier = Modifier.fillMaxSize(), color = Color.Black) {
                    if (mode == "TRIAGE") {
                        EdgeAiTriage(onTriageDetected = { result ->
                            val intent = Intent().apply {
                                putExtra("TRIAGE_RESULT", result)
                            }
                            setResult(Activity.RESULT_OK, intent)
                            finish()
                        })
                    } else if (mode == "SHELF") {
                        ShelfScanner(onLabelsDetected = { labels ->
                            val intent = Intent().apply {
                                putExtra("SHELF_LABELS", labels.toTypedArray())
                            }
                            setResult(Activity.RESULT_OK, intent)
                            finish()
                        })
                    } else {
                        BarcodeScanner(onBarcodeDetected = { result ->
                            val intent = Intent().apply {
                                putExtra("SCAN_RESULT", result)
                            }
                            setResult(Activity.RESULT_OK, intent)
                            finish()
                        })
                    }
                }
            }
        }
    }
}

@SuppressLint("UnsafeOptInUsageError")
@Composable
fun EdgeAiTriage(onTriageDetected: (String) -> Unit) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val cameraExecutor = Executors.newSingleThreadExecutor()
    val labeler = ImageLabeling.getClient(ImageLabelerOptions.DEFAULT_OPTIONS)

    Box(modifier = Modifier.fillMaxSize()) {
        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { ctx ->
                val previewView = PreviewView(ctx)
                val cameraProviderFuture = ProcessCameraProvider.getInstance(ctx)

                cameraProviderFuture.addListener({
                    val cameraProvider = cameraProviderFuture.get()
                    val preview = Preview.Builder().build().also {
                        it.surfaceProvider = previewView.surfaceProvider
                    }

                    val imageAnalyzer = ImageAnalysis.Builder()
                        .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                        .build()
                        .also {
                            it.setAnalyzer(cameraExecutor) { imageProxy ->
                                val mediaImage = imageProxy.image
                                if (mediaImage != null) {
                                    val image = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)
                                    labeler.process(image)
                                        .addOnSuccessListener { labels ->
                                            for (label in labels) {
                                                if (label.confidence > 0.8) {
                                                    onTriageDetected(label.text)
                                                    break
                                                }
                                            }
                                        }
                                        .addOnCompleteListener { imageProxy.close() }
                                }
                            }
                        }

                    val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA
                    cameraProvider.unbindAll()
                    cameraProvider.bindToLifecycle(lifecycleOwner, cameraSelector, preview, imageAnalyzer)
                }, ContextCompat.getMainExecutor(ctx))
                previewView
            }
        )
        Text(
            text = "AI Triage Active: Point at Gadget",
            color = Color.White,
            modifier = Modifier.align(Alignment.TopCenter).padding(top = 20.dp),
            style = MaterialTheme.typography.titleMedium
        )
    }
}

@SuppressLint("UnsafeOptInUsageError")
@Composable
fun ShelfScanner(onLabelsDetected: (List<String>) -> Unit) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val cameraExecutor = Executors.newSingleThreadExecutor()
    val labeler = ImageLabeling.getClient(ImageLabelerOptions.DEFAULT_OPTIONS)

    Box(modifier = Modifier.fillMaxSize()) {
        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { ctx ->
                val previewView = PreviewView(ctx)
                val cameraProviderFuture = ProcessCameraProvider.getInstance(ctx)

                cameraProviderFuture.addListener({
                    val cameraProvider = cameraProviderFuture.get()
                    val preview = Preview.Builder().build().also {
                        it.surfaceProvider = previewView.surfaceProvider
                    }

                    val imageAnalyzer = ImageAnalysis.Builder()
                        .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                        .build()
                        .also {
                            it.setAnalyzer(cameraExecutor) { imageProxy ->
                                val mediaImage = imageProxy.image
                                if (mediaImage != null) {
                                    val image = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)
                                    labeler.process(image)
                                        .addOnSuccessListener { labels ->
                                            val highConfidence = labels.filter { it.confidence > 0.7 }.map { it.text }
                                            if (highConfidence.isNotEmpty()) {
                                                onLabelsDetected(highConfidence)
                                            }
                                        }
                                        .addOnCompleteListener { imageProxy.close() }
                                }
                            }
                        }

                    val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA
                    cameraProvider.unbindAll()
                    cameraProvider.bindToLifecycle(lifecycleOwner, cameraSelector, preview, imageAnalyzer)
                }, ContextCompat.getMainExecutor(ctx))
                previewView
            }
        )
        Text(
            text = "Shelf Audit Active: Scan for Gadgets",
            color = Color.White,
            modifier = Modifier.align(Alignment.TopCenter).padding(top = 20.dp),
            style = MaterialTheme.typography.titleMedium
        )
    }
}

@SuppressLint("UnsafeOptInUsageError")
@Composable
fun BarcodeScanner(onBarcodeDetected: (String) -> Unit) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val cameraExecutor = Executors.newSingleThreadExecutor()

    Box(modifier = Modifier.fillMaxSize()) {
        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { ctx ->
                val previewView = PreviewView(ctx)
                val cameraProviderFuture = ProcessCameraProvider.getInstance(ctx)

                cameraProviderFuture.addListener({
                    val cameraProvider = cameraProviderFuture.get()
                    val preview = Preview.Builder().build().also {
                        it.surfaceProvider = previewView.surfaceProvider
                    }

                    val imageAnalyzer = ImageAnalysis.Builder()
                        .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                        .build()
                        .also {
                            it.setAnalyzer(cameraExecutor) { imageProxy ->
                                val mediaImage = imageProxy.image
                                if (mediaImage != null) {
                                    val image = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)
                                    val scanner = BarcodeScanning.getClient()

                                    scanner.process(image)
                                        .addOnSuccessListener { barcodes ->
                                            for (barcode in barcodes) {
                                                barcode.rawValue?.let { value ->
                                                    onBarcodeDetected(value)
                                                }
                                            }
                                        }
                                        .addOnCompleteListener {
                                            imageProxy.close()
                                        }
                                }
                            }
                        }

                    val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA

                    try {
                        cameraProvider.unbindAll()
                        cameraProvider.bindToLifecycle(
                            lifecycleOwner,
                            cameraSelector,
                            preview,
                            imageAnalyzer
                        )
                    } catch (exc: Exception) {
                        // Handle error
                    }
                }, ContextCompat.getMainExecutor(ctx))
                previewView
            }
        )
        Text(
            text = "Scan Gadget SKU",
            color = Color.White,
            modifier = Modifier.align(Alignment.TopCenter),
            style = MaterialTheme.typography.headlineSmall
        )
    }
}
