(() => {
  if (customElements.get('luv-home-ritual')) return;

  class LuvHomeRitual extends HTMLElement {
    connectedCallback() {
      if (this.abortController) return;

      this.hotspots = Array.from(this.querySelectorAll('[data-luv-ritual-hotspot]'));
      this.cards = Array.from(this.querySelectorAll('[data-luv-ritual-card]'));
      this.status = this.querySelector('[data-luv-ritual-status]');

      if (!this.hotspots.length || !this.cards.length) return;

      this.abortController = new AbortController();
      this.hotspots.forEach((hotspot) => {
        hotspot.addEventListener('click', () => this.selectHotspot(hotspot), {
          signal: this.abortController.signal,
        });
      });
    }

    disconnectedCallback() {
      this.abortController?.abort();
      this.abortController = null;
    }

    selectHotspot(selectedHotspot) {
      const targetId = selectedHotspot.getAttribute('aria-controls');
      const selectedCard = targetId ? this.cards.find((card) => card.id === targetId) : null;

      if (!selectedCard) return;

      this.hotspots.forEach((hotspot) => {
        const isSelected = hotspot === selectedHotspot;
        hotspot.setAttribute('aria-pressed', String(isSelected));
        hotspot.classList.toggle('is-selected', isSelected);
      });

      this.cards.forEach((card) => {
        const isSelected = card === selectedCard;
        card.hidden = !isSelected;
        card.classList.toggle('is-selected', isSelected);
        card.querySelectorAll('a, button, input, select, textarea').forEach((interactive) => {
          interactive.tabIndex = isSelected ? 0 : -1;
        });
      });

      if (this.status) {
        this.status.textContent = selectedHotspot.dataset.statusText || '';
      }
    }
  }

  customElements.define('luv-home-ritual', LuvHomeRitual);
})();
(() => {
  if (customElements.get('luv-home-shoppable-videos-coordinator')) return;

  class LuvHomeShoppableVideosCoordinator extends HTMLElement {
    constructor() {
      super();
      this.handlePlay = this.handlePlay.bind(this);
    }

    connectedCallback() {
      if (this.abortController) return;

      this.abortController = new AbortController();
      this.addEventListener('play', this.handlePlay, {
        capture: true,
        signal: this.abortController.signal,
      });
    }

    disconnectedCallback() {
      this.querySelectorAll('video').forEach((video) => video.pause());
      this.abortController?.abort();
      this.abortController = null;
    }

    handlePlay(event) {
      const activeVideo = event.target;
      if (!(activeVideo instanceof HTMLVideoElement)) return;

      this.querySelectorAll('video').forEach((video) => {
        if (video !== activeVideo && !video.paused) video.pause();
      });
    }
  }

  customElements.define('luv-home-shoppable-videos-coordinator', LuvHomeShoppableVideosCoordinator);
})();
