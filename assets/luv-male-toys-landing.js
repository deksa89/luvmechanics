(() => {
  if (customElements.get('lm-male-toys-landing')) return;

  customElements.define('lm-male-toys-landing', class extends HTMLElement {
    connectedCallback() {
      this.controller?.abort();
      this.controller = new AbortController();
      if (this.hasAttribute('data-design-mode')) return;
      const signal = this.controller.signal;
      const publish = (eventName, detail = {}) => {
        try {
          const analytics = window.Shopify?.analytics;
          if (typeof analytics?.publish !== 'function') return false;
          const result = analytics.publish(`lm_male_toys_${eventName}`, {
            section_id: this.dataset.sectionId,
            locale: this.dataset.locale,
            currency: this.dataset.currency,
            ...detail,
          });
          if (result?.catch) result.catch(() => {});
          return true;
        } catch (_) {
          return false;
        }
      };
      const view = () => {
        if (!this.viewPublished) this.viewPublished = publish('landing_view');
      };
      view();
      window.addEventListener('load', view, { once: true, signal });
      this.addEventListener('click', (event) => {
        if (!(event.target instanceof Element)) return;
        const link = event.target.closest('a[data-lm-event]');
        if (!link || !this.contains(link)) return;
        view();
        const detail = {
          section: link.dataset.lmSection,
          destination_url: link.href,
        };
        if (link.dataset.lmEvent === 'experience_click') detail.experience = link.dataset.experience;
        if (link.dataset.lmEvent === 'product_click') {
          Object.assign(detail, {
            product_id: link.dataset.productId,
            variant_id: link.dataset.variantId,
            product_handle: link.dataset.productHandle,
            product_title: link.dataset.productTitle,
            position: Number(link.dataset.position),
            current_price: Number(link.dataset.currentPrice),
          });
        }
        publish(link.dataset.lmEvent, detail);
        if (link.dataset.lmSection === 'final' && link.dataset.lmEvent !== 'final_cta_click') {
          publish('final_cta_click', detail);
        }
      }, { signal });
    }

    disconnectedCallback() {
      this.controller?.abort();
    }
  });
})();

