# @aits/bridge-shoelace

Shoelace Web Components bridge for AITS Framework.

## Installation

```bash
pnpm add @aits/bridge-shoelace @shoelace-style/shoelace
```

## Quick Start

```typescript
import { registerBridge } from '@aits/core';
import shoelace from '@aits/bridge-shoelace';

// Register the bridge
registerBridge(shoelace);
```

## Usage

### In HTML

```html
<!-- Button -->
<button is="sl-button" variant="primary" size="large">Click Me</button>

<!-- Input -->
<input is="sl-input" type="email" label="Email" placeholder="Enter email" required>

<!-- Dialog -->
<div is="sl-dialog" label="Confirm Action">
  Are you sure?
  <button slot="footer" is="sl-button" variant="primary">Yes</button>
</div>

<!-- Alert -->
<div is="sl-alert" variant="success" closable>
  Operation completed successfully!
</div>

<!-- Select -->
<select is="sl-select" label="Choose Option" clearable multiple>
  <option value="option1">Option 1</option>
  <option value="option2">Option 2</option>
  <option value="option3">Option 3</option>
</select>

<!-- Card -->
<div is="sl-card">
  <img slot="image" src="https://via.placeholder.com/300" alt="Card image">
  <strong slot="header">Card Title</strong>
  <p>Card content goes here</p>
  <div slot="footer">
    <button is="sl-button" variant="primary">Action</button>
  </div>
</div>
```

### Helper Functions

```typescript
import { toast, confirm, createDialog, createDrawer } from '@aits/bridge-shoelace';

// Show toast notification
await toast('Hello World!', 'success', 3000);

// Confirmation dialog
const confirmed = await confirm('Delete this item?', 'Confirm Delete');
if (confirmed) {
  // Perform deletion
  console.log('Item deleted');
}

// Custom dialog
const dialog = await createDialog({
  label: 'Settings',
  content: '<p>Configure your preferences</p>',
  footer: '<sl-button variant="primary">Save</sl-button>'
});
dialog.show();

// Drawer (sidebar)
const drawer = await createDrawer({
  label: 'Menu',
  content: '<nav>...</nav>',
  placement: 'start' // 'start', 'end', 'top', 'bottom'
});
drawer.show();
```

## Supported Components

### Forms & Inputs
- `sl-button` - Button with various styles
- `sl-button-group` - Group buttons together
- `sl-icon-button` - Icon-only button
- `sl-input` - Text input field
- `sl-textarea` - Multi-line text input
- `sl-select` - Dropdown selection
- `sl-checkbox` - Checkbox input
- `sl-radio` - Radio button
- `sl-radio-group` - Group radio buttons
- `sl-radio-button` - Button-style radio
- `sl-switch` - Toggle switch
- `sl-range` - Slider input
- `sl-rating` - Star rating
- `sl-color-picker` - Color selection

### Feedback & Status
- `sl-alert` - Alert messages
- `sl-spinner` - Loading spinner
- `sl-progress-bar` - Progress indicator
- `sl-progress-ring` - Circular progress
- `sl-skeleton` - Loading placeholder
- `sl-badge` - Status badges
- `sl-tag` - Tags/chips

### Overlays & Modals
- `sl-dialog` - Modal dialog
- `sl-drawer` - Slide-out drawer
- `sl-dropdown` - Dropdown menu
- `sl-tooltip` - Hover tooltips
- `sl-popup` - Positioned popup

### Layout & Navigation
- `sl-card` - Content card
- `sl-details` - Collapsible details
- `sl-tab-group` - Tabbed interface
- `sl-tab` - Tab item
- `sl-tab-panel` - Tab content
- `sl-tree` - Tree view
- `sl-tree-item` - Tree node
- `sl-breadcrumb` - Breadcrumb navigation
- `sl-breadcrumb-item` - Breadcrumb link
- `sl-divider` - Visual separator
- `sl-split-panel` - Resizable split view

### Data Display
- `sl-avatar` - User avatar
- `sl-icon` - Icon display
- `sl-image-comparer` - Before/after comparison
- `sl-qr-code` - QR code generator

### Utilities
- `sl-animation` - Animation wrapper
- `sl-format-bytes` - Format byte values
- `sl-format-date` - Format dates
- `sl-format-number` - Format numbers
- `sl-relative-time` - Relative time display
- `sl-include` - Include external content
- `sl-mutation-observer` - DOM change observer
- `sl-resize-observer` - Size change observer
- `sl-visually-hidden` - Screen reader only

## Theme Customization

### Set Theme Mode

```typescript
import { setTheme } from '@aits/bridge-shoelace';

// Set to dark theme
setTheme('dark');

// Set to light theme
setTheme('light');

// Follow system preference
setTheme('auto');
```

### Custom CSS Variables

```css
:root {
  /* Primary color */
  --sl-color-primary-600: #3b82f6;
  
  /* Border radius */
  --sl-border-radius-small: 0.25rem;
  --sl-border-radius-medium: 0.375rem;
  --sl-border-radius-large: 0.5rem;
  
  /* Spacing */
  --sl-spacing-small: 0.5rem;
  --sl-spacing-medium: 1rem;
  --sl-spacing-large: 1.5rem;
  
  /* Font */
  --sl-font-sans: -apple-system, BlinkMacSystemFont, sans-serif;
}
```

## Advanced Configuration

### Manual Initialization

```typescript
import { initShoelace } from '@aits/bridge-shoelace';

// Initialize with options
await initShoelace({
  theme: 'dark',
  basePath: 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.15.0/cdn/',
  autoRegister: true
});
```

### Direct Preset Usage

```typescript
import { registerBridge, createBridgeContext } from '@aits/core';
import shoelacePreset from '@aits/bridge-shoelace';

// Manual setup
await shoelacePreset.setup?.('client');

// Manual transform
const element = document.querySelector('[is="sl-button"]');
if (element && shoelacePreset.match(element)) {
  const context = createBridgeContext(element);
  shoelacePreset.transform(element, context);
}
```

## Event Handling

Shoelace components emit custom events prefixed with `sl-`:

```javascript
// Native events still work
button.addEventListener('click', (e) => {
  console.log('Button clicked');
});

// Shoelace custom events
input.addEventListener('sl-change', (e) => {
  console.log('Input changed:', e.detail);
});

input.addEventListener('sl-input', (e) => {
  console.log('Input typing:', e.detail);
});

dialog