package com.example.theapp.data.model

import kotlinx.serialization.Serializable

@Serializable
data class RemoteWidget(
    val id: String,
    val title: String? = null,
    val description: String? = null,
    val imageUrl: String? = null,
    val buttonText: String? = "Open App",
    val destination: String? = "/",
    val version: Int = 1,
    val backgroundColor: String? = "#ffffff",
    val textColor: String? = "#334155"
)
