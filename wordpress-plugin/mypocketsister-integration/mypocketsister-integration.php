<?php
/**
 * Plugin Name: MyPocketSister Integration
 * Plugin URI: https://mypocketsister.com
 * Description: Seamlessly integrates your WordPress blog with the MyPocketSister app, providing user authentication sync, content sharing, and enhanced parent-child communication features.
 * Version: 1.0.0
 * Author: MyPocketSister Team
 * Author URI: https://mypocketsister.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: mypocketsister-integration
 * Domain Path: /languages
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('MYPOCKETSISTER_PLUGIN_VERSION', '1.0.0');
define('MYPOCKETSISTER_PLUGIN_PATH', plugin_dir_path(__FILE__));
define('MYPOCKETSISTER_PLUGIN_URL', plugin_dir_url(__FILE__));

/**
 * Main Plugin Class
 */
class MyPocketSisterIntegration {
    
    public function __construct() {
        add_action('init', array($this, 'init'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'admin_init'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_action('wp_ajax_sync_user_data', array($this, 'sync_user_data'));
        add_action('wp_ajax_nopriv_sync_user_data', array($this, 'sync_user_data'));
        add_action('wp_ajax_get_app_status', array($this, 'get_app_status'));
        add_action('wp_ajax_nopriv_get_app_status', array($this, 'get_app_status'));
        
        // Shortcodes
        add_shortcode('mypocketsister_signup', array($this, 'signup_shortcode'));
        add_shortcode('mypocketsister_app_status', array($this, 'app_status_shortcode'));
        add_shortcode('mypocketsister_pricing', array($this, 'pricing_shortcode'));
        
        // Custom post types
        add_action('init', array($this, 'register_custom_post_types'));
        
        // Widget
        add_action('widgets_init', array($this, 'register_widgets'));
    }
    
    /**
     * Initialize plugin
     */
    public function init() {
        load_plugin_textdomain('mypocketsister-integration', false, dirname(plugin_basename(__FILE__)) . '/languages');
    }
    
    /**
     * Enqueue scripts and styles
     */
    public function enqueue_scripts() {
        wp_enqueue_script(
            'mypocketsister-integration',
            MYPOCKETSISTER_PLUGIN_URL . 'assets/js/integration.js',
            array('jquery'),
            MYPOCKETSISTER_PLUGIN_VERSION,
            true
        );
        
        wp_enqueue_style(
            'mypocketsister-integration',
            MYPOCKETSISTER_PLUGIN_URL . 'assets/css/integration.css',
            array(),
            MYPOCKETSISTER_PLUGIN_VERSION
        );
        
        // Localize script
        wp_localize_script('mypocketsister-integration', 'mypocketsister_ajax', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('mypocketsister_nonce'),
            'app_url' => get_option('mypocketsister_app_url', 'https://app.mypocketsister.com'),
            'api_key' => get_option('mypocketsister_api_key', '')
        ));
    }
    
    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_options_page(
            'MyPocketSister Settings',
            'MyPocketSister',
            'manage_options',
            'mypocketsister-settings',
            array($this, 'admin_page')
        );
    }
    
    /**
     * Initialize admin settings
     */
    public function admin_init() {
        register_setting('mypocketsister_settings', 'mypocketsister_app_url');
        register_setting('mypocketsister_settings', 'mypocketsister_api_key');
        register_setting('mypocketsister_settings', 'mypocketsister_sync_enabled');
        register_setting('mypocketsister_settings', 'mypocketsister_content_sharing');
        register_setting('mypocketsister_settings', 'mypocketsister_safety_alerts');
        
        add_settings_section(
            'mypocketsister_main',
            'Main Settings',
            array($this, 'settings_section_callback'),
            'mypocketsister-settings'
        );
        
        add_settings_field(
            'mypocketsister_app_url',
            'App URL',
            array($this, 'app_url_callback'),
            'mypocketsister-settings',
            'mypocketsister_main'
        );
        
        add_settings_field(
            'mypocketsister_api_key',
            'API Key',
            array($this, 'api_key_callback'),
            'mypocketsister-settings',
            'mypocketsister_main'
        );
        
        add_settings_field(
            'mypocketsister_sync_enabled',
            'Enable User Sync',
            array($this, 'sync_enabled_callback'),
            'mypocketsister-settings',
            'mypocketsister_main'
        );
        
        add_settings_field(
            'mypocketsister_content_sharing',
            'Enable Content Sharing',
            array($this, 'content_sharing_callback'),
            'mypocketsister-settings',
            'mypocketsister_main'
        );
        
        add_settings_field(
            'mypocketsister_safety_alerts',
            'Enable Safety Alerts',
            array($this, 'safety_alerts_callback'),
            'mypocketsister-settings',
            'mypocketsister_main'
        );
    }
    
    /**
     * Admin page HTML
     */
    public function admin_page() {
        ?>
        <div class="wrap">
            <h1>MyPocketSister Integration Settings</h1>
            <form method="post" action="options.php">
                <?php
                settings_fields('mypocketsister_settings');
                do_settings_sections('mypocketsister-settings');
                submit_button();
                ?>
            </form>
            
            <div class="card" style="margin-top: 20px; padding: 20px;">
                <h2>Integration Status</h2>
                <div id="integration-status">
                    <p>Checking connection...</p>
                </div>
                <button type="button" class="button" id="test-connection">Test Connection</button>
            </div>
            
            <div class="card" style="margin-top: 20px; padding: 20px;">
                <h2>Sync Statistics</h2>
                <div id="sync-stats">
                    <p><strong>Users Synced:</strong> <?php echo get_option('mypocketsister_users_synced', 0); ?></p>
                    <p><strong>Last Sync:</strong> <?php echo get_option('mypocketsister_last_sync', 'Never'); ?></p>
                    <p><strong>Content Shared:</strong> <?php echo get_option('mypocketsister_content_shared', 0); ?> posts</p>
                </div>
                <button type="button" class="button" id="manual-sync">Manual Sync</button>
            </div>
        </div>
        
        <script>
        jQuery(document).ready(function($) {
            $('#test-connection').click(function() {
                $.post(ajaxurl, {
                    action: 'get_app_status',
                    nonce: '<?php echo wp_create_nonce('mypocketsister_nonce'); ?>'
                }, function(response) {
                    if (response.success) {
                        $('#integration-status').html('<p style="color: green;">✓ Connected successfully</p>');
                    } else {
                        $('#integration-status').html('<p style="color: red;">✗ Connection failed: ' + response.data + '</p>');
                    }
                });
            });
            
            $('#manual-sync').click(function() {
                $(this).prop('disabled', true).text('Syncing...');
                $.post(ajaxurl, {
                    action: 'sync_user_data',
                    nonce: '<?php echo wp_create_nonce('mypocketsister_nonce'); ?>'
                }, function(response) {
                    if (response.success) {
                        alert('Sync completed successfully');
                        location.reload();
                    } else {
                        alert('Sync failed: ' + response.data);
                    }
                    $('#manual-sync').prop('disabled', false).text('Manual Sync');
                });
            });
        });
        </script>
        <?php
    }
    
    /**
     * Settings callbacks
     */
    public function settings_section_callback() {
        echo '<p>Configure your MyPocketSister app integration settings below.</p>';
    }
    
    public function app_url_callback() {
        $value = get_option('mypocketsister_app_url', 'https://app.mypocketsister.com');
        echo '<input type="url" name="mypocketsister_app_url" value="' . esc_attr($value) . '" class="regular-text" />';
        echo '<p class="description">The URL where your MyPocketSister app is hosted.</p>';
    }
    
    public function api_key_callback() {
        $value = get_option('mypocketsister_api_key', '');
        echo '<input type="password" name="mypocketsister_api_key" value="' . esc_attr($value) . '" class="regular-text" />';
        echo '<p class="description">API key for secure communication with your app.</p>';
    }
    
    public function sync_enabled_callback() {
        $value = get_option('mypocketsister_sync_enabled', false);
        echo '<input type="checkbox" name="mypocketsister_sync_enabled" value="1" ' . checked(1, $value, false) . ' />';
        echo '<label for="mypocketsister_sync_enabled">Automatically sync user registrations between WordPress and the app</label>';
    }
    
    public function content_sharing_callback() {
        $value = get_option('mypocketsister_content_sharing', false);
        echo '<input type="checkbox" name="mypocketsister_content_sharing" value="1" ' . checked(1, $value, false) . ' />';
        echo '<label for="mypocketsister_content_sharing">Allow app to access and share blog content</label>';
    }
    
    public function safety_alerts_callback() {
        $value = get_option('mypocketsister_safety_alerts', false);
        echo '<input type="checkbox" name="mypocketsister_safety_alerts" value="1" ' . checked(1, $value, false) . ' />';
        echo '<label for="mypocketsister_safety_alerts">Receive safety alerts from the app</label>';
    }
    
    /**
     * AJAX handlers
     */
    public function sync_user_data() {
        if (!wp_verify_nonce($_POST['nonce'], 'mypocketsister_nonce')) {
            wp_die('Security check failed');
        }
        
        $api_key = get_option('mypocketsister_api_key', '');
        $app_url = get_option('mypocketsister_app_url', '');
        
        if (empty($api_key) || empty($app_url)) {
            wp_send_json_error('API key or app URL not configured');
        }
        
        // Get recent user registrations
        $users = get_users(array(
            'meta_key' => 'mypocketsister_synced',
            'meta_compare' => 'NOT EXISTS',
            'number' => 50
        ));
        
        $synced = 0;
        foreach ($users as $user) {
            $user_data = array(
                'email' => $user->user_email,
                'name' => $user->display_name,
                'wordpress_id' => $user->ID,
                'registration_date' => $user->user_registered
            );
            
            $response = wp_remote_post($app_url . '/api/wordpress/sync-user', array(
                'headers' => array(
                    'Authorization' => 'Bearer ' . $api_key,
                    'Content-Type' => 'application/json'
                ),
                'body' => json_encode($user_data),
                'timeout' => 30
            ));
            
            if (!is_wp_error($response) && wp_remote_retrieve_response_code($response) == 200) {
                update_user_meta($user->ID, 'mypocketsister_synced', time());
                $synced++;
            }
        }
        
        update_option('mypocketsister_users_synced', get_option('mypocketsister_users_synced', 0) + $synced);
        update_option('mypocketsister_last_sync', current_time('mysql'));
        
        wp_send_json_success("Synced {$synced} users successfully");
    }
    
    public function get_app_status() {
        if (!wp_verify_nonce($_POST['nonce'], 'mypocketsister_nonce')) {
            wp_die('Security check failed');
        }
        
        $app_url = get_option('mypocketsister_app_url', '');
        $api_key = get_option('mypocketsister_api_key', '');
        
        if (empty($app_url)) {
            wp_send_json_error('App URL not configured');
        }
        
        $response = wp_remote_get($app_url . '/api/health', array(
            'headers' => array(
                'Authorization' => 'Bearer ' . $api_key
            ),
            'timeout' => 10
        ));
        
        if (is_wp_error($response)) {
            wp_send_json_error($response->get_error_message());
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        if ($status_code == 200) {
            wp_send_json_success('App is online and responding');
        } else {
            wp_send_json_error("App returned status code: {$status_code}");
        }
    }
    
    /**
     * Shortcodes
     */
    public function signup_shortcode($atts) {
        $atts = shortcode_atts(array(
            'plan' => 'premium',
            'button_text' => 'Start Free Trial',
            'redirect_url' => ''
        ), $atts);
        
        $app_url = get_option('mypocketsister_app_url', 'https://app.mypocketsister.com');
        $redirect = !empty($atts['redirect_url']) ? $atts['redirect_url'] : $app_url . '/signup';
        
        return sprintf(
            '<a href="%s?plan=%s&source=wordpress" class="mypocketsister-cta-button" data-plan="%s">%s</a>',
            esc_url($redirect),
            esc_attr($atts['plan']),
            esc_attr($atts['plan']),
            esc_html($atts['button_text'])
        );
    }
    
    public function app_status_shortcode($atts) {
        $atts = shortcode_atts(array(
            'show_users' => 'false',
            'show_status' => 'true'
        ), $atts);
        
        ob_start();
        ?>
        <div class="mypocketsister-status-widget">
            <?php if ($atts['show_status'] === 'true'): ?>
                <div class="app-status">
                    <span class="status-indicator" id="app-status-indicator">●</span>
                    <span id="app-status-text">Checking status...</span>
                </div>
            <?php endif; ?>
            
            <?php if ($atts['show_users'] === 'true'): ?>
                <div class="user-stats">
                    <p><strong>Active Families:</strong> <span id="active-families">Loading...</span></p>
                </div>
            <?php endif; ?>
        </div>
        
        <script>
        jQuery(document).ready(function($) {
            $.post(mypocketsister_ajax.ajax_url, {
                action: 'get_app_status',
                nonce: mypocketsister_ajax.nonce
            }, function(response) {
                if (response.success) {
                    $('#app-status-indicator').css('color', 'green');
                    $('#app-status-text').text('App Online');
                } else {
                    $('#app-status-indicator').css('color', 'red');
                    $('#app-status-text').text('App Offline');
                }
            });
        });
        </script>
        <?php
        return ob_get_clean();
    }
    
    public function pricing_shortcode($atts) {
        $atts = shortcode_atts(array(
            'style' => 'cards',
            'highlight' => 'premium'
        ), $atts);
        
        ob_start();
        ?>
        <div class="mypocketsister-pricing-table">
            <div class="pricing-plan <?php echo $atts['highlight'] === 'basic' ? 'highlighted' : ''; ?>">
                <h3>Basic Plan</h3>
                <div class="price">$9.99<span>/month</span></div>
                <ul>
                    <li>50 AI interactions/day</li>
                    <li>1 child profile</li>
                    <li>Basic avatar creation</li>
                    <li>Daily affirmations</li>
                </ul>
                <?php echo $this->signup_shortcode(array('plan' => 'basic')); ?>
            </div>
            
            <div class="pricing-plan <?php echo $atts['highlight'] === 'premium' ? 'highlighted' : ''; ?>">
                <h3>Premium Plan</h3>
                <div class="price">$19.99<span>/month</span></div>
                <ul>
                    <li>200 AI interactions/day</li>
                    <li>Up to 3 child profiles</li>
                    <li>Advanced AI with voice</li>
                    <li>AI-generated avatars</li>
                </ul>
                <?php echo $this->signup_shortcode(array('plan' => 'premium')); ?>
            </div>
            
            <div class="pricing-plan <?php echo $atts['highlight'] === 'family' ? 'highlighted' : ''; ?>">
                <h3>Family Plan</h3>
                <div class="price">$29.99<span>/month</span></div>
                <ul>
                    <li>Unlimited AI interactions</li>
                    <li>Unlimited child profiles</li>
                    <li>GPS tracking & messaging</li>
                    <li>Family analytics</li>
                </ul>
                <?php echo $this->signup_shortcode(array('plan' => 'family')); ?>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Register custom post types
     */
    public function register_custom_post_types() {
        // Safety Alerts post type
        register_post_type('safety_alert', array(
            'labels' => array(
                'name' => 'Safety Alerts',
                'singular_name' => 'Safety Alert',
                'menu_name' => 'Safety Alerts',
                'add_new' => 'Add New Alert',
                'add_new_item' => 'Add New Safety Alert',
                'edit_item' => 'Edit Safety Alert',
                'new_item' => 'New Safety Alert',
                'view_item' => 'View Safety Alert'
            ),
            'public' => false,
            'show_ui' => true,
            'show_in_menu' => 'tools.php',
            'capability_type' => 'post',
            'supports' => array('title', 'editor', 'custom-fields'),
            'menu_icon' => 'dashicons-shield-alt'
        ));
        
        // App Testimonials post type
        register_post_type('app_testimonial', array(
            'labels' => array(
                'name' => 'App Testimonials',
                'singular_name' => 'Testimonial',
                'menu_name' => 'Testimonials',
                'add_new' => 'Add New Testimonial',
                'add_new_item' => 'Add New Testimonial',
                'edit_item' => 'Edit Testimonial',
                'new_item' => 'New Testimonial',
                'view_item' => 'View Testimonial'
            ),
            'public' => true,
            'show_ui' => true,
            'supports' => array('title', 'editor', 'thumbnail', 'custom-fields'),
            'menu_icon' => 'dashicons-heart'
        ));
    }
    
    /**
     * Register widgets
     */
    public function register_widgets() {
        register_widget('MyPocketSister_Status_Widget');
        register_widget('MyPocketSister_Signup_Widget');
    }
}

/**
 * Status Widget
 */
class MyPocketSister_Status_Widget extends WP_Widget {
    
    public function __construct() {
        parent::__construct(
            'mypocketsister_status',
            'MyPocketSister Status',
            array('description' => 'Shows the current status of your MyPocketSister app')
        );
    }
    
    public function widget($args, $instance) {
        echo $args['before_widget'];
        if (!empty($instance['title'])) {
            echo $args['before_title'] . apply_filters('widget_title', $instance['title']) . $args['after_title'];
        }
        
        echo '<div class="mypocketsister-status-widget">';
        echo '<div class="app-status">';
        echo '<span class="status-indicator" style="color: green;">●</span>';
        echo '<span>App Online</span>';
        echo '</div>';
        echo '</div>';
        
        echo $args['after_widget'];
    }
    
    public function form($instance) {
        $title = !empty($instance['title']) ? $instance['title'] : 'App Status';
        ?>
        <p>
            <label for="<?php echo $this->get_field_id('title'); ?>">Title:</label>
            <input class="widefat" id="<?php echo $this->get_field_id('title'); ?>" name="<?php echo $this->get_field_name('title'); ?>" type="text" value="<?php echo esc_attr($title); ?>">
        </p>
        <?php
    }
    
    public function update($new_instance, $old_instance) {
        $instance = array();
        $instance['title'] = (!empty($new_instance['title'])) ? sanitize_text_field($new_instance['title']) : '';
        return $instance;
    }
}

/**
 * Signup Widget
 */
class MyPocketSister_Signup_Widget extends WP_Widget {
    
    public function __construct() {
        parent::__construct(
            'mypocketsister_signup',
            'MyPocketSister Signup',
            array('description' => 'Add a signup button for MyPocketSister')
        );
    }
    
    public function widget($args, $instance) {
        echo $args['before_widget'];
        if (!empty($instance['title'])) {
            echo $args['before_title'] . apply_filters('widget_title', $instance['title']) . $args['after_title'];
        }
        
        $button_text = !empty($instance['button_text']) ? $instance['button_text'] : 'Start Free Trial';
        $plan = !empty($instance['plan']) ? $instance['plan'] : 'premium';
        
        $app_url = get_option('mypocketsister_app_url', 'https://app.mypocketsister.com');
        
        echo '<div class="mypocketsister-signup-widget">';
        echo '<p>Join thousands of families using MyPocketSister to support their daughters\' growth.</p>';
        echo '<a href="' . esc_url($app_url . '/signup?plan=' . $plan . '&source=widget') . '" class="button">' . esc_html($button_text) . '</a>';
        echo '</div>';
        
        echo $args['after_widget'];
    }
    
    public function form($instance) {
        $title = !empty($instance['title']) ? $instance['title'] : 'Try MyPocketSister';
        $button_text = !empty($instance['button_text']) ? $instance['button_text'] : 'Start Free Trial';
        $plan = !empty($instance['plan']) ? $instance['plan'] : 'premium';
        ?>
        <p>
            <label for="<?php echo $this->get_field_id('title'); ?>">Title:</label>
            <input class="widefat" id="<?php echo $this->get_field_id('title'); ?>" name="<?php echo $this->get_field_name('title'); ?>" type="text" value="<?php echo esc_attr($title); ?>">
        </p>
        <p>
            <label for="<?php echo $this->get_field_id('button_text'); ?>">Button Text:</label>
            <input class="widefat" id="<?php echo $this->get_field_id('button_text'); ?>" name="<?php echo $this->get_field_name('button_text'); ?>" type="text" value="<?php echo esc_attr($button_text); ?>">
        </p>
        <p>
            <label for="<?php echo $this->get_field_id('plan'); ?>">Default Plan:</label>
            <select class="widefat" id="<?php echo $this->get_field_id('plan'); ?>" name="<?php echo $this->get_field_name('plan'); ?>">
                <option value="basic" <?php selected($plan, 'basic'); ?>>Basic</option>
                <option value="premium" <?php selected($plan, 'premium'); ?>>Premium</option>
                <option value="family" <?php selected($plan, 'family'); ?>>Family</option>
            </select>
        </p>
        <?php
    }
    
    public function update($new_instance, $old_instance) {
        $instance = array();
        $instance['title'] = (!empty($new_instance['title'])) ? sanitize_text_field($new_instance['title']) : '';
        $instance['button_text'] = (!empty($new_instance['button_text'])) ? sanitize_text_field($new_instance['button_text']) : '';
        $instance['plan'] = (!empty($new_instance['plan'])) ? sanitize_text_field($new_instance['plan']) : '';
        return $instance;
    }
}

// Initialize the plugin
new MyPocketSisterIntegration();

/**
 * Activation hook
 */
register_activation_hook(__FILE__, function() {
    // Set default options
    add_option('mypocketsister_app_url', 'https://app.mypocketsister.com');
    add_option('mypocketsister_sync_enabled', false);
    add_option('mypocketsister_content_sharing', false);
    add_option('mypocketsister_safety_alerts', false);
    add_option('mypocketsister_users_synced', 0);
    add_option('mypocketsister_content_shared', 0);
    
    // Flush rewrite rules
    flush_rewrite_rules();
});

/**
 * Deactivation hook
 */
register_deactivation_hook(__FILE__, function() {
    // Flush rewrite rules
    flush_rewrite_rules();
});
?>