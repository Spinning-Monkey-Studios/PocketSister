import Foundation
import UserNotifications
import UIKit

class NotificationService: NSObject {
    static let shared = NotificationService()
    
    private override init() {
        super.init()
    }
    
    func setupNotifications() {
        UNUserNotificationCenter.current().delegate = self
        requestNotificationPermission()
    }
    
    private func requestNotificationPermission() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            DispatchQueue.main.async {
                if granted {
                    UIApplication.shared.registerForRemoteNotifications()
                    print("Notification permission granted")
                } else {
                    print("Notification permission denied")
                }
            }
        }
    }
    
    func registerDeviceToken(_ deviceToken: Data) {
        let tokenParts = deviceToken.map { data in String(format: "%02.2hhx", data) }
        let token = tokenParts.joined()
        
        // Store token locally
        UserDefaults.standard.set(token, forKey: "apns_token")
        print("Device token: \(token)")
        
        // Send to server - this will be handled by the web interface
        sendTokenToServer(token: token)
    }
    
    private func sendTokenToServer(token: String) {
        // This method will be called from the WebView when user logs in
        NotificationCenter.default.post(
            name: NSNotification.Name("DeviceTokenReady"),
            object: nil,
            userInfo: ["token": token]
        )
    }
    
    func handleRemoteNotification(_ userInfo: [AnyHashable: Any]) {
        print("Received remote notification: \(userInfo)")
        
        // Extract notification data
        let type = userInfo["type"] as? String ?? "default"
        let title = userInfo["title"] as? String ?? "My Pocket Sister"
        let body = userInfo["body"] as? String ?? "You have a new notification"
        
        // Show local notification if app is in foreground
        if UIApplication.shared.applicationState == .active {
            showLocalNotification(title: title, body: body, userInfo: userInfo)
        }
        
        // Handle specific notification types
        handleNotificationType(type: type, userInfo: userInfo)
    }
    
    private func showLocalNotification(title: String, body: String, userInfo: [AnyHashable: Any]) {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        content.userInfo = userInfo
        
        // Add action buttons for usage alerts
        if let type = userInfo["type"] as? String, type == "usage_alert" {
            let viewUsageAction = UNNotificationAction(
                identifier: "VIEW_USAGE",
                title: "View Usage",
                options: [.foreground]
            )
            
            let category = UNNotificationCategory(
                identifier: "USAGE_ALERT",
                actions: [viewUsageAction],
                intentIdentifiers: [],
                options: []
            )
            
            UNUserNotificationCenter.current().setNotificationCategories([category])
            content.categoryIdentifier = "USAGE_ALERT"
        }
        
        let request = UNNotificationRequest(
            identifier: UUID().uuidString,
            content: content,
            trigger: UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        )
        
        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("Error showing notification: \(error)")
            }
        }
    }
    
    private func handleNotificationType(type: String, userInfo: [AnyHashable: Any]) {
        switch type {
        case "usage_alert":
            handleUsageAlert(userInfo: userInfo)
        case "emergency_alert":
            handleEmergencyAlert(userInfo: userInfo)
        case "announcement":
            handleAnnouncement(userInfo: userInfo)
        default:
            break
        }
    }
    
    private func handleUsageAlert(userInfo: [AnyHashable: Any]) {
        // Update app badge with unread count
        if let percentage = userInfo["percentage"] as? String,
           let percentageValue = Double(percentage) {
            
            // Show different badge colors based on usage
            let badgeNumber = percentageValue >= 100 ? 3 : (percentageValue >= 90 ? 2 : 1)
            UIApplication.shared.applicationIconBadgeNumber = badgeNumber
        }
        
        // Trigger haptic feedback for urgent alerts
        if let percentage = userInfo["percentage"] as? String,
           let percentageValue = Double(percentage),
           percentageValue >= 90 {
            
            let impactFeedback = UIImpactFeedbackGenerator(style: .heavy)
            impactFeedback.impactOccurred()
        }
    }
    
    private func handleEmergencyAlert(userInfo: [AnyHashable: Any]) {
        // Emergency alerts get highest priority
        UIApplication.shared.applicationIconBadgeNumber = 5
        
        // Strong haptic feedback
        let impactFeedback = UIImpactFeedbackGenerator(style: .heavy)
        impactFeedback.impactOccurred()
        
        // Play custom sound if available
        // UNNotificationSound(named: UNNotificationSoundName("emergency_alert.wav"))
    }
    
    private func handleAnnouncement(userInfo: [AnyHashable: Any]) {
        // Standard handling for announcements
        let priority = userInfo["priority"] as? String ?? "normal"
        
        if priority == "high" {
            let impactFeedback = UIImpactFeedbackGenerator(style: .medium)
            impactFeedback.impactOccurred()
        }
    }
}

// MARK: - UNUserNotificationCenterDelegate
extension NotificationService: UNUserNotificationCenterDelegate {
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        // Show notification even when app is in foreground
        completionHandler([.alert, .sound, .badge])
    }
    
    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
        let userInfo = response.notification.request.content.userInfo
        
        // Handle notification tap
        if response.actionIdentifier == "VIEW_USAGE" {
            // Navigate to parent portal
            NotificationCenter.default.post(
                name: NSNotification.Name("NavigateToParentPortal"),
                object: nil
            )
        } else {
            // Default action - open app
            handleRemoteNotification(userInfo)
        }
        
        completionHandler()
    }
}