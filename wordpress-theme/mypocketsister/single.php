<?php
/**
 * Single Post Template
 * 
 * Template for displaying individual blog posts
 */

get_header(); ?>

<main id="main-content" class="site-main">
    <?php while (have_posts()) : the_post(); ?>
        <!-- Hero Section for Post -->
        <section style="padding: 3rem 0; background: linear-gradient(135deg, var(--pastel-rose) 0%, var(--pastel-lavender) 100%);">
            <div class="container">
                <div style="max-width: 800px; margin: 0 auto; text-align: center;">
                    <?php
                    $categories = get_the_category();
                    if (!empty($categories)) :
                    ?>
                        <span class="post-category" style="display: inline-block; margin-bottom: 1rem;"><?php echo esc_html($categories[0]->name); ?></span>
                    <?php endif; ?>
                    
                    <h1 style="margin-bottom: 1rem; font-size: 3rem; line-height: 1.2;"><?php the_title(); ?></h1>
                    
                    <div style="display: flex; align-items: center; justify-content: center; gap: 2rem; color: var(--text-light); margin-bottom: 2rem;">
                        <span><?php echo get_the_date(); ?></span>
                        <span>•</span>
                        <span><?php echo get_the_author(); ?></span>
                        <span>•</span>
                        <span><?php echo ceil(str_word_count(strip_tags(get_the_content())) / 200); ?> min read</span>
                    </div>
                </div>
            </div>
        </section>

        <!-- Post Content -->
        <article class="post-content" style="padding: 3rem 0;">
            <div class="container">
                <div style="max-width: 800px; margin: 0 auto;">
                    
                    <!-- Featured Image -->
                    <?php if (has_post_thumbnail()) : ?>
                        <div style="margin-bottom: 3rem;">
                            <img src="<?php the_post_thumbnail_url('large'); ?>" 
                                 alt="<?php the_title_attribute(); ?>" 
                                 style="width: 100%; height: 400px; object-fit: cover; border-radius: var(--border-radius-lg);">
                        </div>
                    <?php endif; ?>

                    <!-- Post Content -->
                    <div class="entry-content" style="line-height: 1.8; color: var(--text-light); font-size: 1.125rem;">
                        <?php
                        the_content();
                        
                        wp_link_pages(array(
                            'before' => '<div class="page-links">',
                            'after'  => '</div>',
                        ));
                        ?>
                    </div>

                    <!-- Post Tags -->
                    <?php
                    $tags = get_the_tags();
                    if ($tags) :
                    ?>
                        <div style="margin: 3rem 0; padding: 2rem; background: var(--pastel-lavender); border-radius: var(--border-radius);">
                            <h3 style="margin-bottom: 1rem; color: var(--primary-purple);">Tags</h3>
                            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                                <?php foreach ($tags as $tag) : ?>
                                    <a href="<?php echo get_tag_link($tag->term_id); ?>" 
                                       style="background: white; color: var(--primary-purple); padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.875rem; text-decoration: none; border: 1px solid var(--primary-purple);">
                                        #<?php echo $tag->name; ?>
                                    </a>
                                <?php endforeach; ?>
                            </div>
                        </div>
                    <?php endif; ?>

                    <!-- Share Buttons -->
                    <div style="margin: 3rem 0; text-align: center; padding: 2rem; background: var(--card-background); border-radius: var(--border-radius); border: 1px solid var(--border-color);">
                        <h3 style="margin-bottom: 1rem;">Share This Post</h3>
                        <div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap;">
                            <a href="https://facebook.com/sharer/sharer.php?u=<?php echo urlencode(get_permalink()); ?>" 
                               target="_blank" 
                               class="social-link">
                                📘 Facebook
                            </a>
                            <a href="https://twitter.com/intent/tweet?url=<?php echo urlencode(get_permalink()); ?>&text=<?php echo urlencode(get_the_title()); ?>" 
                               target="_blank" 
                               class="social-link">
                                🐦 Twitter
                            </a>
                            <a href="https://www.linkedin.com/sharing/share-offsite/?url=<?php echo urlencode(get_permalink()); ?>" 
                               target="_blank" 
                               class="social-link">
                                💼 LinkedIn
                            </a>
                            <a href="mailto:?subject=<?php echo urlencode(get_the_title()); ?>&body=<?php echo urlencode(get_permalink()); ?>" 
                               class="social-link">
                                ✉️ Email
                            </a>
                        </div>
                    </div>

                    <!-- Author Bio -->
                    <div style="margin: 3rem 0; padding: 2rem; background: linear-gradient(135deg, var(--pastel-rose) 0%, var(--pastel-lavender) 100%); border-radius: var(--border-radius-lg);">
                        <div style="display: flex; align-items: center; gap: 1.5rem;">
                            <?php echo get_avatar(get_the_author_meta('ID'), 80, '', '', array('style' => 'border-radius: 50%;')); ?>
                            <div>
                                <h3 style="margin-bottom: 0.5rem; color: var(--primary-purple);">About <?php the_author(); ?></h3>
                                <p style="margin-bottom: 0; color: var(--text-light);">
                                    <?php echo get_the_author_meta('description') ?: 'Author of MyPocketSister blog, dedicated to supporting young girls and their families through technology and understanding.'; ?>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </article>

        <!-- Related Posts -->
        <?php
        $related_posts = get_posts(array(
            'category__in' => wp_get_post_categories($post->ID),
            'numberposts' => 3,
            'post__not_in' => array($post->ID)
        ));
        
        if ($related_posts) :
        ?>
            <section style="padding: 3rem 0; background: var(--background);">
                <div class="container">
                    <div style="max-width: 1000px; margin: 0 auto;">
                        <h2 style="text-align: center; margin-bottom: 3rem;">Related Articles</h2>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
                            <?php foreach ($related_posts as $related_post) : setup_postdata($related_post); ?>
                                <article class="post-card">
                                    <?php if (has_post_thumbnail($related_post->ID)) : ?>
                                        <img src="<?php echo get_the_post_thumbnail_url($related_post->ID, 'medium'); ?>" 
                                             alt="<?php echo get_the_title($related_post->ID); ?>" 
                                             class="post-thumbnail">
                                    <?php else : ?>
                                        <div class="post-thumbnail" style="display: flex; align-items: center; justify-content: center; color: var(--primary-purple); font-size: 3rem;">
                                            📝
                                        </div>
                                    <?php endif; ?>
                                    
                                    <div class="post-content">
                                        <div class="post-meta">
                                            <span><?php echo get_the_date('', $related_post->ID); ?></span>
                                        </div>
                                        
                                        <h3 class="post-title">
                                            <a href="<?php echo get_permalink($related_post->ID); ?>"><?php echo get_the_title($related_post->ID); ?></a>
                                        </h3>
                                        
                                        <div class="post-excerpt">
                                            <?php echo wp_trim_words(get_the_excerpt($related_post->ID), 15, '...'); ?>
                                        </div>
                                        
                                        <a href="<?php echo get_permalink($related_post->ID); ?>" class="read-more">
                                            Read More →
                                        </a>
                                    </div>
                                </article>
                            <?php endforeach; wp_reset_postdata(); ?>
                        </div>
                    </div>
                </div>
            </section>
        <?php endif; ?>

        <!-- Comments Section -->
        <?php if (comments_open() || get_comments_number()) : ?>
            <section style="padding: 3rem 0;">
                <div class="container">
                    <div style="max-width: 800px; margin: 0 auto;">
                        <?php comments_template(); ?>
                    </div>
                </div>
            </section>
        <?php endif; ?>

    <?php endwhile; ?>
</main>

<style>
/* Single post specific styles */
.entry-content h2,
.entry-content h3,
.entry-content h4 {
    color: var(--text-dark);
    margin: 2rem 0 1rem;
}

.entry-content h2 {
    font-size: 2rem;
    border-bottom: 2px solid var(--primary-purple);
    padding-bottom: 0.5rem;
}

.entry-content h3 {
    font-size: 1.5rem;
}

.entry-content p {
    margin-bottom: 1.5rem;
}

.entry-content blockquote {
    background: var(--pastel-lavender);
    border-left: 4px solid var(--primary-purple);
    margin: 2rem 0;
    padding: 1.5rem;
    border-radius: var(--border-radius);
    font-style: italic;
}

.entry-content ul,
.entry-content ol {
    margin: 1.5rem 0;
    padding-left: 2rem;
}

.entry-content li {
    margin-bottom: 0.5rem;
}

.social-link {
    background: white;
    color: var(--primary-purple);
    padding: 0.5rem 1rem;
    border-radius: 25px;
    text-decoration: none;
    border: 2px solid var(--primary-purple);
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
}

.social-link:hover {
    background: var(--primary-purple);
    color: white;
    text-decoration: none;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .hero-section h1 {
        font-size: 2rem !important;
    }
    
    .entry-content {
        font-size: 1rem !important;
    }
    
    .social-link {
        font-size: 0.875rem;
        padding: 0.375rem 0.75rem;
    }
}
</style>

<?php get_footer(); ?>