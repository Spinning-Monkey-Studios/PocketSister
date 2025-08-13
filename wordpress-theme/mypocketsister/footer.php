<footer class="site-footer">
    <div class="container">
        <div class="footer-content">
            <!-- About Section -->
            <div class="footer-section">
                <h3>MyPocketSister</h3>
                <p>Empowering young girls through AI-powered companionship, guidance, and support. Our mission is to provide a safe, nurturing digital environment where girls can grow with confidence.</p>
                <div class="social-links">
                    <a href="<?php echo esc_url(get_theme_mod('facebook_url', '#')); ?>" class="social-link" title="Facebook">
                        <span style="font-size: 1.2rem;">📘</span>
                    </a>
                    <a href="<?php echo esc_url(get_theme_mod('twitter_url', '#')); ?>" class="social-link" title="Twitter">
                        <span style="font-size: 1.2rem;">🐦</span>
                    </a>
                    <a href="<?php echo esc_url(get_theme_mod('instagram_url', '#')); ?>" class="social-link" title="Instagram">
                        <span style="font-size: 1.2rem;">📸</span>
                    </a>
                    <a href="<?php echo esc_url(get_theme_mod('youtube_url', '#')); ?>" class="social-link" title="YouTube">
                        <span style="font-size: 1.2rem;">📺</span>
                    </a>
                </div>
            </div>
            
            <!-- Quick Links -->
            <div class="footer-section">
                <h3>Quick Links</h3>
                <ul style="list-style: none; margin: 0; padding: 0;">
                    <li style="margin-bottom: 0.5rem;"><a href="<?php echo esc_url(home_url('/')); ?>">Home</a></li>
                    <li style="margin-bottom: 0.5rem;"><a href="<?php echo esc_url(home_url('/about')); ?>">About Us</a></li>
                    <li style="margin-bottom: 0.5rem;"><a href="<?php echo esc_url(home_url('/blog')); ?>">Blog</a></li>
                    <li style="margin-bottom: 0.5rem;"><a href="<?php echo esc_url(home_url('/signup')); ?>">Sign Up</a></li>
                    <li style="margin-bottom: 0.5rem;"><a href="<?php echo esc_url(get_theme_mod('app_url', 'https://app.mypocketsister.com')); ?>">Launch App</a></li>
                    <li style="margin-bottom: 0.5rem;"><a href="<?php echo esc_url(home_url('/contact')); ?>">Contact</a></li>
                </ul>
            </div>
            
            <!-- Support -->
            <div class="footer-section">
                <h3>Support</h3>
                <ul style="list-style: none; margin: 0; padding: 0;">
                    <li style="margin-bottom: 0.5rem;"><a href="<?php echo esc_url(home_url('/help')); ?>">Help Center</a></li>
                    <li style="margin-bottom: 0.5rem;"><a href="<?php echo esc_url(home_url('/faq')); ?>">FAQ</a></li>
                    <li style="margin-bottom: 0.5rem;"><a href="<?php echo esc_url(home_url('/safety')); ?>">Safety Guide</a></li>
                    <li style="margin-bottom: 0.5rem;"><a href="<?php echo esc_url(home_url('/parent-guide')); ?>">Parent Guide</a></li>
                    <li style="margin-bottom: 0.5rem;"><a href="mailto:support@mypocketsister.com">Email Support</a></li>
                </ul>
            </div>
            
            <!-- Legal -->
            <div class="footer-section">
                <h3>Legal</h3>
                <ul style="list-style: none; margin: 0; padding: 0;">
                    <li style="margin-bottom: 0.5rem;"><a href="<?php echo esc_url(home_url('/privacy')); ?>">Privacy Policy</a></li>
                    <li style="margin-bottom: 0.5rem;"><a href="<?php echo esc_url(home_url('/terms')); ?>">Terms of Service</a></li>
                    <li style="margin-bottom: 0.5rem;"><a href="<?php echo esc_url(home_url('/coppa')); ?>">COPPA Compliance</a></li>
                    <li style="margin-bottom: 0.5rem;"><a href="<?php echo esc_url(home_url('/data-protection')); ?>">Data Protection</a></li>
                    <li style="margin-bottom: 0.5rem;"><a href="<?php echo esc_url(home_url('/accessibility')); ?>">Accessibility</a></li>
                </ul>
            </div>
        </div>
        
        <div class="footer-bottom">
            <p>&copy; <?php echo date('Y'); ?> MyPocketSister. All rights reserved. | Designed with ❤️ for young girls everywhere.</p>
            <p style="font-size: 0.875rem; margin-top: 0.5rem; color: #9CA3AF;">
                COPPA Compliant • Safe • Secure • Trusted by families worldwide
            </p>
        </div>
    </div>
</footer>

<!-- Back to Top Button -->
<button id="back-to-top" style="display: none; position: fixed; bottom: 2rem; right: 2rem; background: linear-gradient(135deg, var(--primary-pink) 0%, var(--primary-purple) 100%); color: white; border: none; border-radius: 50%; width: 50px; height: 50px; cursor: pointer; box-shadow: var(--shadow-lg); z-index: 1000; transition: all 0.3s ease;">
    ↑
</button>

<script>
// Back to Top Button
document.addEventListener('DOMContentLoaded', function() {
    const backToTopButton = document.getElementById('back-to-top');
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTopButton.style.display = 'block';
        } else {
            backToTopButton.style.display = 'none';
        }
    });
    
    backToTopButton.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});

// Smooth scrolling for anchor links
document.addEventListener('DOMContentLoaded', function() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});

// Form validation enhancement
document.addEventListener('DOMContentLoaded', function() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const requiredFields = this.querySelectorAll('[required]');
            let isValid = true;
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    field.style.borderColor = 'var(--primary-pink)';
                    field.style.boxShadow = '0 0 0 3px rgba(244, 114, 182, 0.1)';
                } else {
                    field.style.borderColor = 'var(--border-color)';
                    field.style.boxShadow = 'none';
                }
            });
            
            if (!isValid) {
                e.preventDefault();
                alert('Please fill in all required fields.');
            }
        });
    });
});

// Accessibility enhancements
document.addEventListener('DOMContentLoaded', function() {
    // Add skip to content link
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.style.cssText = `
        position: absolute;
        top: -40px;
        left: 6px;
        background: var(--text-dark);
        color: white;
        padding: 8px;
        text-decoration: none;
        border-radius: 4px;
        z-index: 1000;
        transition: top 0.3s;
    `;
    
    skipLink.addEventListener('focus', function() {
        this.style.top = '6px';
    });
    
    skipLink.addEventListener('blur', function() {
        this.style.top = '-40px';
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    // Add main content wrapper if it doesn't exist
    const mainContent = document.querySelector('main') || document.querySelector('.site-content');
    if (mainContent) {
        mainContent.id = 'main-content';
        mainContent.setAttribute('tabindex', '-1');
    }
});

// Performance optimization: Lazy load images
document.addEventListener('DOMContentLoaded', function() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        imageObserver.unobserve(img);
                    }
                }
            });
        });
        
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => imageObserver.observe(img));
    }
});
</script>

<style>
/* Lazy loading styles */
img.lazy {
    opacity: 0;
    transition: opacity 0.3s;
}

img.lazy.loaded {
    opacity: 1;
}

/* Print styles */
@media print {
    .site-header,
    .site-footer,
    .cta-button,
    #back-to-top,
    .mobile-nav-overlay {
        display: none !important;
    }
    
    body {
        background: white !important;
        color: black !important;
    }
    
    .card {
        border: 1px solid #ccc !important;
        box-shadow: none !important;
    }
}

/* High contrast mode */
@media (prefers-contrast: high) {
    .gradient-pink-purple,
    .gradient-purple-green,
    .gradient-green-gold,
    .gradient-gold-pink {
        background: #000 !important;
        color: #fff !important;
    }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
    * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
    }
}
</style>

<?php wp_footer(); ?>
</body>
</html>