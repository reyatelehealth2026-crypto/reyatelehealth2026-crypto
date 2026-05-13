<?php
/**
 * Customer on-hold order email — bilingual TH/EN.
 *
 * Override of woocommerce/templates/emails/customer-on-hold-order.php
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

do_action( 'woocommerce_email_header', $email_heading, $email ); ?>

<p style="margin:0 0 12px;">
	<?php
	printf(
		/* translators: %s: customer first name */
		esc_html__( 'Hi %s,', 'astra-child' ),
		esc_html( $order->get_billing_first_name() )
	);
	?>
</p>
<p style="margin:0 0 12px;"><?php esc_html_e( 'Thank you for your order. It is currently on hold until we confirm your payment. Order details below.', 'astra-child' ); ?></p>

<p style="margin:0 0 12px;">
	<?php
	printf(
		/* translators: %s: customer first name */
		esc_html__( 'สวัสดีคุณ %s,', 'astra-child' ),
		esc_html( $order->get_billing_first_name() )
	);
	?>
</p>
<p style="margin:0 0 24px;"><?php esc_html_e( 'ขอบคุณสำหรับคำสั่งซื้อค่ะ ขณะนี้คำสั่งซื้อของท่านอยู่ในสถานะ "รอการชำระเงิน" รายละเอียดตามด้านล่าง', 'astra-child' ); ?></p>

<?php
do_action( 'woocommerce_email_before_order_table', $order, $sent_to_admin, $plain_text, $email );
do_action( 'woocommerce_email_order_details', $order, $sent_to_admin, $plain_text, $email );
do_action( 'woocommerce_email_order_meta', $order, $sent_to_admin, $plain_text, $email );
do_action( 'woocommerce_email_customer_details', $order, $sent_to_admin, $plain_text, $email );

if ( $additional_content ) {
	echo wp_kses_post( wpautop( wptexturize( $additional_content ) ) );
}

do_action( 'woocommerce_email_footer', $email );
