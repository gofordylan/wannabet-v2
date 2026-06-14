# WannaBet Design Guidelines

Reference this document when adding or modifying UI components.

## Brand Identity

WannaBet uses a **warm, playful aesthetic** with Comic Sans font and earthy tones to create a friendly, casual betting experience.

## Color Palette

### Brand Colors (wb-*)

| Token | Hex | Usage |
|-------|-----|-------|
| `wb-mint` | #72d397 | Active/live status, positive actions |
| `wb-brown` | #774e38 | Primary text, headings |
| `wb-taupe` | #9a7b6b | Secondary text, placeholders |
| `wb-coral` | #e08e79 | Primary buttons, CTAs |
| `wb-cream` | #ede5ce | Light backgrounds (drawers) |
| `wb-sand` | #f0d4ae | Card backgrounds, form inputs |
| `wb-gold` | #fcc900 | Winner status, completed states |
| `wb-yellow` | #fde68b | Pending status |
| `wb-pink` | #ffa3a2 | Cancelled status, errors |
| `wb-lavender` | #c4b5fd | Judging status |

### Status Colors

| Status | Color | Emoji |
|--------|-------|-------|
| PENDING | `wb-yellow` | ⏳ |
| ACTIVE | `wb-mint` | 🤝 |
| JUDGING | `wb-lavender` | ⚖️ |
| RESOLVED | `wb-gold` | 🏆 |
| CANCELLED | `wb-pink` | ❌ |

### Theme Colors

- `--primary`: amber-400 (#fbbf24)
- `--accent`: sky-400 (#38bdf8)

## Typography

- **Font Family**: Comic Sans MS, Comic Sans, cursive
- **Primary Text**: `text-wb-brown`
- **Secondary Text**: `text-wb-taupe`
- **Placeholder Text**: `placeholder:text-wb-taupe`

### Sizes

| Element | Class |
|---------|-------|
| Card title | `font-semibold` |
| Body text | `text-base` |
| Labels | `text-sm font-medium` |
| Badge | `text-xs font-semibold` |
| Button | `text-sm font-medium` |

## Spacing

| Context | Class | Pixels |
|---------|-------|--------|
| Between form fields | `space-y-5` | 20px |
| Label to input | `space-y-2` | 8px |
| Card internal lines | `gap-3` | 12px |
| Button row gaps | `gap-2` | 8px |
| Component groups | `gap-4` | 16px |
| Modal padding | `p-6` | 24px |
| Drawer padding | `p-4` | 16px |

## Components

### Buttons

**Primary (Coral)**
```tsx
className="bg-wb-coral hover:bg-wb-coral/90 text-white"
```

**Sizes**
- Default: `h-9 px-4 py-2`
- Small: `h-8 px-3 text-xs`
- Large: `h-10 px-8`
- Icon: `h-9 w-9`
- FAB: `h-14 w-14 rounded-full shadow-lg`

### Inputs

**Standard Form Input**
```tsx
className="bg-wb-sand text-wb-brown placeholder:text-wb-taupe border-0"
```

**Large Touch Target** (for mobile)
```tsx
className="h-[72px]"
```

### Cards

**Bet Card**
```tsx
className="bg-wb-sand border-0 rounded-xl p-4 cursor-pointer transition-all hover:shadow-md"
```

### Drawers

- Background: `bg-wb-cream`
- Content padding: `px-6 pb-6`
- Max height: `max-h-[80vh]`

## Form Patterns

### Field Group Structure
```tsx
<div className="space-y-2">
  <Label className="text-wb-brown">Label Text</Label>
  <Input className="bg-wb-sand text-wb-brown placeholder:text-wb-taupe" />
</div>
```

### Form Container
```tsx
<div className="space-y-5">
  {/* Field groups */}
</div>
```

### Validation
- Use `useMemo` for `isFormValid` computation
- Disable submit button when invalid: `disabled={!isFormValid || isSubmitting}`

### Submit Flow
1. `phase: 'idle'` - Show form
2. `phase: 'submitting'` - Show `<Loader2 className="animate-spin" />`
3. `phase: 'done'` - Show success with 🎉

## Icons

Use **lucide-react** icons:
- Size: `size-4` or `size-5`
- Common: `Plus`, `Search`, `Loader2`, `Wallet`, `Calendar`, `ChevronLeft`, `ChevronRight`

## Emojis

Strategic emoji usage for visual communication:
- 🎉 Success celebration
- 🏆 Winner/trophy
- ❌ Cancelled/error
- ⏳ Pending
- 🤝 Active/live
- ⚖️ Judging

## Animations

- **Hover**: `transition-colors` or `transition-all`
- **Loading**: `animate-spin` on Loader2
- **Cards**: `hover:shadow-md`
- **Buttons**: `hover:opacity-90` or `/90` variants

## Mobile Considerations

- Touch targets: minimum 44px, prefer 72px for important inputs
- Use drawers (bottom sheet) instead of modals on mobile
- Input font: `text-base` to prevent iOS zoom

## Accessibility

- Always include `disabled` states with `opacity-50 cursor-not-allowed`
- Use semantic HTML (`<button>`, `<label>`, `<input>`)
- Include focus rings: `focus-visible:ring-1`
- Proper color contrast (wb-brown on wb-sand backgrounds)

## Component Files Reference

- UI Primitives: `src/components/ui/`
- Feature Components: `src/components/`
- Styles: `src/app/globals.css`
