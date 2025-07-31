package com.mypocketsister;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import org.json.JSONObject;

public class NotificationService extends FirebaseMessagingService {
    private static final String TAG = "NotificationService";
    private static final String CHANNEL_ID = "usage_alerts";
    private static final String CHANNEL_NAME = "Usage Alerts";
    private static final String EMERGENCY_CHANNEL_ID = "emergency_alerts";
    private static final String EMERGENCY_CHANNEL_NAME = "Emergency Alerts";

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannels();
    }

    @Override
    public void onNewToken(String token) {
        Log.d(TAG, "Refreshed token: " + token);
        sendRegistrationToServer(token);
    }

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        Log.d(TAG, "From: " + remoteMessage.getFrom());

        // Check if message contains data payload
        if (remoteMessage.getData().size() > 0) {
            Log.d(TAG, "Message data payload: " + remoteMessage.getData());
            handleDataMessage(remoteMessage.getData());
        }

        // Check if message contains notification payload
        if (remoteMessage.getNotification() != null) {
            Log.d(TAG, "Message Notification Body: " + remoteMessage.getNotification().getBody());
            showNotification(
                remoteMessage.getNotification().getTitle(),
                remoteMessage.getNotification().getBody(),
                remoteMessage.getData()
            );
        }
    }

    private void handleDataMessage(java.util.Map<String, String> data) {
        try {
            String type = data.get("type");
            String title = data.get("title");
            String body = data.get("body");
            
            if (type != null && title != null && body != null) {
                showNotification(title, body, data);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error handling data message", e);
        }
    }

    private void showNotification(String title, String body, java.util.Map<String, String> data) {
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
        
        // Add data to intent for handling when notification is tapped
        if (data != null) {
            for (java.util.Map.Entry<String, String> entry : data.entrySet()) {
                intent.putExtra(entry.getKey(), entry.getValue());
            }
        }

        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 
            0, 
            intent, 
            PendingIntent.FLAG_ONE_SHOT | PendingIntent.FLAG_IMMUTABLE
        );

        String channelId = CHANNEL_ID;
        String priority = data != null ? data.get("priority") : "normal";
        String notificationType = data != null ? data.get("type") : "default";
        
        // Use emergency channel for high priority or emergency alerts
        if ("high".equals(priority) || "emergency_alert".equals(notificationType)) {
            channelId = EMERGENCY_CHANNEL_ID;
        }

        NotificationCompat.Builder notificationBuilder = 
            new NotificationCompat.Builder(this, channelId)
                .setSmallIcon(R.drawable.ic_notification)
                .setContentTitle(title)
                .setContentText(body)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent)
                .setPriority(getPriorityLevel(priority))
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body));

        // Add action buttons for specific notification types
        if ("usage_alert".equals(notificationType)) {
            // Add "View Usage" action
            Intent viewUsageIntent = new Intent(this, MainActivity.class);
            viewUsageIntent.putExtra("navigate_to", "parent_portal");
            PendingIntent viewUsagePendingIntent = PendingIntent.getActivity(
                this, 1, viewUsageIntent, PendingIntent.FLAG_IMMUTABLE
            );
            notificationBuilder.addAction(
                R.drawable.ic_chart, 
                "View Usage", 
                viewUsagePendingIntent
            );
        }

        NotificationManager notificationManager = 
            (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

        int notificationId = (int) System.currentTimeMillis();
        notificationManager.notify(notificationId, notificationBuilder.build());
    }

    private int getPriorityLevel(String priority) {
        switch (priority != null ? priority : "normal") {
            case "high":
                return NotificationCompat.PRIORITY_HIGH;
            case "low":
                return NotificationCompat.PRIORITY_LOW;
            default:
                return NotificationCompat.PRIORITY_DEFAULT;
        }
    }

    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager notificationManager = getSystemService(NotificationManager.class);

            // Usage alerts channel
            NotificationChannel usageChannel = new NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_DEFAULT
            );
            usageChannel.setDescription("Notifications about your child's usage limits");
            notificationManager.createNotificationChannel(usageChannel);

            // Emergency alerts channel
            NotificationChannel emergencyChannel = new NotificationChannel(
                EMERGENCY_CHANNEL_ID,
                EMERGENCY_CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            );
            emergencyChannel.setDescription("Critical security and safety alerts");
            emergencyChannel.enableVibration(true);
            emergencyChannel.setVibrationPattern(new long[]{100, 200, 300, 400, 500, 400, 300, 200, 400});
            notificationManager.createNotificationChannel(emergencyChannel);
        }
    }

    private void sendRegistrationToServer(String token) {
        // Store token locally
        SharedPreferences prefs = getSharedPreferences("MyPocketSister", Context.MODE_PRIVATE);
        prefs.edit().putString("fcm_token", token).apply();

        // Send to server - this will be handled by the web interface
        Log.d(TAG, "Token stored locally: " + token);
    }
}