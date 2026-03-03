# UI Design System

## 1. Design Philosophy

### 1.1 Core Principles
- **Solution-Oriented**: Focus on lifestyle solutions, not just products
- **Clean & Premium**: Inspired by high-end cabinet brands (e.g., Ronbow)
- **Bilingual Support**: Chinese (default) + English with seamless switching

### 1.2 Target Aesthetic
- Minimalist, professional, trustworthy
- High-end residential/commercial feel
- Emphasize quality materials and craftsmanship

---

## 2. Color System

### 2.1 Current Palette (v2.0 - Ronbow-inspired)
```css
:root {
    --primary: #222222;           /* Near black - buttons, headings */
    --primary-dark: #111111;      /* Pure dark */
    --secondary: #888888;         /* Medium gray - accents */
    --accent: #555555;            /* Dark gray */
    --dark-bg: #ffffff;           /* Main backgrounds - white */
    --darker-bg: #f5f5f5;         /* Alternate sections - light gray */
    --light-text: #1a1a1a;        /* Primary text - dark */
    --light-accent: #666666;      /* Secondary text - gray */
}
```

### 2.2 Color Usage Guidelines
| Element | Color | Notes |
|---------|-------|-------|
| Background (main) | `#ffffff` | Clean white |
| Background (alt) | `#f5f5f5` | Light gray for section contrast |
| Headings | `#1a1a1a` | Near black |
| Body text | `#666666` | Medium gray |
| Primary buttons | `#222222` | Dark with white text |
| Borders | `#e0e0e0` | Subtle gray |
| Footer | `#1a1a1a` | Dark with light text |

---

## 3. Typography

### 3.1 Font Family
```css
font-family: 'Roboto', system-ui, -apple-system, sans-serif;
```

### 3.2 Font Weights
- **Light (300)**: Large display headings
- **Regular (400)**: Body text
- **Medium (500)**: Subheadings, labels
- **Bold (700)**: Section titles, CTAs

### 3.3 Font Sizes
| Element | Size | Weight |
|---------|------|--------|
| Hero title | 3rem (48px) | 300 (light) |
| Section title | 2.25rem (36px) | 300 (light) |
| Card title | 1.25rem (20px) | 700 (bold) |
| Body text | 1rem (16px) | 400 (regular) |
| Small text | 0.875rem (14px) | 400 (regular) |

---

## 4. Component Styles

### 4.1 Buttons
- **Primary**: Dark background (`#222222`), white text, rounded corners
- **Secondary**: Outlined, dark border, transparent background
- **Hover**: Slight lift with shadow

### 4.2 Cards
- White background
- Light gray border (`#e0e0e0`)
- Subtle shadow on hover
- Rounded corners (16px)

### 4.3 Form Inputs
- White background
- Gray border (`#e0e0e0`)
- Focus: darker border with subtle ring

### 4.4 Navigation
- Fixed header, white background
- Gray text, hover to dark
- Active language toggle: dark background

---

## 5. Layout Specifications

### 5.1 Design Tool Result Area
- **Width**: `max-w-xl` (36rem / 576px)
- **Aspect ratio**: Maintain uploaded image ratio

### 5.2 Spacing
- Section padding: `py-16` (64px)
- Card padding: `p-8` (32px)
- Grid gaps: `gap-8` (32px)

---

## 6. UI Change History

### v2.0 - 2026-03-03: Ronbow-Inspired Theme
**Major Changes:**
- Shifted from dark theme to light theme (white/black/gray)
- Changed font from system default to **Roboto**
- Updated all CSS variables for light mode
- Redesigned hero tabs (gray borders, dark active state)
- Updated chatbot to light theme
- Footer now uses dark background for contrast

**Reference**: [ronbow.com](https://www.ronbow.com/)

**Git Tag**: `v1.0-ui-baseline` (pre-change baseline)

---

### v1.0 - Initial Dark Theme
**Characteristics:**
- Dark blue-gray background (`#0f172a`)
- Green primary color (`#10b981`)
- Amber secondary (`#f59e0b`)
- White text on dark backgrounds

---

## 7. Baseline Version Management

Before major UI changes:
1. Create git tag: `git tag -a vX.X-ui-baseline -m "Description"`
2. Push tag: `git push origin vX.X-ui-baseline`

**Current Baselines:**
| Tag | Date | Description |
|-----|------|-------------|
| `v1.0-ui-baseline` | 2026-03-03 | Dark theme before Ronbow-style migration |

---

## 8. Future Considerations

- [ ] Custom icon set for consistency
- [ ] Animation/transition guidelines
- [ ] Dark mode toggle (if requested)
- [ ] Accessibility audit (WCAG compliance)
