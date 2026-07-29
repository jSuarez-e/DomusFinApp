package com.domusfin.app

import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import android.content.Intent
import android.provider.Settings

@CapacitorPlugin(name = "AndroidSettings")
class AndroidSettingsPlugin : Plugin() {

    @PluginMethod
    fun openNotificationSettings(call: PluginCall) {
        try {
            val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
            val result = JSObject().apply {
                put("success", true)
            }
            call.resolve(result)
        } catch (e: Exception) {
            call.reject("Error opening notification listener settings: ${e.message}", e)
        }
    }
}
