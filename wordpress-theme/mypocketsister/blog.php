<?php
/**
 * Template Name: Blog Page
 * 
 * Template for displaying blog posts in a grid layout
 */

get_header(); ?>

<main id="main-content" class="site-main">
    <!-- Hero Section -->
    <section class="hero-section">
        <div class="container">
            <div class="hero-content">
                <h1>MyPocketSister Blog</h1>
                <p>Insights, tips, and stories to help parents and daughters navigate growing up together in today's digital world.</p>
            </div>
        </div>
    </section>

    <!-- Featured Post Section -->
    <?php
    $featured_post = get_posts(array(
        'numberposts' => 1,
        'meta_key' => '_featured_post',
        'meta_value' => 'yes'
    ));
    
    if (empty($featured_post)) {
        $featured_post = get_posts(array('numberposts' => 1));
    }
    
    if ($featured_post) :
        $post = $featured_post[0];
        setup_postdata($post);
    ?>
        <section style="padding: 3rem 0; background: var(--card-background);">
            <div class="container">
                <div style="max-width: 1000px; margin: 0 auto;">
                    <h2 style="text-align: center; margin-bottom: 2rem;">Featured Article</h2>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: center;">
                        <div>
                            <?php if (has_post_thumbnail()) : ?>
                                <img src="<?php the_post_thumbnail_url('large'); ?>" 
                                     alt="<?php the_title_attribute(); ?>" 
                                     style="width: 100%; height: 300px; object-fit: cover; border-radius: var(--border-radius-lg);">
                            <?php endif; ?>
                        </div>
                        <div>
                            <?php
                            $categories = get_the_category();
                            if (!empty($categories)) :
                            ?>
                                <span class="post-category" style="margin-bottom: 1rem; display: inline-block;"><?php echo esc_html($categories[0]->name); ?></span>
                            <?php endif; ?>
                            
                            <h3 style="font-size: 2rem; margin-bottom: 1rem; line-height: 1.2;">
                                <a href="<?php the_permalink(); ?>" style="color: var(--text-dark); text-decoration: none;"><?php the_title(); ?></a>
                            </h3>
                            
                            <div style="color: var(--text-light); margin-bottom: 1rem; font-size: 0.875rem;">
                                <?php echo get_the_date(); ?> • <?php echo get_the_author(); ?>
                            </div>
                            
                            <p style="color: var(--text-light); line-height: 1.6; margin-bottom: 2rem;">
                                <?php echo wp_trim_words(get_the_excerpt(), 25, '...'); ?>
                            </p>
                            
                            <a href="<?php the_permalink(); ?>" class="cta-button">
                                Read Full Article →
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    <?php wp_reset_postdata(); endif; ?>

    <!-- Categories Filter -->
    <section style="padding: 2rem 0; background: var(--pastel-lavender);">
        <div class="container">
            <div style="text-align: center;">
                <h3 style="margin-bottom: 1.5rem;">Browse by Category</h3>
                <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 1rem;">
                    <a href="<?php echo esc_url(home_url('/blog')); ?>" 
                       class="category-filter <?php echo !isset($_GET['cat']) ? 'active' : ''; ?>">
                        All Posts
                    </a>
                    <?php
                    $categories = get_categories(array(
                        'orderby' => 'count',
                        'order' => 'DESC',
                        'hide_empty' => true
                    ));
                    
                    foreach ($categories as $category) :
                    ?>
                        <a href="<?php echo esc_url(add_query_arg('cat', $category->term_id, home_url('/blog'))); ?>" 
                           class="category-filter <?php echo isset($_GET['cat']) && $_GET['cat'] == $category->term_id ? 'active' : ''; ?>">
                            <?php echo esc_html($category->name); ?> (<?php echo $category->count; ?>)
                        </a>
                    <?php endforeach; ?>
                </div>
            </div>
        </div>
    </section>

    <!-- Blog Posts Grid -->
    <section style="padding: 4rem 0;">
        <div class="container">
            <?php
            $paged = (get_query_var('paged')) ? get_query_var('paged') : 1;
            $posts_per_page = 9;
            
            $args = array(
                'post_type' => 'post',
                'posts_per_page' => $posts_per_page,
                'paged' => $paged,
                'post_status' => 'publish'
            );
            
            // Filter by category if specified
            if (isset($_GET['cat']) && !empty($_GET['cat'])) {
                $args['cat'] = intval($_GET['cat']);
            }
            
            // Exclude featured post from main grid
            if ($featured_post) {
                $args['post__not_in'] = array($featured_post[0]->ID);
            }
            
            $blog_query = new WP_Query($args);
            
            if ($blog_query->have_posts()) :
            ?>
                <div class="post-grid">
                    <?php while ($blog_query->have_posts()) : $blog_query->the_post(); ?>
                        <article class="post-card">
                            <?php if (has_post_thumbnail()) : ?>
                                <img src="<?php the_post_thumbnail_url('medium'); ?>" 
                                     alt="<?php the_title_attribute(); ?>" 
                                     class="post-thumbnail">
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
                                
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;">
                                    <a href="<?php the_permalink(); ?>" class="read-more">
                                        Read More →
                                    </a>
                                    <span style="font-size: 0.875rem; color: var(--text-light);">
                                        <?php echo ceil(str_word_count(strip_tags(get_the_content())) / 200); ?> min read
                                    </span>
                                </div>
                            </div>
                        </article>
                    <?php endwhile; ?>
                </div>

                <!-- Pagination -->
                <?php if ($blog_query->max_num_pages > 1) : ?>
                    <div style="margin-top: 4rem; text-align: center;">
                        <div class="pagination">
                            <?php
                            echo paginate_links(array(
                                'base' => str_replace(999999999, '%#%', esc_url(get_pagenum_link(999999999))),
                                'format' => '?paged=%#%',
                                'current' => max(1, get_query_var('paged')),
                                'total' => $blog_query->max_num_pages,
                                'prev_text' => '← Previous',
                                'next_text' => 'Next →',
                                'mid_size' => 2,
                                'end_size' => 1
                            ));
                            ?>
                        </div>
                    </div>
                <?php endif; ?>

            <?php else : ?>
                <div style="text-align: center; padding: 4rem 2rem; background: var(--card-background); border-radius: var(--border-radius-lg); border: 1px solid var(--border-color);">
                    <h3>No posts found</h3>
                    <p style="color: var(--text-light); margin-bottom: 2rem;">
                        <?php if (isset($_GET['cat'])) : ?>
                            No posts found in this category. Try browsing all posts or selecting a different category.
                        <?php else : ?>
                            We're working on creating helpful content for you. Check back soon!
                        <?php endif; ?>
                    </p>
                    <a href="<?php echo esc_url(home_url('/blog')); ?>" class="cta-button">
                        View All Posts
                    </a>
                </div>
            <?php endif; wp_reset_postdata(); ?>
        </div>
    </section>

    <!-- Newsletter Signup -->
    <section style="padding: 4rem 0; background: var(--text-dark); color: white;">
        <div class="container">
            <div style="text-align: center; max-width: 600px; margin: 0 auto;">
                <h2 style="color: white; margin-bottom: 1rem;">Stay Updated</h2>
                <p style="color: #D1D5DB; margin-bottom: 2rem;">
                    Get notified when we publish new articles with helpful parenting tips and insights about raising confident, happy girls.
                </p>
                
                <form id="blog-newsletter-form" style="display: flex; gap: 1rem; max-width: 400px; margin: 0 auto;">
                    <input type="email" placeholder="Enter your email" required 
                           style="flex: 1; padding: 0.75rem 1rem; border: none; border-radius: var(--border-radius); background: white;">
                    <button type="submit" class="cta-button">Subscribe</button>
                </form>
                
                <p style="font-size: 0.875rem; color: #9CA3AF; margin-top: 1rem;">
                    We respect your privacy. Unsubscribe at any time.
                </p>
            </div>
        </div>
    </section>
</main>

<style>
/* Category Filter Styles */
.category-filter {
    background: white;
    color: var(--primary-purple);
    padding: 0.5rem 1rem;
    border-radius: 25px;
    text-decoration: none;
    border: 2px solid var(--primary-purple);
    transition: all 0.3s ease;
    font-size: 0.875rem;
    font-weight: 500;
}

.category-filter:hover,
.category-filter.active {
    background: var(--primary-purple);
    color: white;
    text-decoration: none;
}

/* Pagination Styles */
.pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.pagination a,
.pagination span {
    background: white;
    color: var(--primary-purple);
    padding: 0.75rem 1rem;
    border-radius: var(--border-radius);
    text-decoration: none;
    border: 2px solid var(--border-color);
    transition: all 0.3s ease;
}

.pagination a:hover {
    background: var(--primary-purple);
    color: white;
    border-color: var(--primary-purple);
    text-decoration: none;
}

.pagination .current {
    background: var(--primary-purple);
    color: white;
    border-color: var(--primary-purple);
}

/* Featured Post Responsive */
@media (max-width: 768px) {
    .featured-post-grid {
        grid-template-columns: 1fr !important;
        gap: 2rem !important;
    }
    
    .category-filter {
        font-size: 0.75rem;
        padding: 0.375rem 0.75rem;
    }
    
    .pagination {
        gap: 0.25rem;
    }
    
    .pagination a,
    .pagination span {
        padding: 0.5rem 0.75rem;
        font-size: 0.875rem;
    }
}
</style>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // Newsletter form handling
    const newsletterForm = document.getElementById('blog-newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = this.querySelector('input[type="email"]').value;
            const button = this.querySelector('button');
            const originalText = button.textContent;
            
            button.textContent = 'Subscribing...';
            button.disabled = true;
            
            // Simulate newsletter signup
            setTimeout(() => {
                alert('Thank you for subscribing! You\'ll receive our latest articles and parenting tips.');
                this.reset();
                button.textContent = originalText;
                button.disabled = false;
            }, 1500);
        });
    }
    
    // Smooth scroll for category filters
    const categoryFilters = document.querySelectorAll('.category-filter');
    categoryFilters.forEach(filter => {
        filter.addEventListener('click', function(e) {
            // Add loading state
            this.style.opacity = '0.6';
            this.style.pointerEvents = 'none';
        });
    });
    
    // Infinite scroll option (if desired)
    let isLoading = false;
    function checkInfiniteScroll() {
        if (isLoading) return;
        
        const scrollPosition = window.scrollY + window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        
        if (scrollPosition >= documentHeight - 1000) {
            // Load more posts if available
            loadMorePosts();
        }
    }
    
    function loadMorePosts() {
        // Implementation for infinite scroll
        // This would make an AJAX request to load more posts
    }
    
    // Uncomment to enable infinite scroll
    // window.addEventListener('scroll', checkInfiniteScroll);
});
</script>

<?php get_footer(); ?>