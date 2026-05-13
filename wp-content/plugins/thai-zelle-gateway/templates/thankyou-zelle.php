<?php
/**
 * Zelle thank-you page instructions (bilingual TH/EN).
 *
 * Variables in scope:
 *   $order   WC_Order
 *   $gateway WC_Gateway_Zelle
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$instructions_en = $gateway->render_instructions( $gateway->instructions_en, $order );
$instructions_th = $gateway->render_instructions( $gateway->instructions_th, $order );
$amount          = wc_price( $order->get_total(), array( 'currency' => $order->get_currency() ) );
$memo            = 'ORDER #' . $order->get_order_number();
?>
<section class="thai-zelle-thankyou" style="margin:32px 0;padding:24px;border:2px solid #6f2dbd;border-radius:8px;background:#fafafa;">
	<h2 style="margin-top:0;color:#6f2dbd;">
		<?php esc_html_e( 'Complete your Zelle payment', 'thai-zelle-gateway' ); ?>
		<span style="font-size:0.7em;color:#666;"> / <?php esc_html_e( 'ขั้นตอนการชำระเงิน Zelle', 'thai-zelle-gateway' ); ?></span>
	</h2>

	<div class="thai-zelle-summary" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0;">
		<div>
			<strong><?php esc_html_e( 'Amount', 'thai-zelle-gateway' ); ?> / <?php esc_html_e( 'จำนวนเงิน', 'thai-zelle-gateway' ); ?>:</strong><br>
			<span style="font-size:1.25em;"><?php echo wp_kses_post( $amount ); ?></span>
		</div>
		<div>
			<strong><?php esc_html_e( 'Memo', 'thai-zelle-gateway' ); ?>:</strong><br>
			<code style="background:#fff;padding:4px 8px;border:1px solid #ddd;"><?php echo esc_html( $memo ); ?></code>
		</div>
		<?php if ( ! empty( $gateway->zelle_email ) ) : ?>
		<div>
			<strong><?php esc_html_e( 'Send to (email)', 'thai-zelle-gateway' ); ?>:</strong><br>
			<code style="background:#fff;padding:4px 8px;border:1px solid #ddd;"><?php echo esc_html( $gateway->zelle_email ); ?></code>
		</div>
		<?php endif; ?>
		<?php if ( ! empty( $gateway->zelle_phone ) ) : ?>
		<div>
			<strong><?php esc_html_e( 'Send to (phone)', 'thai-zelle-gateway' ); ?>:</strong><br>
			<code style="background:#fff;padding:4px 8px;border:1px solid #ddd;"><?php echo esc_html( $gateway->zelle_phone ); ?></code>
		</div>
		<?php endif; ?>
		<?php if ( ! empty( $gateway->recipient_name ) ) : ?>
		<div>
			<strong><?php esc_html_e( 'Recipient', 'thai-zelle-gateway' ); ?> / <?php esc_html_e( 'ชื่อผู้รับ', 'thai-zelle-gateway' ); ?>:</strong><br>
			<?php echo esc_html( $gateway->recipient_name ); ?>
		</div>
		<?php endif; ?>
	</div>

	<div class="thai-zelle-instructions-en" style="margin:16px 0;">
		<h3 style="margin-bottom:4px;">English</h3>
		<p style="white-space:pre-line;"><?php echo esc_html( $instructions_en ); ?></p>
	</div>

	<div class="thai-zelle-instructions-th" style="margin:16px 0;">
		<h3 style="margin-bottom:4px;">ภาษาไทย</h3>
		<p style="white-space:pre-line;"><?php echo esc_html( $instructions_th ); ?></p>
	</div>

	<p style="font-size:0.9em;color:#666;margin:8px 0 0;">
		<?php esc_html_e( 'Your order will be marked as Processing once we confirm the deposit. You will receive a confirmation email at that point.', 'thai-zelle-gateway' ); ?><br>
		<?php esc_html_e( 'คำสั่งซื้อจะเปลี่ยนสถานะเป็น Processing เมื่อทางร้านยืนยันยอดโอน และจะมีอีเมลแจ้งกลับ', 'thai-zelle-gateway' ); ?>
	</p>
</section>
