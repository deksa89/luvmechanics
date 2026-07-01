class CartNotification extends HTMLElement {
  constructor() {
    super();

    this.notification = document.getElementById('cart-notification');
    this.header = document.querySelector('sticky-header');
    this.onBodyClick = this.handleBodyClick.bind(this);

    this.notification.addEventListener('keyup', (evt) => evt.code === 'Escape' && this.close());
    this.querySelectorAll('[data-cart-notification-close]').forEach((closeButton) =>
      closeButton.addEventListener('click', this.close.bind(this))
    );
  }

  open() {
    this.classList.add('is-open');
    document.body.classList.add('cart-notification-open');
    this.notification.classList.add('animate', 'active');

    this.notification.addEventListener(
      'transitionend',
      () => {
        this.notification.focus();
        trapFocus(this.notification);
      },
      { once: true }
    );

    document.body.addEventListener('click', this.onBodyClick);
  }

  close() {
    this.classList.remove('is-open');
    document.body.classList.remove('cart-notification-open');
    this.notification.classList.remove('active');
    document.body.removeEventListener('click', this.onBodyClick);

    removeTrapFocus(this.activeElement);
  }

  renderContents(parsedState) {
    this.cartItemKey = parsedState.key;
    this.getSectionsToRender().forEach((section) => {
      document.getElementById(section.id).innerHTML = this.getSectionInnerHTML(
        parsedState.sections[section.id],
        section.selector
      );
    });

    this.updateCartSummary();

    if (this.header) this.header.reveal();
    this.open();
  }

  getSectionsToRender() {
    return [
      {
        id: 'cart-notification-product',
        selector: `[id="cart-notification-product-${this.cartItemKey}"]`,
      },
      {
        id: 'cart-notification-button',
      },
      {
        id: 'cart-icon-bubble',
      },
    ];
  }

  getSectionInnerHTML(html, selector = '.shopify-section') {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector).innerHTML;
  }

  handleBodyClick(evt) {
    const target = evt.target;
    if (target !== this.notification && !target.closest('cart-notification')) {
      const disclosure = target.closest('details-disclosure, header-menu');
      this.activeElement = disclosure ? disclosure.querySelector('summary') : null;
      this.close();
    }
  }

  setActiveElement(element) {
    this.activeElement = element;
  }

  async updateCartSummary() {
    try {
      const response = await fetch(`${routes.cart_url}.js`, {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) return;

      const cart = await response.json();
      const countEl = this.querySelector('[data-cart-notification-count]');
      const totalEl = this.querySelector('[data-cart-notification-total]');
      const shippingEl = this.querySelector('[data-cart-notification-shipping]');
      const statusEl = this.querySelector('[data-cart-notification-shipping-status]');
      const progressEl = this.querySelector('[data-cart-notification-progress]');
      const knobEl = this.querySelector('[data-cart-notification-knob]');
      const threshold = Number(shippingEl?.dataset.shippingThreshold || 0);
      const progress = threshold ? Math.min(100, Math.round((cart.total_price / threshold) * 100)) : 0;

      if (countEl) countEl.textContent = cart.item_count;
      if (totalEl) totalEl.textContent = this.formatMoney(cart.total_price, cart.currency);

      if (shippingEl && statusEl && threshold) {
        const unlockedText = shippingEl.dataset.unlockedText || 'You have right to free domestic shipping!';
        const remainingText = shippingEl.dataset.remainingText || 'Spend [amount] more for free domestic shipping';
        const remainingAmount = this.formatMoney(Math.max(threshold - cart.total_price, 0), cart.currency);

        statusEl.textContent = cart.total_price >= threshold ? unlockedText : remainingText.replace('[amount]', remainingAmount);
      }

      if (progressEl) progressEl.style.width = `${progress}%`;
      if (knobEl) knobEl.style.left = `${progress}%`;
    } catch (error) {
      console.error('Cart notification summary could not be updated:', error);
    }
  }

  formatMoney(cents, currency = 'EUR') {
    if (window.Shopify && typeof window.Shopify.formatMoney === 'function') {
      return window.Shopify.formatMoney(cents);
    }

    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
    }).format(cents / 100);
  }
}

customElements.define('cart-notification', CartNotification);