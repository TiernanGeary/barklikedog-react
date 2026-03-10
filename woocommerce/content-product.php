<?php
/**
 * Product card in the shop grid
 *
 * @package Niche Vault
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

global $product;

if ( ! $product ) {
	return;
}
?>
<li <?php wc_product_class( '', $product ); ?>>
	<div class="product-image-wrapper">
		<a href="<?php echo esc_url( $product->get_permalink() ); ?>">
			<?php echo wp_kses_post( $product->get_image( 'product-thumbnail' ) ); ?>
		</a>
	</div>

	<h2 class="product-title">
		<a href="<?php echo esc_url( $product->get_permalink() ); ?>">
			<?php echo esc_html( $product->get_name() ); ?>
		</a>
	</h2>

	<div class="price">
		<?php echo wp_kses_post( $product->get_price_html() ); ?>
	</div>
</li>
