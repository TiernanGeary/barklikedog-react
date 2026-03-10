<?php
/**
 * Single product image
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

<div class="product-images">
	<?php
	$image_id = $product->get_image_id();

	if ( $image_id ) {
		echo wp_kses_post( wp_get_attachment_image( $image_id, 'full' ) );
	} else {
		echo wp_kses_post( wc_placeholder_img( 'full' ) );
	}

	$gallery_ids = $product->get_gallery_image_ids();
	if ( ! empty( $gallery_ids ) ) :
	?>
		<div class="product-gallery">
			<?php foreach ( $gallery_ids as $gallery_id ) : ?>
				<?php echo wp_kses_post( wp_get_attachment_image( $gallery_id, 'full', false, array( 'class' => 'product-gallery-image' ) ) ); ?>
			<?php endforeach; ?>
		</div>
	<?php endif; ?>
</div>
