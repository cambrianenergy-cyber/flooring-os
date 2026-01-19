# Color System Codemod Plan

## Current Status ✅

- **CSS Variables**: Defined in `src/app/globals.css`
- **Tailwind Config**: Updated with semantic colors in `tailwind.config.ts`
- **Universal Inheritance**: `color: inherit` applied globally
- **Text Visibility**: All text now inherits from body color

---

## Files with Hardcoded Colors (Quick Fixes)

### 1. **src/app/login/page.tsx** - Login Form

Replace with semantic classes:

```tsx
/* Old (hardcoded) */
<form className="bg-[#131c2d] text-[#e8edf7]">

/* New (semantic) */
<form className="bg-dark-panel text-foreground">
```

**Changes needed:**
- `bg-[#131c2d]` → `bg-dark-panel`
- `bg-[#0f1624]` → `bg-dark-surface`
- `text-[#e8edf7]` → `text-foreground`
- `text-[#9fb2c9]` → `text-muted`
- `text-[#59f2c2]` → `text-accent`
- `border-[#1b2435]` → `border-dark-muted`

---

### 2. **src/app/signup/page.tsx** - Signup Form

Same as login - apply semantic color replacements.

---

### 3. **src/app/products/page.tsx** - Products Page

```tsx
/* Replace */
bg-[#131c2d]              → bg-dark-panel
bg-[#0f1624]              → bg-dark-surface
bg-[#1b2435]              → bg-dark-muted
text-[#e8edf7]            → text-foreground
text-[#9fb2c9]            → text-muted
text-[#7985a8]            → text-muted
bg-[#59f2c2]              → bg-accent
text-[#0c111a]            → text-background
border-[#252f42]          → border-dark-border
```

---

### 4. **src/app/app/team/page.tsx** - Team Directory

Same pattern as above.

---

### 5. **src/app/app/[workspaceId]/jobs/** - Job Pages

```tsx
bg-[#1b2435]              → bg-dark-panel
text-[#e8edf7]            → text-foreground
text-[#9fb2c9]            → text-muted
text-[#59f2c2]            → text-accent
border-[#1b2435]          → border-dark-muted
bg-[#252f42]              → bg-dark-muted
text-[#ff9b76]            → text-danger
text-[#7985a8]            → text-muted
```

---

## Automated Find & Replace

In VS Code, use **Find & Replace** (Ctrl+H):

### Pattern 1: Backgrounds
```
Find:    bg-\[(#[0-9a-f]{6}|#[0-9a-f]{3})\]
Replace: (See mapping below)
```

**Mapping:**
- `#131c2d` → `dark-panel`
- `#0f1624` → `dark-surface`
- `#1b2435` → `dark-muted`
- `#0c111a` → `dark-bg`
- `#59f2c2` → `accent`
- `#ff9b76` → `danger`
- `#76a1ff` → `accent` (light blue variant)

### Pattern 2: Text Colors
```
Find:    text-\[(#[0-9a-f]{6})\]
Replace: (See mapping below)
```

**Mapping:**
- `#e8edf7` → `foreground`
- `#9fb2c9` → `muted`
- `#7985a8` → `muted`
- `#59f2c2` → `accent`
- `#0c111a` → `background`
- `#ff9b76` → `danger`

### Pattern 3: Border Colors
```
Find:    border-\[(#[0-9a-f]{6})\]
Replace: (See mapping below)
```

**Mapping:**
- `#1b2435` → `dark-muted`
- `#252f42` → `dark-muted`

---

## Manual Review Checklist

After automated replacements, check:

- [ ] All form inputs have `bg-dark-surface text-foreground`
- [ ] All buttons use `bg-accent text-background` or semantic variant
- [ ] All panels/cards use `bg-dark-panel border border-border`
- [ ] Error messages use `text-danger`
- [ ] Muted/secondary text uses `text-muted`
- [ ] All links/anchors use `text-accent`
- [ ] No remaining hardcoded `text-gray-*` or `text-black`
- [ ] No remaining hardcoded `bg-white` or `bg-gray-*`

---

## Testing

After updating:

1. **Visual Test**: Navigate each page
2. **Dark Mode Test**: (When added) Toggle theme
3. **Contrast Test**: Use browser dev tools → Accessibility tab
4. **Mobile Test**: Check responsive at 375px, 768px, 1024px

---

## Files Reference

| File | Type | Priority |
|------|------|----------|
| `src/app/login/page.tsx` | Form | High |
| `src/app/signup/page.tsx` | Form | High |
| `src/app/products/page.tsx` | Page | Medium |
| `src/app/app/team/page.tsx` | Page | Medium |
| `src/app/app/[workspaceId]/jobs/page.tsx` | Page | Medium |
| `src/app/app/[workspaceId]/jobs/[jobId]/page.tsx` | Page | Medium |
| `src/app/app/[workspaceId]/dashboard/page.tsx` | Page | Low |
| `src/app/app/leads/[id]/page.tsx` | Page | Low |
| `src/app/app/workflow-runs/page.tsx` | Page | Low |
| `src/app/app/workflow-runs/error.tsx` | Error | Low |

---

## Summary

**Before**: 500+ hardcoded color values scattered across 15+ files  
**After**: All colors inherit from 4-5 semantic variables

**Result**: 
- ✅ Maintenance = 1 CSS file instead of 15 JSX files
- ✅ Theme switching = Change 5 variables instead of 500 values
- ✅ Consistency = No more "which blue?" questions
- ✅ Scaling = Add new colors once to globals.css
