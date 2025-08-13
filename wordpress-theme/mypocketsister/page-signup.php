<?php
/**
 * Template Name: Signup Page
 * 
 * This template is used for the signup page where users can register
 * for MyPocketSister and start their free trial.
 */

get_header(); ?>

<main id="main-content" class="site-main">
    <!-- Hero Section -->
    <section class="hero-section" style="padding: 3rem 0;">
        <div class="container">
            <div class="hero-content">
                <h1>Start Your Free Trial</h1>
                <p>Join thousands of families who trust MyPocketSister to support their daughters' growth and development.</p>
            </div>
        </div>
    </section>

    <!-- Signup Form Section -->
    <section style="padding: 2rem 0 4rem;">
        <div class="container">
            <div style="max-width: 800px; margin: 0 auto;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: start;">
                    
                    <!-- Signup Form -->
                    <div class="card">
                        <h2 style="margin-bottom: 1.5rem; text-align: center;">Create Your Account</h2>
                        
                        <form id="signup-form" action="<?php echo esc_url(get_theme_mod('app_url', 'https://app.mypocketsister.com')); ?>/signup" method="post">
                            <!-- Parent Information -->
                            <fieldset style="border: none; margin-bottom: 2rem; padding: 0;">
                                <legend style="font-weight: 600; margin-bottom: 1rem; color: var(--text-dark);">Parent Information</legend>
                                
                                <div class="form-group">
                                    <label for="parent_name" class="form-label">Parent/Guardian Name *</label>
                                    <input type="text" id="parent_name" name="parent_name" class="form-input" required>
                                </div>
                                
                                <div class="form-group">
                                    <label for="email" class="form-label">Email Address *</label>
                                    <input type="email" id="email" name="email" class="form-input" required>
                                </div>
                                
                                <div class="form-group">
                                    <label for="password" class="form-label">Password *</label>
                                    <input type="password" id="password" name="password" class="form-input" required minlength="8">
                                    <small style="color: var(--text-light); font-size: 0.875rem;">Minimum 8 characters</small>
                                </div>
                                
                                <div class="form-group">
                                    <label for="confirm_password" class="form-label">Confirm Password *</label>
                                    <input type="password" id="confirm_password" name="confirm_password" class="form-input" required>
                                </div>
                            </fieldset>
                            
                            <!-- Child Information -->
                            <fieldset style="border: none; margin-bottom: 2rem; padding: 0;">
                                <legend style="font-weight: 600; margin-bottom: 1rem; color: var(--text-dark);">Child Information</legend>
                                
                                <div class="form-group">
                                    <label for="child_name" class="form-label">Child's First Name *</label>
                                    <input type="text" id="child_name" name="child_name" class="form-input" required>
                                </div>
                                
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                                    <div class="form-group">
                                        <label for="child_age" class="form-label">Age *</label>
                                        <select id="child_age" name="child_age" class="form-select" required>
                                            <option value="">Select age</option>
                                            <option value="10">10 years old</option>
                                            <option value="11">11 years old</option>
                                            <option value="12">12 years old</option>
                                            <option value="13">13 years old</option>
                                            <option value="14">14 years old</option>
                                        </select>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="timezone" class="form-label">Timezone *</label>
                                        <select id="timezone" name="timezone" class="form-select" required>
                                            <option value="">Select timezone</option>
                                            <option value="EST">Eastern (EST)</option>
                                            <option value="CST">Central (CST)</option>
                                            <option value="MST">Mountain (MST)</option>
                                            <option value="PST">Pacific (PST)</option>
                                            <option value="GMT">GMT</option>
                                            <option value="CET">Central European (CET)</option>
                                        </select>
                                    </div>
                                </div>
                            </fieldset>
                            
                            <!-- Subscription Plan -->
                            <fieldset style="border: none; margin-bottom: 2rem; padding: 0;">
                                <legend style="font-weight: 600; margin-bottom: 1rem; color: var(--text-dark);">Choose Your Plan</legend>
                                
                                <div style="display: grid; gap: 1rem;">
                                    <label class="plan-option" style="display: flex; align-items: center; padding: 1rem; border: 2px solid var(--border-color); border-radius: var(--border-radius); cursor: pointer; transition: all 0.3s ease;">
                                        <input type="radio" name="plan" value="basic" checked style="margin-right: 1rem;">
                                        <div style="flex: 1;">
                                            <div style="font-weight: 600; color: var(--text-dark);">Basic Plan - $9.99/month</div>
                                            <div style="font-size: 0.875rem; color: var(--text-light);">50 interactions/day • 1 child profile • Basic features</div>
                                        </div>
                                        <div style="background: var(--accent-green); color: white; padding: 0.25rem 0.75rem; border-radius: 15px; font-size: 0.75rem; font-weight: 600;">7-DAY FREE</div>
                                    </label>
                                    
                                    <label class="plan-option" style="display: flex; align-items: center; padding: 1rem; border: 2px solid var(--border-color); border-radius: var(--border-radius); cursor: pointer; transition: all 0.3s ease;">
                                        <input type="radio" name="plan" value="premium" style="margin-right: 1rem;">
                                        <div style="flex: 1;">
                                            <div style="font-weight: 600; color: var(--text-dark);">Premium Plan - $19.99/month</div>
                                            <div style="font-size: 0.875rem; color: var(--text-light);">200 interactions/day • 3 child profiles • AI voice + advanced features</div>
                                        </div>
                                        <div style="background: var(--primary-purple); color: white; padding: 0.25rem 0.75rem; border-radius: 15px; font-size: 0.75rem; font-weight: 600;">POPULAR</div>
                                    </label>
                                    
                                    <label class="plan-option" style="display: flex; align-items: center; padding: 1rem; border: 2px solid var(--border-color); border-radius: var(--border-radius); cursor: pointer; transition: all 0.3s ease;">
                                        <input type="radio" name="plan" value="family" style="margin-right: 1rem;">
                                        <div style="flex: 1;">
                                            <div style="font-weight: 600; color: var(--text-dark);">Family Plan - $29.99/month</div>
                                            <div style="font-size: 0.875rem; color: var(--text-light);">Unlimited interactions • Unlimited children • GPS tracking + messaging</div>
                                        </div>
                                        <div style="background: var(--primary-pink); color: white; padding: 0.25rem 0.75rem; border-radius: 15px; font-size: 0.75rem; font-weight: 600;">FAMILY</div>
                                    </label>
                                </div>
                            </fieldset>
                            
                            <!-- Terms and Privacy -->
                            <div class="form-group">
                                <label style="display: flex; align-items: start; gap: 0.75rem; cursor: pointer;">
                                    <input type="checkbox" name="agree_terms" required style="margin-top: 0.25rem;">
                                    <span style="font-size: 0.875rem; line-height: 1.4; color: var(--text-light);">
                                        I agree to the <a href="<?php echo esc_url(home_url('/terms')); ?>" target="_blank">Terms of Service</a> and 
                                        <a href="<?php echo esc_url(home_url('/privacy')); ?>" target="_blank">Privacy Policy</a>. 
                                        I confirm that I am the parent/guardian of the child and consent to their use of MyPocketSister.
                                    </span>
                                </label>
                            </div>
                            
                            <div class="form-group">
                                <label style="display: flex; align-items: start; gap: 0.75rem; cursor: pointer;">
                                    <input type="checkbox" name="marketing_consent">
                                    <span style="font-size: 0.875rem; line-height: 1.4; color: var(--text-light);">
                                        I'd like to receive helpful parenting tips and updates about MyPocketSister (optional).
                                    </span>
                                </label>
                            </div>
                            
                            <!-- Submit Button -->
                            <button type="submit" class="form-button" style="width: 100%; justify-content: center; margin-top: 1rem;">
                                Start 7-Day Free Trial →
                            </button>
                            
                            <p style="text-align: center; margin-top: 1rem; font-size: 0.875rem; color: var(--text-light);">
                                Already have an account? <a href="<?php echo esc_url(get_theme_mod('app_url', 'https://app.mypocketsister.com')); ?>/login">Sign in here</a>
                            </p>
                        </form>
                    </div>
                    
                    <!-- Benefits Sidebar -->
                    <div>
                        <div class="card" style="margin-bottom: 2rem;">
                            <h3 style="margin-bottom: 1rem;">What You Get</h3>
                            <ul style="list-style: none; margin: 0; padding: 0;">
                                <li style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                                    <span style="background: var(--accent-green); color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 0.75rem;">✓</span>
                                    <span>7-day free trial with full access</span>
                                </li>
                                <li style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                                    <span style="background: var(--accent-green); color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 0.75rem;">✓</span>
                                    <span>AI companion personalized for your child</span>
                                </li>
                                <li style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                                    <span style="background: var(--accent-green); color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 0.75rem;">✓</span>
                                    <span>Daily affirmations and motivation</span>
                                </li>
                                <li style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                                    <span style="background: var(--accent-green); color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 0.75rem;">✓</span>
                                    <span>COPPA-compliant safety monitoring</span>
                                </li>
                                <li style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                                    <span style="background: var(--accent-green); color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 0.75rem;">✓</span>
                                    <span>Cancel anytime, no commitment</span>
                                </li>
                            </ul>
                        </div>
                        
                        <div class="card" style="background: linear-gradient(135deg, var(--pastel-rose) 0%, var(--pastel-lavender) 100%); border: none;">
                            <h3 style="margin-bottom: 1rem;">Safe & Secure</h3>
                            <p style="font-size: 0.875rem; line-height: 1.5; margin-bottom: 1rem;">
                                MyPocketSister is designed with safety as our top priority. All conversations are monitored for inappropriate content, 
                                and we're fully COPPA-compliant for children's privacy protection.
                            </p>
                            <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: var(--text-light);">
                                <span style="color: var(--accent-green);">🛡️</span>
                                <span>COPPA Certified</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</main>

<style>
/* Plan option styling */
.plan-option input[type="radio"]:checked + div {
    color: var(--primary-purple);
}

.plan-option:has(input[type="radio"]:checked) {
    border-color: var(--primary-purple) !important;
    background: rgba(168, 85, 247, 0.05);
}

.plan-option:hover {
    border-color: var(--primary-purple);
    background: rgba(168, 85, 247, 0.02);
}

/* Form validation styles */
.form-input:invalid {
    border-color: var(--primary-pink);
}

.form-input:valid {
    border-color: var(--accent-green);
}

/* Responsive design */
@media (max-width: 768px) {
    .container > div > div {
        grid-template-columns: 1fr !important;
        gap: 2rem !important;
    }
    
    .plan-option {
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 0.75rem !important;
    }
    
    .plan-option input[type="radio"] {
        margin-right: 0 !important;
        margin-bottom: 0.5rem !important;
    }
}
</style>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('signup-form');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm_password');
    
    // Password confirmation validation
    function validatePasswords() {
        if (passwordInput.value !== confirmPasswordInput.value) {
            confirmPasswordInput.setCustomValidity('Passwords do not match');
        } else {
            confirmPasswordInput.setCustomValidity('');
        }
    }
    
    passwordInput.addEventListener('input', validatePasswords);
    confirmPasswordInput.addEventListener('input', validatePasswords);
    
    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validate form
        if (!form.checkValidity()) {
            return;
        }
        
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        
        submitButton.textContent = 'Creating Account...';
        submitButton.disabled = true;
        
        // Collect form data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Redirect to app with signup data
        const appUrl = '<?php echo esc_js(get_theme_mod('app_url', 'https://app.mypocketsister.com')); ?>';
        const params = new URLSearchParams(data);
        
        // For demo purposes, we'll show success and redirect
        // In production, this would send data to your app's API
        setTimeout(() => {
            alert('Account created successfully! Redirecting to MyPocketSister app...');
            window.location.href = `${appUrl}/signup?${params.toString()}`;
        }, 1500);
    });
    
    // Plan selection styling
    const planOptions = document.querySelectorAll('.plan-option');
    planOptions.forEach(option => {
        option.addEventListener('click', function() {
            const radio = this.querySelector('input[type="radio"]');
            radio.checked = true;
        });
    });
});
</script>

<?php get_footer(); ?>