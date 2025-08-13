<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="profile" href="https://gmpg.org/xfn/11">
    
    <!-- Preload Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
    
    <!-- SEO Meta Tags -->
    <meta name="description" content="<?php echo esc_attr(get_bloginfo('description', 'display')); ?>">
    <meta name="keywords" content="AI companion, young girls, digital mentor, parenting support, child development, safety, COPPA compliant">
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="<?php wp_title('|', true, 'right'); ?>">
    <meta property="og:description" content="<?php echo esc_attr(get_bloginfo('description', 'display')); ?>">
    <meta property="og:image" content="<?php echo esc_url(get_template_directory_uri() . '/assets/logo-og.png'); ?>">
    <meta property="og:url" content="<?php echo esc_url(home_url('/')); ?>">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="MyPocketSister">
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="<?php wp_title('|', true, 'right'); ?>">
    <meta name="twitter:description" content="<?php echo esc_attr(get_bloginfo('description', 'display')); ?>">
    <meta name="twitter:image" content="<?php echo esc_url(get_template_directory_uri() . '/assets/logo-og.png'); ?>">
    
    <!-- Favicon -->
    <link rel="icon" type="image/png" sizes="32x32" href="<?php echo esc_url(get_template_directory_uri() . '/assets/favicon-32x32.png'); ?>">
    <link rel="icon" type="image/png" sizes="16x16" href="<?php echo esc_url(get_template_directory_uri() . '/assets/favicon-16x16.png'); ?>">
    <link rel="apple-touch-icon" sizes="180x180" href="<?php echo esc_url(get_template_directory_uri() . '/assets/apple-touch-icon.png'); ?>">
    
    <?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<header class="site-header">
    <div class="container">
        <div class="header-content">
            <!-- Logo and Site Title -->
            <a href="<?php echo esc_url(home_url('/')); ?>" class="site-logo">
                <img src="<?php echo esc_url(get_theme_mod('custom_logo_url', get_template_directory_uri() . '/assets/logo.png')); ?>" 
                     alt="MyPocketSister Logo" 
                     width="40" 
                     height="40">
                <span><?php bloginfo('name'); ?></span>
            </a>
            
            <!-- Main Navigation -->
            <nav class="main-navigation">
                <?php
                wp_nav_menu(array(
                    'theme_location' => 'primary',
                    'menu_class' => 'nav-menu',
                    'container' => false,
                    'fallback_cb' => 'mypocketsister_fallback_menu'
                ));
                ?>
                
                <!-- CTA Button -->
                <a href="<?php echo esc_url(get_theme_mod('app_url', 'https://app.mypocketsister.com')); ?>" 
                   class="cta-button">
                    Launch App
                </a>
                
                <!-- Mobile Menu Toggle -->
                <button class="mobile-menu-toggle" id="mobile-menu-toggle" style="display: none; background: none; border: none; cursor: pointer; padding: 0.5rem;">
                    <span style="display: block; width: 25px; height: 3px; background: var(--text-dark); margin: 5px 0; transition: 0.3s;"></span>
                    <span style="display: block; width: 25px; height: 3px; background: var(--text-dark); margin: 5px 0; transition: 0.3s;"></span>
                    <span style="display: block; width: 25px; height: 3px; background: var(--text-dark); margin: 5px 0; transition: 0.3s;"></span>
                </button>
            </nav>
        </div>
    </div>
</header>

<!-- Mobile Navigation Overlay -->
<div class="mobile-nav-overlay" id="mobile-nav-overlay" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 999;">
    <div style="position: absolute; top: 0; right: 0; width: 300px; height: 100%; background: white; padding: 2rem; transform: translateX(100%); transition: transform 0.3s ease;">
        <button class="mobile-menu-close" style="position: absolute; top: 1rem; right: 1rem; background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
        
        <div style="margin-top: 3rem;">
            <?php
            wp_nav_menu(array(
                'theme_location' => 'primary',
                'menu_class' => 'mobile-nav-menu',
                'container' => false,
                'fallback_cb' => 'mypocketsister_fallback_menu'
            ));
            ?>
            
            <div style="margin-top: 2rem;">
                <a href="<?php echo esc_url(get_theme_mod('app_url', 'https://app.mypocketsister.com')); ?>" 
                   class="cta-button" style="width: 100%; justify-content: center;">
                    Launch App
                </a>
            </div>
        </div>
    </div>
</div>

<script>
// Mobile Menu Functionality
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('mobile-menu-toggle');
    const menuOverlay = document.getElementById('mobile-nav-overlay');
    const menuClose = document.querySelector('.mobile-menu-close');
    const mobileMenu = menuOverlay.querySelector('div');
    
    function openMobileMenu() {
        menuOverlay.style.display = 'block';
        setTimeout(() => {
            mobileMenu.style.transform = 'translateX(0)';
        }, 10);
    }
    
    function closeMobileMenu() {
        mobileMenu.style.transform = 'translateX(100%)';
        setTimeout(() => {
            menuOverlay.style.display = 'none';
        }, 300);
    }
    
    if (menuToggle) {
        menuToggle.addEventListener('click', openMobileMenu);
    }
    
    if (menuClose) {
        menuClose.addEventListener('click', closeMobileMenu);
    }
    
    if (menuOverlay) {
        menuOverlay.addEventListener('click', function(e) {
            if (e.target === menuOverlay) {
                closeMobileMenu();
            }
        });
    }
    
    // Show mobile menu toggle on small screens
    function checkScreenSize() {
        if (window.innerWidth <= 768) {
            if (menuToggle) menuToggle.style.display = 'block';
            const mainNav = document.querySelector('.main-navigation .nav-menu');
            if (mainNav) mainNav.style.display = 'none';
        } else {
            if (menuToggle) menuToggle.style.display = 'none';
            const mainNav = document.querySelector('.main-navigation .nav-menu');
            if (mainNav) mainNav.style.display = 'flex';
            closeMobileMenu();
        }
    }
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
});

// Newsletter Form Handling
document.addEventListener('DOMContentLoaded', function() {
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = this.querySelector('input[type="email"]').value;
            const button = this.querySelector('button');
            const originalText = button.textContent;
            
            button.textContent = 'Subscribing...';
            button.disabled = true;
            
            // Simulate newsletter signup (integrate with your email service)
            setTimeout(() => {
                alert('Thank you for subscribing! We\'ll keep you updated with the latest news and tips.');
                this.reset();
                button.textContent = originalText;
                button.disabled = false;
            }, 1000);
        });
    }
});
</script>

<style>
/* Mobile Menu Styles */
.mobile-nav-menu {
    list-style: none;
    margin: 0;
    padding: 0;
}

.mobile-nav-menu li {
    margin-bottom: 1rem;
}

.mobile-nav-menu a {
    display: block;
    padding: 0.75rem 0;
    color: var(--text-dark);
    text-decoration: none;
    font-weight: 500;
    border-bottom: 1px solid var(--border-color);
}

.mobile-nav-menu a:hover {
    color: var(--primary-purple);
}

/* Responsive Navigation */
@media (max-width: 768px) {
    .main-navigation {
        position: relative;
    }
    
    .nav-menu {
        display: none !important;
    }
    
    .mobile-menu-toggle {
        display: block !important;
    }
    
    .cta-button {
        display: none;
    }
}
</style>

<?php
// Fallback menu function
function mypocketsister_fallback_menu() {
    echo '<ul class="nav-menu">';
    echo '<li><a href="' . esc_url(home_url('/')) . '">Home</a></li>';
    echo '<li><a href="' . esc_url(home_url('/blog')) . '">Blog</a></li>';
    echo '<li><a href="' . esc_url(home_url('/about')) . '">About</a></li>';
    echo '<li><a href="' . esc_url(home_url('/privacy')) . '">Privacy</a></li>';
    echo '<li><a href="' . esc_url(home_url('/terms')) . '">Terms</a></li>';
    echo '<li><a href="' . esc_url(home_url('/contact')) . '">Contact</a></li>';
    echo '</ul>';
}
?>