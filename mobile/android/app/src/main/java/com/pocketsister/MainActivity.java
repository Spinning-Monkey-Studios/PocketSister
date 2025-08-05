package com.pocketsister;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Bundle;
import android.os.Handler;
import android.provider.Settings;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import org.json.JSONObject;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.UUID;

public class MainActivity extends AppCompatActivity implements LocationListener {
    
    private static final int LOCATION_PERMISSION_REQUEST_CODE = 1001;
    private static final String APP_URL = "https://my-pocket-sister.replit.app/";
    private static final String API_BASE_URL = "https://my-pocket-sister.replit.app/api/parent-messaging";
    
    private WebView webView;
    private LocationManager locationManager;
    private String deviceId;
    private String childId;
    private boolean isLocationTrackingEnabled = false;
    private Handler locationHandler = new Handler();
    private int trackingInterval = 30 * 60 * 1000; // 30 minutes default
    
    private Runnable locationRunnable = new Runnable() {
        @Override
        public void run() {
            if (isLocationTrackingEnabled) {
                requestLocationUpdate();
                locationHandler.postDelayed(this, trackingInterval);
            }
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        // Generate unique device ID
        deviceId = Settings.Secure.getString(getContentResolver(), Settings.Secure.ANDROID_ID);
        if (deviceId == null) {
            deviceId = UUID.randomUUID().toString();
        }
        
        setupWebView();
        requestLocationPermissions();
    }
    
    private void setupWebView() {
        webView = findViewById(R.id.webview);
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        webSettings.setGeolocationEnabled(true);
        
        // Add JavaScript interface for native bridge
        webView.addJavascriptInterface(new WebAppInterface(this), "AndroidInterface");
        
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                // Inject device info into web app
                String jsCode = "window.deviceInfo = {" +
                    "platform: 'android'," +
                    "deviceId: '" + deviceId + "'," +
                    "appVersion: '" + getAppVersion() + "'" +
                "}; window.dispatchEvent(new Event('deviceready'));";
                view.evaluateJavascript(jsCode, null);
            }
        });
        
        webView.loadUrl(APP_URL);
    }
    
    private void requestLocationPermissions() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
                != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this,
                new String[]{Manifest.permission.ACCESS_FINE_LOCATION},
                LOCATION_PERMISSION_REQUEST_CODE);
        } else {
            initializeLocationManager();
        }
    }
    
    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions,
                                          @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == LOCATION_PERMISSION_REQUEST_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                initializeLocationManager();
            }
        }
    }
    
    private void initializeLocationManager() {
        locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
    }
    
    private void requestLocationUpdate() {
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
                == PackageManager.PERMISSION_GRANTED) {
            
            locationManager.requestSingleUpdate(LocationManager.GPS_PROVIDER, this, null);
            locationManager.requestSingleUpdate(LocationManager.NETWORK_PROVIDER, this, null);
        }
    }
    
    @Override
    public void onLocationChanged(@NonNull Location location) {
        if (isLocationTrackingEnabled && childId != null) {
            sendLocationToServer(location);
        }
    }
    
    private void sendLocationToServer(Location location) {
        new Thread(() -> {
            try {
                URL url = new URL(API_BASE_URL + "/location");
                HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                connection.setRequestMethod("POST");
                connection.setRequestProperty("Content-Type", "application/json");
                connection.setRequestProperty("x-device-id", deviceId);
                connection.setDoOutput(true);
                
                JSONObject locationData = new JSONObject();
                locationData.put("childId", childId);
                locationData.put("latitude", location.getLatitude());
                locationData.put("longitude", location.getLongitude());
                locationData.put("accuracy", location.getAccuracy());
                locationData.put("timestamp", System.currentTimeMillis());
                locationData.put("batteryLevel", getBatteryLevel());
                
                OutputStream outputStream = connection.getOutputStream();
                outputStream.write(locationData.toString().getBytes());
                outputStream.flush();
                outputStream.close();
                
                int responseCode = connection.getResponseCode();
                connection.disconnect();
                
            } catch (Exception e) {
                e.printStackTrace();
            }
        }).start();
    }
    
    private int getBatteryLevel() {
        // Simple battery level implementation
        return 100; // Placeholder - would implement proper battery monitoring
    }
    
    private String getAppVersion() {
        try {
            return getPackageManager().getPackageInfo(getPackageName(), 0).versionName;
        } catch (Exception e) {
            return "1.0.0";
        }
    }
    
    /**
     * JavaScript Interface for communication between web app and native Android
     */
    public class WebAppInterface {
        Context context;
        
        WebAppInterface(Context context) {
            this.context = context;
        }
        
        @JavascriptInterface
        public void requestActivation(String childProfileId) {
            childId = childProfileId;
            requestDeviceActivation();
        }
        
        @JavascriptInterface
        public void enableLocationTracking(boolean enable, int intervalMinutes) {
            isLocationTrackingEnabled = enable;
            trackingInterval = intervalMinutes * 60 * 1000;
            
            if (enable) {
                locationHandler.post(locationRunnable);
            } else {
                locationHandler.removeCallbacks(locationRunnable);
            }
        }
        
        @JavascriptInterface
        public String getDeviceId() {
            return deviceId;
        }
        
        @JavascriptInterface
        public void emergencyLocationRequest() {
            if (ActivityCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION)
                    == PackageManager.PERMISSION_GRANTED) {
                locationManager.requestSingleUpdate(LocationManager.GPS_PROVIDER, 
                    MainActivity.this, null);
            }
        }
    }
    
    private void requestDeviceActivation() {
        new Thread(() -> {
            try {
                URL url = new URL(API_BASE_URL + "/request-activation");
                HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                connection.setRequestMethod("POST");
                connection.setRequestProperty("Content-Type", "application/json");
                connection.setDoOutput(true);
                
                JSONObject requestData = new JSONObject();
                requestData.put("childId", childId);
                requestData.put("deviceId", deviceId);
                
                JSONObject deviceInfo = new JSONObject();
                deviceInfo.put("platform", "android");
                deviceInfo.put("appVersion", getAppVersion());
                deviceInfo.put("deviceName", android.os.Build.MODEL);
                requestData.put("deviceInfo", deviceInfo);
                
                OutputStream outputStream = connection.getOutputStream();
                outputStream.write(requestData.toString().getBytes());
                outputStream.flush();
                outputStream.close();
                
                int responseCode = connection.getResponseCode();
                connection.disconnect();
                
                // Notify web app of activation request sent
                runOnUiThread(() -> {
                    webView.evaluateJavascript(
                        "window.dispatchEvent(new CustomEvent('activationRequested'));", 
                        null);
                });
                
            } catch (Exception e) {
                e.printStackTrace();
            }
        }).start();
    }
    
    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}