<?php
/**
 * Single Post Template
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
		<?php if ( have_posts() ) : while ( have_posts() ) : the_post(); ?>
			<a href="<?php echo esc_url( home_url( '/posts' ) ); ?>" class="back-link">&larr; Back</a>

			<article class="single-post">
				<header class="single-post-header">
					<h1 class="single-post-title"><?php the_title(); ?></h1>
					<div class="single-post-meta">
						<time datetime="<?php echo esc_attr( get_the_date( 'c' ) ); ?>"><?php echo esc_html( get_the_date() ); ?></time>
						<?php
						$categories = get_the_category();
						if ( ! empty( $categories ) ) :
							$cat_names = wp_list_pluck( $categories, 'name' );
						?>
							<span class="single-post-categories"><?php echo esc_html( implode( ', ', $cat_names ) ); ?></span>
						<?php endif; ?>
					</div>
				</header>

				<?php if ( has_post_thumbnail() ) : ?>
					<div class="single-post-image">
						<?php the_post_thumbnail( 'large' ); ?>
					</div>
				<?php endif; ?>

				<div class="single-post-content">
					<?php the_content(); ?>
				</div>

				<?php
				$tags = get_the_tags();
				if ( ! empty( $tags ) ) : ?>
					<div class="single-post-tags">
						<?php foreach ( $tags as $tag ) : ?>
							<span class="post-tag"><?php echo esc_html( $tag->name ); ?></span>
						<?php endforeach; ?>
					</div>
				<?php endif; ?>
			</article>
		<?php if ( comments_open() || get_comments_number() ) : ?>
				<?php comments_template(); ?>
			<?php endif; ?>

		<?php endwhile; endif; ?>
	</div>
</div>

<?php
get_footer();
