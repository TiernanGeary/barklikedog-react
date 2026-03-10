<?php
/**
 * Footer Template
 *
 * @package Niche Vault
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
		</main><!-- #main -->
	</div><!-- #main-content -->

	<footer id="footer" role="contentinfo">
		<div class="footer-content">
			<p>&copy; <?php echo esc_html( date( 'Y' ) ); ?> <?php bloginfo( 'name' ); ?>. All rights reserved.</p>
		</div>
	</footer>

	<?php wp_footer(); ?>
</body>
</html>
