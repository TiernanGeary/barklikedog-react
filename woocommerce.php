<?php
/**
 * WooCommerce Wrapper Template
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
		if ( is_singular( 'product' ) ) {

			if ( have_posts() ) {
				while ( have_posts() ) {
					the_post();
					wc_get_template_part( 'content', 'single-product' );
				}
			}

		} else {

			// Category filter bar
			$product_cats = get_terms( array(
				'taxonomy'   => 'product_cat',
				'hide_empty' => true,
				'orderby'    => 'name',
				'order'      => 'ASC',
			) );
			$current_cat = is_product_category() ? get_queried_object() : null;
			if ( ! empty( $product_cats ) && ! is_wp_error( $product_cats ) ) : ?>
				<nav class="shop-filter-bar">
					<a href="<?php echo esc_url( wc_get_page_permalink( 'shop' ) ); ?>"
					   class="shop-filter-btn<?php echo ! $current_cat ? ' is-active' : ''; ?>">All</a>
					<?php foreach ( $product_cats as $cat ) :
						$is_active = $current_cat && $current_cat->term_id === $cat->term_id; ?>
						<a href="<?php echo esc_url( get_term_link( $cat ) ); ?>"
						   class="shop-filter-btn<?php echo $is_active ? ' is-active' : ''; ?>">
							<?php echo esc_html( $cat->name ); ?>
						</a>
					<?php endforeach; ?>
				</nav>
			<?php endif;

			do_action( 'woocommerce_before_main_content' );
			do_action( 'woocommerce_archive_description' );

			if ( woocommerce_product_loop() ) {
				do_action( 'woocommerce_before_shop_loop' );
				woocommerce_product_loop_start();

				if ( wc_get_loop_prop( 'total' ) ) {
					while ( have_posts() ) {
						the_post();
						do_action( 'woocommerce_shop_loop' );
						wc_get_template_part( 'content', 'product' );
					}
				}

				woocommerce_product_loop_end();
				do_action( 'woocommerce_after_shop_loop' );
			} else {
				do_action( 'woocommerce_no_products_found' );
			}

			do_action( 'woocommerce_after_main_content' );
		}
		?>
	</div>
</div>

<?php
get_footer( 'shop' );
