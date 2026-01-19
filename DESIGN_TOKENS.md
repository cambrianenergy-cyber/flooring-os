# Design Token System

## ✅ Semantic Colors (CSS Variables)

Your app now has a **unified color system** with semantic variables that map to actual colors.

### Core Semantic Colors

| Variable | Tailwind Class | Use Case |
|----------|---|---|
| `--background` / `--bg` | `bg-background` / `bg-dark-bg` | Main background |
| `--foreground` / `--ink-strong` | `text-foreground` / `text-ink-strong` | Primary text (strong) |
| `--muted` / `--ink-soft` | `text-muted` / `text-ink-soft` | Secondary text (muted) |
| `--border` | `border-border` / `border-dark-border` | Borders |
| `--accent` | `bg-accent` / `text-accent` | Primary CTA (teal #59f2c2) |
| `--success` | `text-success` / `bg-success` | Success states (green) |
| `--danger` | `text-danger` / `bg-danger` | Errors & dangers (red) |
| `--warning` | `text-warning` / `bg-warning` | Warnings (orange) |

---

## 📋 Usage Examples

### ✅ DO: Use Semantic Classes

```tsx
/* Text - readable on any background */
<p className="text-foreground">This text is always readable</p>
<p className="text-muted">Secondary text - muted shade</p>

/* Backgrounds */
<div className="bg-background">Main container</div>
<div className="bg-dark-panel">Card or panel</div>

/* Buttons */
<button className="bg-accent text-background font-semibold px-4 py-2">
  Primary Action
</button>

/* Forms */
<input 
  className="bg-dark-surface text-foreground border border-border rounded px-3 py-2 placeholder:text-muted"
  placeholder="Enter text..."
/>

/* Status indicators */
<span className="text-success">✓ Active</span>
<span className="text-danger">✗ Error</span>
<span className="text-warning">⚠ Warning</span>
```

### ❌ DON'T: Use Hardcoded Colors

```tsx
/* ❌ AVOID - breaks in dark/light mode */
<p className="text-black">Text</p>                    /* invisible on dark bg */
<p className="text-gray-500">Secondary</p>            /* wrong shade */
<button className="bg-blue-600">Click</button>        /* not your brand color */

/* ❌ AVOID - hardcoded hex */
<div className="bg-[#ffffff]">Container</div>
<span className="text-[#333333]">Text</span>
```

---

## 🎨 Common Patterns

### Card Component
```tsx
<div className="bg-dark-panel border border-border rounded-md p-4">
  <h3 className="text-foreground font-semibold">Title</h3>
  <p className="text-muted text-sm">Description</p>
</div>
```

### Input/Form Field
```tsx
<div>
  <label className="text-foreground text-sm font-medium">Label</label>
  <input
    className="w-full bg-dark-surface text-foreground border border-border rounded px-3 py-2 placeholder:text-muted focus:outline-none focus:border-accent"
    placeholder="Type here..."
  />
</div>
```

### Button Variants
```tsx
/* Primary */
<button className="bg-accent text-background hover:bg-accent-strong px-4 py-2 rounded font-medium">
  Primary
</button>

/* Secondary */
<button className="bg-dark-panel text-foreground border border-border hover:border-foreground px-4 py-2 rounded">
  Secondary
</button>

/* Danger */
<button className="bg-danger text-background hover:opacity-90 px-4 py-2 rounded font-medium">
  Delete
</button>
```

### Status Messages
```tsx
{/* Success */}
<div className="bg-success/10 border border-success rounded p-4 text-success">
  ✓ Operation successful
</div>

{/* Error */}
<div className="bg-danger/10 border border-danger rounded p-4 text-danger">
  ✗ Something went wrong
</div>

{/* Warning */}
<div className="bg-warning/10 border border-warning rounded p-4 text-warning">
  ⚠ Please check this
</div>
```

---

## 🎯 Migration Guide

When refactoring old hardcoded colors:

### Text Colors
```tsx
/* Old */
text-black, text-gray-900              → text-foreground
text-gray-600, text-gray-700           → text-muted
text-white                              → text-background
text-blue-600, text-blue-700           → text-accent
text-red-600, text-red-700             → text-danger
```

### Background Colors
```tsx
/* Old */
bg-white                               → bg-background / bg-dark-surface
bg-gray-50                             → bg-dark-muted
bg-gray-100                            → bg-dark-panel
bg-blue-600                            → bg-accent
bg-red-600                             → bg-danger
```

### Borders
```tsx
/* Old */
border-gray-200, border-gray-300       → border-border
border-blue-600                        → border-accent
```

---

## 🔧 CSS Variables (src/app/globals.css)

Current theme uses RGB space for flexibility:

```css
:root {
  /* Semantic (RGB tuples for dynamic manipulation) */
  --background: 12 17 26;           /* #0c111a */
  --foreground: 232 237 247;        /* #e8edf7 */
  --muted: 159 178 201;             /* #9fb2c9 */
  --border: rgba(255, 255, 255, 0.06);
  
  /* Brand colors (hex for precision) */
  --accent: #59f2c2;
  --success: #5be49b;
  --danger: #ff6b6b;
  --warning: #f6b556;
  
  /* ... etc ... */
}
```

---

## ✨ Benefits

✅ **Single source of truth** - Change theme in one place  
✅ **Dark mode ready** - Variables adapt to theme  
✅ **Type-safe** - Tailwind autocomplete works  
✅ **Scalable** - Add new semantic colors easily  
✅ **Accessible** - Proper contrast by design  
✅ **Maintainable** - No searching for hardcoded colors  

---

## 🚀 Next Steps

1. **Search & replace hardcoded colors** → Use VS Code Find & Replace
2. **Audit components** → Check buttons, forms, cards match patterns above
3. **Test accessibility** → Verify all text meets WCAG contrast ratios
4. **Add light mode** → Update `:root` with light theme variables when needed
