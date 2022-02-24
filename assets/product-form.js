if (!customElements.get('product-form')) {
  customElements.define('product-form', class ProductForm extends HTMLElement {
    constructor() {
      super();

      this.form = this.querySelector('form');
      this.form.querySelector('[name=id]').disabled = false;
      this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
      this.cartNotification = document.querySelector('cart-notification');
      this.submitButton = this.querySelector('[type="submit"]');
    }

    onSubmitHandler(evt) {
      evt.preventDefault();
      if (this.submitButton.getAttribute('aria-disabled') === 'true') return;

      this.handleErrorMessage();
      this.cartNotification.setActiveElement(document.activeElement);

      this.submitButton.setAttribute('aria-disabled', true);
      this.submitButton.classList.add('loading');
      this.querySelector('.loading-overlay__spinner').classList.remove('hidden');

      const config = fetchConfig('javascript');
      config.headers['X-Requested-With'] = 'XMLHttpRequest';
      delete config.headers['Content-Type'];

      const formData = new FormData(this.form);
      formData.append('sections', this.cartNotification.getSectionsToRender().map((section) => section.id));
      formData.append('sections_url', window.location.pathname);
      config.body = formData;

      fetch(`${routes.cart_add_url}`, config)
        .then((response) => response.json())
        .then((response) => {
          if (response.status) {
            this.handleErrorMessage(response.description);

            const soldOutMessage = this.submitButton.querySelector('.sold-out-message');
            if (!soldOutMessage) return;
            this.submitButton.setAttribute('aria-disabled', true);
            this.submitButton.querySelector('span').classList.add('hidden');
            soldOutMessage.classList.remove('hidden');
            this.error = true;
            return;
          }

          this.error = false;
          this.displaySuccessMessage();

          if (!document.body.classList.contains('overflow-hidden')) {
            this.cartNotification.renderContents(response);
          } else {
            document.body.addEventListener('modalClosed', () => {
              setTimeout(() => { this.cartNotification.renderContents(response) });
            }, { once: true });
          }
        })
        .catch((e) => {
          console.error(e);
        })
        .finally(() => {
          this.submitButton.classList.remove('loading');
          if (!this.error && !this.addedToCartLabel) this.submitButton.removeAttribute('aria-disabled');
          this.querySelector('.loading-overlay__spinner').classList.add('hidden');
        });
    }

    displaySuccessMessage() {
      this.addedToCartLabel = this.submitButton.querySelector('.added-to-cart');
      this.submitButtonLabel = this.submitButton.querySelector('span');
      if (!this.addedToCartLabel || !this.submitButtonLabel) return;

      this.addedToCartLabel.classList.remove('hidden');
      this.submitButtonLabel.classList.add('hidden');
      this.submitButton.classList.toggle('button--secondary');
      this.submitButton.classList.toggle('button--primary');
      this.submitButton.classList.add('success-message');
      this.submitButton.setAttribute('aria-disabled', true);

      this.successTimer = setTimeout(this.resetSubmitButton.bind(this), 2000);
    }

    resetSubmitButton() {
      if (!this.addedToCartLabel || !this.submitButtonLabel) return;

      this.submitButtonLabel.classList.remove('hidden');
      if (!this.addedToCartLabel.classList.contains('hidden')) {
        this.addedToCartLabel.classList.add('hidden');
        this.submitButton.classList.toggle('button--primary');
        this.submitButton.classList.toggle('button--secondary');
      }
      this.submitButton.classList.remove('success-message');
      this.submitButton.removeAttribute('aria-disabled');
      clearTimeout(this.successTimer);
    }

    handleErrorMessage(errorMessage = false) {
      this.errorMessageWrapper = this.errorMessageWrapper || this.querySelector('.product-form__error-message-wrapper');
      if (!this.errorMessageWrapper) return;
      this.errorMessage = this.errorMessage || this.errorMessageWrapper.querySelector('.product-form__error-message');

      this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);

      if (errorMessage) {
        this.errorMessage.textContent = errorMessage;
      }
    }
  });
}
