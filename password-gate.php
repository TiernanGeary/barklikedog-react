<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title><?php echo esc_html( get_bloginfo( 'name' ) ); ?></title>
<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&display=swap');

*, *::before, *::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  overflow: hidden;
}

body {
  font-family: 'DM Mono', 'Courier New', monospace;
  color: #f5f5f0;
  background: #0a0a0a;
}

/* ── video background ── */
.gate-video-wrap {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
}

.gate-video-wrap::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg,
      rgba(0,0,0,0.3) 0%,
      rgba(0,0,0,0.05) 40%,
      rgba(0,0,0,0.05) 60%,
      rgba(0,0,0,0.6) 100%
    );
  z-index: 1;
}

.gate-video-wrap video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gate-video-fallback {
  display: none;
  width: 100%;
  height: 100%;
  background: #0a0a0a;
}

/* ── noise texture overlay ── */
.gate-noise {
  position: fixed;
  inset: 0;
  z-index: 1;
  opacity: 0.035;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 256px 256px;
}

/* ── main content ── */
.gate-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  padding: 2rem;
}

/* ── logo ── */
.gate-logo {
  width: 64px;
  height: 64px;
  margin-bottom: 3rem;
  opacity: 0;
  animation: gate-rise 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards;
}

.gate-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: brightness(0) invert(1);
}

/* ── form ── */
.gate-form {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  opacity: 0;
  animation: gate-rise 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s forwards;
}

.gate-label {
  font-size: 0.7rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: rgba(245, 245, 240, 0.5);
}

.gate-input-row {
  display: flex;
  align-items: stretch;
  border: 1px solid rgba(245, 245, 240, 0.15);
  border-radius: 2px;
  overflow: hidden;
  transition: border-color 0.3s ease;
}

.gate-input-row:focus-within {
  border-color: rgba(245, 245, 240, 0.5);
}

.gate-input {
  width: 240px;
  padding: 0.75rem 1rem;
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  color: #f5f5f0;
  background: rgba(255, 255, 255, 0.04);
  border: none;
  outline: none;
}

.gate-input::placeholder {
  color: rgba(245, 245, 240, 0.2);
}

.gate-submit {
  padding: 0.75rem 1.25rem;
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.75rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #0a0a0a;
  background: #f5f5f0;
  border: none;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.gate-submit:hover {
  background: #fff;
}

/* ── error state ── */
.gate-error {
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  color: #e84040;
  min-height: 1.2em;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.gate-error.visible {
  opacity: 1;
}

/* ── shake animation on wrong password ── */
@keyframes gate-shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-8px); }
  40% { transform: translateX(8px); }
  60% { transform: translateX(-5px); }
  80% { transform: translateX(5px); }
}

.gate-input-row.shake {
  animation: gate-shake 0.4s ease;
  border-color: #e84040;
}

/* ── enter animation ── */
@keyframes gate-rise {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ── bottom bar ── */
.gate-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 2;
  display: flex;
  justify-content: center;
  padding: 1.5rem;
  opacity: 0;
  animation: gate-rise 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.6s forwards;
}

.gate-footer span {
  font-size: 0.6rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: rgba(245, 245, 240, 0.25);
}

/* ── responsive ── */
@media (max-width: 480px) {
  .gate-input {
    width: 180px;
    padding: 0.65rem 0.75rem;
    font-size: 0.8rem;
  }
  .gate-submit {
    padding: 0.65rem 1rem;
  }
}
</style>
</head>
<body>

<!-- VIDEO BACKGROUND -->
<div class="gate-video-wrap">
  <?php
  // Look for video file in theme assets folder
  // Supported: gate-video.mp4
  $video_url = '';
  $video_path = get_template_directory() . '/assets/gate-video.mp4';
  if ( file_exists( $video_path ) ) {
    $video_url = get_template_directory_uri() . '/assets/gate-video.mp4';
  }
  ?>
  <?php if ( $video_url ) : ?>
    <video autoplay loop muted playsinline>
      <source src="<?php echo esc_url( $video_url ); ?>" type="video/mp4">
    </video>
  <?php else : ?>
    <!-- Fallback: dark gradient when no video file is present -->
    <div class="gate-video-fallback" style="display:block; background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%);"></div>
  <?php endif; ?>
</div>

<!-- NOISE -->
<div class="gate-noise"></div>

<!-- CONTENT -->
<div class="gate-content">

  <div class="gate-logo">
    <?php
    $logo_path = get_template_directory() . '/assets/houndstooth.png';
    if ( file_exists( $logo_path ) ) : ?>
      <img src="<?php echo esc_url( get_template_directory_uri() . '/assets/houndstooth.png' ); ?>" alt="<?php echo esc_attr( get_bloginfo( 'name' ) ); ?>">
    <?php endif; ?>
  </div>

  <form class="gate-form" method="post" action="">
    <span class="gate-label">Enter password to continue</span>
    <div class="gate-input-row" id="inputRow">
      <input
        class="gate-input"
        type="password"
        name="nv_gate_password"
        placeholder="••••••••"
        autocomplete="off"
        autofocus
      >
      <button class="gate-submit" type="submit">Enter</button>
    </div>
    <span class="gate-error <?php echo isset( $_POST['nv_gate_password'] ) ? 'visible' : ''; ?>" id="gateError">
      <?php echo isset( $_POST['nv_gate_password'] ) ? 'Wrong password' : '&nbsp;'; ?>
    </span>
    <?php wp_nonce_field( 'nv_gate_check', 'nv_gate_nonce' ); ?>
  </form>

</div>

<div class="gate-footer">
  <span><?php echo esc_html( get_bloginfo( 'name' ) ); ?></span>
</div>

<script>
// Shake animation on wrong password
<?php if ( isset( $_POST['nv_gate_password'] ) ) : ?>
document.getElementById('inputRow').classList.add('shake');
setTimeout(function() {
  document.getElementById('inputRow').classList.remove('shake');
}, 500);
<?php endif; ?>
</script>

</body>
</html>
