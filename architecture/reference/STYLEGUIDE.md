# Aitlas Style Guide

> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---

## Design Philosophy

**Aitlas** = Professional, minimalistic, crystalline.

### Core Principles

| Principle | Description |
|-----------|-------------|
| **Minimal** | Less is more. Every element must justify its existence |
| **Crystalline** | Glass-like, transparent, clean edges |
| **Professional** | Trustworthy, enterprise-grade |
| **Rounded** | Soft, approachable, modern |

---

## Color Palette

### Black & White Foundation

```
┌─────────────────────────────────────────────┐
│  PRIMARY COLORS                            │
├─────────────────────────────────────────────┤
│                                             │
│  Background    #000000  →  #0A0A0A         │
│  Surface       #111111  →  #1A1A1A         │
│  Surface-Alt   #1E1E1E  →  #252525         │
│  Border        #333333  →  #3A3A3A         │
│  Text-Muted    #888888  →  #A0A0A0         │
│  Text          #FFFFFF  →  #F5F5F5         │
│  Accent        #FFFFFF  →  #E0E0E0         │
│                                             │
└─────────────────────────────────────────────┘
```

### Semantic Colors

| Purpose | Light Mode | Dark Mode |
|---------|------------|-----------|
| Success | #22C55E | #4ADE80 |
| Warning | #F59E0B | #FBBF24 |
| Error | #EF4444 | #F87171 |
| Info | #3B82F6 | #60A5FA |

---

## Typography

### Font Family

```
Primary:     "Inter" (system fallback: -apple-system, sans-serif)
Monospace:   "JetBrains Mono" (code)
Display:     "Syne" (headings, hero)
```

### Scale

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| H1 | 48px | 700 | 1.1 |
| H2 | 36px | 600 | 1.2 |
| H3 | 24px | 600 | 1.3 |
| Body | 16px | 400 | 1.6 |
| Small | 14px | 400 | 1.5 |
| Code | 14px | 400 | 1.5 |

---

## Crystalline Glassmorphism

### The Core Effect

```css
/* Crystalline surface */
.glass {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
}

/* Elevated glass */
.glass-elevated {
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}
```

### Glass Layers

```
┌─────────────────────────────────────────┐
│  Layer 0: Background (#000000)          │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ Layer 1: Subtle glass (3% white)  │  │
│  │ blur: 12px, radius: 12px           │  │
│  │                                   │  │
│  │ ┌───────────────────────────────┐  │  │
│  │ │ Layer 2: Elevated (6% white)│  │  │
│  │ │ blur: 20px, radius: 16px     │  │  │
│  │ │                             │  │  │
│  │ │ ┌─────────────────────────┐ │  │  │
│  │ │ │ Layer 3: Interactive   │ │  │  │
│  │ │ │ blur: 24px, radius   │ │  │  │
│  │ │ │ = 20px, border: 12%  │ │  │  │
│  │ │ └─────────────────────────┘ │  │  │
│  │ └───────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## Border Radius

### Rounded Philosophy

All corners should feel soft and approachable.

| Element | Radius |
|---------|--------|
| Buttons | 12px |
| Cards | 16px |
| Inputs | 10px |
| Modals | 24px |
| Avatars | 50% (circle) |
| Tags/Badges | 8px |

### Radius Scale

```
┌────────────────────────────────────────────┐
│                                            │
│  4px   →  Tags, small elements            │
│  8px   →  Inputs, pills                    │
│  12px  →  Buttons, small cards              │
│  16px  →  Cards, panels                    │
│  20px  →  Elevated cards                  │
│  24px  →  Modals, dialogs                  │
│  50%   →  Avatars, circles                 │
│                                            │
└────────────────────────────────────────────┘
```

---

## Spacing System

### Base Unit: 4px

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Tight spacing |
| `--space-2` | 8px | Inline elements |
| `--space-3` | 12px | Component internal |
| `--space-4` | 16px | Standard padding |
| `--space-5` | 20px | Section spacing |
| `--space-6` | 24px | Large gaps |
| `--space-8` | 32px | Section margins |
| `--space-10` | 40px | Hero spacing |
| `--space-12` | 48px | Major sections |
| `--space-16` | 64px | Page margins |

---

## Shadows

### Crystalline Shadows

```css
/* Subtle depth */
.shadow-sm {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* Card depth */
.shadow-md {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

/* Elevated */
.shadow-lg {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

/* Modal/Overlay */
.shadow-xl {
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6);
}
```

---

## Components

### Button Variants

```css
/* Primary - Glass */
.btn-primary {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 12px 24px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
}
```

### Input Fields

```css
.input {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 12px 16px;
  color: #F5F5F5;
}

.input:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
}
```

### Cards

```css
.card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 24px;
}
```

---

## Animations

### Subtle Transitions

```css
/* Smooth, professional animations */
* {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Hover lift */
.hover-lift:hover {
  transform: translateY(-2px);
}

/* Glass shimmer on hover */
.glass:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.12);
}
```

### Loading States

```
┌─────────────────────────────────────────┐
│  Skeleton shimmer (subtle)              │
│  background: linear-gradient(           │
│    90deg,                              │
│    transparent 0%,                      │
│    rgba(255,255,255,0.04) 50%,         │
│    transparent 100%                     │
│  );                                     │
└─────────────────────────────────────────┘
```

---

## Layout Principles

### Max Widths

| Context | Max Width |
|---------|-----------|
| Content | 1200px |
| Card Grid | 1400px |
| Modal | 560px |
| Input | 400px |

### Grid System

```
┌──────────────────────────────────────────┐
│  Mobile:  1 column                      │
│  Tablet:  2 columns (gap: 16px)         │
│  Desktop: 3-4 columns (gap: 24px)       │
│                                          │
│  Container padding: 16px mobile          │
│                    24px tablet          │
│                    32px desktop         │
└──────────────────────────────────────────┘
```

---

## Accessibility

### Contrast Requirements

| Element | Contrast Ratio |
|---------|---------------|
| Text on Background | ≥ 7:1 (AAA) |
| Muted Text | ≥ 4.5:1 (AA) |
| Interactive | ≥ 3:1 (AA Large) |

### Focus States

```css
/* Visible focus for accessibility */
:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.5);
  outline-offset: 2px;
}
```

---

## Dark Mode First

Aitlas is **dark mode by default**.

```css
/* Default = dark */
:root {
  --bg-primary: #000000;
  --bg-surface: #111111;
  --text-primary: #FFFFFF;
  --text-muted: #888888;
  --border: rgba(255, 255, 255, 0.08);
}

/* Light mode = optional override */
@media (prefers-color-scheme: light) {
  :root {
    --bg-primary: #FAFAFA;
    --bg-surface: #FFFFFF;
    --text-primary: #0A0A0A;
    --text-muted: #666666;
    --border: rgba(0, 0, 0, 0.08);
  }
}
```

---

## Iconography

### Style

| Property | Value |
|----------|-------|
| Stroke | 1.5px |
| Rounded caps | ✓ |
| Rounded joins | ✓ |
| Color | Current text color |

### Icon Set

Use **Lucide** or **Heroicons** (outline variant)

---

## Logo Usage

### Clear Space

```
┌─────────────────────────────┐
│                             │
│   ← 1x → │ Logo │ ← 1x →  │
│                             │
│   (1x = height of logo)    │
└─────────────────────────────┘
```

### Size Variants

| Usage | Height |
|-------|--------|
| Navbar | 32px |
| Footer | 24px |
| Favicon | 32px |
| Print | 48px |

---

## Implementation Checklist

- [ ] Black background (#000000)
- [ ] Glass morphism on cards/panels
- [ ] Rounded corners (12-20px)
- [ ] Subtle borders (rgba white)
- [ ] Inter font family
- [ ] Proper spacing (4px grid)
- [ ] Smooth transitions (0.2s)
- [ ] Dark mode default
- [ ] Focus states visible
- [ ] Max widths respected

---

## Related

- [UI Components](./components/)
- [Tailwind Config](./tailwind.config.js)
- [shadcn/ui Theme](./theme.config.tsx)
