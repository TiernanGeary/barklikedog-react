<?php
/**
 * Single Product Template (WooCommerce)
 *
 * @package Niche Vault
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header( 'shop' );
?>

<div class="page-content">
	<div class="page-content-inner">
		<?php
		if ( have_posts() ) {
			while ( have_posts() ) {
				the_post();
				wc_get_template_part( 'content', 'single-product' );
			}
		}
		?>
	</div>
</div>

<?php
get_footer( 'shop' );
