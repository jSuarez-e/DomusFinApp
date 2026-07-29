package com.domusfin.app

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.app.Notification
import android.content.Context
import android.util.Log
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import org.json.JSONObject
import kotlin.concurrent.thread

class AppNotificationListener : NotificationListenerService() {

    private val TAG = "AppNotificationListener"

    // Banking packages we want to monitor
    private val bankingPackages = setOf(
        "com.nequi.MobileCommerce",       // Nequi
        "com.daviplata.primera",          // Daviplata
        "com.grupobancolombia.personas",   // Bancolombia Personas
        "com.grupobancolombia.bancolombiadelaesquina" // Bancolombia A la mano
    )

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        super.onNotificationPosted(sbn)
        if (sbn == null) return

        val packageName = sbn.packageName
        if (!bankingPackages.contains(packageName)) return

        val extras = sbn.notification.extras
        val title = extras.getString(Notification.EXTRA_TITLE) ?: ""
        val body = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""

        Log.d(TAG, "Captured notification from $packageName: Title: $title | Body: $body")

        // Send to backend
        sendToBackend(packageName, title, body)
    }

    private fun sendToBackend(packageName: String, title: String, body: String) {
        thread {
            try {
                // Get JWT token from Capacitor Storage SharedPreferences
                val sharedPrefs = getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE)
                val token = sharedPrefs.getString("domusfin_token", null)

                if (token.isNullOrEmpty()) {
                    Log.w(TAG, "No token found in CapacitorStorage. Cannot authenticate auto-capture request.")
                    return@thread
                }

                // Prepare request payload
                val payload = JSONObject().apply {
                    put("packageName", packageName)
                    put("title", title)
                    put("body", body)
                }

                // Send POST request (use loopback IP 10.0.2.2 for local development on Android emulator)
                val url = URL("http://10.0.2.2:3000/api/v1/webhooks/auto-capture")
                
                val conn = url.openConnection() as HttpURLConnection
                conn.requestMethod = "POST"
                conn.setRequestProperty("Content-Type", "application/json; charset=utf-8")
                conn.setRequestProperty("Authorization", "Bearer $token")
                conn.doOutput = true

                val writer = OutputStreamWriter(conn.outputStream)
                writer.write(payload.toString())
                writer.flush()
                writer.close()

                val responseCode = conn.responseCode
                Log.d(TAG, "Auto-capture webhook response code: $responseCode")
                conn.disconnect()
            } catch (e: Exception) {
                Log.e(TAG, "Error sending auto-capture notification to backend", e)
            }
        }
    }
}
