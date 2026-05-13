# Thai WooCommerce Store — End-to-End Setup Guide

Install guide for a self-hosted WordPress + WooCommerce store selling Thai food and products to the Thai community in the USA, with Stripe + Zelle + bank transfer + local pickup payments, bilingual TH/EN.

This repo ships the **custom code only** (Zelle gateway plugin + Astra child theme). WordPress itself is installed on your hosting and the files below are copied onto that server.

---

## What ships in this repo

```
wp-content/
├── plugins/
│   └── thai-zelle-gateway/
│       ├── thai-zelle-gateway.php          # Plugin bootstrap, registers gateway + cron
│       ├── readme.txt                       # WordPress.org-style readme
│       ├── includes/
│       │   ├── class-wc-gateway-zelle.php   # WC_Payment_Gateway subclass
│       │   └── class-zelle-reminder-cron.php # 24h reminder cron
│       └── templates/
│           └── thankyou-zelle.php           # Bilingual thank-you page
└── themes/
    └── astra-child/
        ├── style.css                        # Child theme header + extra CSS
        ├── functions.php                    # Perishable shipping class,
        │                                    # state restrictions, allergen UI
        └── woocommerce/
            └── emails/
                └── customer-on-hold-order.php  # Bilingual on-hold email
```

---

## Week 1 — Infrastructure

1. **Hosting**: SiteGround GrowBig (~$30/mo) — PHP 8.2+, MySQL 8, free SSL, daily backup. Bluehost or any host with similar specs also works.
2. **Domain**: Namecheap (~$12/yr). Point A record to your host IP.
3. **Install WordPress + WooCommerce**: one-click via host control panel.
4. **Theme**: install **Astra Free** from WP → Appearance → Themes → Add New.
5. **Child theme**: copy `wp-content/themes/astra-child/` from this repo into `wp-content/themes/` on your server. Activate it in Appearance → Themes.
6. **Security**: install Wordfence Free, Limit Login Attempts Reloaded; force HTTPS; disable XML-RPC.
7. **Backup**: install UpdraftPlus → schedule daily DB + weekly file backup → Google Drive.

**Verify**: `https://yourdomain.com` returns 200 with a valid cert. Run an UpdraftPlus restore drill on a staging site.

---

## Week 2 — WooCommerce, Stripe, Zelle

### WooCommerce config
- **Settings → General**: Currency USD, base country US, selling locations "United States".
- **Tax**: install WooCommerce Tax (free, Jetpack/TaxJar-powered) → enable automated rates based on customer shipping address.
- **Shipping zones**:
  - Zone 1 "US Lower 48" — Flat $8.95, free over $75, plus USPS Priority option.
  - Zone 2 "AK / HI / PR" — Flat $24.
  - Zone 3 "Local Pickup" — restrict by ZIP, enable Local Pickup method.
- **Shipping classes** — Perishable is auto-created by the child theme on `woocommerce_init`. Configure surcharge in Zone 1 (e.g. +$12).
- **Categories**: Thai Food (Dried Goods / Snacks / Sauces & Pastes / Noodles & Rice) / Perishable / Kitchenware / Beauty & Herbs / Beverages.

### Stripe
1. Install plugin: **WooCommerce Stripe Payment Gateway** (Automattic).
2. Connect a Stripe account. Enable: Card, Apple Pay, Google Pay, Link, 3DS.
3. Webhook endpoint (Stripe dashboard → Developers → Webhooks): `https://yourdomain.com/?wc-api=wc_stripe`, events `payment_intent.succeeded`, `charge.refunded`.
4. Test with card `4242 4242 4242 4242` (success) and `4000 0000 0000 3220` (3DS). Switch to live keys after passing UAT.

### Zelle (this repo's custom plugin)
1. Copy `wp-content/plugins/thai-zelle-gateway/` from this repo onto the server.
2. WP admin → Plugins → activate "Thai Zelle Gateway for WooCommerce".
3. WooCommerce → Settings → Payments → "Zelle (Manual)" → fill in:
   - Zelle email (must be a **Zelle for Small Business** account at your bank — personal Zelle prohibits business use).
   - Zelle phone (optional).
   - Recipient name.
   - Optional minimum order total.
   - Instructions (English) and (Thai). Placeholders: `{amount}`, `{order_id}`, `{email}`, `{phone}`, `{name}`.
4. Confirm WP-Cron is firing (or set up a real server cron hitting `wp-cron.php`).

### Other manual methods
- **BACS** (Bank Transfer) — enable built-in gateway, fill bank account.
- **Cash on Local Pickup** — enable Cash on Delivery, restrict to "Local Pickup" shipping method only.

---

## Week 3 — Bilingual, food rules, customer experience

### TH/EN
1. Install plugin **TranslatePress** (free, 2 languages).
2. TranslatePress → Settings → Default `English`, Secondary `ไทย`, URL `/th/`.
3. Install Thai language pack: Settings → General → Site Language → switch and back to install the `.mo` file.
4. Use TranslatePress's visual editor to translate product titles/descriptions, category names, checkout buttons, and email subjects.
5. Currency stays USD in both languages.

### Food / perishable handling
- Mark perishable products with the "Perishable" shipping class — the child theme auto-blocks shipping to HI/AK/PR and shows a notice at cart and checkout.
- Allergens: add a product attribute named `Allergens` (multi-select: peanut, shellfish, gluten, soy, dairy). The child theme renders it on the product page.
- Lot/expiry: install WooCommerce Lot Numbers OR use ACF custom fields `_lot_number`, `_expiry_date` and show on packing slip.

### Customer experience
- The child theme overrides `customer-on-hold-order.php` to show English + Thai paragraphs.
- Install **Chaty** plugin for a floating LINE / Facebook Messenger / WhatsApp widget.

---

## Week 4 — UAT and launch

1. Run end-to-end tests (see Verification below).
2. Add legal pages: Terms of Service, Privacy Policy, Refund Policy.
3. Set up Google Analytics 4 + Search Console.
4. Switch Stripe to live keys, switch Zelle settings to the production small-business account.
5. Soft launch with ~5 friendly buyers, monitor WooCommerce Analytics + Wordfence + UpdraftPlus.

---

## Verification — end-to-end test checklist

1. **Stripe card success** — checkout with `4242 4242 4242 4242` → order status "Processing" + processing email received.
2. **Stripe 3DS** — `4000 0000 0000 3220` → 3DS prompt completes successfully.
3. **Zelle checkout** — order status "On hold" + thank-you page shows Zelle send-to email/phone + `ORDER #N` memo + amount.
4. **Zelle email** — customer receives bilingual on-hold email with Zelle instructions.
5. **Admin confirms Zelle** — change status to Processing → customer receives processing email.
6. **Reminder cron** — after 24h on hold, customer receives reminder email; order note added.
7. **Perishable + HI** — add a Perishable product, checkout to a Hawaii address → cart shows error and shipping is blocked.
8. **Multi-state tax** — checkout to CA, TX, NY → tax line is correctly applied for each.
9. **Bilingual** — switch to `/th/` → UI, product names, checkout buttons, on-hold email all translated.
10. **Backup** — restore the most recent UpdraftPlus backup onto a staging site.

---

## Cost (rough, monthly)

| Item | Cost |
|------|------|
| SiteGround GrowBig hosting | $30/mo |
| Namecheap domain | $1/mo |
| TranslatePress Free, Astra Free, WC Stripe Free, Wordfence Free, this Zelle plugin | $0 |
| Conditional Shipping & Payments (optional, fancier rules) | $79/yr |
| Advanced Shipment Tracking | $49/yr |
| Stripe fee | 2.9% + $0.30 per txn |

**~$35/mo + $130/yr extensions + Stripe per-transaction fees.**

---

## Risks (review before launch)

- **Zelle ToS**: personal Zelle prohibits business use — enroll in Zelle for Small Business at your bank (Chase, BoA, Wells Fargo, etc.).
- **Food shipping**: FDA cottage-food rules and state restrictions on meat/dairy vary (HI/AK strict). Confirm with your state's Department of Agriculture before listing fresh items.
- **Sales-tax nexus**: economic nexus thresholds vary by state. If you sell into many states or > $100k/yr, use TaxJar or Avalara to manage filings.
- **PCI**: Stripe Elements keeps you out of PCI scope. Never store card numbers locally.

---

## Co-existing portfolio

The static `index.html` at the repo root is unrelated to the store — deploy it separately to a host like Cloudflare Pages on `portfolio.yourdomain.com` so it does not conflict with WordPress at the root.
