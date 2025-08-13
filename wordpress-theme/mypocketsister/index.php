<?php
/**
 * MyPocketSister Theme - Main Index Template
 * 
 * This is the main template file that displays the homepage and blog posts.
 * It includes the hero section, app description, and recent blog posts.
 */

get_header(); ?>

<!-- Hero Section -->
<section class="hero-section">
    <div class="container">
        <div class="hero-content">
            <h1>Welcome to MyPocketSister</h1>
            <p>Your AI-powered companion for young girls, providing guidance, support, and friendship through every step of growing up.</p>
            <div style="margin-top: 2rem;">
                <a href="<?php echo esc_url(get_theme_mod('app_url', 'https://app.mypocketsister.com')); ?>" class="cta-button">
                    Launch App →
                </a>
                <a href="<?php echo esc_url(home_url('/signup')); ?>" class="cta-button" style="margin-left: 1rem; background: white; color: var(--primary-purple); border: 2px solid var(--primary-purple);">
                    Sign Up Free
                </a>
            </div>
        </div>
    </div>
</section>

<!-- About MyPocketSister Section -->
<section style="padding: 4rem 0;">
    <div class="container">
        <div style="text-align: center; margin-bottom: 3rem;">
            <h2>What is MyPocketSister?</h2>
            <p style="font-size: 1.25rem; max-width: 800px; margin: 0 auto;">
                MyPocketSister is an AI-powered digital companion designed specifically for young girls aged 10-14. 
                Our intelligent assistant provides personalized support, daily affirmations, and guidance to help 
                young minds navigate the challenges of growing up with confidence and joy.
            </p>
        </div>
        
        <!-- Features Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin: 3rem 0;">
            <div class="card feature-card">
                <div class="feature-icon gradient-pink-purple">💬</div>
                <h3>Smart Conversations</h3>
                <p>Engage in meaningful conversations with Stella, your AI companion who remembers your interests and adapts to your personality.</p>
            </div>
            
            <div class="card feature-card">
                <div class="feature-icon gradient-purple-green">✨</div>
                <h3>Daily Inspiration</h3>
                <p>Receive personalized motivational messages and affirmations that boost your confidence and brighten your day.</p>
            </div>
            
            <div class="card feature-card">
                <div class="feature-icon gradient-green-gold">🎨</div>
                <h3>Avatar Creation</h3>
                <p>Design and customize your own AI companion avatar with endless possibilities for creativity and self-expression.</p>
            </div>
            
            <div class="card feature-card">
                <div class="feature-icon gradient-gold-pink">🛡️</div>
                <h3>Safe & Secure</h3>
                <p>COPPA-compliant platform with advanced safety monitoring and parental controls for peace of mind.</p>
            </div>
        </div>
    </div>
</section>

<!-- Subscription Plans Section -->
<section style="padding: 4rem 0; background: linear-gradient(135deg, var(--pastel-rose) 0%, var(--pastel-lavender) 100%);">
    <div class="container">
        <div style="text-align: center; margin-bottom: 3rem;">
            <h2>Choose Your Plan</h2>
            <p style="font-size: 1.25rem; color: var(--text-light);">Start with a 7-day free trial, then choose the plan that works best for your family.</p>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; max-width: 1000px; margin: 0 auto;">
            <!-- Basic Plan -->
            <div class="card" style="text-align: center; position: relative;">
                <div style="background: var(--accent-green); color: white; padding: 0.5rem 1rem; border-radius: 20px; display: inline-block; margin-bottom: 1rem; font-weight: 600;">Basic</div>
                <h3 style="font-size: 2rem; margin-bottom: 0.5rem;">$9.99<span style="font-size: 1rem; color: var(--text-light);">/month</span></h3>
                <ul style="list-style: none; text-align: left; margin: 2rem 0;">
                    <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">✓ 50 AI interactions/day</li>
                    <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">✓ 1 child profile</li>
                    <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">✓ Basic avatar creation</li>
                    <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">✓ Daily affirmations</li>
                    <li style="padding: 0.5rem 0;">✓ Standard safety monitoring</li>
                </ul>
                <a href="<?php echo esc_url(home_url('/signup')); ?>" class="cta-button" style="width: 100%; justify-content: center;">Start Free Trial</a>
            </div>
            
            <!-- Premium Plan -->
            <div class="card" style="text-align: center; position: relative; border: 3px solid var(--primary-purple);">
                <div style="background: var(--primary-purple); color: white; padding: 0.5rem 1rem; border-radius: 20px; display: inline-block; margin-bottom: 1rem; font-weight: 600;">Premium</div>
                <div style="position: absolute; top: -10px; right: -10px; background: var(--accent-gold); color: white; padding: 0.25rem 0.75rem; border-radius: 15px; font-size: 0.75rem; font-weight: 600;">POPULAR</div>
                <h3 style="font-size: 2rem; margin-bottom: 0.5rem;">$19.99<span style="font-size: 1rem; color: var(--text-light);">/month</span></h3>
                <ul style="list-style: none; text-align: left; margin: 2rem 0;">
                    <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">✓ 200 AI interactions/day</li>
                    <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">✓ Up to 3 child profiles</li>
                    <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">✓ Advanced AI with voice</li>
                    <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">✓ AI-generated avatars</li>
                    <li style="padding: 0.5rem 0;">✓ Enhanced safety monitoring</li>
                </ul>
                <a href="<?php echo esc_url(home_url('/signup')); ?>" class="cta-button" style="width: 100%; justify-content: center;">Start Free Trial</a>
            </div>
            
            <!-- Family Plan -->
            <div class="card" style="text-align: center; position: relative;">
                <div style="background: var(--primary-pink); color: white; padding: 0.5rem 1rem; border-radius: 20px; display: inline-block; margin-bottom: 1rem; font-weight: 600;">Family</div>
                <h3 style="font-size: 2rem; margin-bottom: 0.5rem;">$29.99<span style="font-size: 1rem; color: var(--text-light);">/month</span></h3>
                <ul style="list-style: none; text-align: left; margin: 2rem 0;">
                    <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">✓ Unlimited AI interactions</li>
                    <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">✓ Unlimited child profiles</li>
                    <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">✓ GPS tracking & messaging</li>
                    <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">✓ Family analytics</li>
                    <li style="padding: 0.5rem 0;">✓ Priority support</li>
                </ul>
                <a href="<?php echo esc_url(home_url('/signup')); ?>" class="cta-button" style="width: 100%; justify-content: center;">Start Free Trial</a>
            </div>
        </div>
    </div>
</section>

<!-- Latest Blog Posts -->
<section style="padding: 4rem 0;">
    <div class="container">
        <div style="text-align: center; margin-bottom: 3rem;">
            <h2>Latest from Our Blog</h2>
            <p style="font-size: 1.25rem; color: var(--text-light);">
                Tips, insights, and stories to help parents and girls navigate growing up together.
            </p>
        </div>
        
        <?php if (have_posts()) : ?>
            <div class="post-grid">
                <?php 
                // Query for latest 6 posts
                $latest_posts = new WP_Query(array(
                    'posts_per_page' => 6,
                    'post_status' => 'publish'
                ));
                
                if ($latest_posts->have_posts()) :
                    while ($latest_posts->have_posts()) : $latest_posts->the_post();
                ?>
                    <article class="post-card">
                        <?php if (has_post_thumbnail()) : ?>
                            <img src="<?php the_post_thumbnail_url('medium'); ?>" alt="<?php the_title_attribute(); ?>" class="post-thumbnail">
                        <?php else : ?>
                            <div class="post-thumbnail" style="display: flex; align-items: center; justify-content: center; color: var(--primary-purple); font-size: 3rem;">
                                📝
                            </div>
                        <?php endif; ?>
                        
                        <div class="post-content">
                            <div class="post-meta">
                                <?php
                                $categories = get_the_category();
                                if (!empty($categories)) :
                                ?>
                                    <span class="post-category"><?php echo esc_html($categories[0]->name); ?></span>
                                <?php endif; ?>
                                <span><?php echo get_the_date(); ?></span>
                            </div>
                            
                            <h3 class="post-title">
                                <a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
                            </h3>
                            
                            <div class="post-excerpt">
                                <?php echo wp_trim_words(get_the_excerpt(), 20, '...'); ?>
                            </div>
                            
                            <a href="<?php the_permalink(); ?>" class="read-more">
                                Read More →
                            </a>
                        </div>
                    </article>
                <?php 
                    endwhile;
                    wp_reset_postdata();
                endif;
                ?>
            </div>
            
            <div style="text-align: center; margin-top: 3rem;">
                <a href="<?php echo esc_url(home_url('/blog')); ?>" class="cta-button">
                    View All Posts
                </a>
            </div>
        <?php else : ?>
            <div style="text-align: center; padding: 3rem; background: var(--card-background); border-radius: var(--border-radius-lg); border: 1px solid var(--border-color);">
                <h3>No posts yet!</h3>
                <p>Check back soon for helpful tips and insights about raising confident, happy girls.</p>
            </div>
        <?php endif; ?>
    </div>
</section>

<!-- Newsletter Signup -->
<section style="padding: 4rem 0; background: var(--text-dark); color: white;">
    <div class="container">
        <div style="text-align: center; max-width: 600px; margin: 0 auto;">
            <h2 style="color: white; margin-bottom: 1rem;">Stay Connected</h2>
            <p style="color: #D1D5DB; margin-bottom: 2rem;">
                Get the latest updates, parenting tips, and insights delivered to your inbox.
            </p>
            
            <form id="newsletter-form" style="display: flex; gap: 1rem; max-width: 400px; margin: 0 auto;">
                <input type="email" placeholder="Enter your email" required 
                       style="flex: 1; padding: 0.75rem 1rem; border: none; border-radius: var(--border-radius); background: white;">
                <button type="submit" class="cta-button">Subscribe</button>
            </form>
        </div>
    </div>
</section>

<?php get_footer(); ?>