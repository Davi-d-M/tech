package com.example.theapp.widget

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.Button
import androidx.glance.ColorFilter
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.action.actionStartActivity
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import com.example.theapp.MainActivity
import com.example.theapp.data.model.RemoteWidget

class ApexHomeWidget : GlanceAppWidget() {

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        // 💾 Apex OS: Load state from cache
        val prefs = context.getSharedPreferences("apex_widget_prefs", Context.MODE_PRIVATE)
        val widgetData = RemoteWidget(
            id = "cached",
            title = prefs.getString("widget_title", "Apex stores Kenya"),
            description = prefs.getString("widget_desc", "Elite Tech Extraction Grid Active 🦾"),
            buttonText = prefs.getString("widget_btn", "Explore Shop")
        )

        provideContent {
            WidgetContent(widgetData)
        }
    }

    @Composable
    private fun WidgetContent(widget: RemoteWidget) {
        Column(
            modifier = GlanceModifier
                .fillMaxSize()
                .background(Color.White)
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = widget.title ?: "Apex stores",
                style = TextStyle(
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = ColorProvider(Color(0xFF334155))
                )
            )
            
            Spacer(modifier = GlanceModifier.height(8.dp))
            
            Text(
                text = widget.description ?: "Synchronizing data...",
                style = TextStyle(
                    fontSize = 12.sp,
                    color = ColorProvider(Color(0xFF64748B))
                )
            )
            
            Spacer(modifier = GlanceModifier.height(16.dp))
            
            Button(
                text = widget.buttonText ?: "Open App",
                onClick = actionStartActivity<MainActivity>()
            )
        }
    }
}
