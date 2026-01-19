# Quick Start: Using Page Background Colors

## TL;DR - Just Copy These Classes

When building new components, use one of these three classes:

```tsx
// For main page backgrounds
className="bg-page-bg"

// For cards, surfaces, popups
className="bg-page-surface"

// For panels, containers, modals
className="bg-page-panel"
```

---

## The Three Background Colors

```
📱 bg-page-bg      = #0c111a  (darkest - use for main page)
📱 bg-page-surface = #0f1624  (medium  - use for cards)
📱 bg-page-panel   = #131c2d  (dark    - use for containers)
```

---

## Copy-Paste Examples

### Example 1: Page Container
```tsx
<div className="bg-page-bg min-h-screen p-6">
  {/* Your page content */}
</div>
```

### Example 2: Card/Panel
```tsx
<div className="bg-page-surface rounded-lg p-4 shadow">
  <h3 className="text-foreground font-semibold">Title</h3>
  <p className="text-muted">Description</p>
</div>
```

### Example 3: Modal/Popup
```tsx
<div className="fixed inset-0 bg-black/50 flex items-center justify-center">
  <div className="bg-page-panel rounded-lg p-6 w-full max-w-md">
    <h2 className="text-foreground text-lg font-bold">Modal Title</h2>
    <p className="text-muted mt-2">Modal content here</p>
  </div>
</div>
```

### Example 4: Form Input Area
```tsx
<div className="space-y-4">
  <input 
    className="w-full bg-dark-surface text-foreground border border-dark-muted rounded px-3 py-2"
    placeholder="Enter text..."
  />
  <button className="bg-accent text-background px-4 py-2 rounded font-semibold">
    Submit
  </button>
</div>
```

### Example 5: Multi-Section Layout
```tsx
<div className="bg-page-bg min-h-screen p-6">
  <header className="bg-page-surface rounded-lg p-4 mb-6">
    <h1 className="text-foreground text-2xl font-bold">Page Title</h1>
  </header>
  
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div className="bg-page-surface rounded-lg p-4">
      <h3 className="text-foreground font-semibold mb-2">Section 1</h3>
      <p className="text-muted">Content...</p>
    </div>
    <div className="bg-page-surface rounded-lg p-4">
      <h3 className="text-foreground font-semibold mb-2">Section 2</h3>
      <p className="text-muted">Content...</p>
    </div>
    <div className="bg-page-surface rounded-lg p-4">
      <h3 className="text-foreground font-semibold mb-2">Section 3</h3>
      <p className="text-muted">Content...</p>
    </div>
  </div>
</div>
```

---

## Complementary Colors To Use Together

### Text Colors (Always Pair With Backgrounds)
```tsx
<div className="bg-page-surface">
  <p className="text-foreground">Primary text (bright)</p>
  <p className="text-muted">Secondary text (dimmed)</p>
  <p className="text-accent">Action/highlight text (green)</p>
  <p className="text-danger">Error text (red)</p>
</div>
```

### Border Colors (For Outlines)
```tsx
<div className="border border-dark-border rounded">
  {/* subtle border */}
</div>

<div className="border border-dark-muted rounded">
  {/* more visible border */}
</div>
```

### Interactive States
```tsx
{/* Link/button */}
<button className="text-accent hover:brightness-125">
  Click me
</button>

{/* Form field */}
<input className="border border-dark-muted focus:border-accent" />

{/* Disabled state */}
<button disabled className="opacity-50 cursor-not-allowed">
  Disabled
</button>
```

---

## Color Combinations That Work Well

### Light Content On Dark Background
```tsx
<div className="bg-page-bg">
  <p className="text-foreground">✓ Good - high contrast</p>
  <p className="text-accent">✓ Good - accent color pops</p>
  <p className="text-muted">✓ Good - secondary text</p>
</div>
```

### Card Layout
```tsx
<div className="bg-page-bg p-6">
  <div className="bg-page-surface rounded-lg p-4">
    <h3 className="text-foreground font-bold">Card Title</h3>
    <p className="text-muted text-sm">Card description</p>
    <button className="bg-accent text-background mt-4 px-3 py-2 rounded">
      Action
    </button>
  </div>
</div>
```

### Info Panel
```tsx
<div className="bg-page-panel border border-dark-muted rounded-lg p-4">
  <p className="text-foreground font-semibold">ℹ Info</p>
  <p className="text-muted text-sm mt-1">Information text here</p>
</div>
```

---

## What NOT To Do

### ❌ Don't Use Hardcoded Colors
```tsx
// BAD - hardcoded hex
<div className="bg-[#0f1624] text-[#e8edf7]">
  Content
</div>

// BAD - hardcoded Tailwind colors
<div className="bg-white text-blue-700">
  Content
</div>

// BAD - inline styles
<div style={{ backgroundColor: "#0f1624" }}>
  Content
</div>
```

### ✅ Do Use Semantic Classes
```tsx
// GOOD - semantic classes
<div className="bg-page-surface text-foreground">
  Content
</div>
```

---

## Changing Colors Globally

If you ever need to change all background colors (e.g., for a client theme):

**Edit `src/app/globals.css` - just 3 lines:**

```css
:root {
  --page-bg: #000000;        /* Change this */
  --page-surface: #111111;   /* Change this */
  --page-panel: #222222;     /* Change this */
  
  /* Everything else stays the same */
}
```

Done! All 200+ components automatically update.

---

## Real-World Component Template

Use this as a starting point for new components:

```tsx
import React from "react";

interface MyComponentProps {
  title: string;
  description: string;
  items: string[];
}

export function MyComponent({ title, description, items }: MyComponentProps) {
  return (
    <div className="bg-page-surface rounded-lg border border-dark-muted p-4">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-foreground text-lg font-semibold">{title}</h3>
        <p className="text-muted text-sm mt-1">{description}</p>
      </div>

      {/* Content */}
      <div className="space-y-2 mb-4">
        {items.map((item) => (
          <div
            key={item}
            className="p-2 bg-page-bg rounded text-foreground text-sm"
          >
            {item}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button className="bg-accent text-background px-3 py-2 rounded text-sm font-semibold">
          Primary Action
        </button>
        <button className="border border-dark-muted text-foreground px-3 py-2 rounded text-sm">
          Secondary Action
        </button>
      </div>
    </div>
  );
}
```

---

## Frequently Asked Questions

**Q: Which background should I use for a card?**
A: Use `bg-page-surface` for cards, modals, and popups.

**Q: Which background should I use for a page?**
A: Use `bg-page-bg` for the main page container.

**Q: Which background should I use for a panel/section?**
A: Use `bg-page-panel` for panels, containers, and sections.

**Q: Can I mix backgrounds?**
A: Yes! Use lighter backgrounds for main container, then darker/lighter nested backgrounds for visual hierarchy.

**Q: What if I need a different background color?**
A: Edit `src/app/globals.css` and add a new CSS variable, then add it to Tailwind config.

**Q: Do I have to use these classes?**
A: Recommended, but not required. New code should use these classes for consistency.

---

## Summary

✅ **bg-page-bg** - Main page backgrounds  
✅ **bg-page-surface** - Cards, surfaces, popups  
✅ **bg-page-panel** - Panels, containers, modals  
✅ **text-foreground** - Primary text  
✅ **text-muted** - Secondary text  
✅ **text-accent** - Action text  
✅ **border-dark-border** - Default borders  

Use these classes in every new component!

To change all colors: Edit `src/app/globals.css` - 3 lines total.

Done! 🎉
