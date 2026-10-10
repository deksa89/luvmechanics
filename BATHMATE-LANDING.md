# Bathmate landing page — implementation and setup

Current status (26 September 2026): controlled production code deployment completed on live theme 206919369041 using fresh staging source 207003550033. Remote sync, existing-storefront regression and EN/HR landing checks passed. No final page was created or assigned and no theme was published/swapped. The existing pixel filters out Bathmate custom events; it was not modified. See reports/bathmate-landing/PRODUCTION-DEPLOYMENT.md for the exact scope, evidence and manual page setup.

Implemented locally on 25 September 2026. Deployment update (26 September): all six landing files and 31 locales are confirmed synchronized on Development theme 206739407185; actual Shopify previews pass layout and interaction checks. Theme Editor controls still need manual verification. Fresh unpublished copy 207003550033 was created from current live and has no Bathmate deployment yet. Live remains untouched. See reports/bathmate-landing/DEPLOYMENT.md for results and preview links.

## Files

Created:

- templates/page.bathmate-landing.json
- sections/luv-bathmate-landing.liquid
- assets/luv-bathmate-landing.css
- assets/luv-bathmate-landing.js
- snippets/luv-bathmate-product.liquid
- snippets/luv-bathmate-icon.liquid
- BATHMATE-LANDING.md (this guide)

Modified (only a new lm_bathmate namespace was appended; existing translations were preserved):

- locales/bg.json
- locales/cs.json
- locales/da.json
- locales/de.json
- locales/el.json
- locales/en.default.json
- locales/es.json
- locales/fi.json
- locales/fr.json
- locales/hr.json
- locales/hu.json
- locales/id.json
- locales/it.json
- locales/ja.json
- locales/ko.json
- locales/lt.json
- locales/nb.json
- locales/nl.json
- locales/pl.json
- locales/pt-BR.json
- locales/pt-PT.json
- locales/ro.json
- locales/ru.json
- locales/sk.json
- locales/sl.json
- locales/sv.json
- locales/th.json
- locales/tr.json
- locales/vi.json
- locales/zh-CN.json
- locales/zh-TW.json

English and Croatian have 81 matching keys. The other 29 existing storefront locales receive English fallback copy, following this repository’s existing localization convention and avoiding new MatchingTranslations findings. These are not claimed as translations into those languages. No schema locale files changed.

Local test scripts, JSON results, validation output, and fixture screenshots are in reports/bathmate-landing/. The repository already ignores reports/; these are local QA artifacts, not deployable theme assets. The test runner uses temporary LiquidJS and browser packages and adds no runtime dependencies to the theme.

## Implementation

The ten requested sections live in one dedicated OS 2.0 section, with four product blocks and six FAQ blocks. The page retains the existing layout/theme.liquid header/footer groups, page SEO metadata, locale controls, and body font. The hydro-blue palette, navy premium panels, product cards, and responsive comparison layout are scoped to lm-bathmate selectors. No global product cards, product pages, collections, homepage, cart, floating add-to-cart, or collection analytics were edited.

The content width is capped at 1280px, with 16px mobile gutters. Products use four columns from 1000px, two from 600px, and compact horizontal cards below 600px. Comparison rows become readable cards below 750px. The hero uses a framed white product panel with a large contained product image. Dark slate primary buttons, alternating #f8f9ff / #eff4ff surfaces, centered desktop headings, separate sizing cards, pale-blue / cyan series buttons, white FAQ rows and the centered size-guide panel follow the supplied references. Product badges sit above the images. Existing theme fonts are retained; no new external font requests were added. Images use image_url/image_tag, responsive widths, natural dimensions, eager hero loading, and lazy product loading. Native details/summary provides keyboard operation and expanded/collapsed accessibility semantics without requiring JavaScript. There is one H1 and no added metadata or structured data.

The same four Shopify product objects drive the cards and comparison. Titles, URLs, featured images, availability and prices come from Shopify. Prices use money formatting; varying prices show a translated “From” label. A compare-at price is shown only alongside a uniform product price, using the cheapest variant’s corresponding compare-at value to avoid mixing prices from different variants. Sold-out products retain their product-detail link and show a translated sold-out label. No cart forms or purchase events were added.

Blank content settings use locale defaults. Custom Theme Editor headings, labels, product descriptions, chips and FAQ answers are translatable theme content; translate those overrides through Shopify Translate & Adapt. Shopify supplies localized product titles. Series names remain brand names.

Unselected products are omitted on the storefront and show setup prompts in the editor. Unconfigured guide links are omitted rather than assigned an invented destination. Hero imagery falls back to the first selected product. Primary CTA defaults to the products anchor; secondary CTA defaults to comparison, or products when comparison is hidden. Series buttons use configurable destinations and otherwise lead to comparison.

## Analytics

The existing theme uses Shopify.analytics.publish for custom collection events; no direct GA4/GTM/dataLayer integration was found in repository source. The landing page follows that existing transport and does not initialize a dataLayer or add a tag manager. App-injected tracking outside the repository was not inspected.

Events:

- lm_bathmate_landing_view
- lm_bathmate_size_guide_click
- lm_bathmate_compare_click
- lm_bathmate_product_click
- lm_bathmate_final_cta_click

Product events include product_id, variant_id (the minimum-price variant), product_handle, product_title, position, section, current_price, currency, locale and section_id. The displayed product minimum price is also the tracked current_price. A final size-guide click intentionally emits both the size-guide and final-CTA event. Theme Editor previews suppress tracking. Failures are caught, and missing analytics never block navigation. Shopify controls pixel consent/delivery. Confirm that the existing custom pixel subscribes to these new event names if GA4/GTM reporting is required; no pixel configuration was changed.

Native anchor navigation retains the incoming URL query, including UTMs. No history rewrite, UTM storage, cross-domain decoration or second analytics system was added. Checkout and purchase tracking remain outside this page.

## Assumptions and content verification

The supplied DESIGN (4).md and DESIGN (5).md were read and are identical. The desktop screen (4).png (283 × 1600) and mobile screen (5).png (82 × 1600) were reviewed as visual references. The layout now follows their backgrounds, CTA colors, hero frame, step-card structure, centered desktop sections, series contrast, size-guide panel and FAQ treatment. Those notes are visual reference material, not permission to copy their clinical/medical claims or add new features. The original brief remains authoritative: mobile products stay compact, comparison rows become readable cards, existing global header/footer and floating-cart behavior are preserved, and no pressure/sizing specifications or sticky purchase layer were added. The referenced HTML exports are still unavailable. Exact pixel-level typography, original image scale and a measured 15–20% product-image increase cannot be established from these very small screenshots. The hero instead prioritizes a large, uncropped configured product image.

Product selectors are intentionally unconfigured: the intended order is Hydromax 7, Hydromax 9, HydroXtreme 5, HydroXtreme 8, but actual store handles were not guessed. Configure an approved hero image and the existing LuvMechanics size-guide URL before using this page. Optional product chips and positioning/experience labels stay blank until verified. Select the matching series when changing a product.

Review the default packaging, secure-checkout, EU-delivery and pricing copy against current store policies. The brief supplied these conservative defaults; this task did not independently audit shipping operations or payment providers. Verify both locale destinations, product publication/market availability, product image alt text, selected product variants/prices, series links, and all custom copy before paid traffic.

## Shopify Admin: create a hidden page

These steps are for later setup, after the files are available on your chosen unpublished development/staging theme. No upload was performed by this task.

1. In Shopify Admin, go to Online Store > Pages > Add page.
2. Enter a page title such as “Bathmate — Find Your Model”. Leave the page body empty; this template supplies its content.
3. In Search engine listing, edit the SEO title, description and URL handle. The existing theme layout uses those Page values.
4. Set Visibility to Hidden and save. Do not add the page to navigation while reviewing.

## Theme Editor: configure the landing page

1. Go to Online Store > Themes. Locate the unpublished staging theme containing these files and click Edit theme (Customize in some interfaces). Confirm you are not editing the live theme.
2. Open the top template selector, choose Pages > bathmate-landing.
3. In Preview, click Change and select the hidden page you created. This previews the template with that page; it does not assign the template in Admin.
4. Open the Bathmate landing section. Select Hero image and set Existing Bathmate Size Guide URL using the existing store guide. Blank headings/body/CTA labels retain the built-in EN/HR copy. Leave CTA URLs blank to use the internal anchors, or choose verified destinations.
5. Open each Bathmate product block in order. Click Product > Select, search for the exact product, and select:
   - Product 1: Bathmate Hydromax 7; Series: Hydromax; default badge: Popular choice.
   - Product 2: Bathmate Hydromax 9; Series: Hydromax; default badge: None.
   - Product 3: Bathmate HydroXtreme 5; Series: HydroXtreme; default badge: Advanced.
   - Product 4: Bathmate HydroXtreme 8; Series: HydroXtreme; default badge: Premium.
6. Add verified short descriptions, optional chips, positioning and experience labels. A blank CTA uses the translated “View product” label. Rearranging product blocks also rearranges comparison rows.
7. Set optional Hydromax/HydroXtreme URLs, review FAQ topics/answers, and use the visibility switches if needed. The guide link is shared across the page, including the size FAQ and final CTA.
8. Save changes to this unpublished theme. Translate custom overrides for Croatian in Translate & Adapt and preview both languages. Do not click Publish.

## Assign page.bathmate-landing: Shopify limitation

When bathmate-landing is available in the page’s Theme template dropdown: Online Store > Pages > open the page > Online store > Theme template > bathmate-landing > Save. The Admin label is “bathmate-landing”; the code file is templates/page.bathmate-landing.json.

Shopify’s page-assignment dropdown lists templates from the current live theme only. A template existing only in a staging theme may therefore be absent. Under this task’s no-live-changes constraint, do not publish the staging theme or modify the live theme just to expose it. Use the Theme Editor’s alternate-template preview described above and defer actual Admin assignment until a separately authorized release makes the template available. A hidden page can be used in that preview.

References: [Shopify page creation](https://help.shopify.com/en/manual/online-store/add-edit-pages), [Shopify template preview and assignment](https://help.shopify.com/en/manual/online-store/themes/theme-structure/templates).

## Test scope and checklist

Completed locally using the actual Liquid templates through LiquidJS, mocked Shopify-specific filters, synthetic product data, Chromium and the existing base.css. Fixture images are visibly labeled TEST FIXTURE; they are not product assets or claimed Shopify screenshots. The supplied low-resolution reference screenshots were reviewed for visual structure; the test screenshots continue to use labeled fixture product images. These tests do not substitute for Shopify server rendering or a preview with the full global header/footer and installed app code.

- [x] EN and HR layouts: 1440, 1280, 1024, 768, 430, 390, 375, 320px.
- [x] No document overflow; correct product grid columns; contained, loaded images with positive dimensions.
- [x] Dynamic price change, compare-at price, varying “From” price and sold-out state with fixture data.
- [x] One H1; correct EN/HR default labels; four corresponding comparison rows.
- [x] FAQ opens/closes using Enter and Space; content/FAQ works without JavaScript.
- [x] Visible keyboard focus, comparison anchor, default CTA fallback when comparison is hidden, retained incoming UTM query.
- [x] Product event payload, page view deduplication, reconnect behavior, final guide events, editor suppression, missing/throwing analytics.
- [x] Empty product settings, missing image fallback and unconfigured guide URL are handled.
- [x] No JavaScript browser errors; node --check passes.
- [x] Review both supplied design notes and desktop/mobile screenshots; adapt the scoped layout while retaining the original content restrictions.
- [ ] Review the final actual-product Shopify preview at full resolution; the HTML exports and higher-resolution reference images were not supplied.
- [ ] Preview in Shopify with all four actual products, hero image and verified size-guide destination.
- [ ] Verify market/currency formatting, real product/sale/availability data and localized product URLs.
- [ ] Test every configured CTA and the actual guide page in EN and HR, including global header/footer overlap and mobile scroll targets.
- [ ] Check real customer-pixel consent and delivery to the existing GA4/GTM setup.
- [ ] Verify actual Shopify render has no Liquid or console errors and inspect responsive images/network weight.

All 36 local browser checks passed, including final-CTA contrast, the decorative size motif and mobile sizing-card layout. Official Theme Check found no new findings and no findings in the landing-page files: baseline and final results are both 6,219 existing errors and 25 warnings.

Official Theme Check results and the pre-change comparison are recorded in reports/bathmate-landing/theme-check-summary.json. The skill validation output is in skill-validation.txt. Full-repository CLI scans exhausted the default Node heap while including local reports, so checks use exact copies of the deployable theme directories. Existing unrelated translation findings are not silently repaired.

## Unsupported claims excluded

No official distributor status, ISO/material certifications, patented-technology labels (including “DX-Patented”), 0.5 BAR or other pressure specifications, medical/clinical/biomedical claims, medical-grade hand pumps, clinical guidance/results, permanent enlargement promises, numerical sizing recommendations, invented materials/warranties, dispatch guarantees (including 24-hour/same-day), neutral billing/payment-descriptor promises, or 256-bit encryption claims were included. No fake sizing table, clinical diagram or fabricated product structured data was added.
