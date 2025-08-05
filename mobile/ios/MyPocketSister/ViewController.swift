import UIKit
import WebKit
import CoreLocation

class ViewController: UIViewController, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler, CLLocationManagerDelegate {
    
    @IBOutlet weak var webView: WKWebView!
    
    private let locationManager = CLLocationManager()
    private let appURL = "https://my-pocket-sister.replit.app/"
    private let apiBaseURL = "https://my-pocket-sister.replit.app/api/parent-messaging"
    
    private var deviceId: String = ""
    private var childId: String = ""
    private var isLocationTrackingEnabled = false
    private var trackingInterval: TimeInterval = 30 * 60 // 30 minutes default
    private var locationTimer: Timer?
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Generate unique device ID
        deviceId = UIDevice.current.identifierForVendor?.uuidString ?? UUID().uuidString
        
        setupWebView()
        setupLocationManager()
    }
    
    private func setupWebView() {
        let contentController = WKUserContentController()
        
        // Add JavaScript message handlers
        contentController.add(self, name: "requestActivation")
        contentController.add(self, name: "enableLocationTracking")
        contentController.add(self, name: "getDeviceId")
        contentController.add(self, name: "emergencyLocationRequest")
        
        let config = WKWebViewConfiguration()
        config.userContentController = contentController
        
        webView = WKWebView(frame: view.bounds, configuration: config)
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        
        view.addSubview(webView)
        
        if let url = URL(string: appURL) {
            webView.load(URLRequest(url: url))
        }
    }
    
    private func setupLocationManager() {
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        locationManager.requestWhenInUseAuthorization()
    }
    
    // MARK: - WKNavigationDelegate
    
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        // Inject device info into web app
        let appVersion = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0.0"
        let jsCode = """
            window.deviceInfo = {
                platform: 'ios',
                deviceId: '\(deviceId)',
                appVersion: '\(appVersion)'
            };
            window.dispatchEvent(new Event('deviceready'));
        """
        webView.evaluateJavaScript(jsCode, completionHandler: nil)
    }
    
    // MARK: - WKScriptMessageHandler
    
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        switch message.name {
        case "requestActivation":
            if let childProfileId = message.body as? String {
                childId = childProfileId
                requestDeviceActivation()
            }
            
        case "enableLocationTracking":
            if let params = message.body as? [String: Any],
               let enable = params["enable"] as? Bool,
               let intervalMinutes = params["intervalMinutes"] as? Int {
                enableLocationTracking(enable: enable, intervalMinutes: intervalMinutes)
            }
            
        case "getDeviceId":
            webView.evaluateJavaScript("window.receiveDeviceId('\(deviceId)')", completionHandler: nil)
            
        case "emergencyLocationRequest":
            emergencyLocationRequest()
            
        default:
            break
        }
    }
    
    // MARK: - Location Management
    
    private func enableLocationTracking(enable: Bool, intervalMinutes: Int) {
        isLocationTrackingEnabled = enable
        trackingInterval = TimeInterval(intervalMinutes * 60)
        
        if enable {
            startLocationTracking()
        } else {
            stopLocationTracking()
        }
    }
    
    private func startLocationTracking() {
        guard isLocationTrackingEnabled else { return }
        
        locationTimer?.invalidate()
        locationTimer = Timer.scheduledTimer(withTimeInterval: trackingInterval, repeats: true) { _ in
            self.requestLocationUpdate()
        }
        
        // Get initial location
        requestLocationUpdate()
    }
    
    private func stopLocationTracking() {
        locationTimer?.invalidate()
        locationTimer = nil
    }
    
    private func requestLocationUpdate() {
        guard CLLocationManager.locationServicesEnabled() else { return }
        
        switch locationManager.authorizationStatus {
        case .authorizedWhenInUse, .authorizedAlways:
            locationManager.requestLocation()
        case .notDetermined:
            locationManager.requestWhenInUseAuthorization()
        default:
            break
        }
    }
    
    private func emergencyLocationRequest() {
        requestLocationUpdate()
    }
    
    // MARK: - CLLocationManagerDelegate
    
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last,
              isLocationTrackingEnabled,
              !childId.isEmpty else { return }
        
        sendLocationToServer(location: location)
    }
    
    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        print("Location error: \(error.localizedDescription)")
    }
    
    func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
        switch status {
        case .authorizedWhenInUse, .authorizedAlways:
            if isLocationTrackingEnabled {
                startLocationTracking()
            }
        default:
            stopLocationTracking()
        }
    }
    
    // MARK: - Network Requests
    
    private func sendLocationToServer(location: CLLocation) {
        guard let url = URL(string: "\(apiBaseURL)/location") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(deviceId, forHTTPHeaderField: "x-device-id")
        
        let locationData: [String: Any] = [
            "childId": childId,
            "latitude": location.coordinate.latitude,
            "longitude": location.coordinate.longitude,
            "accuracy": location.horizontalAccuracy,
            "timestamp": Int(location.timestamp.timeIntervalSince1970 * 1000),
            "batteryLevel": getBatteryLevel()
        ]
        
        do {
            let jsonData = try JSONSerialization.data(withJSONObject: locationData)
            request.httpBody = jsonData
            
            URLSession.shared.dataTask(with: request) { data, response, error in
                if let error = error {
                    print("Location upload error: \(error.localizedDescription)")
                }
            }.resume()
        } catch {
            print("JSON serialization error: \(error.localizedDescription)")
        }
    }
    
    private func requestDeviceActivation() {
        guard let url = URL(string: "\(apiBaseURL)/request-activation") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let deviceInfo: [String: Any] = [
            "platform": "ios",
            "appVersion": Bundle.main.infoDictionary?["CFBundleShortVersionString"] ?? "1.0.0",
            "deviceName": UIDevice.current.name
        ]
        
        let requestData: [String: Any] = [
            "childId": childId,
            "deviceId": deviceId,
            "deviceInfo": deviceInfo
        ]
        
        do {
            let jsonData = try JSONSerialization.data(withJSONObject: requestData)
            request.httpBody = jsonData
            
            URLSession.shared.dataTask(with: request) { data, response, error in
                DispatchQueue.main.async {
                    if error == nil {
                        // Notify web app of activation request sent
                        self.webView.evaluateJavaScript(
                            "window.dispatchEvent(new CustomEvent('activationRequested'));",
                            completionHandler: nil
                        )
                    }
                }
            }.resume()
        } catch {
            print("JSON serialization error: \(error.localizedDescription)")
        }
    }
    
    private func getBatteryLevel() -> Int {
        UIDevice.current.isBatteryMonitoringEnabled = true
        let batteryLevel = UIDevice.current.batteryLevel
        UIDevice.current.isBatteryMonitoringEnabled = false
        
        if batteryLevel < 0 {
            return 100 // Battery level unavailable
        }
        
        return Int(batteryLevel * 100)
    }
}