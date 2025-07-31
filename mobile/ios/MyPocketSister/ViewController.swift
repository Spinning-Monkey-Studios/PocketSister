import UIKit
import WebKit
import LocalAuthentication

class ViewController: UIViewController, WKNavigationDelegate, WKUIDelegate {
    
    @IBOutlet weak var webView: WKWebView!
    @IBOutlet weak var progressView: UIProgressView!
    @IBOutlet weak var activityIndicator: UIActivityIndicatorView!
    
    private let baseURL = "https://my-pocket-sister.replit.app/"
    private let fallbackURL = "https://mypocketsister.com/"
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupWebView()
        loadWebApp()
    }
    
    private func setupWebView() {
        // Configure WebView
        let configuration = WKWebViewConfiguration()
        configuration.allowsInlineMediaPlayback = true
        configuration.mediaTypesRequiringUserActionForPlayback = []
        
        // Set up user agent
        let userAgent = "MyPocketSister-Mobile/1.0.0"
        configuration.applicationNameForUserAgent = userAgent
        
        // Configure content controller for JavaScript messaging
        let contentController = WKUserContentController()
        contentController.add(self, name: "nativeHandler")
        configuration.userContentController = contentController
        
        webView.configuration.userContentController = contentController
        webView.navigationDelegate = self
        webView.uiDelegate = self
        
        // Enable observation of loading progress
        webView.addObserver(self, forKeyPath: #keyPath(WKWebView.estimatedProgress), options: .new, context: nil)
        
        // Configure progress view
        progressView.progressTintColor = UIColor.systemBlue
        progressView.trackTintColor = UIColor.clear
    }
    
    private func loadWebApp() {
        guard let url = URL(string: baseURL) else { return }
        let request = URLRequest(url: url)
        webView.load(request)
    }
    
    // MARK: - KVO for Progress
    override func observeValue(forKeyPath keyPath: String?, of object: Any?, change: [NSKeyValueChangeKey : Any]?, context: UnsafeMutableRawPointer?) {
        if keyPath == "estimatedProgress" {
            progressView.progress = Float(webView.estimatedProgress)
            progressView.isHidden = webView.estimatedProgress >= 1.0
        }
    }
    
    // MARK: - WKNavigationDelegate
    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        activityIndicator.startAnimating()
        progressView.isHidden = false
    }
    
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        activityIndicator.stopAnimating()
        progressView.isHidden = true
    }
    
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        activityIndicator.stopAnimating()
        progressView.isHidden = true
        showErrorPage()
    }
    
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        
        guard let url = navigationAction.request.url else {
            decisionHandler(.allow)
            return
        }
        
        // Handle external links
        if !url.absoluteString.hasPrefix(baseURL) && !url.absoluteString.hasPrefix(fallbackURL) {
            UIApplication.shared.open(url)
            decisionHandler(.cancel)
            return
        }
        
        decisionHandler(.allow)
    }
    
    // MARK: - WKUIDelegate
    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        let alert = UIAlertController(title: "My Pocket Sister", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in
            completionHandler()
        })
        present(alert, animated: true)
    }
    
    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        let alert = UIAlertController(title: "My Pocket Sister", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in
            completionHandler(true)
        })
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel) { _ in
            completionHandler(false)
        })
        present(alert, animated: true)
    }
    
    // MARK: - Error Handling
    private func showErrorPage() {
        let errorHTML = """
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; margin: 0; }
                .error-container { background: white; border-radius: 12px; padding: 40px 20px; box-shadow: 0 2px 20px rgba(0,0,0,0.1); margin: 20px; }
                .error-icon { font-size: 64px; margin-bottom: 20px; }
                h1 { color: #333; margin-bottom: 10px; font-size: 24px; }
                p { color: #666; margin-bottom: 30px; line-height: 1.5; }
                .retry-btn { background: #007AFF; color: white; padding: 12px 32px; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; }
                .retry-btn:active { background: #0056b3; }
            </style>
        </head>
        <body>
            <div class="error-container">
                <div class="error-icon">🤖</div>
                <h1>Connection Error</h1>
                <p>Unable to connect to My Pocket Sister.<br>Please check your internet connection and try again.</p>
                <button class="retry-btn" onclick="window.location.reload()">Try Again</button>
            </div>
        </body>
        </html>
        """
        
        webView.loadHTMLString(errorHTML, baseURL: nil)
    }
    
    // MARK: - Biometric Authentication
    private func authenticateWithBiometrics() {
        let context = LAContext()
        var error: NSError?
        
        if context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) {
            let reason = "Use your biometric authentication to access My Pocket Sister"
            
            context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, localizedReason: reason) { [weak self] success, authenticationError in
                DispatchQueue.main.async {
                    if success {
                        // Inject success into webview
                        self?.webView.evaluateJavaScript("window.biometricAuthSuccess && window.biometricAuthSuccess();")
                    } else {
                        let alert = UIAlertController(title: "Authentication Failed", 
                                                    message: authenticationError?.localizedDescription, 
                                                    preferredStyle: .alert)
                        alert.addAction(UIAlertAction(title: "OK", style: .default))
                        self?.present(alert, animated: true)
                    }
                }
            }
        } else {
            let alert = UIAlertController(title: "Biometric Authentication Unavailable", 
                                        message: "Your device does not support biometric authentication.", 
                                        preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "OK", style: .default))
            present(alert, animated: true)
        }
    }
    
    deinit {
        webView.removeObserver(self, forKeyPath: #keyPath(WKWebView.estimatedProgress))
    }
}

// MARK: - WKScriptMessageHandler
extension ViewController: WKScriptMessageHandler {
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        if message.name == "nativeHandler" {
            guard let body = message.body as? [String: Any],
                  let action = body["action"] as? String else { return }
            
            switch action {
            case "requestBiometricAuth":
                authenticateWithBiometrics()
            case "showToast":
                if let text = body["message"] as? String {
                    showToast(message: text)
                }
            default:
                break
            }
        }
    }
    
    private func showToast(message: String) {
        let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        present(alert, animated: true)
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
            alert.dismiss(animated: true)
        }
    }
}