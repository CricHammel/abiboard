# Design System - AbiBoard

## Design-Philosophie

**Minimalistisch & Funktional**
- Klare visuelle Hierarchie
- Großzügiger Weißraum (Whitespace)
- Fokus auf Inhalt, nicht auf Dekoration
- Touch-freundlich (mindestens 44px Click-Targets)
- Mobile-first Design

---

## Farbschema

### Primärfarben

```css
Primary (Akzent):     #2563eb  /* Blau - für CTAs, Links */
Primary Dark:         #1e40af  /* Hover-States */
Primary Light:        #dbeafe  /* Hintergründe, Badges */

Graustufen:
Text Primary:         #111827  /* Haupttext */
Text Secondary:       #6b7280  /* Sekundärer Text, Labels */
Border:               #e5e7eb  /* Trennlinien, Input-Borders */
Background:           #ffffff  /* Haupthintergrund */
Background Alt:       #f9fafb  /* Alternative Hintergründe */

Feedback-Farben:
Success:              #10b981  /* Grün - Erfolg, Approved */
Error:                #ef4444  /* Rot - Fehler, Rejected */
Warning:              #f59e0b  /* Orange - Warnung */
Info:                 #3b82f6  /* Blau - Information */
```

### Tailwind CSS Mapping

```javascript
colors: {
  primary: {
    DEFAULT: '#2563eb',
    dark: '#1e40af',
    light: '#dbeafe',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    600: '#6b7280',
    900: '#111827',
  },
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
}
```

---

## Typografie

### Font Family
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
```

### Font Sizes & Weights

```
H1:     2rem (32px)    - Font Weight: 700 (Bold)
H2:     1.5rem (24px)  - Font Weight: 600 (Semi-Bold)
H3:     1.25rem (20px) - Font Weight: 600 (Semi-Bold)
Body:   1rem (16px)    - Font Weight: 400 (Normal)
Small:  0.875rem (14px)- Font Weight: 400 (Normal)
Tiny:   0.75rem (12px) - Font Weight: 400 (Normal)
```

### Line Heights
```
Headlines:  1.2
Body:       1.5
Small:      1.4
```

---

## Spacing System

Basiert auf 4px Grid:

```
xs:   4px   (0.25rem)
sm:   8px   (0.5rem)
md:   16px  (1rem)
lg:   24px  (1.5rem)
xl:   32px  (2rem)
2xl:  48px  (3rem)
3xl:  64px  (4rem)
```

---

## Layout-Strukturen

### Auth-Seiten (Login, Register)

```
┌─────────────────────────────────────┐
│                                     │
│           [Logo/Title]              │
│         [Subtitle/Text]             │
│                                     │
│     ┌─────────────────────┐        │
│     │                     │        │
│     │   Card mit          │        │
│     │   Formular          │        │
│     │   (max 400px)       │        │
│     │                     │        │
│     └─────────────────────┘        │
│                                     │
│      [Sekundärer Link]             │
│                                     │
└─────────────────────────────────────┘
```

**Eigenschaften:**
- Zentriert vertikal und horizontal
- Card mit Schatten
- Max-Width: 400px
- Padding: 24px (Mobile: 16px)

### Dashboard-Layout

**Desktop (≥ 1024px):**
```
┌────────┬──────────────────────────┐
│        │                          │
│ Side   │   Header Bar             │
│ bar    ├──────────────────────────┤
│        │                          │
│ Nav    │   Main Content Area      │
│ Items  │                          │
│        │                          │
│        │                          │
└────────┴──────────────────────────┘
```

**Mobile (< 1024px):**
```
┌──────────────────────────────┐
│  [☰] Title        [Avatar]   │ ← Header mit Menu
├──────────────────────────────┤
│                              │
│      Main Content            │
│                              │
│                              │
└──────────────────────────────┘
```

---

## Komponenten

### Buttons

#### Primary Button
```
Hintergrund:   bg-primary (#2563eb)
Text:          text-white
Border Radius: 8px (rounded-lg)
Padding:       py-3 px-6 (12px 24px)
Font Weight:   600 (Semi-Bold)
Hover:         bg-primary-dark (#1e40af)
Transition:    200ms
Mobile:        w-full (volle Breite)
Min Height:    44px
```

#### Secondary Button
```
Hintergrund:   bg-white
Text:          text-gray-700
Border:        1px solid #e5e7eb
Border Radius: 8px
Padding:       py-3 px-6
Hover:         bg-gray-50
```

#### Text Button / Link
```
Hintergrund:   transparent
Text:          text-primary
Hover:         underline
```

### Input-Felder

```
Border:        1px solid #e5e7eb
Border Radius: 8px (rounded-lg)
Padding:       py-3 px-4 (12px 16px)
Font Size:     1rem (16px) - wichtig für iOS!
Min Height:    44px

States:
- Focus:   border-primary, ring-2 ring-primary-light
- Error:   border-error, ring-2 ring-red-100
- Disabled: bg-gray-50, cursor-not-allowed

Label:
- Position:    Über Input
- Font Size:   0.875rem (14px)
- Color:       text-gray-600
- Margin:      mb-2
```

### Cards

```
Hintergrund:   bg-white
Border:        1px solid #e5e7eb (optional)
Shadow:        shadow-sm (leicht)
Border Radius: 12px (rounded-xl)
Padding:       24px (Desktop), 16px (Mobile)

Hover (bei klickbar):
Shadow:        shadow-md
Transition:    200ms
```

### Badges / Status

```
DRAFT (Entwurf):
  bg-gray-100, text-gray-700

SUBMITTED (Eingereicht):
  bg-green-100, text-green-700

Border Radius: 9999px (rounded-full)
Padding:       py-1 px-3
Font Size:     0.75rem (12px)
Font Weight:   500
```

---

## Navigation

### Student-Navigation
```
- Dashboard / Übersicht
- Mein Steckbrief
- Einstellungen
- Logout
```

### Admin-Navigation
```
- Dashboard
- Steckbriefe prüfen
- Benutzer verwalten
- Einstellungen
- Logout
```

### Mobile Navigation
- Hamburger-Menü (☰) oben links
- Overlay-Menu (volle Höhe)
- Schließen mit X oder außerhalb klicken

### Desktop Navigation
- Sidebar links (240px breit)
- Fixiert (position: fixed)
- Icons + Text für jeden Link
- Aktiver Link: bg-primary-light, text-primary

---

## Responsive Breakpoints

```
Mobile:       < 640px   (sm)
Tablet:       640-1024px (md/lg)
Desktop:      > 1024px   (xl)
```

### Breakpoint-Verhalten

**Mobile (<640px):**
- Buttons: volle Breite
- Cards: weniger Padding
- Navigation: Hamburger-Menü
- Formulare: gestapelt

**Tablet (640-1024px):**
- Cards: mehr Padding
- Formulare: können 2-spaltig sein
- Navigation: noch Hamburger-Menü

**Desktop (>1024px):**
- Sidebar Navigation sichtbar
- Content max-width: 1280px
- Multi-Column Layouts

---

## Formulare

### Layout
```
- Labels über Inputs
- Inputs: volle Breite
- Fehler unter Input (text-error, text-sm)
- Hilfetext unter Input (text-gray-500, text-sm)
- Abstand zwischen Feldern: 1rem (16px)
```

### Validation States

**Success:**
```
Border: green
Icon: ✓ grün
```

**Error:**
```
Border: red
Icon: ✗ rot
Error Message: unter Input, klein, rot
```

### Beispiel Login-Form
```
┌─────────────────────────────┐
│ E-Mail                      │ ← Label
│ ┌─────────────────────────┐ │
│ │ user@example.com        │ │ ← Input
│ └─────────────────────────┘ │
│                             │
│ Passwort                    │
│ ┌─────────────────────────┐ │
│ │ ••••••••                │ │
│ └─────────────────────────┘ │
│ Passwort vergessen?         │ ← Link (rechts)
│                             │
│ ┌─────────────────────────┐ │
│ │      Anmelden           │ │ ← Primary Button
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

---

## Animationen & Transitions

### Grundregel: Subtil und schnell

```
Standard Transition:  200ms ease-in-out
Hover-Effekte:        transform, background-color, shadow
Button Click:         scale(0.98) - leicht nach unten
Page Transitions:     fade-in (opacity 0 → 1, 150ms)
```

### Zu vermeiden
- Lange Animationen (>300ms)
- Komplexe Keyframe-Animationen
- Bewegungen, die ablenken

---

## Accessibility (a11y)

### Kontrast
- Text auf Hintergrund: min. 4.5:1 (WCAG AA)
- Große Überschriften: min. 3:1
- Aktive States deutlich erkennbar

### Keyboard Navigation
- Alle interaktiven Elemente mit Tab erreichbar
- Focus-States sichtbar (ring)
- Skip-Links für Hauptinhalt
- Enter/Space für Buttons

### Screen Reader
- Semantisches HTML (header, nav, main, article)
- Alt-Texte für Bilder
- Labels für alle Inputs (auch versteckte)
- ARIA-Labels wo nötig

### Touch Targets
- Mindestens 44x44px
- Abstand zwischen Targets: min. 8px

---

## Icons

**Icon-System:** Heroicons (MIT License)
- Outline Style für Navigation
- Solid Style für Buttons/Actions
- Größe: 20px (sm), 24px (md)

Häufig genutzte Icons:
```
- User/Profil: UserCircleIcon
- Dashboard: HomeIcon
- Settings: CogIcon
- Logout: ArrowRightOnRectangleIcon
- Edit: PencilIcon
- Check: CheckIcon
- X/Close: XMarkIcon
- Menu: Bars3Icon
```

---

## Bildrichtlinien

### Profilbilder
```
Format:      JPEG oder PNG
Max Größe:   2MB
Aspect:      1:1 (quadratisch)
Resize:      400x400px (anzeigen)
Border:      rounded-full oder rounded-lg
```

### Platzhalter
- Graue Box mit Icon (UserIcon)
- Oder Initialen (z.B. "MM" für Max Mustermann)

---

## Error Handling

### Error Messages (Deutsch!)
```
"Bitte gib deine E-Mail-Adresse ein."
"Das Passwort muss mindestens 8 Zeichen lang sein."
"E-Mail oder Passwort falsch."
"Etwas ist schiefgelaufen. Bitte versuche es erneut."
```

### Error Display
- Unter dem betroffenen Feld
- Rot (#ef4444)
- Klein (text-sm)
- Icon optional (XCircleIcon)

### Success Messages
- Toast/Notification oben rechts
- Grün (#10b981)
- Auto-dismiss nach 3-5 Sekunden
- Oder inline unter Button (bei Formularen)

---

## Loading States

### Buttons
```
- Disabled während Loading
- Spinner Icon
- Text: "Lädt..." oder "Wird gesendet..."
- Cursor: not-allowed
```

### Page Loading
```
- Skeleton Screens (für Cards/Listen)
- Oder einfacher Spinner zentriert
- Keine vollen Overlays (schlechte UX)
```

---

## Best Practices

1. **Mobile First:** Immer erst für Mobile designen
2. **Konsistenz:** Gleiche Abstände, Farben, Schriften
3. **Performance:** Keine schweren Bilder ohne Optimierung
4. **Accessibility:** Immer testen mit Keyboard + Screen Reader
5. **Feedback:** Immer Rückmeldung bei Aktionen geben
6. **Fehler:** Verständliche deutsche Fehlermeldungen
7. **Whitespace:** Lieber zu viel als zu wenig
8. **Touch:** Mindestens 44px für alle klickbaren Elemente

---

## Beispiel-Implementierung (Tailwind)

### Primary Button Component
```tsx
<button className="
  w-full md:w-auto
  bg-primary hover:bg-primary-dark
  text-white font-semibold
  py-3 px-6
  rounded-lg
  transition-colors duration-200
  min-h-[44px]
  focus:outline-none focus:ring-2 focus:ring-primary-light
">
  Anmelden
</button>
```

### Input Field Component
```tsx
<div>
  <label className="block text-sm font-medium text-gray-600 mb-2">
    E-Mail
  </label>
  <input
    type="email"
    className="
      w-full
      px-4 py-3
      border border-gray-200 rounded-lg
      text-base
      focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary
      min-h-[44px]
    "
    placeholder="max@beispiel.de"
  />
</div>
```

### Card Component
```tsx
<div className="
  bg-white
  border border-gray-200
  rounded-xl
  shadow-sm
  p-6 md:p-8
">
  {/* Card Content */}
</div>
```

---

## Maintenance

Dieses Design-System ist:
- ✅ Mobile-first
- ✅ Accessible (WCAG AA)
- ✅ Performant
- ✅ Erweiterbar

Bei Änderungen oder neuen Komponenten immer:
1. Dieses Dokument aktualisieren
2. Konsistenz mit bestehendem Design prüfen
3. Auf Mobile und Desktop testen
4. Accessibility prüfen
