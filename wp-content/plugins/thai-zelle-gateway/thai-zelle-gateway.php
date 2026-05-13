<?php
/**
 * Plugin Name: Thai Zelle Gateway for WooCommerce
 * Plugin URI:  https://example.com/thai-zelle-gateway
 * Description: Manual Zelle payment gateway for WooCommerce. Bilingual (Thai/English) checkout instructions and 24h reminder cron. Designed for Thai community stores in the USA.
 * Version:     1.0.0
 * Author:      Reya Telehealth
 * License:     GPL-2.0-or-later
 * Text Domain: thai-zelle-gateway
 * Domain Path: /languages
 * Requires PHP: 7.4
 * Requires at least: 6.0
 * WC requires at least: 7.0
 * WC tested up to: 9.4
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'THAI_ZELLE_GATEWAY_VERSION', '1.0.0' );
define( 'THAI_ZELLE_GATEWAY_PATH', plugin_dir_path( __FILE__ ) );
define( 'THAI_ZELLE_GATEWAY_URL', plugin_dir_url( __FILE__ ) );

add_action( 'plugins_loaded', 'thai_zelle_gateway_bootstrap' );

function thai_zelle_gateway_bootstrap() {
	if ( ! class_exists( 'WC_Payment_Gateway' ) ) {
		add_action( 'admin_notices', 'thai_zelle_gateway_missing_wc_notice' );
		return;
	}

	load_plugin_textdomain( 'thai-zelle-gateway', false, dirname( plugin_basename( __FILE__ ) ) . '/languages' );

	require_once THAI_ZELLE_GATEWAY_PATH . 'includes/class-wc-gateway-zelle.php';
	require_once THAI_ZELLE_GATEWAY_PATH . 'includes/class-zelle-reminder-cron.php';

	add_filter( 'woocommerce_payment_gateways', 'thai_zelle_gateway_register' );

	Thai_Zelle_Reminder_Cron::init();
}

function thai_zelle_gateway_register( $gateways ) {
	$gateways[] = 'WC_Gateway_Zelle';
	return $gateways;
}

function thai_zelle_gateway_missing_wc_notice() {
	echo '<div class="error"><p><strong>' . esc_html__( 'Thai Zelle Gateway requires WooCommerce to be installed and active.', 'thai-zelle-gateway' ) . '</strong></p></div>';
}

register_activation_hook( __FILE__, 'thai_zelle_gateway_activate' );
function thai_zelle_gateway_activate() {
	if ( ! wp_next_scheduled( 'thai_zelle_reminder' ) ) {
		wp_schedule_event( time() + HOUR_IN_SECONDS, 'daily', 'thai_zelle_reminder' );
	}
}

register_deactivation_hook( __FILE__, 'thai_zelle_gateway_deactivate' );
function thai_zelle_gateway_deactivate() {
	wp_clear_scheduled_hook( 'thai_zelle_reminder' );
}

add_action( 'before_woocommerce_init', function() {
	if ( class_exists( \Automattic\WooCommerce\Utilities\FeaturesUtil::class ) ) {
		\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'custom_order_tables', __FILE__, true );
	}
} );
