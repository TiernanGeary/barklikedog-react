<?php
/**
 * Page Template
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
		<?php
		if ( have_posts() ) {
			while ( have_posts() ) {
				the_post();
				?>
				<article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
					<h1 class="page-title"><?php the_title(); ?></h1>

					<div class="entry-content">
						<?php
						the_content();
						wp_link_pages( array(
							'before' => '<div class="page-links">',
							'after'  => '</div>',
						) );
						?>
					</div>
				</article>
				<?php
			}
		}
		?>
	</div>
</div>

<?php
get_footer();
