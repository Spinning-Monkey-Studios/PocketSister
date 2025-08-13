<?php
/**
 * MyPocketSister Theme Functions
 * 
 * This file contains all the theme setup, enqueue scripts/styles,
 * custom functions, and WordPress hooks for the MyPocketSister theme.
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Theme Setup
 */
function mypocketsister_setup() {
    // Add theme support for various WordPress features
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('custom-logo');
    add_theme_support('custom-header');
    add_theme_support('custom-background');
    add_theme_support('html5', array(
        'search-form',
        'comment-form',
        'comment-list',
        'gallery',
        'caption',
        'script',
        'style'
    ));
    
    // Add support for responsive embeds
    add_theme_support('responsive-embeds');
    
    // Add support for editor styles
    add_theme_support('editor-styles');
    
    // Register navigation menus
    register_nav_menus(array(
        'primary' => esc_html__('Primary Menu', 'mypocketsister'),
        'footer' => esc_html__('Footer Menu', 'mypocketsister'),
    ));
    
    // Set content width
    if (!isset($content_width)) {
        $content_width = 1200;
    }
    
    // Add image sizes
    add_image_size('mypocketsister-featured', 800, 400, true);
    add_image_size('mypocketsister-thumbnail', 350, 200, true);
}
add_action('after_setup_theme', 'mypocketsister_setup');

/**
 * Enqueue Scripts and Styles
 */
function mypocketsister_scripts() {
    // Theme stylesheet
    wp_enqueue_style('mypocketsister-style', get_stylesheet_uri(), array(), wp_get_theme()->get('Version'));
    
    // Google Fonts (already loaded in header.php, but keeping as backup)
    wp_enqueue_style('mypocketsister-fonts', 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Nunito:wght@400;600;700;800&display=swap', array(), null);
    
    // Theme JavaScript
    wp_enqueue_script('mypocketsister-script', get_template_directory_uri() . '/js/theme.js', array(), wp_get_theme()->get('Version'), true);
    
    // Comment reply script
    if (is_singular() && comments_open() && get_option('thread_comments')) {
        wp_enqueue_script('comment-reply');
    }
    
    // Localize script for AJAX
    wp_localize_script('mypocketsister-script', 'mypocketsister_ajax', array(
        'ajax_url' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('mypocketsister_nonce'),
        'app_url' => get_theme_mod('app_url', 'https://app.mypocketsister.com')
    ));
}
add_action('wp_enqueue_scripts', 'mypocketsister_scripts');

/**
 * Customizer Settings
 */
function mypocketsister_customize_register($wp_customize) {
    // MyPocketSister Settings Section
    $wp_customize->add_section('mypocketsister_settings', array(
        'title' => __('MyPocketSister Settings', 'mypocketsister'),
        'priority' => 30,
    ));
    
    // Custom Logo URL Setting
    $wp_customize->add_setting('custom_logo_url', array(
        'default' => get_template_directory_uri() . '/assets/logo.png',
        'sanitize_callback' => 'esc_url_raw',
    ));
    
    $wp_customize->add_control('custom_logo_url', array(
        'label' => __('Custom Logo URL', 'mypocketsister'),
        'description' => __('Enter the URL to your logo image. This should be updated to point to your WordPress uploads directory after uploading the logo.', 'mypocketsister'),
        'section' => 'mypocketsister_settings',
        'type' => 'url',
    ));
    
    // App URL Setting
    $wp_customize->add_setting('app_url', array(
        'default' => 'https://app.mypocketsister.com',
        'sanitize_callback' => 'esc_url_raw',
    ));
    
    $wp_customize->add_control('app_url', array(
        'label' => __('App URL', 'mypocketsister'),
        'description' => __('The URL where your MyPocketSister app is hosted.', 'mypocketsister'),
        'section' => 'mypocketsister_settings',
        'type' => 'url',
    ));
    
    // Social Media URLs
    $social_platforms = array(
        'facebook' => 'Facebook',
        'twitter' => 'Twitter',
        'instagram' => 'Instagram',
        'youtube' => 'YouTube'
    );
    
    foreach ($social_platforms as $platform => $label) {
        $wp_customize->add_setting($platform . '_url', array(
            'default' => '',
            'sanitize_callback' => 'esc_url_raw',
        ));
        
        $wp_customize->add_control($platform . '_url', array(
            'label' => sprintf(__('%s URL', 'mypocketsister'), $label),
            'section' => 'mypocketsister_settings',
            'type' => 'url',
        ));
    }
    
    // Newsletter Settings
    $wp_customize->add_setting('newsletter_enabled', array(
        'default' => true,
        'sanitize_callback' => 'wp_validate_boolean',
    ));
    
    $wp_customize->add_control('newsletter_enabled', array(
        'label' => __('Enable Newsletter Signup', 'mypocketsister'),
        'section' => 'mypocketsister_settings',
        'type' => 'checkbox',
    ));
}
add_action('customize_register', 'mypocketsister_customize_register');

/**
 * Widget Areas
 */
function mypocketsister_widgets_init() {
    register_sidebar(array(
        'name' => esc_html__('Sidebar', 'mypocketsister'),
        'id' => 'sidebar-1',
        'description' => esc_html__('Add widgets here.', 'mypocketsister'),
        'before_widget' => '<section id="%1$s" class="widget %2$s">',
        'after_widget' => '</section>',
        'before_title' => '<h3 class="widget-title">',
        'after_title' => '</h3>',
    ));
    
    register_sidebar(array(
        'name' => esc_html__('Footer Widget Area 1', 'mypocketsister'),
        'id' => 'footer-1',
        'description' => esc_html__('First footer widget area.', 'mypocketsister'),
        'before_widget' => '<div id="%1$s" class="footer-widget %2$s">',
        'after_widget' => '</div>',
        'before_title' => '<h3 class="widget-title">',
        'after_title' => '</h3>',
    ));
    
    register_sidebar(array(
        'name' => esc_html__('Footer Widget Area 2', 'mypocketsister'),
        'id' => 'footer-2',
        'description' => esc_html__('Second footer widget area.', 'mypocketsister'),
        'before_widget' => '<div id="%1$s" class="footer-widget %2$s">',
        'after_widget' => '</div>',
        'before_title' => '<h3 class="widget-title">',
        'after_title' => '</h3>',
    ));
}
add_action('widgets_init', 'mypocketsister_widgets_init');

/**
 * Custom Post Excerpt Length
 */
function mypocketsister_excerpt_length($length) {
    return 25;
}
add_filter('excerpt_length', 'mypocketsister_excerpt_length');

/**
 * Custom Excerpt More
 */
function mypocketsister_excerpt_more($more) {
    return '...';
}
add_filter('excerpt_more', 'mypocketsister_excerpt_more');

/**
 * Custom Body Classes
 */
function mypocketsister_body_classes($classes) {
    // Add class for single posts
    if (is_single()) {
        $classes[] = 'single-post';
    }
    
    // Add class for pages
    if (is_page()) {
        $classes[] = 'single-page';
    }
    
    // Add class for blog page
    if (is_home()) {
        $classes[] = 'blog-home';
    }
    
    return $classes;
}
add_filter('body_class', 'mypocketsister_body_classes');

/**
 * Newsletter Signup AJAX Handler
 */
function mypocketsister_newsletter_signup() {
    // Verify nonce
    if (!wp_verify_nonce($_POST['nonce'], 'mypocketsister_nonce')) {
        wp_die('Security check failed');
    }
    
    $email = sanitize_email($_POST['email']);
    
    if (!is_email($email)) {
        wp_send_json_error('Invalid email address');
    }
    
    // Here you would integrate with your email service provider
    // For now, we'll just simulate success
    
    // Save to WordPress options as a simple storage (you might want to use a proper email service)
    $subscribers = get_option('mypocketsister_subscribers', array());
    if (!in_array($email, $subscribers)) {
        $subscribers[] = $email;
        update_option('mypocketsister_subscribers', $subscribers);
    }
    
    wp_send_json_success('Thank you for subscribing!');
}
add_action('wp_ajax_newsletter_signup', 'mypocketsister_newsletter_signup');
add_action('wp_ajax_nopriv_newsletter_signup', 'mypocketsister_newsletter_signup');

/**
 * Custom Comments Callback
 */
function mypocketsister_comment($comment, $args, $depth) {
    if ('div' === $args['style']) {
        $tag       = 'div';
        $add_below = 'comment';
    } else {
        $tag       = 'li';
        $add_below = 'div-comment';
    }
    ?>
    <<?php echo $tag; ?> <?php comment_class(empty($args['has_children']) ? '' : 'parent'); ?> id="comment-<?php comment_ID(); ?>">
    <?php if ('div' != $args['style']) : ?>
        <div id="div-comment-<?php comment_ID(); ?>" class="comment-body">
    <?php endif; ?>
    
    <div class="comment-author vcard">
        <?php if ($args['avatar_size'] != 0) echo get_avatar($comment, $args['avatar_size']); ?>
        <?php printf(__('<cite class="fn">%s</cite> <span class="says">says:</span>'), get_comment_author_link()); ?>
    </div>
    
    <?php if ($comment->comment_approved == '0') : ?>
        <em class="comment-awaiting-moderation"><?php _e('Your comment is awaiting moderation.'); ?></em>
        <br />
    <?php endif; ?>
    
    <div class="comment-meta commentmetadata">
        <a href="<?php echo htmlspecialchars(get_comment_link($comment->comment_ID)); ?>">
            <?php
            printf(__('%1$s at %2$s'), get_comment_date(),  get_comment_time());
            ?>
        </a>
        <?php edit_comment_link(__('(Edit)'), '  ', ''); ?>
    </div>
    
    <?php comment_text(); ?>
    
    <div class="reply">
        <?php comment_reply_link(array_merge($args, array('add_below' => $add_below, 'depth' => $depth, 'max_depth' => $args['max_depth']))); ?>
    </div>
    
    <?php if ('div' != $args['style']) : ?>
        </div>
    <?php endif; ?>
    <?php
}

/**
 * Security Enhancements
 */
// Remove WordPress version from head
remove_action('wp_head', 'wp_generator');

// Remove WordPress version from RSS feeds
function mypocketsister_remove_version() {
    return '';
}
add_filter('the_generator', 'mypocketsister_remove_version');

// Disable XML-RPC
add_filter('xmlrpc_enabled', '__return_false');

// Remove unnecessary head links
remove_action('wp_head', 'wlwmanifest_link');
remove_action('wp_head', 'rsd_link');

/**
 * SEO Enhancements
 */
function mypocketsister_seo_meta() {
    if (is_single() || is_page()) {
        global $post;
        if ($post) {
            $description = wp_trim_words(strip_tags($post->post_content), 25, '...');
            echo '<meta name="description" content="' . esc_attr($description) . '">' . "\n";
        }
    }
}
add_action('wp_head', 'mypocketsister_seo_meta');

/**
 * Performance Optimizations
 */
// Defer parsing of JavaScript
function mypocketsister_defer_parsing_js($url) {
    if (FALSE === strpos($url, '.js') || strpos($url, 'jquery.js')) return $url;
    return "$url' defer='defer";
}
add_filter('clean_url', 'mypocketsister_defer_parsing_js', 11, 1);

// Remove query strings from static resources
function mypocketsister_remove_query_strings($src) {
    $parts = explode('?ver', $src);
    return $parts[0];
}
add_filter('script_loader_src', 'mypocketsister_remove_query_strings', 15, 1);
add_filter('style_loader_src', 'mypocketsister_remove_query_strings', 15, 1);

/**
 * Custom Admin Functions
 */
function mypocketsister_admin_styles() {
    echo '<style>
        .toplevel_page_mypocketsister-settings .wp-menu-image:before {
            content: "\\1f469\\200d\\1f4bb";
            font-family: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif;
        }
    </style>';
}
add_action('admin_head', 'mypocketsister_admin_styles');

/**
 * Theme Support for Gutenberg
 */
function mypocketsister_gutenberg_support() {
    // Add support for wide and full width images
    add_theme_support('align-wide');
    
    // Add support for custom color palette
    add_theme_support('editor-color-palette', array(
        array(
            'name' => __('Primary Pink', 'mypocketsister'),
            'slug' => 'primary-pink',
            'color' => '#F472B6',
        ),
        array(
            'name' => __('Primary Purple', 'mypocketsister'),
            'slug' => 'primary-purple',
            'color' => '#A855F7',
        ),
        array(
            'name' => __('Accent Green', 'mypocketsister'),
            'slug' => 'accent-green',
            'color' => '#34D399',
        ),
        array(
            'name' => __('Accent Gold', 'mypocketsister'),
            'slug' => 'accent-gold',
            'color' => '#FBBF24',
        ),
    ));
    
    // Disable custom colors
    add_theme_support('disable-custom-colors');
    
    // Add support for custom font sizes
    add_theme_support('editor-font-sizes', array(
        array(
            'name' => __('Small', 'mypocketsister'),
            'size' => 14,
            'slug' => 'small'
        ),
        array(
            'name' => __('Regular', 'mypocketsister'),
            'size' => 16,
            'slug' => 'regular'
        ),
        array(
            'name' => __('Large', 'mypocketsister'),
            'size' => 20,
            'slug' => 'large'
        ),
        array(
            'name' => __('Extra Large', 'mypocketsister'),
            'size' => 24,
            'slug' => 'extra-large'
        )
    ));
}
add_action('after_setup_theme', 'mypocketsister_gutenberg_support');

/**
 * Custom Login Page Styling
 */
function mypocketsister_login_style() {
    ?>
    <style type="text/css">
        body.login {
            background: linear-gradient(135deg, #FDF2F8 0%, #F3E8FF 100%);
        }
        
        .login h1 a {
            background-image: url('<?php echo esc_url(get_theme_mod('custom_logo_url', get_template_directory_uri() . '/assets/logo.png')); ?>');
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            width: 100px;
            height: 100px;
        }
        
        .login form {
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        
        .login .button-primary {
            background: linear-gradient(135deg, #F472B6 0%, #A855F7 100%);
            border: none;
            border-radius: 6px;
            text-shadow: none;
            box-shadow: none;
        }
        
        .login .button-primary:hover {
            background: linear-gradient(135deg, #EC4899 0%, #9333EA 100%);
        }
    </style>
    <?php
}
add_action('login_enqueue_scripts', 'mypocketsister_login_style');

/**
 * Change login logo URL
 */
function mypocketsister_login_logo_url() {
    return home_url();
}
add_filter('login_headerurl', 'mypocketsister_login_logo_url');

/**
 * Change login logo title
 */
function mypocketsister_login_logo_url_title() {
    return 'MyPocketSister';
}
add_filter('login_headertitle', 'mypocketsister_login_logo_url_title');
?>