<?php
/**
 * Daily WP-Cron that emails customers whose Zelle order has been on-hold
 * for more than 24 hours without a confirmed transfer.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Thai_Zelle_Reminder_Cron {

	const HOOK = 'thai_zelle_reminder';
	const META_KEY = '_thai_zelle_reminder_sent';

	public static function init() {
		add_action( self::HOOK, array( __CLASS__, 'run' ) );
	}

	public static function run() {
		$cutoff = gmdate( 'Y-m-d H:i:s', strtotime( '-24 hours' ) );

		$orders = wc_get_orders( array(
			'status'         => array( 'on-hold' ),
			'payment_method' => 'thai_zelle',
			'date_created'   => '<' . $cutoff,
			'limit'          => 50,
			'meta_query'     => array(
				array(
					'key'     => self::META_KEY,
					'compare' => 'NOT EXISTS',
				),
			),
		) );

		foreach ( $orders as $order ) {
			self::send_reminder( $order );
		}
	}

	protected static function send_reminder( $order ) {
		$gateways = WC()->payment_gateways()->payment_gateways();
		if ( empty( $gateways['thai_zelle'] ) ) {
			return;
		}
		$gateway = $gateways['thai_zelle'];

		$to = $order->get_billing_email();
		if ( ! $to ) {
			return;
		}

		$subject = sprintf(
			/* translators: %s: order number */
			__( 'Reminder: complete your Zelle payment for order #%s', 'thai-zelle-gateway' ),
			$order->get_order_number()
		);

		$instructions_en = $gateway->render_instructions( $gateway->instructions_en, $order );
		$instructions_th = $gateway->render_instructions( $gateway->instructions_th, $order );

		$body  = '<p>' . esc_html__( 'Hi,', 'thai-zelle-gateway' ) . '</p>';
		$body .= '<p>' . esc_html__( 'We have not received your Zelle transfer yet for the order below. Please complete the transfer to ship your items.', 'thai-zelle-gateway' ) . '</p>';
		$body .= '<p>' . nl2br( esc_html( $instructions_en ) ) . '</p>';
		$body .= '<hr><p>' . esc_html__( 'สวัสดีค่ะ', 'thai-zelle-gateway' ) . '</p>';
		$body .= '<p>' . esc_html__( 'ทางร้านยังไม่ได้รับยอดโอน Zelle สำหรับคำสั่งซื้อด้านล่าง รบกวนโอนเพื่อให้เราจัดส่งสินค้าค่ะ', 'thai-zelle-gateway' ) . '</p>';
		$body .= '<p>' . nl2br( esc_html( $instructions_th ) ) . '</p>';
		$body .= '<p><a href="' . esc_url( $order->get_view_order_url() ) . '">' . esc_html__( 'View order', 'thai-zelle-gateway' ) . '</a></p>';

		$mailer  = WC()->mailer();
		$wrapped = $mailer->wrap_message( $subject, $body );
		$mailer->send( $to, $subject, $wrapped, "Content-Type: text/html\r\n", array() );

		$order->update_meta_data( self::META_KEY, current_time( 'mysql', true ) );
		$order->add_order_note( __( 'Zelle payment reminder email sent to customer.', 'thai-zelle-gateway' ) );
		$order->save();
	}
}
