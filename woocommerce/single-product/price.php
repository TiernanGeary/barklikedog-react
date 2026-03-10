<?php
/**
 * Single product price
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

<div class="price">
	<?php echo wp_kses_post( $product->get_price_html() ); ?>
</div>
