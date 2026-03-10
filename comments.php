<?php
/**
 * Comments Template
 *
 * @package Niche Vault
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( post_password_required() ) {
	return;
}
?>

<div id="comments" class="comments-area">

	<?php if ( have_comments() ) : ?>
		<h2 class="comments-title">COMMENTS:</h2>

		<ol class="comment-list">
			<?php wp_list_comments( array(
				'style'      => 'ol',
				'short_ping' => true,
				'callback'   => 'niche_vault_comment',
			) ); ?>
		</ol>

		<?php the_comments_pagination( array(
			'prev_text' => '&larr;',
			'next_text' => '&rarr;',
		) ); ?>

	<?php endif; ?>

	<?php
	comment_form( array(
		'title_reply' => have_comments() ? '' : 'COMMENTS:',
	) );
	?>

</div>
