# Custom Product Detail Page (PDP) — Curtain Configurator

This repository contains the code for a custom Shopify Product Detail Page implementation. The project focus is a curtain configurator that updates pricing dynamically using metafield data and hidden variant logic.

## Live Demo
- **URL:** [View Live Demo](https://rostam-of3d6yz1.myshopify.com/products/london-blind-linen-powder?preview_theme_id=144512057462)
- **Password:** `ropstam`

---

## Project Overview
The objective was to develop a PDP where the pricing is determined by a combination of a user-selected Width (mapped to a panel count) and a user-selected Drop. The "Fabric Panels" variant option is handled in the background and is not exposed to the user as a selectable dropdown.

## Technical Implementation

### Variant and Pricing Logic
The Shopify product is configured with two options:
1. Option 1: Fabric Panels (1, 2, 3, 4, 5)
2. Option 2: Drop (e.g., 120, 150, 180, 210, 240, 270, 300, 330)

When a user interacts with the configurator:
- The selected Width is compared against a JSON mapping (`width_panel_mapping`) to determine the required number of Fabric Panels.
- The JavaScript logic then resolves the specific Variant ID matching both the calculated Fabric Panels and the user-selected Drop.
- The price is then updated on the Add to Cart button using the resolved variant's price data.

### Key Implementation Logic
- **Variant Resolution Algorithm:** Instead of iterating through the DOM, the `CurtainConfigurator` class builds a local map of variant objects from the `product.variants` JSON. This allows for fast lookup when matching Option1 (Panels) and Option2 (Drop) to find the correct Variant ID.
- **Custom UI Component System:** The standard HTML `<select>` elements are wrapped in a custom UI layer. This allows for full CSS control over the dropdown appearance while maintaining the native accessibility and mobile behavior of the original select inputs.
- **State Synchronization:** The fabric selection modal uses a centralized state. When a user selects a fabric or color in the popup, the values are instantly synchronized back to the main configurator form and hidden inputs via JavaScript event listeners.
- **JSON-Driven Data Handling:** To avoid heavy Liquid processing in the browser, all complex data structures (width mappings and fabric colors) are injected into the page as JSON objects. This ensures that all pricing calculations and UI updates happen locally in JavaScript for a faster user experience.

### Captured Line Item Properties
When a product is added to the cart, the following custom properties are captured to ensure all configuration details are available in the Shopify Order:
- **Fabric:** The selected fabric name.
- **Colour:** The selected colour name.
- **Width:** The custom width selected by the user.
- **Drop:** The selected drop length.
- **Chain Side:** Selection for the hanging side of the chain.
- **Chain Colour:** Selected finish for the chain.
- **Installation Height:** The mounting height for the product.
- **Power / Fitting:** Optional add-on properties if selected by the user.

---

## Files Included in Submission

### Liquid Snippets and Sections
- `sections/main-product-curtain.liquid`: Main section for the curtain product page.
- `snippets/curtain-configurator.liquid`: Configurator UI components and form logic.
- `snippets/fabric-selector-modal.liquid`: Selection modal for fabrics and colours.
- `snippets/product-gallery-curtain.liquid`: Custom gallery implementation.

### Assets
- `assets/curtain-configurator.css`: Structural and interactive styling.
- `assets/curtain-configurator.js`: Core logic for variant resolution and price updates.
- `assets/fabric-selector.js`: Logic for managing the fabric selection modal and state.

---

## Data Schema

### Product Metafields
| Namespace & Key | Type | Purpose |
| :--- | :--- | :--- |
| `custom.width_panel_mapping` | JSON | Maps Width values to Panel counts for variant resolution. |
| `custom.fabric_colours` | List (Metaobject) | List of fabric metaobject references. |
| `custom.chain_side_options` | List (Text) | Configures selectable options for Chain Side. |
| `custom.chain_colour_options` | List (Text) | Configures selectable options for Chain Colour. |
| `custom.installation_height_options` | List (Text) | Configures selectable options for Installation Height. |

---

## Configuration and Setup
1. Define the metafields listed above in the Shopify Admin.
2. Create Fabric metaobjects and link them to the product via the `custom.fabric_colours` metafield.
3. Ensure variants are created with Option 1 as Fabric Panels and Option 2 as Drop.
4. Assign the `product.curtain` template to the relevant products.