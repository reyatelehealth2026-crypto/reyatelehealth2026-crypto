=== Thai Zelle Gateway for WooCommerce ===
Contributors: reyatelehealth
Tags: woocommerce, zelle, payment, gateway, thai, bilingual
Requires at least: 6.0
Tested up to: 6.7
Requires PHP: 7.4
WC requires at least: 7.0
WC tested up to: 9.4
Stable tag: 1.0.0
License: GPLv2 or later

Manual Zelle payment gateway for WooCommerce with bilingual (Thai/English) checkout instructions and 24-hour reminder cron.

== Description ==

Zelle does not provide a merchant API for online stores. This plugin implements Zelle as a manual payment gateway:

* Customer chooses Zelle at checkout.
* Order moves to "On hold" with the Zelle send-to email/phone and a memo like `ORDER #123` shown on the thank-you page and in the customer email.
* Bilingual (Thai/English) instructions on the thank-you page and emails.
* WP-Cron runs daily and sends a reminder email after 24 hours if the order is still on hold.
* Admin reviews the deposit in their bank app, then changes the order status to "Processing" — WooCommerce sends the standard processing email.

Designed for stores serving the Thai community in the USA who want to accept Zelle alongside Stripe.

== Installation ==

1. Upload the `thai-zelle-gateway` folder to `/wp-content/plugins/`.
2. Activate the plugin in WP admin → Plugins.
3. Go to WooCommerce → Settings → Payments → Zelle (Manual) and fill in:
   * Zelle email registered with Zelle for Small Business
   * Zelle phone (optional)
   * Recipient name
   * Optional minimum order total
   * Instructions in English and Thai (placeholders supported: `{amount}`, `{order_id}`, `{email}`, `{phone}`, `{name}`)
4. Make sure WP-Cron is running (or set up a real server cron pointing at `wp-cron.php`).

== Important: Zelle Terms of Service ==

Personal Zelle accounts prohibit business use. The store owner must enroll in **Zelle for Small Business** through their bank (Chase, Bank of America, Wells Fargo, and most major US banks support this).

== Frequently Asked Questions ==

= Can Zelle payments be automated? =
No. Zelle does not expose a merchant API. The admin must manually confirm each deposit in their bank app and change the order to "Processing".

= Will customers see Thai or English instructions? =
Both. The thank-you page and customer email show English first, then Thai. Pair with TranslatePress if you want the rest of the store translated too.

== Changelog ==

= 1.0.0 =
* Initial release: Zelle manual gateway, bilingual thank-you page, 24h reminder cron, HPOS compatibility declaration.
