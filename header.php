<?php
/**
 * Header Template
 *
 * @package Niche Vault
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
	<?php wp_body_open(); ?>

	<?php niche_vault_sidebar(); ?>

	<div id="main-content">
		<header id="header" role="banner">
			<!-- Header content goes here if needed -->
		</header>

		<main id="main" role="main">
