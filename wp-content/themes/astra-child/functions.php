<?php
/**
 * Astra child theme functions — Thai store customizations.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'wp_enqueue_scripts', 'astra_child_enqueue_styles' );
function astra_child_enqueue_styles() {
	wp_enqueue_style( 'astra-parent', get_template_directory_uri() . '/style.css', array(), wp_get_theme( 'astra' )->get( 'Version' ) );
	wp_enqueue_style( 'astra-child', get_stylesheet_uri(), array( 'astra-parent' ), wp_get_theme()->get( 'Version' ) );
}

add_filter( 'woocommerce_locate_template', 'astra_child_woocommerce_locate_template', 10, 3 );
function astra_child_woocommerce_locate_template( $template, $template_name, $template_path ) {
	$override = get_stylesheet_directory() . '/woocommerce/' . $template_name;
	if ( file_exists( $override ) ) {
		return $override;
	}
	return $template;
}

add_action( 'woocommerce_init', 'astra_child_register_perishable_shipping_class' );
function astra_child_register_perishable_shipping_class() {
	$term = get_term_by( 'slug', 'perishable', 'product_shipping_class' );
	if ( ! $term ) {
		wp_insert_term(
			__( 'Perishable', 'astra-child' ),
			'product_shipping_class',
			array(
				'slug'        => 'perishable',
				'description' => __( 'Cold-pack required. Higher shipping cost and shipping restrictions apply.', 'astra-child' ),
			)
		);
	}
}

add_action( 'woocommerce_single_product_summary', 'astra_child_show_perishable_badge', 6 );
function astra_child_show_perishable_badge() {
	global $product;
	if ( ! $product ) {
		return;
	}
	if ( $product->get_shipping_class() === 'perishable' ) {
		echo '<span class="thai-store-perishable-badge">' . esc_html__( 'Perishable / สินค้าสด', 'astra-child' ) . '</span>';
	}
}

add_action( 'woocommerce_single_product_summary', 'astra_child_show_allergens', 25 );
function astra_child_show_allergens() {
	global $product;
	if ( ! $product ) {
		return;
	}
	$allergens = $product->get_attribute( 'allergens' );
	if ( empty( $allergens ) ) {
		return;
	}
	echo '<div class="thai-store-allergen-list"><strong>' . esc_html__( 'Allergens / สารก่อภูมิแพ้:', 'astra-child' ) . '</strong> ' . esc_html( $allergens ) . '</div>';
}

add_filter( 'woocommerce_package_rates', 'astra_child_block_perishable_in_restricted_states', 100, 2 );
function astra_child_block_perishable_in_restricted_states( $rates, $package ) {
	$restricted = apply_filters( 'astra_child_perishable_restricted_states', array( 'HI', 'AK', 'PR' ) );
	$destination_state = isset( $package['destination']['state'] ) ? $package['destination']['state'] : '';
	if ( ! in_array( $destination_state, $restricted, true ) ) {
		return $rates;
	}

	$has_perishable = false;
	foreach ( $package['contents'] as $item ) {
		$product = $item['data'];
		if ( $product && $product->get_shipping_class() === 'perishable' ) {
			$has_perishable = true;
			break;
		}
	}

	if ( $has_perishable ) {
		return array();
	}

	return $rates;
}

add_action( 'woocommerce_check_cart_items', 'astra_child_notice_perishable_in_restricted_states' );
function astra_child_notice_perishable_in_restricted_states() {
	if ( ! WC()->customer ) {
		return;
	}
	$restricted = apply_filters( 'astra_child_perishable_restricted_states', array( 'HI', 'AK', 'PR' ) );
	$state = WC()->customer->get_shipping_state();
	if ( ! in_array( $state, $restricted, true ) ) {
		return;
	}
	foreach ( WC()->cart->get_cart() as $item ) {
		if ( $item['data']->get_shipping_class() === 'perishable' ) {
			wc_add_notice(
				__( 'Sorry, we cannot ship perishable items to your state. Please remove them or choose a different address. / ขออภัย ไม่สามารถจัดส่งสินค้าสดไปยังรัฐของท่านได้', 'astra-child' ),
				'error'
			);
			return;
		}
	}
}

add_filter( 'woocommerce_email_subject_customer_on_hold_order', 'astra_child_bilingual_on_hold_subject', 10, 2 );
function astra_child_bilingual_on_hold_subject( $subject, $order ) {
	return sprintf(
		/* translators: %1$s order number, %2$s site title */
		__( 'Your order #%1$s is awaiting Zelle payment / รอการชำระเงิน — %2$s', 'astra-child' ),
		$order->get_order_number(),
		get_bloginfo( 'name' )
	);
}
