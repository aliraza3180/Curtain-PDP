class CurtainConfigurator {
  constructor(container) {
    if (!container) return;
    this.container = container;
    this.init();
  }

  init() {
    this.cacheDom();
    this.loadData();
    this.buildVariantMap();
    this.bindEvents();
    this.initPremiumDropdowns();
    this.resolveVariant();        // initial price
  }

  cacheDom() {
    const c = this.container;
    this.widthSelect   = c.querySelector('#cc-width');
    this.dropSelect    = c.querySelector('#cc-drop');
    this.chainSide     = c.querySelector('#cc-chain-side');
    this.chainColour   = c.querySelector('#cc-chain-colour');
    this.installHeight = c.querySelector('#cc-install-height');
    this.priceEl       = c.querySelector('#cc-price');
    this.atcBtn        = c.querySelector('#cc-atc-btn');
    this.atcText       = c.querySelector('#cc-atc-text');
    this.variantInput  = c.querySelector('#cc-variant-id');
    this.fabricInput   = c.querySelector('#cc-prop-fabric');
    this.colourInput   = c.querySelector('#cc-prop-colour');
    this.chainSideInput  = c.querySelector('#cc-prop-chain-side');
    this.chainColourInput = c.querySelector('#cc-prop-chain-colour');
    this.installInput  = c.querySelector('#cc-prop-install-height');
    this.widthInput    = c.querySelector('#cc-prop-width');
    this.fabricDisplay = c.querySelector('#cc-fabric-display');
    this.colourDisplay = c.querySelector('#cc-colour-display');
    this.form          = c.querySelector('#cc-product-form');
  }

  loadData() {
    this.variants = window.ccProductVariants || [];
    this.moneyFormat = window.ccMoneyFormat || '£{{amount}}';

    // widthPanelMap may arrive as a JSON string (double-encoded by Liquid)
    let wpm = window.ccWidthPanelMap || [];
    if (typeof wpm === 'string') {
      try { wpm = JSON.parse(wpm); } catch (e) { wpm = []; }
    }
    this.widthPanelMap = Array.isArray(wpm) ? wpm : [];
  }

  buildVariantMap() {
    this.variantMap = {};
    this.variants.forEach(v => {
      const key = `${String(v.option1).trim()}-${String(v.option2).trim()}`;
      this.variantMap[key] = v;
    });
  }

  initPremiumDropdowns() {
    const wraps = this.container.querySelectorAll('.cc-select-wrap');
    wraps.forEach(wrap => {
      const select = wrap.querySelector('select');
      if (!select) return;

      const originalSvg = wrap.querySelector('svg');
      if (originalSvg) originalSvg.style.display = 'none';

      select.style.display = 'none';

      const customDropdown = document.createElement('div');
      customDropdown.className = 'cc-custom-dropdown';

      const trigger = document.createElement('div');
      trigger.className = 'cc-custom-dropdown__trigger';
      trigger.tabIndex = 0;

      const valueSpan = document.createElement('span');
      valueSpan.className = 'cc-custom-dropdown__value';
      valueSpan.textContent = select.options[select.selectedIndex]?.text || '';

      const icon = document.createElement('div');
      icon.className = 'cc-custom-dropdown__icon';
      icon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;

      trigger.appendChild(valueSpan);
      trigger.appendChild(icon);

      const menu = document.createElement('div');
      menu.className = 'cc-custom-dropdown__menu';

      Array.from(select.options).forEach((opt, index) => {
        const optionEl = document.createElement('div');
        optionEl.className = 'cc-custom-dropdown__option';
        if (index === select.selectedIndex) optionEl.classList.add('is-selected');
        optionEl.textContent = opt.text;

        optionEl.addEventListener('click', (e) => {
          e.stopPropagation();
          select.value = opt.value;
          valueSpan.textContent = opt.text;
          menu.querySelectorAll('.cc-custom-dropdown__option').forEach(el => el.classList.remove('is-selected'));
          optionEl.classList.add('is-selected');
          customDropdown.classList.remove('is-open');

          select.dispatchEvent(new Event('change'));
        });
        menu.appendChild(optionEl);
      });

      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = customDropdown.classList.contains('is-open');
        document.querySelectorAll('.cc-custom-dropdown').forEach(d => d.classList.remove('is-open'));
        if (!isOpen) customDropdown.classList.add('is-open');
      });

      customDropdown.appendChild(trigger);
      customDropdown.appendChild(menu);
      wrap.appendChild(customDropdown);

      select.addEventListener('change', () => {
        valueSpan.textContent = select.options[select.selectedIndex]?.text || '';
        menu.querySelectorAll('.cc-custom-dropdown__option').forEach((el, index) => {
          if (index === select.selectedIndex) el.classList.add('is-selected');
          else el.classList.remove('is-selected');
        });
      });
    });

    document.addEventListener('click', () => {
      document.querySelectorAll('.cc-custom-dropdown').forEach(d => d.classList.remove('is-open'));
    });
  }

  bindEvents() {
    if (this.widthSelect)   this.widthSelect.addEventListener('change', () => this.resolveVariant());
    if (this.dropSelect)    this.dropSelect.addEventListener('change', () => this.resolveVariant());
    if (this.chainSide)     this.chainSide.addEventListener('change', () => this.syncLineProps());
    if (this.chainColour)   this.chainColour.addEventListener('change', () => this.syncLineProps());
    if (this.installHeight) this.installHeight.addEventListener('change', () => this.syncLineProps());

    const btnPower = document.getElementById('cc-btn-power');
    const propPower = document.getElementById('cc-prop-power');
    if (btnPower && propPower) {
      btnPower.addEventListener('click', () => {
        btnPower.classList.toggle('is-active');
        if (btnPower.classList.contains('is-active')) {
          btnPower.textContent = 'Power Added';
          propPower.disabled = false;
        } else {
          btnPower.textContent = 'Add Power';
          propPower.disabled = true;
        }
      });
    }

    const btnFitting = document.getElementById('cc-btn-fitting');
    const propFitting = document.getElementById('cc-prop-fitting');
    if (btnFitting && propFitting) {
      btnFitting.addEventListener('click', () => {
        btnFitting.classList.toggle('is-active');
        if (btnFitting.classList.contains('is-active')) {
          btnFitting.textContent = 'Fitting Added';
          propFitting.disabled = false;
        } else {
          btnFitting.textContent = 'Add Fitting';
          propFitting.disabled = true;
        }
      });
    }

    if (this.form) {
      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.addToCart();
      });
    }
  }

  getPanels(width) {
    const w = parseInt(width, 10);
    const match = this.widthPanelMap.find(m => parseInt(m.width, 10) === w);
    return match ? String(match.panels) : null;
  }

  resolveVariant() {
    const width = this.widthSelect ? this.widthSelect.value : null;
    const drop  = this.dropSelect  ? this.dropSelect.value  : null;
    if (!width || !drop) return this.setUnavailable();

    const panels = this.getPanels(width);
    if (!panels) return this.setUnavailable();

    const key = `${panels.trim()}-${drop.trim()}`;
    const variant = this.variantMap[key];

    if (!variant) return this.setUnavailable();

    this.currentVariant = variant;
    if (this.variantInput) this.variantInput.value = variant.id;
    this.updatePrice(variant);

    if (variant.available) {
      this.enableATC();
    } else {
      this.setUnavailableBtn();
    }
    this.syncLineProps();
  }

  updatePrice(variant) {
    const price = this.formatMoney(variant.price);
    if (this.priceEl) this.priceEl.textContent = price;
    if (this.atcText) this.atcText.textContent = `${price} — Add to cart`;
  }

  formatMoney(cents) {
    const amount = (cents / 100).toFixed(2);
    return this.moneyFormat
      .replace('{{amount}}', amount)
      .replace('{{amount_no_decimals}}', Math.round(cents / 100))
      .replace('{{amount_with_comma_separator}}', amount.replace('.', ','))
      .replace('{{amount_no_decimals_with_comma_separator}}', String(Math.round(cents / 100)));
  }

  syncLineProps() {
    if (this.chainSideInput && this.chainSide)     this.chainSideInput.value = this.chainSide.value;
    if (this.chainColourInput && this.chainColour)  this.chainColourInput.value = this.chainColour.value;
    if (this.installInput && this.installHeight)    this.installInput.value = this.installHeight.value;
    if (this.widthInput && this.widthSelect)         this.widthInput.value = this.widthSelect.value + 'cm';
  }

  setFabricColour(fabric, colour) {
    if (this.fabricInput)   this.fabricInput.value = fabric;
    if (this.colourInput)   this.colourInput.value = colour;
    if (this.fabricDisplay)  this.fabricDisplay.textContent = fabric || 'Select';
    if (this.colourDisplay)  this.colourDisplay.textContent = colour || 'Select';
  }

  setUnavailable() {
    this.currentVariant = null;
    if (this.atcBtn) {
      this.atcBtn.disabled = true;
      if (this.atcText) this.atcText.textContent = 'Unavailable';
    }
  }

  setUnavailableBtn() {
    if (this.atcBtn) {
      this.atcBtn.disabled = true;
      if (this.atcText) {
        const price = this.formatMoney(this.currentVariant.price);
        this.atcText.textContent = `${price} — Out of stock`;
      }
    }
  }

  enableATC() {
    if (this.atcBtn) this.atcBtn.disabled = false;
  }

  async addToCart() {
    if (!this.currentVariant || this.atcBtn.disabled) return;
    this.atcBtn.classList.add('is-loading');
    this.atcBtn.disabled = true;

    const properties = {};
    if (this.fabricInput && this.fabricInput.value)       properties['Fabric'] = this.fabricInput.value;
    if (this.colourInput && this.colourInput.value)       properties['Colour'] = this.colourInput.value;
    if (this.widthInput && this.widthInput.value)         properties['Width'] = this.widthInput.value;
    if (this.chainSideInput && this.chainSideInput.value) properties['Chain Side'] = this.chainSideInput.value;
    if (this.chainColourInput && this.chainColourInput.value) properties['Chain Colour'] = this.chainColourInput.value;
    if (this.installInput && this.installInput.value)     properties['Installation Height'] = this.installInput.value;

    if (this.dropSelect) properties['Drop'] = this.dropSelect.value + 'cm';

    try {
      const res = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          id: this.currentVariant.id,
          quantity: 1,
          properties
        })
      });

      if (!res.ok) throw new Error('Add to cart failed');

      this.atcBtn.classList.remove('is-loading');
      this.atcBtn.disabled = false;
      if (this.atcText) {
        const originalText = this.atcText.textContent;
        this.atcText.textContent = '✓ Added to cart';
        setTimeout(() => { this.atcText.textContent = originalText; }, 2000);
      }

      document.dispatchEvent(new CustomEvent('cart:refresh'));
      this.updateCartCount();

    } catch (err) {
      console.error('Cart error:', err);
      this.atcBtn.classList.remove('is-loading');
      this.atcBtn.disabled = false;
      if (this.atcText) this.atcText.textContent = 'Error — try again';
      setTimeout(() => this.resolveVariant(), 2500);
    }
  }

  async updateCartCount() {
    try {
      const res = await fetch('/cart.js', { headers: { 'Accept': 'application/json' } });
      const cart = await res.json();
      const bubbles = document.querySelectorAll('.cart-count-bubble span[aria-hidden="true"]');
      bubbles.forEach(b => { b.textContent = cart.item_count; });

      const cartDrawer = document.querySelector('cart-drawer');
      if (cartDrawer && typeof cartDrawer.open === 'function') {
        const drawerRes = await fetch('/cart?sections=cart-drawer');
        const sections = await drawerRes.json();
        if (sections['cart-drawer']) {
          const tmp = document.createElement('div');
          tmp.innerHTML = sections['cart-drawer'];
          const newDrawer = tmp.querySelector('.drawer__inner');
          const currentDrawer = cartDrawer.querySelector('.drawer__inner');
          if (newDrawer && currentDrawer) {
            currentDrawer.innerHTML = newDrawer.innerHTML;
          }
        }
        cartDrawer.open();
      }
    } catch (e) { }
  }
}

class CurtainGallery {
  constructor(container) {
    if (!container) return;
    this.container = container;
    this.init();
  }

  init() {
    this.initDesktop();
    this.initMobile();
  }

  initDesktop() {
    this.thumbs = Array.from(this.container.querySelectorAll('.cc-gallery__thumb'));
    this.mainImages = Array.from(this.container.querySelectorAll('.cc-gallery__main img'));
    if (!this.thumbs.length || !this.mainImages.length) return;

    this.thumbs.forEach((thumb, i) => {
      thumb.addEventListener('click', (e) => {
        e.preventDefault();
        this.setActive(i);
      });
    });

    this.setActive(0);
  }

  setActive(index) {
    this.thumbs.forEach(t => t.classList.remove('is-active'));
    this.mainImages.forEach(img => {
      img.classList.remove('is-visible');
      img.classList.add('is-hidden');
    });
    if (this.thumbs[index]) this.thumbs[index].classList.add('is-active');
    if (this.mainImages[index]) {
      this.mainImages[index].classList.remove('is-hidden');
      this.mainImages[index].classList.add('is-visible');
    }
  }

  initMobile() {
    this.slider = this.container.querySelector('.cc-gallery__slider');
    if (!this.slider) return;

    this.track = this.slider.querySelector('.cc-gallery__track');
    this.slides = this.slider.querySelectorAll('.cc-gallery__slide');
    this.dots = this.slider.querySelectorAll('.cc-gallery__dot');
    this.currentSlide = 0;

    let startX = 0, diff = 0, isDragging = false;

    this.track.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      isDragging = true;
      this.track.style.transition = 'none';
    }, { passive: true });

    this.track.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      diff = e.touches[0].clientX - startX;
      const offset = -(this.currentSlide * 100) + (diff / this.slider.offsetWidth * 100);
      this.track.style.transform = `translateX(${offset}%)`;
    }, { passive: true });

    this.track.addEventListener('touchend', () => {
      isDragging = false;
      this.track.style.transition = '';
      if (Math.abs(diff) > 50) {
        if (diff < 0 && this.currentSlide < this.slides.length - 1) this.currentSlide++;
        else if (diff > 0 && this.currentSlide > 0) this.currentSlide--;
      }
      this.goToSlide(this.currentSlide);
      diff = 0;
    });

    this.dots.forEach((dot, i) => {
      dot.addEventListener('click', () => this.goToSlide(i));
    });
  }

  goToSlide(index) {
    this.currentSlide = index;
    this.track.style.transform = `translateX(-${index * 100}%)`;
    this.dots.forEach((d, i) => d.classList.toggle('is-active', i === index));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('#CurtainConfigurator');
  if (!container) return;

  window.curtainConfigurator = new CurtainConfigurator(container);
  window.curtainGallery = new CurtainGallery(container);
});
