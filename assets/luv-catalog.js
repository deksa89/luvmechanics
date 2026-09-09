if (!customElements.get('luv-catalog')) {
  customElements.define('luv-catalog', class extends HTMLElement {
    connectedCallback() {
      this.events = new AbortController();
      this.sequence = 0;
      this.mobile = matchMedia('(max-width: 1023px)');
      const options = { signal: this.events.signal };
      this.addEventListener('click', (event) => this.onClick(event), options);
      this.addEventListener('change', (event) => this.onChange(event), options);
      this.addEventListener('input', (event) => {
        if (event.target.matches('[data-filter-search]')) this.search(event.target);
      }, options);
      this.addEventListener('submit', (event) => {
        if (!event.target.matches('[data-filter-form], [data-sort-form]')) return;
        event.preventDefault();
        if (!this.validatePrices()) return;
        const url = this.formURL(event.target);
        if (this.dialog.open) {
          window.luvCollectionTracking?.publish('luvmechanics:collection_filter_used', {
            filter_action: 'apply',
            filter_name: [...url.searchParams.keys()].filter((key) => key.startsWith('filter.')),
            filter_value: [...url.searchParams.entries()].filter(([key]) => key.startsWith('filter.')).map(([, value]) => value)
          });
        }
        this.closeDrawer(false);
        this.navigate(url);
      }, options);
      window.addEventListener('popstate', () => {
        this.closeDrawer(true);
        this.navigate(new URL(location.href), false);
      }, options);
      this.mobile.addEventListener('change', () => {
        this.closeDrawer(true);
        this.updateToggle();
      }, options);
      this.classList.add('is-enhanced');
      this.bindDialog();
      this.updateToggle();
    }
    disconnectedCallback() {
      this.closeDrawer(true);
      this.events?.abort();
      this.request?.abort();
    }
    bindDialog() {
      this.dialog = this.querySelector('dialog');
      this.dialog.addEventListener('cancel', (event) => {
        event.preventDefault();
        this.closeDrawer(true);
      }, { signal: this.events.signal });
      this.dialog.addEventListener('click', (event) => {
        if (event.target === this.dialog) this.closeDrawer(true);
      }, { signal: this.events.signal });
    }
    updateToggle() {
      const button = this.querySelector('[data-filter-toggle]');
      if (!button) return;
      button.querySelector('[data-filter-toggle-label]').textContent = this.mobile.matches
        ? button.dataset.mobile : this.classList.contains('filters-hidden') ? button.dataset.show : button.dataset.hide;
      button.setAttribute('aria-expanded', String(this.mobile.matches ? this.dialog.open : !this.classList.contains('filters-hidden')));
      button.setAttribute('aria-controls', this.mobile.matches ? this.dialog.id : this.querySelector('.luv-catalog__sidebar').id);
      if (this.mobile.matches) button.setAttribute('aria-haspopup', 'dialog');
      else button.removeAttribute('aria-haspopup');
    }
    openDrawer() {
      const form = this.querySelector('[data-filter-form]');
      if (!form || this.dialog.open) return;
      this.returnFocus = this.querySelector('[data-filter-toggle]');
      this.formHome = form.parentElement;
      this.draftSnapshot = [...form.elements].map((control) => [control, control.value, control.checked]);
      this.dialog.append(form);
      this.previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      this.dialog.showModal();
      this.updateDraft();
      this.updateToggle();
      form.querySelector('[data-drawer-close]').focus();
    }
    closeDrawer(cancel) {
      if (!this.dialog?.open) return;
      const form = this.dialog.querySelector('form');
      if (cancel) this.draftSnapshot?.forEach(([control, value, checked]) => {
        control.value = value;
        control.checked = checked;
        control.setCustomValidity?.('');
      });
      this.dialog.close();
      if (form && this.formHome) this.formHome.append(form);
      document.body.style.overflow = this.previousOverflow || '';
      this.updateToggle();
      this.returnFocus?.focus({ preventScroll: true });
    }
    updateDraft() {
      const form = this.querySelector('[data-filter-form]');
      if (!form) return;
      let count = 0;
      const chips = form.querySelector('[data-draft-chips]');
      chips.replaceChildren();
      const addChip = (label, inputs) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'luv-catalog__chip';
        button.dataset.draftRemove = JSON.stringify(inputs.map((input) => input.id));
        button.textContent = label + ' ×';
        button.setAttribute('aria-label', this.dataset.removeLabel.replace('FILTER_LABEL', label));
        chips.append(button);
      };
      form.querySelectorAll('[data-filter-group]').forEach((group) => {
        const checked = group.querySelectorAll('input[type=checkbox]:checked').length;
        const hasPrice = [...group.querySelectorAll('input[type=number]')].some((input) => input.value !== '');
        count += checked + Number(hasPrice);
        if (this.dialog.open) {
          group.querySelectorAll('input[type=checkbox]:checked').forEach((input) => addChip(input.closest('label').querySelector('.luv-catalog__value-label').textContent, [input]));
          if (hasPrice) {
            const inputs = [...group.querySelectorAll('input[type=number]')];
            const format = new Intl.NumberFormat(this.dataset.locale, { style: 'currency', currency: this.dataset.currency });
            addChip(format.format(Number(inputs[0].value || 0)) + ' – ' + format.format(Number(inputs[1].value || inputs[1].max)), inputs);
          }
        }
      });
      form.querySelector('[data-draft-count]').textContent = String(count);
    }
    formURL(form) {
      const url = new URL(location.href);
      url.searchParams.delete('page');
      url.searchParams.delete('section_id');
      if (form.matches('[data-filter-form]')) {
        [...url.searchParams.keys()].filter((key) => key.startsWith('filter.') || key === 'sort_by').forEach((key) => url.searchParams.delete(key));
      } else url.searchParams.delete('sort_by');
      for (const [key, value] of new FormData(form)) if (String(value).trim() && (form.matches('[data-filter-form]') || key === 'sort_by')) url.searchParams.append(key, value);
      return url;
    }
    validatePrices() {
      const form = this.querySelector('[data-filter-form]');
      if (!form) return true;
      const inputs = [...form.querySelectorAll('input[type=number]')];
      inputs.forEach((input) => input.setCustomValidity(''));
      if (inputs.length === 2 && inputs.every((input) => input.value !== '') && Number(inputs[0].value) > Number(inputs[1].value)) {
        inputs[1].setCustomValidity(this.dataset.priceError);
      }
      return form.reportValidity();
    }
    onChange(event) {
      if (event.target.closest('[data-sort-form]')) {
        this.navigate(this.formURL(event.target.form));
        return;
      }
      if (!event.target.name?.startsWith('filter.')) return;
      this.updateDraft();
      if (!this.dialog.open && this.validatePrices()) this.navigate(this.formURL(event.target.form));
    }
    onClick(event) {
      const target = event.target.closest('button, a');
      if (!target || !this.contains(target)) return;
      if (target.matches('[data-filter-toggle]')) {
        if (this.mobile.matches) this.openDrawer();
        else { this.classList.toggle('filters-hidden'); this.updateToggle(); }
      } else if (target.matches('[data-drawer-close]')) this.closeDrawer(true);
      else if (target.matches('[data-draft-remove]')) {
        JSON.parse(target.dataset.draftRemove).forEach((id) => {
          const input = this.querySelector(`#${CSS.escape(id)}`);
          if (input.type === 'checkbox') input.checked = false;
          else { input.value = ''; input.setCustomValidity(''); }
        });
        this.updateDraft();
      }
      else if (target.matches('[data-filter-more]')) {
        const group = target.closest('[data-filter-group]');
        const expanded = target.getAttribute('aria-expanded') !== 'true';
        group.classList.toggle('is-expanded', expanded);
        target.setAttribute('aria-expanded', String(expanded));
        target.textContent = expanded ? target.dataset.less : target.dataset.more;
      } else if (target.matches('[data-reset-all], [data-group-reset]') && this.dialog.open) {
        event.preventDefault();
        const scope = target.matches('[data-group-reset]') ? target.closest('[data-filter-group]') : target.closest('form');
        scope.querySelectorAll('input[type=checkbox]').forEach((input) => { input.checked = false; });
        scope.querySelectorAll('input[type=number]').forEach((input) => { input.value = ''; input.setCustomValidity(''); });
        this.updateDraft();
      } else if (target.matches('[data-catalog-link], [data-page-link], [data-reset-all], [data-group-reset], [data-retry]')) {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        const url = new URL(target.href);
        if (!target.matches('[data-page-link]')) url.searchParams.delete('page');
        for (const key of ['preview_theme_id', 'view']) {
          const current = new URL(location.href).searchParams.get(key);
          if (current && !url.searchParams.has(key)) url.searchParams.set(key, current);
        }
        this.navigate(url, true, target.matches('[data-page-link]'));
      }
    }
    search(input) {
      const group = input.closest('[data-filter-group]');
      const query = input.value.trim().toLocaleLowerCase();
      group.classList.toggle('is-searching', Boolean(query));
      group.querySelectorAll('[data-filter-value]').forEach((item) => {
        item.hidden = !item.dataset.label.toLocaleLowerCase().includes(query);
      });
    }
    async navigate(url, push = true, pageChange = false) {
      const requestId = ++this.sequence;
      this.request?.abort();
      this.request = new AbortController();
      const controller = this.request;
      const fetchURL = new URL(url);
      fetchURL.searchParams.set('section_id', this.dataset.sectionId);
      const feedback = this.querySelector('.luv-catalog__feedback');
      feedback.hidden = false;
      feedback.querySelector('[data-loading]').hidden = false;
      feedback.querySelector('[data-error]').hidden = true;
      this.querySelector('.luv-catalog__results').setAttribute('aria-busy', 'true');
      const toggle = this.querySelector('[data-filter-toggle]');
      if (toggle) toggle.disabled = true;
      const focusId = document.activeElement?.id;
      const groupStates = [...this.querySelectorAll('[data-filter-group]')].map((group) => ({
        open: group.open, expanded: group.classList.contains('is-expanded'), search: group.querySelector('[data-filter-search]')?.value
      }));
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const response = await fetch(fetchURL, { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const parsed = new DOMParser().parseFromString(await response.text(), 'text/html');
        const content = parsed.querySelector('luv-catalog [data-catalog-content]');
        if (!content || !content.querySelector('#ProductGridContainer')) throw new Error('Invalid section response');
        if (requestId !== this.sequence) return;
        this.querySelector('[data-catalog-content]').replaceWith(content);
        this.querySelectorAll('[data-filter-group]').forEach((group, index) => {
          const state = groupStates[index];
          if (!state) return;
          group.open = state.open;
          if (state.expanded) group.querySelector('[data-filter-more]')?.click();
          const input = group.querySelector('[data-filter-search]');
          if (input && state.search) { input.value = state.search; this.search(input); }
        });
        if (push && url.href !== location.href) history.pushState({}, '', url);
        this.updateToggle();
        const focus = focusId ? this.querySelector(`#${CSS.escape(focusId)}`) : null;
        (focus || this.querySelector('#ProductGridContainer')).focus({ preventScroll: true });
        if (pageChange) this.querySelector('.luv-catalog__toolbar').scrollIntoView({ block: 'start', behavior: 'instant' });
      } catch (error) {
        if (requestId !== this.sequence) return;
        feedback.querySelector('[data-loading]').hidden = true;
        feedback.querySelector('[data-error]').hidden = false;
        feedback.querySelector('[data-retry]').href = url.href;
        feedback.focus({ preventScroll: true });
      } finally {
        clearTimeout(timeout);
        if (requestId === this.sequence) {
          this.querySelector('.luv-catalog__results').removeAttribute('aria-busy');
          const currentToggle = this.querySelector('[data-filter-toggle]');
          if (currentToggle) currentToggle.disabled = false;
        }
      }
    }
  });
}
