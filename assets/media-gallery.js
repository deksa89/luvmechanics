if (!customElements.get('media-gallery')) {
  customElements.define(
    'media-gallery',
    class MediaGallery extends HTMLElement {
      constructor() {
        super();
        this.elements = {
          liveRegion: this.querySelector('[id^="GalleryStatus"]'),
          viewer: this.querySelector('[id^="GalleryViewer"]'),
          thumbnails: this.querySelector('[id^="GalleryThumbnails"]'),
        };
        this.mql = window.matchMedia('(min-width: 750px)');
        this.verticalThumbnailsMql = window.matchMedia('(min-width: 1200px)');
        if (!this.elements.thumbnails) return;

        this.verticalThumbnailList = this.elements.thumbnails.querySelector('[id^="Slider-Thumbnails"]');

        this.elements.viewer.addEventListener('slideChanged', debounce(this.onSlideChanged.bind(this), 500));
        this.elements.thumbnails.querySelectorAll('[data-target]').forEach((mediaToSwitch) => {
          mediaToSwitch
            .querySelector('button')
            .addEventListener('click', this.setActiveMedia.bind(this, mediaToSwitch.dataset.target, false));
        });
        this.elements.thumbnails.addEventListener('click', this.onVerticalThumbnailControl.bind(this), true);
        this.verticalThumbnailsMql.addEventListener('change', this.onVerticalThumbnailLayoutChange.bind(this));

        if ('IntersectionObserver' in window && this.verticalThumbnailList) {
          const boundaryThumbnails = [
            this.verticalThumbnailList.firstElementChild,
            this.verticalThumbnailList.lastElementChild,
          ].filter(Boolean);

          this.verticalThumbnailBoundaryObserver = new IntersectionObserver(
            () => this.syncVerticalThumbnailControls(),
            { root: this.verticalThumbnailList, threshold: 0.95 }
          );
          boundaryThumbnails.forEach((thumbnail) => this.verticalThumbnailBoundaryObserver.observe(thumbnail));
        }

        if ('ResizeObserver' in window && this.verticalThumbnailList) {
          this.verticalThumbnailResizeObserver = new ResizeObserver(() => {
            window.requestAnimationFrame(() => this.syncVerticalThumbnailControls());
          });
          this.verticalThumbnailResizeObserver.observe(this.verticalThumbnailList);
        }

        window.requestAnimationFrame(() => this.syncVerticalThumbnailControls());
        if (this.dataset.desktopLayout.includes('thumbnail') && this.mql.matches) this.removeListSemantic();
      }

      isVerticalThumbnailRail() {
        return this.verticalThumbnailsMql.matches && this.classList.contains('luv-product-gallery--multiple');
      }

      onVerticalThumbnailControl(event) {
        if (!this.isVerticalThumbnailRail()) return;
        if (!(event.target instanceof Element)) return;

        const button = event.target.closest('[data-lm-thumbnail-rail-control]');
        if (!button || !this.elements.thumbnails.contains(button) || !this.verticalThumbnailList) return;

        event.preventDefault();
        event.stopImmediatePropagation();

        const firstThumbnail = this.verticalThumbnailList.querySelector('.thumbnail-list__item');
        const styles = window.getComputedStyle(this.verticalThumbnailList);
        const gap = Number.parseFloat(styles.rowGap || styles.gap) || 0;
        const itemStep = (firstThumbnail?.offsetHeight || 76) + gap;
        const itemCount = Number(button.dataset.step || 1);
        const direction = button.dataset.direction === 'next' ? 1 : -1;

        this.verticalThumbnailList.scrollTo({
          top: this.verticalThumbnailList.scrollTop + direction * itemStep * itemCount,
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        });
      }

      onVerticalThumbnailLayoutChange() {
        if (!this.isVerticalThumbnailRail()) {
          this.elements.thumbnails.querySelectorAll('[data-lm-thumbnail-rail-control]').forEach((button) => {
            button.removeAttribute('disabled');
          });
          this.elements.thumbnails.resetPages?.();
        }

        window.requestAnimationFrame(() => this.syncVerticalThumbnailControls());
      }

      syncVerticalThumbnailControls() {
        if (!this.isVerticalThumbnailRail() || !this.verticalThumbnailList) return;

        const previousButton = this.elements.thumbnails.querySelector(
          '[data-lm-thumbnail-rail-control][data-direction="previous"]'
        );
        const nextButton = this.elements.thumbnails.querySelector(
          '[data-lm-thumbnail-rail-control][data-direction="next"]'
        );
        const atStart = this.verticalThumbnailList.scrollTop <= 1;
        const atEnd =
          this.verticalThumbnailList.scrollTop + this.verticalThumbnailList.clientHeight >=
          this.verticalThumbnailList.scrollHeight - 1;

        previousButton?.toggleAttribute('disabled', atStart);
        nextButton?.toggleAttribute('disabled', atEnd);
      }

      onSlideChanged(event) {
        const thumbnail = this.elements.thumbnails.querySelector(
          `[data-target="${event.detail.currentElement.dataset.mediaId}"]`
        );
        this.setActiveThumbnail(thumbnail);
      }

      setActiveMedia(mediaId, prepend) {
        const activeMedia =
          this.elements.viewer.querySelector(`[data-media-id="${mediaId}"]`) ||
          this.elements.viewer.querySelector('[data-media-id]');
        if (!activeMedia) {
          return;
        }
        this.elements.viewer.querySelectorAll('[data-media-id]').forEach((element) => {
          element.classList.remove('is-active');
        });
        activeMedia?.classList?.add('is-active');

        if (prepend) {
          activeMedia.parentElement.firstChild !== activeMedia && activeMedia.parentElement.prepend(activeMedia);

          if (this.elements.thumbnails) {
            const activeThumbnail = this.elements.thumbnails.querySelector(`[data-target="${mediaId}"]`);
            activeThumbnail.parentElement.firstChild !== activeThumbnail && activeThumbnail.parentElement.prepend(activeThumbnail);
          }

          if (this.elements.viewer.slider) this.elements.viewer.resetPages();
        }

        this.preventStickyHeader();
        window.setTimeout(() => {
          if (!this.mql.matches || this.elements.thumbnails) {
            activeMedia.parentElement.scrollTo({ left: activeMedia.offsetLeft });
          }
          const activeMediaRect = activeMedia.getBoundingClientRect();
          // Don't scroll if the image is already in view
          if (activeMediaRect.top > -0.5) return;
          const top = activeMediaRect.top + window.scrollY;
          window.scrollTo({ top: top, behavior: 'smooth' });
        });
        this.playActiveMedia(activeMedia);

        if (!this.elements.thumbnails) return;
        const activeThumbnail = this.elements.thumbnails.querySelector(`[data-target="${mediaId}"]`);
        this.setActiveThumbnail(activeThumbnail);
        this.announceLiveRegion(activeMedia, activeThumbnail.dataset.mediaPosition);
      }

      setActiveThumbnail(thumbnail) {
        if (!this.elements.thumbnails || !thumbnail) return;

        this.elements.thumbnails
          .querySelectorAll('button')
          .forEach((element) => element.removeAttribute('aria-current'));
        thumbnail.querySelector('button').setAttribute('aria-current', true);

        if (this.isVerticalThumbnailRail() && this.verticalThumbnailList) {
          const thumbnailTop = thumbnail.offsetTop;
          const thumbnailBottom = thumbnailTop + thumbnail.offsetHeight;
          const visibleTop = this.verticalThumbnailList.scrollTop;
          const visibleBottom = visibleTop + this.verticalThumbnailList.clientHeight;

          if (thumbnailTop < visibleTop || thumbnailBottom > visibleBottom) {
            this.verticalThumbnailList.scrollTo({
              top: Math.max(thumbnailTop - (this.verticalThumbnailList.clientHeight - thumbnail.offsetHeight) / 2, 0),
              behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
            });
          }

          this.syncVerticalThumbnailControls();
          return;
        }

        if (this.elements.thumbnails.isSlideVisible(thumbnail, 10)) return;

        this.elements.thumbnails.slider.scrollTo({ left: thumbnail.offsetLeft });
      }

      announceLiveRegion(activeItem, position) {
        const image = activeItem.querySelector('.product__modal-opener--image img');
        if (!image) return;
        image.onload = () => {
          this.elements.liveRegion.setAttribute('aria-hidden', false);
          this.elements.liveRegion.innerHTML = window.accessibilityStrings.imageAvailable.replace('[index]', position);
          setTimeout(() => {
            this.elements.liveRegion.setAttribute('aria-hidden', true);
          }, 2000);
        };
        image.src = image.src;
      }

      playActiveMedia(activeItem) {
        window.pauseAllMedia();
        const deferredMedia = activeItem.querySelector('.deferred-media');
        if (deferredMedia) deferredMedia.loadContent(false);
      }

      preventStickyHeader() {
        this.stickyHeader = this.stickyHeader || document.querySelector('sticky-header');
        if (!this.stickyHeader) return;
        this.stickyHeader.dispatchEvent(new Event('preventHeaderReveal'));
      }

      removeListSemantic() {
        if (!this.elements.viewer.slider) return;
        this.elements.viewer.slider.setAttribute('role', 'presentation');
        this.elements.viewer.sliderItems.forEach((slide) => slide.setAttribute('role', 'presentation'));
      }
    }
  );
}
