package com.example.theapp.worker

import android.content.Context
import androidx.glance.appwidget.updateAll
import androidx.work.CoroutineWorker
import androidx.work.ListenableWorker.Result
import androidx.work.WorkerParameters
import com.example.theapp.data.remote.WidgetRepository
import com.example.theapp.widget.ApexHomeWidget

class WidgetSyncWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): androidx.work.ListenableWorker.Result {
        return try {
            val repository = WidgetRepository(applicationContext)
            val remoteWidget = repository.fetchCurrentWidget()
            
            if (remoteWidget != null) {
                // 💾 Apex OS: Persist Remote State
                val prefs = applicationContext.getSharedPreferences("apex_widget_prefs", Context.MODE_PRIVATE)
                prefs.edit().apply {
                    putString("widget_title", remoteWidget.title)
                    putString("widget_desc", remoteWidget.description)
                    putString("widget_btn", remoteWidget.buttonText)
                    apply()
                }
                
                // Trigger Glance refresh
                ApexHomeWidget().updateAll(applicationContext)
            }
            
            androidx.work.ListenableWorker.Result.success()
        } catch (e: Exception) {
            androidx.work.ListenableWorker.Result.retry()
        }
    }
}
