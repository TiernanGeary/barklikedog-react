<?php
/**
 * Blog Posts Archive Template
 *
 * @package Niche Vault
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();
?>

<div class="page-content">
	<div class="page-content-inner">
		<?php if ( have_posts() ) : ?>
			<div class="posts-list">
				<?php $post_index = 0; while ( have_posts() ) : the_post(); ?>
					<article class="post-item<?php echo $post_index === 0 ? ' post-item--featured' : ''; ?>">
						<a href="<?php the_permalink(); ?>" class="post-item-link">
							<?php if ( has_post_thumbnail() ) : ?>
								<div class="post-item-image">
									<?php the_post_thumbnail( $post_index === 0 ? 'large' : 'product-thumbnail' ); ?>
								</div>
							<?php endif; ?>
							<div class="post-item-content">
								<?php if ( $post_index === 0 ) : ?>
									<span class="post-item-label">Latest</span>
								<?php endif; ?>
								<h2 class="post-item-title"><?php the_title(); ?></h2>
								<div class="post-item-meta">
									<time datetime="<?php echo esc_attr( get_the_date( 'c' ) ); ?>"><?php echo esc_html( get_the_date() ); ?></time>
								</div>
								<div class="post-item-excerpt">
									<?php the_excerpt(); ?>
								</div>
							</div>
						</a>
					</article>
				<?php $post_index++; endwhile; ?>
			</div>

			<?php the_posts_pagination( array(
				'prev_text' => '&larr;',
				'next_text' => '&rarr;',
			) ); ?>
		<?php else : ?>
			<p>No posts found.</p>
		<?php endif; ?>
	</div>
</div>

<?php
get_footer();
