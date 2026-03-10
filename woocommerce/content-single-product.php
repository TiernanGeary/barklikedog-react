<?php
/**
 * Single Product Content Template
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

do_action( 'woocommerce_before_single_product' );

if ( post_password_required() ) {
	echo get_the_password_form();
	return;
}
?>

<a href="<?php echo esc_url( wc_get_page_permalink( 'shop' ) ); ?>" class="back-link">&larr; Back</a>

<div id="product-<?php the_ID(); ?>" <?php wc_product_class( '', $product ); ?>>
	<div class="product-images">
		<?php
		$image_id = $product->get_image_id();
		if ( $image_id ) {
			echo wp_get_attachment_image( $image_id, 'full', false, array( 'class' => 'product-main-image' ) );
		} else {
			echo wc_placeholder_img( 'full' );
		}

		$gallery_ids = $product->get_gallery_image_ids();
		if ( ! empty( $gallery_ids ) ) :
		?>
			<div class="product-gallery">
				<?php foreach ( $gallery_ids as $gallery_id ) : ?>
					<?php echo wp_get_attachment_image( $gallery_id, 'full', false, array( 'class' => 'product-gallery-image' ) ); ?>
				<?php endforeach; ?>
			</div>
		<?php endif; ?>
	</div>

	<div class="product-summary">
		<h1 class="product-title"><?php the_title(); ?></h1>

		<div class="price">
			<?php echo wp_kses_post( $product->get_price_html() ); ?>
		</div>

		<?php
		$product_year = get_post_meta( $product->get_id(), 'product_year', true );
		if ( $product_year ) : ?>
			<div class="product-meta-item"><?php echo esc_html( $product_year ); ?></div>
		<?php endif; ?>

		<?php
		$categories = get_the_terms( $product->get_id(), 'product_cat' );
		if ( ! empty( $categories ) && ! is_wp_error( $categories ) ) :
			$cat_names = wp_list_pluck( $categories, 'name' );
		?>
			<div class="product-meta-item"><?php echo esc_html( implode( ', ', $cat_names ) ); ?></div>
		<?php endif; ?>

		<?php
		$description = $product->get_description();
		if ( $description ) : ?>
			<div class="product-description">
				<?php echo wp_kses_post( wpautop( $description ) ); ?>
			</div>
		<?php endif; ?>

		<?php
		$attributes = $product->get_attributes();
		if ( ! empty( $attributes ) ) : ?>
			<div class="product-attributes">
				<?php foreach ( $attributes as $attribute ) :
					$name = wc_attribute_label( $attribute->get_name() );
					if ( $attribute->is_taxonomy() ) {
						$values = wc_get_product_terms( $product->get_id(), $attribute->get_name(), array( 'fields' => 'names' ) );
						$value = implode( ', ', $values );
					} else {
						$value = implode( ', ', $attribute->get_options() );
					}
				?>
					<div class="product-meta-item">
						<span class="product-meta-label"><?php echo esc_html( $name ); ?>:</span> <?php echo esc_html( $value ); ?>
					</div>
				<?php endforeach; ?>
			</div>
		<?php endif; ?>

		<?php woocommerce_template_single_add_to_cart(); ?>
	</div>
</div>

<?php do_action( 'woocommerce_after_single_product' ); ?>
