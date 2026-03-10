<?php
/**
 * Simple product add to cart
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

if ( $product->is_purchasable() ) {
	?>
	<form class="cart" action="<?php echo esc_url( apply_filters( 'woocommerce_add_to_cart_form_action', $product->get_permalink() ) ); ?>" method="post" enctype='multipart/form-data'>
		<?php
		/**
		 * Hook: woocommerce_before_add_to_cart_quantity.
		 *
		 * @hooked woocommerce_quantity_input - 10
		 */
		do_action( 'woocommerce_before_add_to_cart_quantity' );

		/**
		 * Hook: woocommerce_after_add_to_cart_quantity.
		 *
		 * @hooked woocommerce_button_variation_add_to_cart - 20
		 */
		do_action( 'woocommerce_after_add_to_cart_quantity' );
		?>

		<button type="submit" name="add-to-cart" value="<?php echo esc_attr( $product->get_id() ); ?>" class="button add_to_cart_button">
			<?php echo esc_html( $product->single_add_to_cart_text() ); ?>
		</button>

		<?php
		/**
		 * Hook: woocommerce_after_add_to_cart_button.
		 */
		do_action( 'woocommerce_after_add_to_cart_button' );
		?>
	</form>
	<?php
} else {
	echo wp_kses_post( apply_filters( 'woocommerce_out_of_stock_message', __( 'This product is currently out of stock and unavailable.', 'niche-vault' ) ) );
}
