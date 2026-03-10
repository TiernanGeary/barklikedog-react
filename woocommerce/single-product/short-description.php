<?php
/**
 * Single product short description
 *
 * @package Niche Vault
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

global $post;

if ( ! $post ) {
	return;
}

$short_description = apply_filters( 'woocommerce_short_description', $post->post_excerpt );

if ( ! $short_description ) {
	return;
}
?>

<div class="product-description">
	<?php echo wp_kses_post( $short_description ); ?>
</div>
