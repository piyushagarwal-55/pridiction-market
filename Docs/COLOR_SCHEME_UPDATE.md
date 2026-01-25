# Color Scheme Update - Bet Bazzar

## New Color Palette

### 🎨 Theme: Vibrant Blue/Purple with High Contrast

**Old Theme:** Dark green/gold (Eden Haus style)
**New Theme:** Deep navy blue with bright blue/purple accents

---

## Color Definitions

### Background Colors
```css
--bg-primary: #0f172a        /* Deep navy blue - main background */
--bg-secondary: #1e293b      /* Slate blue - cards/panels */
--bg-tertiary: #334155       /* Medium slate - hover states */
```

### Accent Colors
```css
--accent-primary: #3b82f6    /* Bright blue - primary actions */
--accent-secondary: #8b5cf6  /* Purple - secondary accents */
--accent-tertiary: #06b6d4   /* Cyan - tertiary accents */
```

### Text Colors
```css
--text-primary: #f1f5f9      /* Almost white - main text */
--text-secondary: #cbd5e1    /* Light gray - secondary text */
--text-muted: #94a3b8        /* Medium gray - muted text */
```

### Border Colors
```css
--border-primary: #3b82f6    /* Blue border */
--border-secondary: #8b5cf6  /* Purple border */
```

### Status Colors
```css
--success: #10b981           /* Green - success states */
--error: #ef4444             /* Red - error states */
--warning: #f59e0b           /* Amber - warning states */
```

---

## Color Mapping (Old → New)

| Element | Old Color | New Color | Usage |
|---------|-----------|-----------|-------|
| **Background** | `#1F3D2B` (dark green) | `#0f172a` (navy) | Main background |
| **Cards/Panels** | `rgba(10,14,12,0.55)` | `rgba(30,41,59,0.70)` | Glass panels |
| **Primary Accent** | `#C2A14D` (gold) | `#3b82f6` (blue) | Buttons, borders |
| **Secondary Accent** | `#B08D57` (brass) | `#8b5cf6` (purple) | Secondary elements |
| **Primary Text** | `#F3EBDD` (cream) | `#f1f5f9` (white) | Headings, important text |
| **Secondary Text** | `#D8CFC0` (beige) | `#cbd5e1` (light gray) | Body text |
| **Muted Text** | `#D8CFC0/60` | `#94a3b8` | Subtle text |
| **Success** | `#C2A14D` (gold) | `#10b981` (green) | Success toasts |
| **Error** | `#C2A14D` (gold) | `#ef4444` (red) | Error toasts |

---

## Files Updated

### ✅ Core Files
- [x] `apps/frontend/app/globals.css` - New CSS variables
- [x] `apps/frontend/app/page.tsx` - Landing page colors
- [x] `apps/frontend/app/components/ui/sonner.tsx` - Toast notifications

### 🔄 Remaining Files (Need Update)
- [ ] `apps/frontend/app/prediction/[id]/page.tsx`
- [ ] `apps/frontend/app/prediction/page.tsx`
- [ ] `apps/frontend/app/sports/page.tsx`
- [ ] `apps/frontend/app/esports/page.tsx`
- [ ] `apps/frontend/app/casino/page.tsx`
- [ ] `apps/frontend/app/terms/page.tsx`
- [ ] `apps/frontend/app/responsible-gaming/page.tsx`
- [ ] `apps/frontend/app/contact/page.tsx`

---

## Quick Reference: Common Replacements

### Background Gradients
```tsx
// OLD
bg-[linear-gradient(135deg,rgba(10,14,12,0.55),rgba(10,14,12,0.22))]

// NEW
bg-[linear-gradient(135deg,rgba(30,41,59,0.70),rgba(15,23,42,0.40))]
```

### Borders
```tsx
// OLD
border-[#B08D57]/45

// NEW
border-[#3b82f6]/60
```

### Text Colors
```tsx
// OLD
text-[#F3EBDD]

// NEW
text-[#f1f5f9]
```

### Accent Colors
```tsx
// OLD
bg-[#C2A14D]

// NEW
bg-[#3b82f6]
```

---

## Visual Improvements

### ✅ Better Contrast
- White text (#f1f5f9) on dark navy (#0f172a) = **WCAG AAA compliant**
- Old cream (#F3EBDD) on green (#1F3D2B) = **WCAG AA compliant**

### ✅ More Vibrant
- Bright blue (#3b82f6) pops more than muted gold (#C2A14D)
- Purple accents (#8b5cf6) add depth
- Cyan highlights (#06b6d4) for special elements

### ✅ Modern Look
- Blue/purple = tech/blockchain aesthetic
- Navy background = professional
- High contrast = better readability

---

## Next Steps

1. **Test Landing Page** - Verify all text is visible
2. **Update Remaining Pages** - Apply new colors to all pages
3. **Update Components** - Buttons, cards, modals
4. **Test Accessibility** - Ensure WCAG compliance
5. **Get User Feedback** - Validate new design

---

## Rollback Plan

If you want to revert to old colors:

```bash
# Restore old colors from git
git checkout HEAD -- apps/frontend/app/globals.css
git checkout HEAD -- apps/frontend/app/page.tsx
git checkout HEAD -- apps/frontend/app/components/ui/sonner.tsx
```

---

## Preview

**Landing Page:**
- Background: Deep navy blue gradient
- Card: Slate blue with blue/purple borders
- Text: Bright white with excellent contrast
- Accents: Bright blue buttons with purple glow
- Knock indicators: Blue glow effect

**Overall Feel:**
- Modern, tech-forward
- High contrast, easy to read
- Vibrant without being overwhelming
- Professional blockchain aesthetic
