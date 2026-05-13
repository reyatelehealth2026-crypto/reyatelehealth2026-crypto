<?php
/**
 * Zelle Manual Payment Gateway.
 *
 * Customer chooses Zelle → order moves to on-hold with Zelle instructions
 * (send-to email/phone + memo with order #). Admin manually marks paid
 * once they see the Zelle deposit in their bank app.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class WC_Gateway_Zelle extends WC_Payment_Gateway {

	public $zelle_email;
	public $zelle_phone;
	public $recipient_name;
	public $instructions_en;
	public $instructions_th;
	public $minimum_amount;

	public function __construct() {
		$this->id                 = 'thai_zelle';
		$this->icon               = apply_filters( 'thai_zelle_gateway_icon', THAI_ZELLE_GATEWAY_URL . 'assets/zelle-logo.png' );
		$this->has_fields         = false;
		$this->method_title       = __( 'Zelle (Manual)', 'thai-zelle-gateway' );
		$this->method_description = __( 'Accept Zelle bank transfers. Orders stay on-hold until you confirm the deposit in your bank app.', 'thai-zelle-gateway' );

		$this->init_form_fields();
		$this->init_settings();

		$this->title           = $this->get_option( 'title' );
		$this->description     = $this->get_option( 'description' );
		$this->zelle_email     = $this->get_option( 'zelle_email' );
		$this->zelle_phone     = $this->get_option( 'zelle_phone' );
		$this->recipient_name  = $this->get_option( 'recipient_name' );
		$this->instructions_en = $this->get_option( 'instructions_en' );
		$this->instructions_th = $this->get_option( 'instructions_th' );
		$this->minimum_amount  = (float) $this->get_option( 'minimum_amount', '0' );

		add_action( 'woocommerce_update_options_payment_gateways_' . $this->id, array( $this, 'process_admin_options' ) );
		add_action( 'woocommerce_thankyou_' . $this->id, array( $this, 'thankyou_page' ) );
		add_action( 'woocommerce_email_before_order_table', array( $this, 'email_instructions' ), 10, 3 );
	}

	public function init_form_fields() {
		$this->form_fields = array(
			'enabled' => array(
				'title'   => __( 'Enable/Disable', 'thai-zelle-gateway' ),
				'type'    => 'checkbox',
				'label'   => __( 'Enable Zelle payment', 'thai-zelle-gateway' ),
				'default' => 'no',
			),
			'title' => array(
				'title'       => __( 'Title', 'thai-zelle-gateway' ),
				'type'        => 'text',
				'description' => __( 'Payment method title shown at checkout.', 'thai-zelle-gateway' ),
				'default'     => __( 'Zelle (Bank Transfer)', 'thai-zelle-gateway' ),
				'desc_tip'    => true,
			),
			'description' => array(
				'title'       => __( 'Description', 'thai-zelle-gateway' ),
				'type'        => 'textarea',
				'description' => __( 'Short description shown at checkout.', 'thai-zelle-gateway' ),
				'default'     => __( 'Send payment via Zelle from your US bank. Your order will be processed once we confirm the transfer.', 'thai-zelle-gateway' ),
			),
			'zelle_email' => array(
				'title'       => __( 'Zelle Email', 'thai-zelle-gateway' ),
				'type'        => 'email',
				'description' => __( 'The email registered with your Zelle for Small Business account.', 'thai-zelle-gateway' ),
				'default'     => '',
				'desc_tip'    => true,
			),
			'zelle_phone' => array(
				'title'       => __( 'Zelle Phone', 'thai-zelle-gateway' ),
				'type'        => 'text',
				'description' => __( 'Optional. Phone number registered with Zelle (US format).', 'thai-zelle-gateway' ),
				'default'     => '',
				'desc_tip'    => true,
			),
			'recipient_name' => array(
				'title'       => __( 'Recipient Name', 'thai-zelle-gateway' ),
				'type'        => 'text',
				'description' => __( 'Name shown to customers as the Zelle recipient.', 'thai-zelle-gateway' ),
				'default'     => '',
				'desc_tip'    => true,
			),
			'minimum_amount' => array(
				'title'       => __( 'Minimum Order Total', 'thai-zelle-gateway' ),
				'type'        => 'number',
				'description' => __( 'Zelle is hidden at checkout if the cart total is below this amount. Set 0 to disable.', 'thai-zelle-gateway' ),
				'default'     => '0',
				'custom_attributes' => array( 'step' => '0.01', 'min' => '0' ),
				'desc_tip'    => true,
			),
			'instructions_en' => array(
				'title'       => __( 'Instructions (English)', 'thai-zelle-gateway' ),
				'type'        => 'textarea',
				'description' => __( 'Shown on the thank-you page and customer email. {amount}, {order_id}, {email}, {phone}, {name} placeholders are supported.', 'thai-zelle-gateway' ),
				'default'     => __( "Please send {amount} via Zelle to {email} (or {phone}).\nUse memo: \"ORDER #{order_id}\"\nRecipient: {name}\nWe will ship your order within 1 business day of receiving the transfer.", 'thai-zelle-gateway' ),
				'css'         => 'min-height:120px;',
			),
			'instructions_th' => array(
				'title'       => __( 'Instructions (Thai)', 'thai-zelle-gateway' ),
				'type'        => 'textarea',
				'description' => __( 'ข้อความภาษาไทยที่จะแสดงบนหน้า Thank You และอีเมล รองรับ {amount}, {order_id}, {email}, {phone}, {name}', 'thai-zelle-gateway' ),
				'default'     => __( "กรุณาโอน {amount} ผ่าน Zelle ไปที่ {email} (หรือเบอร์ {phone})\nระบุ memo ว่า \"ORDER #{order_id}\"\nชื่อผู้รับ: {name}\nร้านจะจัดส่งสินค้าภายใน 1 วันทำการหลังได้รับการโอน", 'thai-zelle-gateway' ),
				'css'         => 'min-height:120px;',
			),
		);
	}

	public function is_available() {
		if ( ! parent::is_available() ) {
			return false;
		}

		if ( $this->minimum_amount > 0 && WC()->cart && WC()->cart->get_total( 'edit' ) < $this->minimum_amount ) {
			return false;
		}

		if ( empty( $this->zelle_email ) && empty( $this->zelle_phone ) ) {
			return false;
		}

		return true;
	}

	public function process_payment( $order_id ) {
		$order = wc_get_order( $order_id );

		$order->update_status(
			apply_filters( 'thai_zelle_gateway_on_hold_status', 'on-hold', $order ),
			__( 'Awaiting Zelle transfer from customer.', 'thai-zelle-gateway' )
		);

		$order->update_meta_data( '_thai_zelle_reminder_sent', '' );
		$order->save();

		wc_reduce_stock_levels( $order_id );

		if ( WC()->cart ) {
			WC()->cart->empty_cart();
		}

		return array(
			'result'   => 'success',
			'redirect' => $this->get_return_url( $order ),
		);
	}

	public function thankyou_page( $order_id ) {
		$order = wc_get_order( $order_id );
		if ( ! $order || $order->get_payment_method() !== $this->id ) {
			return;
		}

		$template = THAI_ZELLE_GATEWAY_PATH . 'templates/thankyou-zelle.php';
		if ( file_exists( $template ) ) {
			$gateway = $this;
			include $template;
		}
	}

	public function email_instructions( $order, $sent_to_admin, $plain_text = false ) {
		if ( $sent_to_admin || $order->get_payment_method() !== $this->id ) {
			return;
		}

		if ( ! $order->has_status( 'on-hold' ) ) {
			return;
		}

		$instructions_en = $this->render_instructions( $this->instructions_en, $order );
		$instructions_th = $this->render_instructions( $this->instructions_th, $order );

		if ( $plain_text ) {
			echo "\n\n" . wp_strip_all_tags( $instructions_en ) . "\n\n";
			echo wp_strip_all_tags( $instructions_th ) . "\n\n";
			return;
		}

		echo '<div style="margin:24px 0;padding:16px;border:1px solid #ddd;background:#fafafa;">';
		echo '<h3 style="margin-top:0;">' . esc_html__( 'Zelle Payment Instructions', 'thai-zelle-gateway' ) . '</h3>';
		echo '<p>' . nl2br( esc_html( $instructions_en ) ) . '</p>';
		echo '<hr style="border:none;border-top:1px dashed #ccc;margin:12px 0;">';
		echo '<h3 style="margin:0 0 8px;">' . esc_html__( 'วิธีชำระเงินผ่าน Zelle', 'thai-zelle-gateway' ) . '</h3>';
		echo '<p>' . nl2br( esc_html( $instructions_th ) ) . '</p>';
		echo '</div>';
	}

	public function render_instructions( $template, $order ) {
		$replacements = array(
			'{amount}'   => html_entity_decode( wp_strip_all_tags( wc_price( $order->get_total(), array( 'currency' => $order->get_currency() ) ) ) ),
			'{order_id}' => $order->get_order_number(),
			'{email}'    => $this->zelle_email,
			'{phone}'    => $this->zelle_phone,
			'{name}'     => $this->recipient_name,
		);
		return strtr( (string) $template, $replacements );
	}
}
