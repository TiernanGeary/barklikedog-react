<?php
/**
 * Niche Vault Theme Functions
 *
 * @package Niche Vault
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Theme Setup
 */
function niche_vault_theme_setup() {
	// Add theme support for WooCommerce
	add_theme_support( 'woocommerce' );
	add_theme_support( 'wc-product-gallery-zoom' );
	add_theme_support( 'wc-product-gallery-lightbox' );
	add_theme_support( 'wc-product-gallery-slider' );

	// Add theme support for post thumbnails
	add_theme_support( 'post-thumbnails' );
	set_post_thumbnail_size( 500, 500, true );

	// Add custom image sizes for products
	add_image_size( 'product-thumbnail', 500, 500, true );
	add_image_size( 'product-gallery', 800, 800, true );

	// Add theme support for HTML5
	add_theme_support( 'html5', array(
		'search-form',
		'comment-form',
		'comment-list',
		'gallery',
		'caption',
		'style',
		'script',
	) );

	// Add theme support for title tag
	add_theme_support( 'title-tag' );

	// Register navigation menu
	register_nav_menus( array(
		'primary' => esc_html__( 'Primary Menu', 'niche-vault' ),
	) );
}
add_action( 'after_setup_theme', 'niche_vault_theme_setup' );

/**
 * Enqueue Styles and Scripts
 */
function niche_vault_scripts() {
	// Enqueue main stylesheet
	wp_enqueue_style( 'niche-vault-style', get_stylesheet_uri(), array(), '1.2.0' );

	// Enqueue WooCommerce styles if WooCommerce is active
	if ( class_exists( 'WooCommerce' ) ) {
		wp_enqueue_style( 'woocommerce-general' );
	}

	// Enqueue custom scripts
	wp_enqueue_script( 'niche-vault-main', get_template_directory_uri() . '/js/main.js', array(), '1.1.0', true );
}
add_action( 'wp_enqueue_scripts', 'niche_vault_scripts' );

/**
 * Remove WooCommerce default styles to prevent conflicts
 */
function niche_vault_remove_woocommerce_styles() {
	wp_dequeue_style( 'woocommerce-layout' );
	wp_dequeue_style( 'woocommerce-smallscreen' );
	wp_dequeue_style( 'woocommerce-general' );
}
add_action( 'wp_enqueue_scripts', 'niche_vault_remove_woocommerce_styles', 99 );

/**
 * Register Custom Product Fields
 */
function niche_vault_register_product_meta() {
	register_meta( 'post', 'product_year', array(
		'type'         => 'string',
		'description'  => 'Product year or date',
		'single'       => true,
		'show_in_rest' => true,
		'auth_callback' => function() {
			return current_user_can( 'edit_posts' );
		}
	) );
}
add_action( 'init', 'niche_vault_register_product_meta' );

/**
 * Add custom product meta box
 */
function niche_vault_add_product_meta_box() {
	add_meta_box(
		'niche_vault_product_meta',
		'Product Details',
		'niche_vault_render_product_meta_box',
		'product',
		'normal',
		'high'
	);
}
add_action( 'add_meta_boxes', 'niche_vault_add_product_meta_box' );

/**
 * Render product meta box
 */
function niche_vault_render_product_meta_box( $post ) {
	$year = get_post_meta( $post->ID, 'product_year', true );
	wp_nonce_field( 'niche_vault_save_product_meta', 'niche_vault_product_meta_nonce' );
	?>
	<label for="product_year">Year/Date:</label>
	<input type="text" name="product_year" id="product_year" value="<?php echo esc_attr( $year ); ?>" style="width: 100%; padding: 8px; font-family: Courier New, monospace; margin-top: 5px;" placeholder="e.g., 2024, 1980s, etc." />
	<p style="font-size: 12px; color: #666; margin-top: 5px;">Enter the year or era this piece is from.</p>
	<?php
}

/**
 * Save product meta box data
 */
function niche_vault_save_product_meta( $post_id ) {
	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return;
	}

	if ( ! isset( $_POST['niche_vault_product_meta_nonce'] ) || ! wp_verify_nonce( $_POST['niche_vault_product_meta_nonce'], 'niche_vault_save_product_meta' ) ) {
		return;
	}

	if ( isset( $_POST['product_year'] ) ) {
		$year = sanitize_text_field( $_POST['product_year'] );
		update_post_meta( $post_id, 'product_year', $year );
	}
}
add_action( 'save_post_product', 'niche_vault_save_product_meta' );

/**
 * WooCommerce specific functions
 */

// Remove default WooCommerce hooks
remove_action( 'woocommerce_after_shop_loop_item', 'woocommerce_template_loop_add_to_cart' );
remove_action( 'woocommerce_before_shop_loop_item_title', 'woocommerce_template_loop_product_thumbnail' );
remove_action( 'woocommerce_shop_loop_item_title', 'woocommerce_template_loop_product_title' );

// Remove breadcrumbs
remove_action( 'woocommerce_before_main_content', 'woocommerce_breadcrumb', 20 );

// Remove result count and ordering
remove_action( 'woocommerce_before_shop_loop', 'woocommerce_result_count', 20 );
remove_action( 'woocommerce_before_shop_loop', 'woocommerce_catalog_ordering', 30 );

// Remove product rating in loop
remove_action( 'woocommerce_after_shop_loop_item_title', 'woocommerce_template_loop_rating', 5 );

// Add custom product loop hooks
add_action( 'woocommerce_shop_loop_item_title', 'niche_vault_product_image', 5 );
add_action( 'woocommerce_after_shop_loop_item_title', 'niche_vault_product_price', 10 );

/**
 * Display product image in loop
 */
function niche_vault_product_image() {
	global $product;
	?>
	<div class="product-image-wrapper">
		<a href="<?php echo esc_url( $product->get_permalink() ); ?>">
			<?php echo wp_kses_post( $product->get_image( 'product-thumbnail' ) ); ?>
		</a>
	</div>
	<?php
}

/**
 * Display product price in loop
 */
function niche_vault_product_price() {
	global $product;
	?>
	<div class="price">
		<?php echo wp_kses_post( $product->get_price_html() ); ?>
	</div>
	<?php
}

/**
 * Customize WooCommerce product gallery
 */
function niche_vault_woocommerce_gallery_settings() {
	return array(
		'flexslider'       => false,
		'zoom'             => false,
		'photoswipe'       => false,
		'testimonials'     => false,
	);
}
add_filter( 'woocommerce_gallery_settings', 'niche_vault_woocommerce_gallery_settings' );

/**
 * Add body class for sidebar layout
 */
function niche_vault_body_classes( $classes ) {
	$classes[] = 'niche-vault-theme';
	return $classes;
}
add_filter( 'body_class', 'niche_vault_body_classes' );

/**
 * Customize product loop product title class
 */
function niche_vault_product_title_class( $html ) {
	return str_replace( 'class="woocommerce-loop-product__title"', 'class="woocommerce-loop-product__title product-title"', $html );
}
add_filter( 'woocommerce_the_product_title', 'niche_vault_product_title_class' );

/**
 * Customize add to cart button
 */
function niche_vault_add_to_cart_text() {
	return esc_html__( 'Add to Cart', 'niche-vault' );
}
add_filter( 'woocommerce_product_add_to_cart_text', 'niche_vault_add_to_cart_text' );
add_filter( 'woocommerce_product_single_add_to_cart_text', 'niche_vault_add_to_cart_text' );

/**
 * Remove WooCommerce sidebar
 */
function niche_vault_remove_woocommerce_sidebar() {
	remove_action( 'woocommerce_sidebar', 'woocommerce_get_sidebar' );
}
add_action( 'init', 'niche_vault_remove_woocommerce_sidebar' );

/**
 * Custom logo function
 */
function niche_vault_get_logo() {
	$logo_path = get_template_directory() . '/assets/houndstooth.png';
	if ( file_exists( $logo_path ) ) {
		$logo_url = get_template_directory_uri() . '/assets/houndstooth.png';
		return '<img src="' . esc_url( $logo_url ) . '" alt="' . esc_attr( get_bloginfo( 'name' ) ) . '" class="site-logo" />';
	}
	return '';
}

/**
 * Generate navigation menu items
 */
function niche_vault_get_nav_groups() {
	$groups = array(
		array(
			'label' => '',
			'items' => array(
				array(
					'title' => 'House',
					'url'   => home_url(),
				),
				array(
					'title' => 'Shop',
					'url'   => wc_get_page_permalink( 'shop' ),
				),
			),
		),
		array(
			'label' => '',
			'items' => array(
				array(
					'title' => 'Posts',
					'url'   => home_url( '/posts' ),
				),
				array(
					'title' => 'Media',
					'url'   => home_url( '/media' ),
				),
			),
		),
		array(
			'label' => '',
			'items' => array(
				array(
					'title' => 'About',
					'url'   => home_url( '/about' ),
				),
			),
		),
	);

	return apply_filters( 'niche_vault_nav_groups', $groups );
}

/**
 * Sidebar template
 */
function niche_vault_sidebar() {
	?>
	<aside id="sidebar">
		<div class="logo-container">
			<a href="<?php echo esc_url( home_url( '/' ) ); ?>">
				<?php echo niche_vault_get_logo(); ?>
			</a>
		</div>

		<?php
		$nav_groups = niche_vault_get_nav_groups();
		foreach ( $nav_groups as $group ) :
			?>
			<nav class="nav-group">
				<?php if ( ! empty( $group['label'] ) ) : ?>
					<h3><?php echo esc_html( $group['label'] ); ?></h3>
				<?php endif; ?>

				<ul>
					<?php
					foreach ( $group['items'] as $item ) :
						$current_url = trailingslashit( home_url( $_SERVER['REQUEST_URI'] ) );
						$item_url = trailingslashit( $item['url'] );
						$current_class = ( $current_url === $item_url ) ? 'current' : '';
						?>
						<li>
							<a href="<?php echo esc_url( $item['url'] ); ?>" class="<?php echo esc_attr( $current_class ); ?>">
								<?php echo esc_html( $item['title'] ); ?>
							</a>
						</li>
					<?php endforeach; ?>
				</ul>
			</nav>
		<?php endforeach; ?>
	</aside>
	<?php
}

/**
 * Get cart URL (WooCommerce)
 */
function niche_vault_get_cart_url() {
	if ( function_exists( 'wc_get_cart_url' ) ) {
		return wc_get_cart_url();
	}
	return '#';
}

/**
 * Customize WooCommerce product per page
 */
function niche_vault_loop_shop_per_page() {
	return 25;
}
add_filter( 'loop_shop_per_page', 'niche_vault_loop_shop_per_page' );

/**
 * Customize WooCommerce columns
 */
function niche_vault_loop_shop_columns() {
	return 5;
}
add_filter( 'loop_shop_columns', 'niche_vault_loop_shop_columns' );

/**
 * Disable specific WooCommerce features
 */
function niche_vault_customize_woocommerce() {
	// Remove product reviews
	remove_action( 'woocommerce_single_product_summary', 'comments_template', 20 );

	// Remove related products
	remove_action( 'woocommerce_after_single_product_summary', 'woocommerce_output_related_products', 20 );

	// Remove upsells
	remove_action( 'woocommerce_after_single_product_summary', 'woocommerce_upsell_display', 15 );
}
add_action( 'wp_footer', 'niche_vault_customize_woocommerce' );

/**
 * Hide stock quantity display on frontend
 */
add_filter( 'woocommerce_get_stock_html', '__return_empty_string' );

/**
 * Custom excerpt length
 */
function niche_vault_excerpt_length( $length ) {
	return 20;
}
add_filter( 'excerpt_length', 'niche_vault_excerpt_length' );

/**
 * Custom excerpt more
 */
function niche_vault_excerpt_more( $more ) {
	return '...';
}
add_filter( 'excerpt_more', 'niche_vault_excerpt_more' );

/**
 * Register Media Custom Post Type
 */
function niche_vault_register_media_post_type() {
	$labels = array(
		'name'               => 'Media',
		'singular_name'      => 'Media',
		'add_new'            => 'Add New',
		'add_new_item'       => 'Add New Media',
		'edit_item'          => 'Edit Media',
		'new_item'           => 'New Media',
		'view_item'          => 'View Media',
		'search_items'       => 'Search Media',
		'not_found'          => 'No media found',
		'not_found_in_trash' => 'No media found in Trash',
		'menu_name'          => 'Media Library (NV)',
	);

	$args = array(
		'labels'        => $labels,
		'public'        => true,
		'has_archive'   => true,
		'rewrite'       => array( 'slug' => 'media' ),
		'supports'      => array( 'title', 'editor', 'thumbnail' ),
		'menu_icon'     => 'dashicons-format-video',
		'menu_position' => 5,
		'show_in_rest'  => true,
	);

	register_post_type( 'nv_media', $args );
}
add_action( 'init', 'niche_vault_register_media_post_type' );

/**
 * Add Media meta box
 */
function niche_vault_add_media_meta_box() {
	add_meta_box(
		'niche_vault_media_meta',
		'Media Details',
		'niche_vault_render_media_meta_box',
		'nv_media',
		'normal',
		'high'
	);
}
add_action( 'add_meta_boxes', 'niche_vault_add_media_meta_box' );

/**
 * Render media meta box
 */
function niche_vault_render_media_meta_box( $post ) {
	$media_type = get_post_meta( $post->ID, 'nv_media_type', true );
	$video_url  = get_post_meta( $post->ID, 'nv_video_url', true );
	$audio_url  = get_post_meta( $post->ID, 'nv_audio_url', true );
	$featured   = get_post_meta( $post->ID, 'nv_media_featured', true );
	$order      = get_post_meta( $post->ID, 'nv_media_order', true );
	wp_nonce_field( 'niche_vault_save_media_meta', 'niche_vault_media_meta_nonce' );
	?>
	<p>
		<label>
			<input type="checkbox" name="nv_media_featured" value="1" <?php checked( $featured, '1' ); ?> />
			<strong>Featured</strong> — this item will appear first and larger on the media page
		</label>
	</p>
	<p>
		<label for="nv_media_order"><strong>Order:</strong></label>
		<input type="number" name="nv_media_order" id="nv_media_order" value="<?php echo esc_attr( $order ); ?>" style="width: 80px; padding: 5px; margin-left: 5px;" placeholder="0" />
		<span style="font-size: 12px; color: #666; margin-left: 5px;">Lower numbers appear first. Items with the same number are sorted by date.</span>
	</p>
	<p>
		<label for="nv_media_type"><strong>Media Type:</strong></label><br>
		<select name="nv_media_type" id="nv_media_type" style="width: 200px; padding: 5px; margin-top: 5px;">
			<option value="photo" <?php selected( $media_type, 'photo' ); ?>>Photo</option>
			<option value="video" <?php selected( $media_type, 'video' ); ?>>Video</option>
			<option value="audio" <?php selected( $media_type, 'audio' ); ?>>Audio</option>
		</select>
	</p>
	<p>
		<label for="nv_video_url"><strong>Video URL:</strong></label><br>
		<input type="url" name="nv_video_url" id="nv_video_url" value="<?php echo esc_attr( $video_url ); ?>" style="width: 100%; padding: 8px; font-family: Courier New, monospace; margin-top: 5px;" placeholder="YouTube or Vimeo URL" />
		<span style="font-size: 12px; color: #666;">Only used when Media Type is Video.</span>
	</p>
	<p>
		<label for="nv_audio_url"><strong>Audio File URL:</strong></label><br>
		<input type="url" name="nv_audio_url" id="nv_audio_url" value="<?php echo esc_attr( $audio_url ); ?>" style="width: 100%; padding: 8px; font-family: Courier New, monospace; margin-top: 5px;" placeholder="URL to .mp3 or .wav file" />
		<span style="font-size: 12px; color: #666;">Only used when Media Type is Audio. Upload audio via WordPress Media Library, then paste the URL here. The Featured Image will be the cover art.</span>
	</p>
	<?php
}

/**
 * Save media meta box data
 */
function niche_vault_save_media_meta( $post_id ) {
	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return;
	}

	if ( ! isset( $_POST['niche_vault_media_meta_nonce'] ) || ! wp_verify_nonce( $_POST['niche_vault_media_meta_nonce'], 'niche_vault_save_media_meta' ) ) {
		return;
	}

	if ( isset( $_POST['nv_media_type'] ) ) {
		update_post_meta( $post_id, 'nv_media_type', sanitize_text_field( $_POST['nv_media_type'] ) );
	}
	if ( isset( $_POST['nv_video_url'] ) ) {
		update_post_meta( $post_id, 'nv_video_url', esc_url_raw( $_POST['nv_video_url'] ) );
	}
	if ( isset( $_POST['nv_audio_url'] ) ) {
		update_post_meta( $post_id, 'nv_audio_url', esc_url_raw( $_POST['nv_audio_url'] ) );
	}
	update_post_meta( $post_id, 'nv_media_featured', isset( $_POST['nv_media_featured'] ) ? '1' : '0' );
	if ( isset( $_POST['nv_media_order'] ) ) {
		update_post_meta( $post_id, 'nv_media_order', intval( $_POST['nv_media_order'] ) );
	}
}
add_action( 'save_post_nv_media', 'niche_vault_save_media_meta' );

/**
 * Set media archive posts per page
 */
function niche_vault_media_posts_per_page( $query ) {
	if ( ! is_admin() && $query->is_main_query() && is_post_type_archive( 'nv_media' ) ) {
		$query->set( 'posts_per_page', 25 );
		$query->set( 'orderby', 'date' );
		$query->set( 'order', 'DESC' );
	}
}

/**
 * Custom ordering for media archive: featured first, then by order number
 */
function niche_vault_media_orderby( $orderby, $query ) {
	if ( ! is_admin() && $query->is_main_query() && is_post_type_archive( 'nv_media' ) ) {
		global $wpdb;
		$orderby = "(SELECT COALESCE(pm.meta_value, '0') FROM {$wpdb->postmeta} pm WHERE pm.post_id = {$wpdb->posts}.ID AND pm.meta_key = 'nv_media_featured' LIMIT 1) DESC, " .
			"(SELECT COALESCE(CAST(pm2.meta_value AS UNSIGNED), 999) FROM {$wpdb->postmeta} pm2 WHERE pm2.post_id = {$wpdb->posts}.ID AND pm2.meta_key = 'nv_media_order' LIMIT 1) ASC, " .
			"{$wpdb->posts}.post_date DESC";
	}
	return $orderby;
}
add_filter( 'posts_orderby', 'niche_vault_media_orderby', 10, 2 );
add_action( 'pre_get_posts', 'niche_vault_media_posts_per_page' );

/**
 * Flush rewrite rules on theme switch
 */
function niche_vault_rewrite_flush() {
	niche_vault_register_media_post_type();
	flush_rewrite_rules();
}
add_action( 'after_switch_theme', 'niche_vault_rewrite_flush' );

/**
 * Custom comment template callback — outputs: [avatar] Username · 1d · Edit
 */
function niche_vault_comment( $comment, $args, $depth ) {
	$colors      = array( '#ff3700', '#16b3e8', '#ead814', '#684c0b', '#369843', '#d90a8a', '#cd2f2f' );
	$author      = get_comment_author( $comment );
	$color_index = array_sum( array_map( 'ord', str_split( $author ) ) ) % count( $colors );
	$avatar_color = $colors[ $color_index ];
	?>
	<li id="comment-<?php comment_ID(); ?>" <?php comment_class( '', $comment ); ?>>
		<div class="comment-body">
			<div class="comment-row">
				<div class="comment-avatar" style="background-color: <?php echo esc_attr( $avatar_color ); ?>"></div>
				<div class="comment-main">
					<div class="comment-meta">
						<span class="comment-author-name"><?php comment_author(); ?></span>
						<span class="comment-time"><?php echo esc_html( get_comment_date() ); ?></span>
						<?php edit_comment_link( 'Edit', '<span class="comment-edit-link">', '</span>' ); ?>
					</div>
					<?php if ( '0' === $comment->comment_approved ) : ?>
						<p class="comment-awaiting-moderation">Awaiting moderation</p>
					<?php endif; ?>
					<div class="comment-content">
						<?php comment_text(); ?>
					</div>
					<?php comment_reply_link( array_merge( $args, array(
						'add_below' => 'comment',
						'depth'     => $depth,
						'max_depth' => $args['max_depth'],
						'before'    => '<div class="reply">',
						'after'     => '</div>',
					) ) ); ?>
				</div>
			</div>
		</div>
	<?php
}

/**
 * Remove "Required fields are marked *" from comment form
 */
add_filter( 'comment_form_defaults', function( $defaults ) {
	$defaults['required_text']        = '';
	$defaults['comment_notes_before'] = '';
	return $defaults;
} );

/**
 * Show relative time (e.g. "3 hours ago") instead of full date on comments
 */
add_filter( 'get_comment_date', function( $date, $format, $comment ) {
	$diff  = current_time( 'timestamp' ) - strtotime( $comment->comment_date );
	$years = intval( $diff / 31536000 );
	$weeks = intval( $diff / 604800 );
	$days  = intval( $diff / 86400 );
	$hours = intval( $diff / 3600 );
	$mins  = intval( $diff / 60 );

	if ( $years >= 1 )   return $years . 'y';
	if ( $weeks >= 1 )   return $weeks . 'w';
	if ( $days >= 1 )    return $days . 'd';
	if ( $hours >= 1 )   return $hours . 'h';
	if ( $mins >= 1 )    return $mins . 'm';
	return 'now';
}, 10, 3 );

/**
 * =============================================================================
 * PASSWORD GATE — shows coming soon page when Site Visibility is "Coming Soon"
 * =============================================================================
 *
 * Activated by:  Settings → General → Site Visibility → "Coming Soon"
 *                (WordPress 6.4+, or blog_public = 0 on older versions)
 * Password:      Settings → Reading → "Coming Soon Password"
 * Video file:    Drop an MP4 at /assets/gate-video.mp4
 */
define( 'NV_GATE_COOKIE', 'nv_site_access' );
define( 'NV_GATE_COOKIE_DAYS', 30 );

/**
 * Add a password field to Settings → Reading for the coming soon gate
 */
function niche_vault_gate_settings_init() {
	add_settings_section(
		'nv_gate_section',
		'Coming Soon Password',
		function() {
			echo '<p>When Site Visibility is set to "Coming Soon", visitors must enter this password. Logged-in admins bypass the gate.</p>';
		},
		'reading'
	);

	add_settings_field(
		'nv_gate_password',
		'Gate password',
		function() {
			$password = get_option( 'nv_gate_password', 'niche2026' );
			echo '<input type="text" name="nv_gate_password" value="' . esc_attr( $password ) . '" class="regular-text" />';
		},
		'reading',
		'nv_gate_section'
	);

	register_setting( 'reading', 'nv_gate_password', array(
		'type'              => 'string',
		'sanitize_callback' => 'sanitize_text_field',
		'default'           => 'niche2026',
	) );
}
add_action( 'admin_init', 'niche_vault_gate_settings_init' );

/**
 * Password gate handler — active when blog_public != 1 (Coming Soon / non-public)
 */
function niche_vault_password_gate() {
	// Only activate when site is NOT public (Coming Soon or Discourage search engines)
	// blog_public: 1 = public, 0 = discourage search engines / coming soon
	$blog_public = (int) get_option( 'blog_public', 1 );
	if ( $blog_public === 1 ) {
		return;
	}

	// Let logged-in admins through
	if ( is_user_logged_in() && current_user_can( 'manage_options' ) ) {
		return;
	}

	// Never block wp-admin, REST API, AJAX, or WooCommerce checkout/cart/account
	if ( is_admin() || wp_doing_ajax() ) {
		return;
	}
	if ( defined( 'REST_REQUEST' ) && REST_REQUEST ) {
		return;
	}
	if ( function_exists( 'is_cart' ) && ( is_cart() || is_checkout() || is_account_page() || is_wc_endpoint_url() ) ) {
		return;
	}

	$gate_password = get_option( 'nv_gate_password', 'niche2026' );

	// Check for valid cookie
	if ( isset( $_COOKIE[ NV_GATE_COOKIE ] ) && $_COOKIE[ NV_GATE_COOKIE ] === md5( $gate_password . 'nv_salt' ) ) {
		return;
	}

	// Handle password submission
	if ( isset( $_POST['nv_gate_password'] ) && isset( $_POST['nv_gate_nonce'] ) ) {
		if ( wp_verify_nonce( $_POST['nv_gate_nonce'], 'nv_gate_check' ) ) {
			if ( $_POST['nv_gate_password'] === $gate_password ) {
				$cookie_value = md5( $gate_password . 'nv_salt' );
				setcookie( NV_GATE_COOKIE, $cookie_value, time() + ( DAY_IN_SECONDS * NV_GATE_COOKIE_DAYS ), '/' );
				wp_safe_redirect( home_url( '/' ) );
				exit;
			}
		}
	}

	// Show the password gate
	include get_template_directory() . '/password-gate.php';
	exit;
}
add_action( 'template_redirect', 'niche_vault_password_gate', 5 );

/**
 * =============================================================================
 * HEADLESS / REACT FRONTEND SUPPORT
 * =============================================================================
 */

/**
 * Expose custom meta fields in WP/WC REST API for the React frontend.
 */
add_action( 'rest_api_init', function() {
	// product_year on WooCommerce products
	register_rest_field( 'product', 'product_year', array(
		'get_callback' => function( $obj ) {
			return get_post_meta( $obj['id'], 'product_year', true );
		},
		'schema' => array( 'type' => 'string', 'description' => 'Year/era of the product' ),
	) );

	// nv_media custom fields
	$nv_media_fields = array(
		'nv_media_type',
		'nv_video_url',
		'nv_audio_url',
		'nv_media_featured',
		'nv_media_order',
	);
	foreach ( $nv_media_fields as $field ) {
		register_rest_field( 'nv_media', $field, array(
			'get_callback' => function( $obj ) use ( $field ) {
				return get_post_meta( $obj['id'], $field, true );
			},
			'schema' => array( 'type' => 'string' ),
		) );
	}
} );

/**
 * Add CORS headers so the React frontend (main domain) can call the WP REST API.
 * Replace https://yoursite.com with your actual React app domain.
 */
add_action( 'init', function() {
	$allowed_origins = array(
		'http://localhost:3000',       // local dev
		'https://www.barklike.dog',    // React frontend
	);

	$origin = isset( $_SERVER['HTTP_ORIGIN'] ) ? $_SERVER['HTTP_ORIGIN'] : '';

	if ( in_array( $origin, $allowed_origins, true ) ) {
		header( 'Access-Control-Allow-Origin: ' . $origin );
		header( 'Access-Control-Allow-Methods: GET, POST, OPTIONS' );
		header( 'Access-Control-Allow-Headers: Authorization, Content-Type' );
		header( 'Access-Control-Allow-Credentials: true' );
	}

	if ( isset( $_SERVER['REQUEST_METHOD'] ) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS' ) {
		status_header( 200 );
		exit();
	}
} );

/**
 * Redirect all WordPress front-end pages to the React app at www.barklike.dog.
 * WooCommerce checkout, cart, and account pages are kept on barklike.dog.
 * wp-admin and the REST API are never affected by template_redirect.
 */
add_action( 'template_redirect', function() {
	// Keep WooCommerce transactional pages and add-to-cart actions on this domain
	if ( is_cart() || is_checkout() || is_account_page() || is_wc_endpoint_url() ) {
		return;
	}
	if ( isset( $_GET['add-to-cart'] ) || isset( $_GET['added-to-cart'] ) ) {
		return;
	}

	// Redirect everything else to the React frontend
	$path = isset( $_SERVER['REQUEST_URI'] ) ? $_SERVER['REQUEST_URI'] : '/';
	wp_redirect( 'https://www.barklike.dog' . $path, 301 );
	exit;
} );
