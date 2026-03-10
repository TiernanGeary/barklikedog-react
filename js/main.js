/**
 * Niche Vault Theme Main JavaScript
 *
 * @package Niche Vault
 */

(function() {
	'use strict';

	var main = document.getElementById('main');

	// Fade in on page load
	main.style.opacity = '0';
	window.addEventListener('pageshow', function() {
		main.classList.remove('fade-out');
		main.style.opacity = '';
	});

	// Set active navigation item
	var currentUrl = window.location.href;
	var navLinks = document.querySelectorAll('.nav-group a');
	navLinks.forEach(function(link) {
		if (link.href === currentUrl) {
			link.classList.add('current');
		}
	});

	// Intercept internal link clicks for fade transition
	document.addEventListener('click', function(e) {
		var link = e.target.closest('a');
		if (!link) return;

		var href = link.getAttribute('href');
		if (!href) return;

		// Handle anchor links with smooth scroll
		if (href.startsWith('#')) {
			var element = document.querySelector(href);
			if (element) {
				e.preventDefault();
				element.scrollIntoView({ behavior: 'smooth' });
			}
			return;
		}

		// Skip external links, new tabs, and special links
		if (link.hostname !== window.location.hostname) return;
		if (link.target === '_blank') return;
		if (e.ctrlKey || e.metaKey || e.shiftKey) return;

		// Fade out then navigate
		e.preventDefault();
		main.classList.add('fade-out');

		setTimeout(function() {
			window.location.href = link.href;
		}, 300);
	});

	// =============================================
	// Custom Audio Player
	// =============================================
	var audio = document.getElementById('nv-audio');
	if (audio) {
		var playerColors = ['#ff3700', '#16b3e8', '#ead814', '#684c0b', '#369843', '#d90a8a', '#cd2f2f'];
		var playerEl = document.getElementById('nv-audio-player');
		playerEl.style.background = playerColors[Math.floor(Math.random() * playerColors.length)];

		var playBtn = document.getElementById('nv-audio-play');
		var progress = document.getElementById('nv-audio-progress');
		var progressFilled = document.getElementById('nv-audio-progress-filled');
		var currentTime = document.getElementById('nv-audio-current');
		var durationEl = document.getElementById('nv-audio-duration');
		var muteBtn = document.getElementById('nv-audio-mute');
		var volumeSlider = document.getElementById('nv-audio-volume');

		function formatTime(sec) {
			if (isNaN(sec)) return '0:00';
			var m = Math.floor(sec / 60);
			var s = Math.floor(sec % 60);
			return m + ':' + (s < 10 ? '0' : '') + s;
		}

		function setPlayIcon(playing) {
			var span = playBtn.querySelector('span');
			span.className = playing ? 'audio-icon-pause' : 'audio-icon-play';
			playBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
		}

		function setMuteIcon(muted) {
			var span = muteBtn.querySelector('span');
			span.className = muted ? 'audio-icon-muted' : 'audio-icon-vol';
			muteBtn.setAttribute('aria-label', muted ? 'Unmute' : 'Mute');
		}

		// Play / Pause
		playBtn.addEventListener('click', function() {
			if (audio.paused) {
				audio.play();
			} else {
				audio.pause();
			}
		});

		audio.addEventListener('play', function() { setPlayIcon(true); });
		audio.addEventListener('pause', function() { setPlayIcon(false); });

		// Duration loaded
		audio.addEventListener('loadedmetadata', function() {
			durationEl.textContent = formatTime(audio.duration);
		});

		// Progress update
		audio.addEventListener('timeupdate', function() {
			currentTime.textContent = formatTime(audio.currentTime);
			var pct = (audio.currentTime / audio.duration) * 100;
			progressFilled.style.width = pct + '%';
		});

		// Seek on click
		progress.addEventListener('click', function(e) {
			var rect = progress.getBoundingClientRect();
			var pct = (e.clientX - rect.left) / rect.width;
			audio.currentTime = pct * audio.duration;
		});

		// Mute
		muteBtn.addEventListener('click', function() {
			audio.muted = !audio.muted;
			setMuteIcon(audio.muted);
			volumeSlider.value = audio.muted ? 0 : audio.volume;
		});

		// Volume
		volumeSlider.addEventListener('input', function() {
			audio.volume = this.value;
			audio.muted = (this.value == 0);
			setMuteIcon(audio.muted);
		});

		// Reset on ended
		audio.addEventListener('ended', function() {
			setPlayIcon(false);
			progressFilled.style.width = '0%';
			currentTime.textContent = '0:00';
		});

		// Clickable timestamps in description
		var desc = document.querySelector('.single-media-description');
		if (desc) {
			// Walk text nodes and wrap timestamps like 0:30, 1:23, 1:00:30
			var walker = document.createTreeWalker(desc, NodeFilter.SHOW_TEXT, null, false);
			var textNodes = [];
			while (walker.nextNode()) textNodes.push(walker.currentNode);

			textNodes.forEach(function(node) {
				var text = node.textContent;
				// Match h:mm:ss or m:ss patterns (not inside links already)
				if (!/\d{1,2}:\d{2}/.test(text)) return;
				if (node.parentNode.tagName === 'A') return;

				var frag = document.createDocumentFragment();
				var parts = text.split(/(\d{1,2}(?::\d{2}){1,2})/);
				parts.forEach(function(part) {
					if (/^\d{1,2}(?::\d{2}){1,2}$/.test(part)) {
						// Parse timestamp to seconds
						var segs = part.split(':').map(Number);
						var secs = 0;
						if (segs.length === 3) secs = segs[0] * 3600 + segs[1] * 60 + segs[2];
						else secs = segs[0] * 60 + segs[1];

						var link = document.createElement('a');
						link.href = '#';
						link.className = 'timestamp-link';
						link.textContent = part;
						link.setAttribute('data-seek', secs);
						link.addEventListener('click', function(e) {
							e.preventDefault();
							audio.currentTime = secs;
							if (audio.paused) audio.play();
						});
						frag.appendChild(link);
					} else {
						frag.appendChild(document.createTextNode(part));
					}
				});
				node.parentNode.replaceChild(frag, node);
			});
		}
	}

	// =============================================
	// Collapsible comment replies
	// =============================================
	document.querySelectorAll('ol.children, ul.children').forEach(function(children) {
		var count = children.querySelectorAll(':scope > li').length;
		var label = 'view ' + count + (count === 1 ? ' reply' : ' replies');

		var btn = document.createElement('button');
		btn.className = 'view-replies-btn';
		btn.textContent = label;

		btn.addEventListener('click', function() {
			var open = children.classList.toggle('replies-open');
			btn.textContent = open
				? 'hide replies'
				: label;
		});

		children.parentNode.insertBefore(btn, children);
	});

})();
