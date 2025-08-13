/**
 * MyPocketSister Integration Plugin JavaScript
 * Handles dynamic functionality and API communication
 */

(function($) {
    'use strict';

    // Initialize when document is ready
    $(document).ready(function() {
        initializeIntegration();
        initializeWidgets();
        initializeShortcodes();
        initializeStatusChecks();
    });

    /**
     * Initialize main integration functionality
     */
    function initializeIntegration() {
        // Add tracking to CTA buttons
        $('.mypocketsister-cta-button').on('click', function(e) {
            var plan = $(this).data('plan') || 'unknown';
            var source = $(this).data('source') || 'button';
            
            // Track the click event
            trackEvent('cta_click', {
                plan: plan,
                source: source,
                page: window.location.pathname
            });
            
            // Add loading state
            $(this).addClass('mypocketsister-loading');
        });

        // Initialize form enhancements
        enhanceForms();
    }

    /**
     * Initialize widget functionality
     */
    function initializeWidgets() {
        // Status widget updates
        updateStatusWidgets();
        
        // Auto-refresh status every 5 minutes
        setInterval(updateStatusWidgets, 300000);

        // Signup widget enhancements
        $('.mypocketsister-signup-widget .button').on('click', function(e) {
            trackEvent('widget_signup_click', {
                widget_location: $(this).closest('.widget').attr('id') || 'unknown'
            });
        });
    }

    /**
     * Initialize shortcode functionality
     */
    function initializeShortcodes() {
        // Pricing table interactions
        $('.mypocketsister-pricing-table .pricing-plan').on('mouseenter', function() {
            $(this).addClass('hovered');
        }).on('mouseleave', function() {
            $(this).removeClass('hovered');
        });

        // Plan selection tracking
        $('.pricing-plan .mypocketsister-cta-button').on('click', function(e) {
            var planName = $(this).closest('.pricing-plan').find('h3').text();
            trackEvent('pricing_plan_selected', {
                plan: planName.toLowerCase().replace(' plan', ''),
                source: 'pricing_table'
            });
        });
    }

    /**
     * Initialize status checking functionality
     */
    function initializeStatusChecks() {
        // Check app status on page load
        checkAppStatus();
        
        // Periodic status checks for critical pages
        if (isImportantPage()) {
            setInterval(checkAppStatus, 60000); // Every minute for important pages
        }
    }

    /**
     * Update status widgets across the site
     */
    function updateStatusWidgets() {
        $('.mypocketsister-status-widget').each(function() {
            var widget = $(this);
            updateSingleStatusWidget(widget);
        });
    }

    /**
     * Update a single status widget
     */
    function updateSingleStatusWidget(widget) {
        var statusIndicator = widget.find('.status-indicator');
        var statusText = widget.find('#app-status-text');
        var activeFamilies = widget.find('#active-families');

        $.ajax({
            url: mypocketsister_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'get_app_status',
                nonce: mypocketsister_ajax.nonce
            },
            success: function(response) {
                if (response.success) {
                    statusIndicator.css('color', '#34D399').text('●');
                    statusText.text('App Online');
                    
                    // Update additional stats if available
                    if (response.data && response.data.active_families) {
                        activeFamilies.text(response.data.active_families);
                    }
                } else {
                    statusIndicator.css('color', '#EF4444').text('●');
                    statusText.text('App Offline');
                }
            },
            error: function() {
                statusIndicator.css('color', '#F59E0B').text('●');
                statusText.text('Status Unknown');
            }
        });
    }

    /**
     * Check overall app status
     */
    function checkAppStatus() {
        $.ajax({
            url: mypocketsister_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'get_app_status',
                nonce: mypocketsister_ajax.nonce
            },
            success: function(response) {
                // Update global status indicator if it exists
                if ($('#global-app-status').length) {
                    if (response.success) {
                        $('#global-app-status')
                            .removeClass('status-offline status-unknown')
                            .addClass('status-online')
                            .text('Online');
                    } else {
                        $('#global-app-status')
                            .removeClass('status-online status-unknown')
                            .addClass('status-offline')
                            .text('Offline');
                    }
                }

                // Store status in sessionStorage for other scripts
                sessionStorage.setItem('mypocketsister_app_status', response.success ? 'online' : 'offline');
            },
            error: function() {
                if ($('#global-app-status').length) {
                    $('#global-app-status')
                        .removeClass('status-online status-offline')
                        .addClass('status-unknown')
                        .text('Unknown');
                }
                sessionStorage.setItem('mypocketsister_app_status', 'unknown');
            }
        });
    }

    /**
     * Enhance forms with integration features
     */
    function enhanceForms() {
        // Newsletter forms
        $('form[id*="newsletter"], form[class*="newsletter"]').on('submit', function(e) {
            var form = $(this);
            var email = form.find('input[type="email"]').val();
            
            if (email) {
                // Sync with app if integration is enabled
                syncNewsletterSubscription(email);
            }
        });

        // Contact forms
        $('form[id*="contact"], form[class*="contact"]').on('submit', function(e) {
            var form = $(this);
            trackEvent('contact_form_submit', {
                form_id: form.attr('id') || 'unknown',
                page: window.location.pathname
            });
        });
    }

    /**
     * Sync newsletter subscription with app
     */
    function syncNewsletterSubscription(email) {
        if (!mypocketsister_ajax.api_key) {
            return; // No API key configured
        }

        $.ajax({
            url: mypocketsister_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'sync_newsletter_subscription',
                nonce: mypocketsister_ajax.nonce,
                email: email
            },
            success: function(response) {
                console.log('Newsletter subscription synced with app');
            },
            error: function() {
                console.log('Failed to sync newsletter subscription with app');
            }
        });
    }

    /**
     * Track events for analytics
     */
    function trackEvent(eventName, properties) {
        // Send tracking data to app if integration is enabled
        if (mypocketsister_ajax.api_key) {
            $.ajax({
                url: mypocketsister_ajax.ajax_url,
                type: 'POST',
                data: {
                    action: 'track_event',
                    nonce: mypocketsister_ajax.nonce,
                    event: eventName,
                    properties: JSON.stringify(properties),
                    timestamp: Date.now()
                },
                success: function() {
                    console.log('Event tracked:', eventName);
                }
            });
        }

        // Google Analytics tracking if available
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, properties);
        }

        // Facebook Pixel tracking if available
        if (typeof fbq !== 'undefined') {
            fbq('trackCustom', eventName, properties);
        }
    }

    /**
     * Check if current page is important for status monitoring
     */
    function isImportantPage() {
        var path = window.location.pathname;
        var importantPaths = ['/signup', '/pricing', '/contact', '/'];
        
        return importantPaths.some(function(importantPath) {
            return path.includes(importantPath);
        });
    }

    /**
     * Handle signup redirect with proper tracking
     */
    function handleSignupRedirect(plan, source) {
        var appUrl = mypocketsister_ajax.app_url;
        var params = new URLSearchParams({
            plan: plan || 'premium',
            source: source || 'wordpress',
            referrer: window.location.href,
            utm_source: 'wordpress',
            utm_medium: 'website',
            utm_campaign: 'blog_integration'
        });

        // Track the redirect
        trackEvent('signup_redirect', {
            plan: plan,
            source: source,
            destination: appUrl
        });

        // Redirect to app
        window.location.href = appUrl + '/signup?' + params.toString();
    }

    /**
     * Initialize A/B testing for CTAs
     */
    function initializeABTesting() {
        // Simple A/B testing for button text
        var variant = sessionStorage.getItem('mypocketsister_cta_variant');
        
        if (!variant) {
            variant = Math.random() < 0.5 ? 'A' : 'B';
            sessionStorage.setItem('mypocketsister_cta_variant', variant);
        }

        if (variant === 'B') {
            $('.mypocketsister-cta-button').each(function() {
                var currentText = $(this).text();
                if (currentText.includes('Start Free Trial')) {
                    $(this).text(currentText.replace('Start Free Trial', 'Try Free for 7 Days'));
                }
            });
        }

        // Track variant for analytics
        trackEvent('ab_test_view', {
            variant: variant,
            test_name: 'cta_button_text'
        });
    }

    /**
     * Handle errors gracefully
     */
    function handleError(error, context) {
        console.error('MyPocketSister Integration Error:', error, 'Context:', context);
        
        // Track errors for debugging
        trackEvent('integration_error', {
            error: error.toString(),
            context: context,
            user_agent: navigator.userAgent,
            page: window.location.pathname
        });
    }

    /**
     * Utility function to debounce events
     */
    function debounce(func, wait, immediate) {
        var timeout;
        return function() {
            var context = this, args = arguments;
            var later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }

    /**
     * Initialize performance monitoring
     */
    function initializePerformanceMonitoring() {
        // Monitor page load performance
        window.addEventListener('load', function() {
            setTimeout(function() {
                var perfData = performance.getEntriesByType("navigation")[0];
                trackEvent('page_performance', {
                    load_time: perfData.loadEventEnd - perfData.loadEventStart,
                    dom_ready: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
                    page: window.location.pathname
                });
            }, 1000);
        });
    }

    /**
     * Accessibility enhancements
     */
    function initializeAccessibility() {
        // Add keyboard navigation for pricing tables
        $('.pricing-plan').attr('tabindex', '0').on('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                $(this).find('.mypocketsister-cta-button')[0].click();
            }
        });

        // Add screen reader announcements
        $('<div>', {
            'aria-live': 'polite',
            'aria-atomic': 'true',
            'class': 'sr-only',
            'id': 'mypocketsister-announcements'
        }).appendTo('body');
    }

    /**
     * Mobile-specific enhancements
     */
    function initializeMobileEnhancements() {
        if (window.innerWidth <= 768) {
            // Optimize touch targets
            $('.mypocketsister-cta-button').css('min-height', '44px');
            
            // Add swipe support for pricing table
            if ($('.mypocketsister-pricing-table').length) {
                // Simple swipe detection could be added here
            }
        }
    }

    // Initialize additional features
    $(document).ready(function() {
        initializeABTesting();
        initializePerformanceMonitoring();
        initializeAccessibility();
        initializeMobileEnhancements();
    });

    // Expose useful functions to global scope
    window.MyPocketSisterIntegration = {
        trackEvent: trackEvent,
        checkAppStatus: checkAppStatus,
        handleSignupRedirect: handleSignupRedirect,
        updateStatusWidgets: updateStatusWidgets
    };

})(jQuery);