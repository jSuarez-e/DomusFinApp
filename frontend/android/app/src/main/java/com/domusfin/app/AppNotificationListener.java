package com.domusfin.app;

import android.app.Notification;
import android.content.Context;
import android.content.SharedPreferences;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.util.Log;

import org.json.JSONObject;

import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

public class AppNotificationListener extends NotificationListenerService {

    private static final String TAG = "AppNotificationListener";

    // Paquetes bancarios a monitorear
    private final Set bankingPackages = new HashSet<>(Arrays.asList(
            "com.nequi.MobileCommerce",       // Nequi
            "com.daviplata.primera",          // Daviplata
            "com.grupobancolombia.personas",   // Bancolombia Personas
            "com.grupobancolombia.bancolombiadelaesquina" // Bancolombia A la mano
    ));

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        super.onNotificationPosted(sbn);
        if (sbn == null) return;

        String packageName = sbn.getPackageName();
        if (!bankingPackages.contains(packageName)) return;

        String title = sbn.getNotification().extras.getString(Notification.EXTRA_TITLE, "");
        CharSequence bodyChar = sbn.getNotification().extras.getCharSequence(Notification.EXTRA_TEXT);
        String body = bodyChar != null ? bodyChar.toString() : "";

        Log.d(TAG, "Captured notification from " + packageName + ": Title: " + title + " | Body: " + body);

        // Enviar al backend
        sendToBackend(packageName, title, body);
    }

    private void sendToBackend(String packageName, String title, String body) {
        new Thread(() -> {
            try {
                // Obtener JWT token de Capacitor Storage
                SharedPreferences sharedPrefs = getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
                String token = sharedPrefs.getString("domusfin_token", null);

                if (token == null || token.isEmpty()) {
                    Log.w(TAG, "No token found in CapacitorStorage. Cannot authenticate auto-capture request.");
                    return;
                }

                // Preparar payload
                JSONObject payload = new JSONObject();
                payload.put("packageName", packageName);
                payload.put("title", title);
                payload.put("body", body);

                // Petición HTTP a producción
                URL url = new URL("https://domusfinapp-production.up.railway.app/api/v1/webhooks/auto-capture");

                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json; charset=utf-8");
                conn.setRequestProperty("Authorization", "Bearer " + token);
                conn.setDoOutput(true);

                OutputStreamWriter writer = new OutputStreamWriter(conn.getOutputStream());
                writer.write(payload.toString());
                writer.flush();
                writer.close();

                int responseCode = conn.getResponseCode();
                Log.d(TAG, "Auto-capture webhook response code: " + responseCode);
                conn.disconnect();
            } catch (Exception e) {
                Log.e(TAG, "Error sending auto-capture notification to backend", e);
            }
        }).start();
    }
}