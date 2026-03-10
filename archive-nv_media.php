<?php
/**
 * Media Archive Template
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
			<div class="media-grid">
				<?php while ( have_posts() ) : the_post();
					$is_featured = get_post_meta( get_the_ID(), 'nv_media_featured', true ) === '1';
					$item_class = 'media-item' . ( $is_featured ? ' media-item-featured' : '' );
				?>
					<div class="<?php echo esc_attr( $item_class ); ?>">
						<a href="<?php the_permalink(); ?>">
							<div class="media-image-wrapper">
								<?php if ( has_post_thumbnail() ) : ?>
									<?php the_post_thumbnail( $is_featured ? 'large' : 'product-thumbnail' ); ?>
								<?php else : ?>
									<div class="media-placeholder"></div>
								<?php endif; ?>
							</div>
							<div class="media-item-title"><?php the_title(); ?></div>
						</a>
					</div>
				<?php endwhile; ?>
			</div>

			<?php the_posts_pagination( array(
				'prev_text' => '&larr;',
				'next_text' => '&rarr;',
			) ); ?>
		<?php else : ?>
			<p>No media found.</p>
		<?php endif; ?>
	</div>
</div>

<?php
get_footer();
