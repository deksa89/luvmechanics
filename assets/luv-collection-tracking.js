(() => {
  if (window.luvCollectionTracking) return;

  const eventNames = {
    hero: 'luvmechanics:collection_hero_cta_click',
    featuredProduct: 'luvmechanics:collection_featured_product_click',
    finderPopup: 'luvmechanics:collection_finder_popup_open',
    finderLink: 'luvmechanics:collection_finder_link_click',
    guidePopup: 'luvmechanics:collection_guide_popup_open',
    guideLink: 'luvmechanics:collection_guide_link_click',
    product: 'luvmechanics:collection_product_click',
    editorial: 'luvmechanics:collection_editorial_click',
    filter: 'luvmechanics:collection_filter_used',
    sort: 'luvmechanics:collection_sort_used',
    newsletter: 'luvmechanics:collection_newsletter_submit',
  };

  const compact = (value) =>
    Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== null && entry !== ''));

  const toNumber = (value) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : undefined;
  };

  const getCollectionContext = () => {
    const context = document.querySelector('[data-luv-collection-context]');
    if (!context) return {};

    return compact({
      collection_id: context.dataset.collectionId,
      collection_handle: context.dataset.collectionHandle,
      collection_title: context.dataset.collectionTitle,
      template_suffix: context.dataset.templateSuffix,
      locale: context.dataset.locale,
      currency: context.dataset.currency,
    });
  };

  const publishLuvCollectionEvent = (eventName, payload = {}) => {
    try {
      const publish = window.Shopify?.analytics?.publish;
      if (typeof publish !== 'function') return;

      const result = publish.call(window.Shopify.analytics, eventName, compact({ ...getCollectionContext(), ...payload }));
      if (result && typeof result.catch === 'function') result.catch(() => {});
    } catch (_error) {
      // Analytics must never interrupt the storefront interaction.
    }
  };

  const productPayload = (element) =>
    compact({
      product_id: element.dataset.productId,
      product_handle: element.dataset.productHandle,
      product_title: element.dataset.productTitle,
      product_vendor: element.dataset.productVendor,
      variant_id: element.dataset.variantId,
      price: toNumber(element.dataset.price),
      position: toNumber(element.dataset.position),
    });

  const cardPayload = (element) =>
    compact({
      card_title: element.dataset.luvCardTitle,
      card_type: element.dataset.luvCardType,
      interaction_type: element.dataset.luvInteractionType,
      destination_url: element.href,
    });

  const filterEntries = (url) => {
    const entries = {};
    new URL(url, window.location.href).searchParams.forEach((value, key) => {
      if (!key.startsWith('filter.')) return;
      if (!entries[key]) entries[key] = [];
      entries[key].push(value);
    });
    return entries;
  };

  const sameValues = (first = [], second = []) =>
    first.length === second.length && first.every((value, index) => value === second[index]);

  const filterRemovalPayload = (link) => {
    const before = filterEntries(window.location.href);
    const after = filterEntries(link.href);
    const names = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(
      (name) => !sameValues(before[name], after[name])
    );
    const values = names.flatMap((name) => before[name] || []);
    const beforeCount = Object.values(before).flat().length;
    const afterCount = Object.values(after).flat().length;

    return compact({
      filter_label: names.length === 1 ? names[0] : names,
      filter_value: values.length === 1 ? values[0] : values,
      filter_action: afterCount < beforeCount ? 'remove' : 'change',
    });
  };

  const filterLabel = (control) => {
    if (control.getAttribute('aria-label')) return control.getAttribute('aria-label').trim();

    const filter = control.closest('.js-filter');
    const heading = filter?.querySelector(
      ':scope > summary .facets__summary-label, :scope > summary > div > span:first-child, :scope > .mobile-facets__summary label'
    );
    return heading?.textContent.replace(/\s+/g, ' ').trim() || control.name;
  };

  const filterControlPayload = (control) => {
    let value = control.value;
    if (control.matches('[data-numeric-facet-slider]')) value = toNumber(value);

    return compact({
      filter_label: filterLabel(control),
      filter_name: control.name,
      filter_value: value,
      filter_action: control.type === 'checkbox' ? (control.checked ? 'add' : 'remove') : 'change',
    });
  };

  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;

    const tracked = event.target.closest('[data-luv-track]');
    if (tracked) {
      switch (tracked.dataset.luvTrack) {
        case 'hero-cta':
          publishLuvCollectionEvent(eventNames.hero, {
            cta_label: tracked.textContent.replace(/\s+/g, ' ').trim(),
            destination: tracked.getAttribute('href'),
          });
          return;
        case 'featured-product':
          publishLuvCollectionEvent(eventNames.featuredProduct, productPayload(tracked));
          return;
        case 'finder-link':
          publishLuvCollectionEvent(eventNames.finderLink, cardPayload(tracked));
          return;
        case 'guide-link':
          publishLuvCollectionEvent(eventNames.guideLink, cardPayload(tracked));
          return;
        case 'product-grid-product':
          publishLuvCollectionEvent(eventNames.product, productPayload(tracked));
          return;
        case 'editorial':
          publishLuvCollectionEvent(
            eventNames.editorial,
            compact({
              article_id: tracked.dataset.articleId,
              article_title: tracked.dataset.articleTitle,
              article_handle: tracked.dataset.articleHandle,
              destination_url: tracked.href,
            })
          );
          return;
      }
    }

    const facetLink = event.target.closest(
      '#luv-collection-products facet-remove a, #luv-collection-products .facets__reset, #luv-collection-products .mobile-facets__clear'
    );
    if (facetLink) publishLuvCollectionEvent(eventNames.filter, filterRemovalPayload(facetLink));
  });

  document.addEventListener('change', (event) => {
    const control = event.target;
    if (!(control instanceof HTMLInputElement || control instanceof HTMLSelectElement)) return;
    if (!control.closest('#luv-collection-products')) return;

    if (control.name === 'sort_by') {
      publishLuvCollectionEvent(eventNames.sort, { sort_value: control.value });
      return;
    }

    if (control.name?.startsWith('filter.') || control.matches('[data-numeric-facet-slider]')) {
      publishLuvCollectionEvent(eventNames.filter, filterControlPayload(control));
    }
  });

  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (form instanceof HTMLFormElement && form.matches('[data-luv-track="newsletter"]')) {
      publishLuvCollectionEvent(eventNames.newsletter);
    }
  });

  document.addEventListener('luv:collection-modal-opened', (event) => {
    const detail = event.detail || {};
    const cardType = detail.cardType;
    if (cardType !== 'finder' && cardType !== 'guide') return;

    publishLuvCollectionEvent(cardType === 'finder' ? eventNames.finderPopup : eventNames.guidePopup, {
      card_title: detail.cardTitle,
      card_type: cardType,
      interaction_type: 'popup',
    });
  });

  window.luvCollectionTracking = { publish: publishLuvCollectionEvent };
})();
