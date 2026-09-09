/* The existing product form remains the sole purchase controller. */
if (!customElements.get('luv-sticky-cart')) {
  customElements.define('luv-sticky-cart', class extends HTMLElement {
    connectedCallback() {
      this.hidden = true;
      this.inert = true;
      this.events = new AbortController();
      const options = { signal: this.events.signal };
      this.schedule = () => {
        if (!this.frame) this.frame = requestAnimationFrame(() => { this.frame = 0; this.update(); });
      };
      this.resizeObserver = new ResizeObserver(this.schedule);
      this.mutations = new MutationObserver(records => {
        if (records.some(r => !this.contains(r.target) && !r.target.classList?.contains('lm-sticky-boundary'))) this.schedule();
      });
      this.mutations.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'open', 'hidden', 'aria-expanded', 'aria-disabled', 'disabled'] });
      window.addEventListener('scroll', this.schedule, { ...options, passive: true });
      window.addEventListener('resize', this.schedule, options);
      window.addEventListener('pageshow', this.schedule, options);
      window.visualViewport?.addEventListener('resize', this.schedule, options);
      window.visualViewport?.addEventListener('scroll', this.schedule, options);
      document.addEventListener('load', this.schedule, { ...options, capture: true });
      document.addEventListener('toggle', this.schedule, { ...options, capture: true });
      document.addEventListener('change', this.schedule, options);
      document.addEventListener('shopify:section:load', this.schedule, options);
      document.addEventListener('shopify:section:unload', event => {
        if (event.target.contains(this)) this.disconnect();
        else this.schedule();
      }, options);
      this.schedule();
    }
    disconnectedCallback() { this.disconnect(); }
    disconnect() {
      this.events?.abort();
      this.resizeObserver?.disconnect();
      this.observer?.disconnect();
      this.mutations?.disconnect();
      cancelAnimationFrame(this.frame);
      this.frame = 0;
      this.startMarker?.remove();
      this.endMarker?.remove();
      this.start = this.footer = this.chatRoot = null;
      this.hidden = true;
      this.inert = true;
      this.style.removeProperty('--lm-sticky-bottom');
    }
    marker(target, kind) {
      if (!target) return null;
      const marker = document.createElement('span');
      marker.className = 'lm-sticky-boundary';
      marker.dataset.stickyBoundary = kind;
      marker.setAttribute('aria-hidden', 'true');
      target.after(marker);
      return marker;
    }
    update() {
      if (!this.isConnected || this.events.signal.aborted) return;
      const root = this.closest('.luv-product-page');
      if (!root) return;
      const start = root.querySelector('.product-feature-highlights') || root.querySelector('.product__info-container');
      const footer = document.querySelector('footer.luv-footer, footer.footer');
      const header = document.querySelector('.section-header');
      const headerBox = header?.getBoundingClientRect();
      const headerHeight = Math.max(0, Math.min(headerBox?.height || 0, headerBox?.bottom || 0));
      if (start !== this.start || footer !== this.footer || headerHeight !== this.headerHeight) {
        if (start !== this.start) { this.startMarker?.remove(); this.startMarker = this.marker(start, 'start'); }
        if (footer !== this.footer) { this.endMarker?.remove(); this.endMarker = this.marker(footer, 'footer-end'); }
        this.start = start;
        this.footer = footer;
        this.headerHeight = headerHeight;
        this.observer?.disconnect();
        this.observer = new IntersectionObserver(this.schedule, { rootMargin: `-${headerHeight}px 0px 0px 0px`, threshold: 0 });
        [this.startMarker, this.endMarker].filter(Boolean).forEach(e => this.observer.observe(e));
        this.resizeObserver.disconnect();
        [document.body, root, start, footer, header].filter(Boolean).forEach(e => this.resizeObserver.observe(e));
      }
      const selected = root.querySelector('input[data-variant-id]:checked');
      const available = selected ? selected.dataset.variantAvailable !== 'false' : this.dataset.variantAvailable !== 'false';
      const button = this.querySelector('.lm-sticky-atc__btn');
      const primary = document.getElementById(button.getAttribute('form'))?.querySelector('[name="add"]');
      const busy = primary?.classList.contains('loading') || primary?.getAttribute('aria-disabled') === 'true';
      button.disabled = !available || !!busy;
      button.setAttribute('aria-busy', String(!!busy));
      const label = available ? button.dataset.addToCartLabel : button.dataset.soldOutLabel;
      if (button.textContent.trim() !== label) button.textContent = label;
      const chat = document.querySelector('shopify-chat');
      const launcher = chat?.shadowRoot?.querySelector('[part~="activator"]');
      if (chat?.shadowRoot && chat.shadowRoot !== this.chatRoot) {
        this.chatRoot = chat.shadowRoot;
        this.mutations.observe(this.chatRoot, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'aria-expanded'] });
      }
      const overlay = document.querySelector('cart-drawer.active, cart-notification.active, product-modal[open], quick-add-modal[open], dialog[open], .menu-drawer-container[open], details[open] .search-modal');
      const chatOpen = launcher?.getAttribute('aria-expanded') === 'true';
      const passed = start && start.getBoundingClientRect().bottom <= headerHeight;
      const footerEnd = footer && footer.getBoundingClientRect().bottom <= window.innerHeight + 1;
      const show = !!passed && !footerEnd && available && !overlay && !chatOpen;
      this.hidden = !show;
      this.inert = !show;
      this.setAttribute('aria-hidden', String(!show));
      if (!show) { this.style.removeProperty('--lm-sticky-bottom'); return; }
      // Measure exposed widget geometry only; do not change third-party internals.
      const bar = this.getBoundingClientRect();
      const viewport = window.visualViewport;
      let bottom = viewport ? Math.max(0, innerHeight - viewport.offsetTop - viewport.height) : 0;
      // Shopify supplies this inset only in preview; never assume a toolbar height.
      const previewInset = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--private-preview-bar-offset')) || 0;
      bottom = Math.max(bottom, previewInset ? previewInset + 12 : 0);
      const obstacles = [launcher, ...document.querySelectorAll('iframe#PBarNextFrame, iframe#preview-bar-iframe')].filter(Boolean);
      for (const element of obstacles) {
        const box = element.getBoundingClientRect();
        if (box.width && box.height && box.height < innerHeight / 2 && box.top < innerHeight && box.bottom > 0 && box.right > bar.left && box.left < bar.right) {
          bottom = Math.max(bottom, innerHeight - box.top + 12);
        }
      }
      const value = `${Math.ceil(bottom)}px`;
      if (this.style.getPropertyValue('--lm-sticky-bottom') !== value) this.style.setProperty('--lm-sticky-bottom', value);
    }
  });
}
