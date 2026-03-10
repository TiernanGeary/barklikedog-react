<?php
/**
 * Single Media Template
 *
 * @package Niche Vault
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();

$media_type = get_post_meta( get_the_ID(), 'nv_media_type', true );
$video_url  = get_post_meta( get_the_ID(), 'nv_video_url', true );
$audio_url  = get_post_meta( get_the_ID(), 'nv_audio_url', true );
if ( ! $media_type ) {
	$media_type = 'photo';
}
?>

<div class="page-content">
	<div class="page-content-inner">
		<a href="<?php echo esc_url( get_post_type_archive_link( 'nv_media' ) ); ?>" class="back-link">&larr; Back</a>

		<div class="single-media">
			<div class="single-media-content">
				<?php if ( 'video' === $media_type && $video_url ) : ?>
					<div class="media-video-embed">
						<?php echo wp_oembed_get( $video_url ); ?>
					</div>
				<?php elseif ( 'audio' === $media_type ) : ?>
					<?php if ( has_post_thumbnail() ) : ?>
						<div class="media-cover-art">
							<?php the_post_thumbnail( 'large' ); ?>
						</div>
					<?php endif; ?>
					<?php if ( $audio_url ) : ?>
						<div class="audio-player" id="nv-audio-player">
							<audio id="nv-audio" preload="metadata">
								<source src="<?php echo esc_url( $audio_url ); ?>">
							</audio>
							<button class="audio-player-btn" id="nv-audio-play" type="button" aria-label="Play">
								<span class="audio-icon-play"></span>
							</button>
							<div class="audio-player-time" id="nv-audio-current">0:00</div>
							<div class="audio-player-progress" id="nv-audio-progress">
								<div class="audio-player-progress-filled" id="nv-audio-progress-filled"></div>
							</div>
							<div class="audio-player-time" id="nv-audio-duration">0:00</div>
							<div class="audio-player-volume">
								<button class="audio-player-btn audio-player-vol-btn" id="nv-audio-mute" type="button" aria-label="Mute">
									<span class="audio-icon-vol"></span>
								</button>
								<input type="range" class="audio-player-vol-slider" id="nv-audio-volume" min="0" max="1" step="0.01" value="1" />
							</div>
						</div>
					<?php endif; ?>
				<?php else : ?>
					<?php if ( has_post_thumbnail() ) : ?>
						<div class="media-full-image">
							<?php the_post_thumbnail( 'full' ); ?>
						</div>
					<?php endif; ?>
				<?php endif; ?>
			</div>

			<div class="single-media-info">
				<h1 class="single-media-title"><?php the_title(); ?></h1>

				<div class="single-media-type"><?php echo esc_html( ucfirst( $media_type ) ); ?></div>

				<?php
				$content = get_the_content();
				if ( $content ) : ?>
					<div class="single-media-description">
						<?php echo wp_kses_post( wpautop( $content ) ); ?>
					</div>
				<?php endif; ?>
			</div>
		</div>
	</div>
</div>

<?php
get_footer();
