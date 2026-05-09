/**
 * FabricSelector
 * ---------------
 * Handles the fabric & colour modal.
 * Groups flat metaobject entries by fabric_name,
 * renders dynamic colour grid when fabric is selected.
 */
class FabricSelector {
  constructor() {
    this.overlay = document.querySelector('#cc-modal-overlay');
    this.modal = document.querySelector('#cc-modal');

    if (!this.overlay || !this.modal) {
      console.warn('[FabricSelector] Modal elements not found in DOM');
      return;
    }

    // Move modal + overlay to body to escape any CSS stacking context
    // (Dawn's scroll animations apply transforms that break position:fixed)
    document.body.appendChild(this.overlay);
    document.body.appendChild(this.modal);

    this.fabricGrid = this.modal.querySelector('#cc-fabric-grid');
    this.colourGrid = this.modal.querySelector('#cc-colour-grid');
    this.confirmBtn = this.modal.querySelector('#cc-modal-confirm');
    this.closeBtn = this.modal.querySelector('#cc-modal-close');

    this.fabricTrigger = document.querySelector('#cc-fabric-trigger');
    this.colourTrigger = document.querySelector('#cc-colour-trigger');

    this.selectedFabric = null;
    this.selectedColour = null;

    this.data = window.ccFabricColours || [];
    this.grouped = this.processFabricData(this.data);

    this.init();
  }

  /* ---- process new metaobject structure where colours are in a JSON field ---- */
  processFabricData(entries) {
    const map = {};
    entries.forEach(entry => {
      const fabric = entry.fabric_name;
      if (!fabric) return;

      let colors = [];
      if (typeof entry.fabric_colors === 'string') {
        try { colors = JSON.parse(entry.fabric_colors); } catch (e) { colors = []; }
      } else if (Array.isArray(entry.fabric_colors)) {
        colors = entry.fabric_colors;
      }

      // Initialize fabric in map
      if (!map[fabric]) {
        map[fabric] = {
          name: fabric,
          image: entry.fabric_image || '',
          colours: []
        };
      }

      // Add colors from the JSON array
      if (colors && colors.length > 0) {
        colors.forEach(c => {
          map[fabric].colours.push({
            name: c.name || c.colour_name || c.color_name || '',
            swatch_color: c.swatch_color || c.color || '',
            swatch_image: c.swatch_image || c.image || ''
          });
        });
      } else if (entry.colour_name) {
        // Fallback for old flat structure just in case
        map[fabric].colours.push({
          name: entry.colour_name,
          swatch_color: entry.swatch_color || '',
          swatch_image: entry.swatch_image || ''
        });
      }
    });
    return map;
  }

  init() {
    this.renderFabrics();
    this.bindEvents();
  }

  /* ---- render fabric cards ---- */
  renderFabrics() {
    if (!this.fabricGrid) return;
    const fabrics = Object.values(this.grouped);

    // Sort by sort_order if available
    this.fabricGrid.innerHTML = fabrics.map(f => `
      <div class="cc-fabric-card" data-fabric="${this.escapeHtml(f.name)}" role="button" tabindex="0" aria-label="Select fabric: ${this.escapeHtml(f.name)}">
        ${f.image
        ? `<img class="cc-fabric-card__img" src="${f.image}" alt="${this.escapeHtml(f.name)}" loading="lazy">`
        : `<div class="cc-fabric-card__img" style="background:var(--cc-surface);display:flex;align-items:center;justify-content:center;font-size:12px;color:var(--cc-text-light)">${this.escapeHtml(f.name)}</div>`
      }
        <div class="cc-fabric-card__name">${this.escapeHtml(f.name)}</div>
      </div>
    `).join('');
  }

  /* ---- render colour swatches for selected fabric ---- */
  renderColours(fabricName) {
    if (!this.colourGrid) return;
    const fabric = this.grouped[fabricName];

    if (!fabric || !fabric.colours.length) {
      this.colourGrid.innerHTML = '<div class="cc-colour-empty">No colours available</div>';
      return;
    }

    this.colourGrid.innerHTML = fabric.colours.map(c => `
      <div class="cc-colour-card" data-colour="${this.escapeHtml(c.name)}" role="button" tabindex="0" aria-label="Select colour: ${this.escapeHtml(c.name)}">
        <div class="cc-colour-swatch"
             style="${c.swatch_image ? '' : `background-color: ${c.swatch_color || '#e0e0e0'}`}">
          ${c.swatch_image ? `<img src="${c.swatch_image}" alt="${this.escapeHtml(c.name)}" loading="lazy">` : ''}
        </div>
        <div class="cc-colour-card__name">${this.escapeHtml(c.name)}</div>
      </div>
    `).join('');

    // Bind colour click events
    this.colourGrid.querySelectorAll('.cc-colour-card').forEach(card => {
      card.addEventListener('click', () => this.selectColour(card));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.selectColour(card);
        }
      });
    });
  }

  /* ---- event binding ---- */
  bindEvents() {
    // Open modal triggers
    [this.fabricTrigger, this.colourTrigger].forEach(trigger => {
      if (trigger) {
        trigger.addEventListener('click', () => this.open());
        trigger.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.open(); }
        });
      }
    });

    // Close
    if (this.closeBtn) this.closeBtn.addEventListener('click', () => this.close());
    if (this.overlay) this.overlay.addEventListener('click', () => this.close());

    // ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    });

    // Confirm
    if (this.confirmBtn) {
      this.confirmBtn.addEventListener('click', () => this.confirm());
    }

    // Fabric card clicks
    if (this.fabricGrid) {
      this.fabricGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.cc-fabric-card');
        if (card) this.selectFabric(card);
      });

      this.fabricGrid.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const card = e.target.closest('.cc-fabric-card');
          if (card) this.selectFabric(card);
        }
      });
    }
  }

  /* ---- open / close ---- */
  open() {
    this.isOpen = true;
    this.overlay.classList.add('is-active');
    this.modal.classList.add('is-active');
    document.body.style.overflow = 'hidden';

    // Focus trap: focus close button
    setTimeout(() => {
      if (this.closeBtn) this.closeBtn.focus();
    }, 100);
  }

  close() {
    this.isOpen = false;
    this.overlay.classList.remove('is-active');
    this.modal.classList.remove('is-active');
    document.body.style.overflow = '';
  }

  /* ---- select fabric ---- */
  selectFabric(card) {
    this.fabricGrid.querySelectorAll('.cc-fabric-card').forEach(c => c.classList.remove('is-selected'));
    card.classList.add('is-selected');
    this.selectedFabric = card.dataset.fabric;
    this.selectedColour = null; // reset colour when fabric changes
    this.renderColours(this.selectedFabric);
    this.updateConfirmState();
  }

  /* ---- select colour ---- */
  selectColour(card) {
    this.colourGrid.querySelectorAll('.cc-colour-card').forEach(c => c.classList.remove('is-selected'));
    card.classList.add('is-selected');
    this.selectedColour = card.dataset.colour;
    this.updateConfirmState();
  }

  /* ---- confirm button state ---- */
  updateConfirmState() {
    if (this.confirmBtn) {
      this.confirmBtn.disabled = !(this.selectedFabric && this.selectedColour);
    }
  }

  /* ---- confirm and apply ---- */
  confirm() {
    if (!this.selectedFabric || !this.selectedColour) return;

    // Update main configurator
    if (window.curtainConfigurator) {
      window.curtainConfigurator.setFabricColour(this.selectedFabric, this.selectedColour);
    }

    this.close();
  }

  /* ---- utility ---- */
  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

/* ---- Product Details Accordion ---- */
class ProductAccordion {
  constructor() {
    document.querySelectorAll('.cc-details__trigger').forEach(trigger => {
      trigger.addEventListener('click', () => {
        const expanded = trigger.getAttribute('aria-expanded') === 'true';
        trigger.setAttribute('aria-expanded', !expanded);
        const body = trigger.nextElementSibling;
        if (body) body.classList.toggle('is-open');
      });
    });
  }
}

/* ---- Init ---- */
document.addEventListener('DOMContentLoaded', () => {
  window.fabricSelector = new FabricSelector();
  new ProductAccordion();
});
