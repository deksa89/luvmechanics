(() => {
  const existingController = window.luvCollectionCardModal;

  if (existingController) {
    existingController.init(document);
    return;
  }

  const triggerSelector = '[data-luv-collection-modal-trigger]';
  const dialogSelector = 'dialog[data-luv-collection-modal]';
  const closeSelector = '[data-luv-collection-modal-close]';
  const openClass = 'luv-collection-modal-open';
  const lastTrigger = new WeakMap();

  const restorePageScroll = () => {
    if (!document.querySelector(`${dialogSelector}[open]`)) {
      document.documentElement.classList.remove(openClass);
    }
  };

  const closeDialog = (dialog) => {
    if (dialog?.open) dialog.close();
  };

  const openDialog = (trigger) => {
    const dialogId = trigger.getAttribute('aria-controls');
    const dialog = dialogId ? document.getElementById(dialogId) : null;

    if (!(dialog instanceof HTMLDialogElement) || dialog.open || typeof dialog.showModal !== 'function') return;

    lastTrigger.set(dialog, trigger);
    dialog.showModal();
    document.documentElement.classList.add(openClass);

    document.dispatchEvent(
      new CustomEvent('luv:collection-modal-opened', {
        detail: {
          cardType: trigger.dataset.luvCardType || '',
          cardTitle: trigger.dataset.luvCardTitle || '',
        },
      })
    );

    window.requestAnimationFrame(() => {
      dialog.querySelector(closeSelector)?.focus({ preventScroll: true });
    });
  };

  const initDialog = (dialog) => {
    if (!(dialog instanceof HTMLDialogElement) || dialog.dataset.luvCollectionModalInitialized === 'true') return;

    dialog.dataset.luvCollectionModalInitialized = 'true';

    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) closeDialog(dialog);
    });

    dialog.addEventListener('close', () => {
      restorePageScroll();

      const trigger = lastTrigger.get(dialog);
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
      lastTrigger.delete(dialog);
    });
  };

  const init = (root = document) => {
    if (root.matches?.(dialogSelector)) initDialog(root);
    root.querySelectorAll?.(dialogSelector).forEach(initDialog);
  };

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest(triggerSelector);
    if (trigger) {
      openDialog(trigger);
      return;
    }

    const closeButton = event.target.closest(closeSelector);
    if (closeButton) closeDialog(closeButton.closest(dialogSelector));
  });

  document.addEventListener('shopify:section:load', (event) => init(event.target));
  document.addEventListener('shopify:section:unload', restorePageScroll);

  window.luvCollectionCardModal = { init };
  init(document);
})();
