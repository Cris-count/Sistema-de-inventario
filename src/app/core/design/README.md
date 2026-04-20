# Sistema visual — Design System oficial

> **Alcance**: este documento es la **fuente de verdad visual** del frontend.
> Describe el sistema visual vigente y las reglas para mantenerlo. Cualquier
> nueva pantalla, sección o componente del producto debe seguir estas reglas.
>
> **No** es un documento de propuestas ni de ideas a futuro. Es el estado real
> del código en `src/app/core/design/tokens.css`, `src/styles.css`,
> `src/landing-styles.css`, `tailwind.config.mjs` y los componentes
> compartidos en `src/app/shared/components/ui/*`.

---

## 0. Índice

1. [Propósito del sistema visual](#1-propósito-del-sistema-visual)
2. [Arquitectura visual por áreas](#2-arquitectura-visual-por-áreas)
3. [Paleta oficial](#3-paleta-oficial)
4. [Tipografía oficial](#4-tipografía-oficial)
5. [Tokens (radios, sombras, motion, espaciado, z-index)](#5-tokens-radios-sombras-motion-espaciado-z-index)
6. [Componentes compartidos](#6-componentes-compartidos)
7. [Reglas por área](#7-reglas-por-área)
8. [Reglas de estados (alerts, badges, banners)](#8-reglas-de-estados-alerts-badges-banners)
9. [Dark mode](#9-dark-mode)
10. [Responsive](#10-responsive)
11. [Motion](#11-motion)
12. [Semántica visual (tokens vs hardcoded)](#12-semántica-visual-tokens-vs-hardcoded)
13. [Do / Don’t](#13-do--dont)
14. [Anti-patterns y deprecados](#14-anti-patterns-y-deprecados)
15. [Checklist para nuevas pantallas / secciones](#15-checklist-para-nuevas-pantallas--secciones)
16. [Cómo cambiar el acento del producto](#16-cómo-cambiar-el-acento-del-producto)
17. [Validación al tocar tokens](#17-validación-al-tocar-tokens)

---

## 1. Propósito del sistema visual

El producto es un **SaaS de inventario para pymes**. La identidad visual busca
transmitir:

- **Confianza**: superficies limpias, sin ruido, legibles.
- **Control**: jerarquía tipográfica fuerte, estados semánticos claros.
- **Operatividad**: densidad cómoda en el panel (tablas, formularios) sin
  caer en dashboards fríos.
- **Cercanía comercial** en la landing sin perder sobriedad en el panel.

**Frase rectora interna:**

> *"Un producto que se ve cuidado en la landing, se siente firme en el login y
> trabaja bien todo el día en el dashboard."*

Los tokens y componentes compartidos existen para que las **tres áreas**
(landing, auth, dashboard) se sientan del mismo producto sin tener tres
dialectos visuales.

---

## 2. Arquitectura visual por áreas

| Área | Carácter visual | Archivos clave |
| --- | --- | --- |
| **Landing pública** | Comercial moderna, teal como marca, superficies claras, mocks de producto, secciones con `py-section`, reveal on scroll. | `src/app/pages/landing/**`, `src/landing-styles.css` |
| **Auth (login + wizard)** | Sobria premium: tipografía clara, poco color, foco en formularios, sin adornos. Los pasos del wizard usan tokens semánticos (`text-primary`, `text-secondary`, `bg-surface`, `ring-accent`), no teal crudo. | `src/app/pages/login/**`, `src/app/pages/register/**` |
| **Dashboard / panel** | Operativa elegante: densidad cómoda, tablas y forms profesionales, badges semánticos, alerts con `color-mix(var(--*))`, body 16px. Layout con `--space-page`. | `src/styles.css`, `src/app/features/**`, `src/app/shared/shell/**` |

**Los tres consumen los mismos tokens** (`tokens.css`). Si un área necesita un
matiz extra, se expresa como **alias local** que apunta al token oficial (ver
`src/styles.css` bloque inicial: `--bg`, `--surface`, `--accent` → son alias
de `var(--color-*)`).

```
tokens.css (fuente única)
     │
     ├──► styles.css          (dashboard, login, panel)
     ├──► landing-styles.css  (landing pública, registro)
     └──► tailwind.config.mjs (UiButton, UiCard, UiBadge, utilities)
```

> **Cambiar un token en `tokens.css` cambia el estilo en toda la app.**
> **No declarar colores hardcoded fuera de este archivo.**

---

## 3. Paleta oficial

### 3.1 Acento y estados (colores semánticos)

| Token | Rol | Light (RGB) | Dark (RGB) | Equivalente Tailwind |
| --- | --- | --- | --- | --- |
| `--color-accent` | CTA primario, marca, activos, links primarios | `13 148 136` (teal-600) | `45 212 191` (teal-400) | `accent` / `text-accent` / `bg-accent` |
| `--color-accent-strong` | Hover/pressed sobre acento; gradiente del botón primario | teal-700 | teal-500 | `accent-strong` |
| `--color-accent-soft` | Fondo sutil con acento (chips de icono, destacado de plan recomendado) | teal-100 | teal-900 | `accent-soft` / `bg-accent-soft` |
| `--color-info` | Links descriptivos, banners informativos, estados neutrales | `59 130 246` (blue-500) | `96 165 250` (blue-400) | `info` / `text-info` |
| `--color-success` | Estados OK, badges OK, alerts success | emerald-500 | emerald-400 | `success` |
| `--color-warning` | Estados de atención, stock bajo, advertencias | amber-500 | amber-400 | `warning` |
| `--color-danger` | Errores, stock agotado, destructivos | red-500 | red-400 | `danger` |

**Regla de uso — no mezclar roles:**

- `accent` = **acción**. No usarlo para informar.
- `info` = **información**. No usarlo como CTA primario.
- El usuario aprende a asociar teal → acción, azul → información.

### 3.2 Superficies, bordes y texto

| Token | Rol | Light | Dark | Tailwind |
| --- | --- | --- | --- | --- |
| `--color-bg` | Fondo principal de página | slate-50 | slate-950 | `bg-background` |
| `--color-surface` | Tarjetas, paneles, modales, inputs | white | slate-900 | `bg-surface` |
| `--color-surface-hover` | Hover suave sobre superficies | slate-50 | slate-800 | `bg-surface-hover` |
| `--color-text` | Texto principal | slate-900 | slate-100 | `text-primary` |
| `--color-text-muted` | Texto secundario, helpers | slate-500 | slate-400 | `text-secondary` |
| `--color-text-subtle` | Texto auxiliar (captions largas, disclaimers) | slate-400 | slate-500 | (no alias Tailwind) |
| `--color-border` | Bordes estándar | slate-200 | slate-700 | `border-slate-200`* |
| `--color-border-strong` | Bordes visibles | slate-300 | slate-600 | `border-slate-300`* |
| `--color-border-subtle` | Bordes muy suaves (divisores) | slate-100 | slate-800 | `border-slate-100`* |

\* En componentes nuevos se usan las utilidades `border-slate-*` con opacidad
(`border-slate-200/80`, `dark:border-slate-600/70`), que es el patrón oficial
de `UiCard` y del resto del sistema. El token `--color-border` es usado por
el CSS legacy del dashboard.

### 3.3 Uso correcto de la paleta (resumen accionable)

- **CTA principal** → `UiButton variant="primary"` (gradient `from-accent to-accent-strong`).
- **Acción secundaria** → `UiButton variant="secondary"` (outline + superficie).
- **Acción terciaria** → `UiButton variant="ghost"` (texto semántico).
- **Chip de marca / icono en section** → `bg-accent-soft text-accent ring-1 ring-accent/20 dark:bg-accent/15 dark:ring-accent/30`.
- **Badge OK** → `.badge-ok` (dashboard) o `UiBadge tone="success"` (landing/UI).
- **Badge warning** → `.badge-warn`.
- **Badge danger** → `.badge-danger`.
- **Alert info** → `.alert.alert-info` (dashboard).
- **Destacado de plan** → `UiCard [highlighted]="true"` (ring accent + sombra mayor).

---

## 4. Tipografía oficial

Una sola fuente: **Inter** (cargada en `src/index.html`).

### 4.1 Escala (definida en `tokens.css`, expuesta en Tailwind)

| Rol | Token | Tamaño | Line-height | Uso |
| --- | --- | --- | --- | --- |
| `display` | `--text-display` | 48 / 3rem | 1.1 | Hero de landing (opcional) |
| `h1` | `--text-h1` | 36 / 2.25rem | 1.2 | Título de página (dashboard) |
| `h2` | `--text-h2` | 28 / 1.75rem | 1.25 | Sección / título de card grande |
| `h3` | `--text-h3` | 20 / 1.25rem | 1.35 | Subtítulo de card |
| `body-lg` | `--text-body-lg` | 18 / 1.125rem | 1.6 | Lead / descripción |
| `body` | `--text-body` | 16 / 1rem | 1.55 | Texto corriente |
| `body-sm` | `--text-body-sm` | 14 / 0.875rem | 1.5 | Ayudas, tablas, labels |
| `caption` | `--text-caption` | 12 / 0.75rem | 1.45 | Metadatos, badges, eyebrows |

Pesos disponibles: 400, 500, 600, 700.

### 4.2 Reglas de uso

- **body del panel = 16px** (1rem). No bajar a 15px "para que entre más"; ya
  se corrigió en la fase tipográfica.
- **Headings del panel** no se inflan: el dashboard usa `h1 = text-h2`,
  `h2 = text-h3`, `h3 = text-body-lg` (ver `src/styles.css`). Esto preserva
  densidad operativa sin perder jerarquía. La landing sí usa la escala
  completa (`display`, `h1`, `h2`) porque es territorio comercial.
- **Eyebrows** (palabras cortas uppercase sobre un título) →
  `text-xs font-semibold uppercase tracking-wider text-accent`.
- **Texto secundario largo** → `text-secondary` (light y dark). No inventar
  `text-slate-500` a mano si ya está el alias semántico.
- **No usar `text-[11px]` arbitrarios**: si un texto es más pequeño que
  caption, revisar antes si de verdad es necesario. Los labels de UI nunca
  deben estar por debajo de **12 px**.
- **No cargar fuentes adicionales** en `index.html` sin justificación
  documentada. Inter cubre todos los rangos.

---

## 5. Tokens (radios, sombras, motion, espaciado, z-index)

### 5.1 Radios

| Token | Valor | Uso recomendado |
| --- | --- | --- |
| `--radius-sm` | 8 px | Chips, inputs pequeños |
| `--radius-md` | 12 px | Botones, inputs, cards pequeñas |
| `--radius-lg` | 16 px | Cards estándar |
| `--radius-xl` | 20 px | Cards grandes, modales |
| `--radius-2xl` | 24 px | Heros, paneles destacados |

En componentes Angular se consumen como `rounded-md`, `rounded-lg`,
`rounded-xl`, `rounded-2xl` (Tailwind lee los tokens).

### 5.2 Sombras

`--shadow-xs < --shadow-sm < --shadow-soft < --shadow-md < --shadow-lg`.

- `shadow-soft` es la sombra canónica de `UiCard` y de los paneles de landing.
- `--shadow-focus = 0 0 0 3px rgb(var(--color-accent) / 0.25)` es el anillo de
  foco estándar. Cualquier elemento interactivo nuevo debe conservar foco
  visible compatible con este anillo.
- En dark mode las sombras se recalculan automáticamente (más oscuras, más
  difusas), no hay que redefinirlas por componente.

### 5.3 Espaciado de layout

| Token | Valor | Uso |
| --- | --- | --- |
| `--space-page` | `clamp(1rem, 3vw, 1.75rem)` | Padding horizontal de páginas del panel |
| `--space-section` | 5 rem | `py-section` en landing (separación entre bloques) |
| `--space-section-sm` | 3.5 rem | `py-section-sm` (secciones más compactas: advisor, social proof) |

Se consumen en Tailwind como `py-section` / `py-section-sm`. No inventar
`py-24` / `py-16` arbitrarios para nuevas secciones de landing.

### 5.4 Z-index (único catálogo oficial)

Usar **siempre** estos tokens en lugar de valores literales:

```
--z-base            1
--z-nav            50   navbars fijas
--z-drawer         90   drawers móviles
--z-header        150   header sticky interno
--z-fab           200   floating action buttons
--z-modal-backdrop 300
--z-modal          310
--z-toast          400
--z-tooltip        500
```

Expuestos en Tailwind como `z-nav`, `z-drawer`, `z-modal`, etc. **Prohibido
`z-[9999]`** o números arbitrarios.

---

## 6. Componentes compartidos

> **Regla dura**: si ya existe el componente, se usa. No duplicar clases de
> `UiCard` a mano, no reinventar badges, no pintar botones con `class="bg-..."`.

### 6.1 `UiButton`

Archivo: `src/app/shared/components/ui/button/ui-button.component.ts`.

**Variantes canónicas (3)**:

| Variante | Uso | Estructura |
| --- | --- | --- |
| `primary` | CTA principal, conversión | gradient `from-accent to-accent-strong` + `shadow-soft` |
| `secondary` | Acción secundaria | outline sobre `bg-surface`, texto semántico |
| `ghost` | Acción terciaria discreta | solo texto semántico (`!text-secondary` hover `!text-primary`) |

**Tamaños**: `sm` (min-h 36), `md` (min-h 42, default), `lg` (min-h 48).

**Aliases retrocompatibles** (deprecated, siguen funcionando pero **migrar en
nuevos componentes**):

| Alias | Equivalente canónico |
| --- | --- |
| `gradient` | `primary` |
| `landing-primary` | `primary` + `size="lg"` |
| `landing-secondary` | `secondary` + `size="lg"` |
| `landing-navbar` | `primary` + `size="md"` |
| `landing-floating` | `primary` + `size="md"` |

**Reglas de uso**:

- Navegación interna → usar input `linkTo` (RouterLink en el botón).
- Ancla a sección en la landing → usar `(click)` + `scrollIntoView`, no `<a href="#..."`.
- No anular texto ni fondo con `!important` (`!text-white`, `!bg-xxx`).
  Si falta una variante, se amplía el componente, no se pisa desde afuera.
- Foco: el botón ya trae `focus-visible:outline-accent`. **No quitarlo.**

### 6.2 `UiCard`

Archivo: `src/app/shared/components/ui/card/ui-card.component.ts`.

Base del sistema de superficies.

**Inputs**:

- `padded` (default `true`) → `p-6`. Pasar `false` para layouts custom
  (headers de tabla, contenedores ya padded).
- `highlighted` (default `false`) → ring accent + sombra más marcada.
  Reservado para **card destacada de una serie** (plan recomendado).
- `class` → clases extra de layout interno.

**Estructura base generada**:

```
rounded-2xl border border-slate-200/80 bg-surface shadow-soft
transition duration-200
hover:border-slate-300 hover:shadow-md hover:-translate-y-px
dark:border-slate-600/70 dark:bg-slate-900/85
dark:hover:border-slate-500 dark:hover:bg-slate-900/95
```

**Reglas de uso**:

- Si vas a dibujar `rounded-2xl border border-slate-200/80 bg-surface shadow-soft`
  a mano, **detente y usa `<app-ui-card>`**. Ese dialecto manual es un
  anti-pattern ya corregido en la fase 3.
- No forzar el fondo con `!important` desde fuera (advisor y pricing ya se
  limpiaron de ese anti-pattern en la micro-ronda P1-P6). Si necesitas un
  gradient externo, envuelve la card en un `<div>` con el gradiente y deja
  `UiCard` con superficie transparente/neutra.

### 6.3 `UiBadge`

Archivo: `src/app/shared/components/ui/badge/ui-badge.component.ts`.

**Tonos reales disponibles**: `neutral | accent | success | on-dark`.

| Tono | Uso | Estilo |
| --- | --- | --- |
| `neutral` | Default: etiquetas genéricas | slate-100 / slate-800 dark |
| `accent` | Badges de marca, overlays sobre mockups, "Recomendado" | teal-50 / teal-950 dark |
| `success` | Estados OK en landing o UI | emerald-50 / emerald-950 dark |
| `on-dark` | Badges sobre fondos oscuros (hero, CTAs) | `bg-white/10 ring-white/15 text-teal-100 backdrop-blur` |

> Para **estados semánticos del panel operativo** (warn/danger sobre tablas
> de stock) se usan las clases CSS del panel `.badge`, `.badge-ok`,
> `.badge-warn`, `.badge-danger`, `.badge-off` definidas en `src/styles.css`.
> `UiBadge` con tono `warning` / `danger` **no existe** intencionalmente: el
> dashboard usa las clases CSS del panel porque se combinan con tablas,
> filtros y layouts del panel.

### 6.4 Tablas, formularios, alerts, banners del panel

Definidos como CSS global en `src/styles.css`. Se consumen con las clases
documentadas:

- `table.data` → tabla estándar (headers sticky, hover de filas, borders).
- `.field` + `.field label` + `.field input/select/textarea` → grupo de form.
- `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-danger` → botones del panel
  (equivalentes a UiButton pero pensados para forms inline del CSS legacy).
- `.alert`, `.alert-info`, `.alert-success`, `.alert-error` → alerts
  semánticos con `color-mix(in srgb, var(--*) ...)` (patrón unificado).
- `.badge`, `.badge-ok`, `.badge-warn`, `.badge-danger`, `.badge-off` →
  badges operativos.
- `.spinner` → loader estándar. Dentro de `.btn-primary` usa borde
  translúcido + top blanco (buen contraste sobre el teal del botón).
- `.page-header`, `.page-lead`, `.muted` → tipografía auxiliar de páginas.

En **nuevos componentes del panel** preferir estas clases a reinventar
estilos con Tailwind. El CSS del panel está pensado para interoperar con
ellas (hover de filas sobre `--accent-soft`, foco de inputs sobre
`--shadow-focus`, etc.).

### 6.5 Shared del landing

- `RevealOnScrollDirective` (`[appReveal]`) → reveal on scroll con
  `IntersectionObserver`. Combina con `.lp-stagger` (hijo directo) para
  stagger automático de hasta 5 elementos.
- `.lp-card-hover` (en `landing-styles.css`) → microinteracción hover para
  cards de landing cuando no se usa `UiCard`.

---

## 7. Reglas por área

### 7.1 Landing

- **Contenedor**: `max-w-6xl mx-auto px-4 sm:px-6 lg:px-8`.
- **Secciones**: cada sección usa `py-section` o `py-section-sm`. El `id`
  se usa para anclas del navbar (`#producto`, `#soluciones`, `#funciones`,
  `#planes`, `#faq`, `#showcase`).
- **Alternancia de fondos**: alternar `bg-surface` (con
  `dark:bg-slate-900`) y `bg-background` (con `dark:bg-slate-950`) entre
  secciones contiguas. **Dos secciones seguidas con el mismo fondo** rompen
  el ritmo visual (fue un hallazgo real corregido en QA final del showcase).
- **Cards de landing**: usar `UiCard` salvo caso excepcional. Si vas a
  dibujar el contorno "rounded-2xl + border + shadow-soft", usa `UiCard`.
- **Chips de icono** (features / sectors / trust / showcase):
  `bg-accent-soft text-accent ring-1 ring-accent/20 dark:bg-accent/15 dark:ring-accent/30`.
  **Un solo lenguaje visual** para chips.
- **CTAs primarios**: `UiButton variant="primary" size="lg"`
  (o alias `landing-primary`).
- **Badges en heros oscuros**: `UiBadge tone="on-dark"`. **No** parchar
  `tone="accent"` con `!bg-white/10 !text-teal-100 !ring-white/10`
  (anti-pattern ya eliminado).

### 7.2 Auth (login + wizard)

- Texto principal → `text-primary` (no `text-slate-900`).
- Texto secundario → `text-secondary` (no `text-slate-600`).
- Superficies → `bg-surface` (no `bg-white`).
- Rings de foco → `ring-accent` / `ring-accent/30` (no `ring-teal-400` /
  `ring-teal-500/30`).
- Borders "seleccionado" → `border-accent` (no `border-teal-300`).
- Progresión del wizard → gradient `from-accent to-accent-strong`
  (no `to-teal-600`).
- Estados de error de validación → clase `.err` del panel o `.alert-error`
  según layout. No inventar rojos.

### 7.3 Dashboard / panel

- **Layout**: `app-shell` aporta header + sidebar. Las páginas deben usar
  `<section class="page-header">…</section>` para el título + descripción.
- **Tablas**: usar `table.data`. Para columnas de stock crítico, combinar
  con `.badge-warn` / `.badge-danger`.
- **Formularios**: usar `.field`. No estilizar inputs con Tailwind inline.
- **Alerts**: usar `.alert .alert-info/success/error`. No crear alerts con
  `bg-red-50 border-red-200 text-red-900` a mano.
- **Cards del panel**: usar el patrón existente de tarjetas del panel
  (fondo `--surface`, borde `--border`, sombra `--shadow-sm`) o `UiCard` si
  es una pantalla híbrida con layout moderno.
- **Body = 16px**: no volver a 15px.

---

## 8. Reglas de estados (alerts, badges, banners)

### 8.1 Familia de alerts (`src/styles.css`)

Todos los alerts siguen el mismo patrón:

```css
.alert-<tono> {
  background: color-mix(in srgb, var(--<tono>) 14%, transparent);
  border-color: color-mix(in srgb, var(--<tono>) 35%, transparent);
  color: <foreground-semántico>;
}
[data-theme='light'] .alert-<tono> { /* light refinement */ }
```

- **info** → `var(--info)` (azul). **No teñir con accent.**
- **success** → `var(--ok)` (emerald).
- **error** → `var(--danger)` (red).
- **warning** no tiene `.alert-warning` creada; si se necesita, se agrega
  siguiendo el **mismo patrón `color-mix`**.

### 8.2 Familia de badges

Dos sistemas coexisten intencionalmente:

**(A) Badges de UI/landing** → `UiBadge` (componente Angular).

- Tonos: `neutral | accent | success | on-dark`.

**(B) Badges operativos del panel** → clases CSS globales.

- `.badge` (base), `.badge-ok` (success), `.badge-warn` (warning),
  `.badge-danger` (danger), `.badge-off` (muted).
- Siguen el mismo patrón `color-mix(var(--*) ...)`.

Jerarquía visual obligatoria en tablas de stock:

| Estado | Clase | Color | Prioridad |
| --- | --- | --- | --- |
| OK / disponible | `.badge-ok` | emerald | Base |
| Atención / cerca del tope | `.badge-warn` | amber | Alta |
| Crítico / lleno / agotado | `.badge-danger` | red | **Más alta** |

Nunca usar `.badge-off` (gris) para un estado **crítico**: gris < OK en
jerarquía, sería el error señalado en la auditoría.

### 8.3 Banners / bloqueos de plan

- `PlanBlockFollowupComponent` → sigue el estilo del sistema (fondo teal
  suave, botón `primary`, ring accent).
- No duplicar su estética con markup inline en pantallas de feature.

---

## 9. Dark mode

### 9.1 Principios

- **Un solo toggle** lo controla: `ThemeService` aplica clase `dark` en
  `<html>` y `data-theme='dark'` para el panel legacy. Los dos están
  sincronizados.
- **Todo el dark mode vive en `tokens.css`** (bloque `:root.dark`). Los
  componentes **no** deben redefinir el dark con hex nuevos; deben consumir
  tokens.
- Bordes en dark → `dark:border-slate-600/70` (bordes visibles) o
  `dark:border-slate-700/60` (más sutil). Evitar `dark:border-slate-800`
  en bordes que deban verse.
- Superficies en dark →
  - página: `dark:bg-slate-950`
  - card / panel: `dark:bg-slate-900` (a veces `/85` para backdrop blur)
  - elevación extra: `dark:bg-slate-800`

### 9.2 Errores ya corregidos — **no volver a introducir**

- ❌ Fallbacks azules legacy en componentes (ej. theme-toggle con
  `#3b82f6`). Sustituidos por equivalentes teal.
- ❌ `from-accent to-teal-600` (el `to-teal-600` es un valor fijo que no
  se adapta a dark). Usar `from-accent to-accent-strong`.
- ❌ `.alert-info` teñida de teal compitiendo con primary. Corregida a
  `var(--info)`.
- ❌ Ghost del `UiButton` usando `!text-slate-600` / `hover:!text-slate-900`.
  Corregido a `!text-secondary` / `hover:!text-primary`.
- ❌ FAQ dark con cards casi planas (`dark:bg-slate-950`). Subido a
  `dark:bg-slate-800/60` con `dark:open:bg-slate-800/80` para dar elevación.
- ❌ Navbar con borde `border-white/10` sobre fondo claro (invisible en
  light). Corregido a `border-slate-200/80` + `dark:border-slate-700/60`.

### 9.3 Checklist de dark mode para un componente nuevo

1. ¿Consume tokens semánticos (`bg-surface`, `text-primary`, `text-secondary`)?
2. ¿Tiene `dark:` explícito donde la superficie cambia de elevación?
3. ¿El borde se sigue viendo en dark (opacity 60–80, no 10)?
4. ¿El foco sigue visible (`focus-visible:outline-accent` o
   `--shadow-focus`)?
5. ¿El contraste texto/fondo está arriba de 4.5:1 para body y 3:1 para
   texto grande?

---

## 10. Responsive

- **Breakpoints Tailwind estándar**: `sm` (640), `md` (768), `lg` (1024),
  `xl` (1280).
- **Landing**:
  - Contenedor `max-w-6xl`.
  - Heros y splits usan `lg:grid-cols-2` o `lg:grid-cols-12`.
  - CTAs pasan a `flex-col gap-3 sm:flex-row`.
  - En móvil los mockups van **antes** que el texto en secciones "split"
    (ver showcase): ver primero, leer después.
- **Dashboard**:
  - Tablas siempre en `overflow-x-auto` si tienen >4 columnas.
  - Sidebar colapsa a drawer por debajo de `md` (ya manejado en
    `app-shell`).
  - Forms usan `.field` apilado vertical en móvil.
- **Topbar comercial del landing** se oculta por debajo de `md` y se
  reemplaza por la versión reducida. Reglas en
  `src/app/pages/landing/sections/topbar/*`.

---

## 11. Motion

### 11.1 Duraciones oficiales (`tokens.css`)

- `--duration-fast` (120 ms) → hover, focus, microinteracciones.
- `--duration-base` (200 ms) → transiciones estándar (tabs, banners).
- `--duration-slow` (320 ms) → reveals grandes, modales.
- Bajo `prefers-reduced-motion: reduce` las tres bajan a 1 ms (accesibilidad
  gratis, no hay que replicar la regla por componente).

### 11.2 Easings

- `--easing-out` = `cubic-bezier(0.22, 1, 0.36, 1)` → entradas (fade, slide).
- `--easing-in-out` = `cubic-bezier(0.4, 0, 0.2, 1)` → transiciones
  reversibles (toggles, tabs).

### 11.3 Triggers Angular oficiales (`src/app/core/animations`)

| Trigger | Dónde usarlo |
| --- | --- |
| `fadeIn` | Aparición simple (elementos con `@if` que llegan y se quedan) |
| `fadeUp` | Reveal estándar (secciones de landing, cards grandes) |
| `fadeDown` | Avisos, cards que "caen" |
| `fadeInOut` | Alerts, banners, feedback (entra y sale) |
| `slideDown` / `slideInUp` / `slideInLeft` / `slideInRight` | Drawers, sidebars, toasts |
| `staggerList` / `listItem` | Listas y grids animadas |
| `backdropFade` / `modalFadeScale` | Modales oficiales |
| `routeFadeAnimation` | Transición entre rutas del panel |

### 11.4 Reglas de uso

- **No animar height/width** si se puede animar `opacity` + `transform`.
  Todas las animaciones del sistema son GPU-aceleradas y no causan reflow.
- **Reveal máximo 24 px de `translateY`** (alineado con `MOTION.translate.reveal = 16px`).
- **No apilar animaciones** sobre el mismo elemento. Si una sección lleva
  `@fadeUp`, sus hijos no llevan otro `@fadeUp`; usan `[appReveal]` para
  reveal on scroll.
- La landing prefiere `[appReveal]` + `.lp-stagger` sobre triggers Angular,
  porque el reveal depende del scroll, no del `:enter`.

---

## 12. Semántica visual (tokens vs hardcoded)

### 12.1 Qué es "usar el sistema"

Es preferir **el alias semántico** al color crudo:

| En lugar de | Usar |
| --- | --- |
| `text-slate-900` | `text-primary` |
| `text-slate-600` / `text-slate-500` | `text-secondary` |
| `bg-white` | `bg-surface` |
| `ring-teal-500/30` / `ring-teal-400` | `ring-accent/30` / `ring-accent` |
| `border-teal-300` / `border-teal-600` | `border-accent` / `border-accent-strong` |
| `bg-teal-50` / `bg-teal-100` | `bg-accent-soft` |
| `dark:bg-teal-950/40` | `dark:bg-accent/10` o `dark:bg-accent/15` |
| `ring-teal-100` | `ring-accent/20` |
| `to-teal-600` en gradient | `to-accent-strong` |
| `rgba(13, 148, 136, 0.14)` inline | `rgb(var(--color-accent) / 0.14)` o `color-mix(in srgb, var(--accent) 14%, transparent)` |
| `#3b82f6`, `#60a5fa` (azules legacy) | `var(--info)` o tokens teal si era marca |

Si el color que necesitas **no** tiene token, la regla es agregarlo a
`tokens.css` **primero** y después consumirlo. No escribir hex o rgb en un
componente.

### 12.2 Excepciones aceptadas

- Traffic lights de "ventana" en mockups (`bg-red-400/90`,
  `bg-amber-400/90`, `bg-emerald-400/90`): son **decoración mimética** de
  macOS, no estados. Permitido porque no representan nada semántico.
- Colores directos en SVGs de mocks (`public/landing/showcase-*.svg`): OK,
  el asset es una ilustración.
- Hex dentro del gradiente de `--shadow-focus`: permitido porque compone
  alpha sobre el token.

---

## 13. Do / Don’t

### ✅ Do

- Usar `<app-ui-button>`, `<app-ui-card>`, `<app-ui-badge>` para cualquier
  botón, card o badge nuevos.
- Importar `fadeUp`, `staggerList`, etc. desde `src/app/core/animations`.
- Expresar colores como `rgb(var(--color-*) / <alpha>)` o `color-mix(var(--*) ...)`.
- Alternar fondos entre secciones contiguas de landing.
- Mantener body en 16px.
- Usar `[appReveal]` para reveal on scroll.
- Hacer `npm run build` después de tocar tokens.

### ❌ Don’t

- Pintar un botón con `class="inline-flex rounded-xl bg-linear-to-r ..."`.
  Eso ya es `UiButton variant="primary"`.
- Duplicar `rounded-2xl border border-slate-200/80 bg-surface shadow-soft`.
  Eso ya es `<app-ui-card>`.
- Hacer un badge manual con `<span class="rounded-full bg-teal-50 ...">`.
  Eso ya es `<app-ui-badge tone="accent">`.
- Escribir `!important` para anular `UiCard` o `UiButton` desde un padre.
- Mezclar `accent` con `info` en la misma CTA.
- Usar `z-index: 9999`.
- Usar `text-[11px]` o tamaños por debajo de `--text-caption` (12 px).
- Importar CSS o JS de plantillas externas (`nicepage.css`, `u-*`
  globales). Si hay una plantilla de referencia, vive solo en
  `_templete-reference/` (ignorado en git) y se adapta reconstruyendo con
  este sistema.

---

## 14. Anti-patterns y deprecados

> Los siguientes patrones **están explícitamente prohibidos**. Todos fueron
> causas reales de regresión visual detectadas en auditorías previas.

| Anti-pattern | Qué pasaba | Estado |
| --- | --- | --- |
| Wizard de registro usando `text-slate-*`, `bg-white`, `ring-teal-*` | Dialecto visual distinto del resto del producto | **Corregido P1** |
| `.alert-info` teñida de teal | Competía con CTAs primarios | **Corregido P1** |
| `near / full` usando `.badge` genérico y `.badge-off` gris | Estado crítico se veía menos que OK | **Corregido P1** (badge-warn/badge-danger) |
| `rgba(13, 148, 136, ...)` inline en `mi-empresa.page.ts` | Hardcoded, rompía dark mode | **Corregido P1** |
| Spinner en `.btn-primary` con poco contraste | Imposible verlo en el botón teal | **Corregido P1** |
| Gradientes `from-accent to-teal-600` | `to-teal-600` fijo no adapta a dark | **Corregido P1** |
| Body en 15 px | Token oficial es 16 px, jerarquía rota | **Corregido P2** |
| Heads `h1`/`h2` del panel "encogidos" | No seguían la escala tipográfica | **Corregido P2** |
| Badges por debajo de 11 px | Ilegibles | **Corregido P2** |
| `landing-benefits` reinventando `UiCard` | Duplicación de estilos | **Corregido P3** |
| Badge del hero con `!bg-white/10 !text-teal-100 !ring-white/10` | `!important` anulando `UiBadge` | **Corregido P3** (tono `on-dark` oficial) |
| CTA final idéntico al hero | Sensación de déjà vu | **Corregido P3** |
| FAQ dark con cards planas | Sin elevación perceptible | **Corregido P3** |
| Hover de `UiCard` imperceptible en light | No se sentía clicable | **Corregido P3** |
| Theme-toggle con fallbacks azules legacy | Paleta antigua | **Corregido P3** |
| `landing-plans-compare` con `bg-teal-*` / `ring-teal-*` hardcoded | Fuera del lenguaje visual | **Corregido P1–P6** |
| Badge "Recomendado" reinventado inline | Duplicaba `UiBadge` | **Corregido P1–P6** |
| `.alert-error` con hex crudos | No seguía patrón `color-mix` | **Corregido P1–P6** |
| `landing-advisor` con `!important` estructural sobre `UiCard` | Anti-pattern serio | **Corregido P1–P6** |
| Navbar con `border-white/10` en light | Invisible en light mode | **Corregido P1–P6** |
| `UiButton ghost` con `!text-slate-600` | Slate crudo en vez de semántico | **Corregido P1–P6** |
| Doble "window chrome" sobre mockup del showcase | Traffic-lights + SVG con barra propia | **Corregido cierre showcase** |
| `aria-hidden="true"` en disclaimer de honestidad | Ocultaba contexto clave a lectores de pantalla | **Corregido cierre showcase** |

**Regla general**: si ves en una PR alguno de estos patrones reapareciendo,
se rechaza. El sistema visual está cerrado; cada uno de estos ajustes tuvo
una razón.

---

## 15. Checklist para nuevas pantallas / secciones

Antes de mergear una nueva vista/sección, pasar esta lista:

- [ ] ¿Usa `UiButton` para todos los botones?
- [ ] ¿Usa `UiCard` (o las clases del panel) para superficies?
- [ ] ¿Usa `UiBadge` o `.badge-*` para badges?
- [ ] ¿El texto principal usa `text-primary`? ¿El secundario `text-secondary`?
- [ ] ¿Las superficies usan `bg-surface` / `bg-surface-hover` (no `bg-white` crudo)?
- [ ] ¿Los rings y borders usan `accent` / `slate-*/opacity`, no `teal-*` hardcoded?
- [ ] ¿Los radios, sombras y espaciados vienen de tokens (`rounded-xl`,
      `shadow-soft`, `py-section`)?
- [ ] ¿Hay dark mode explícito y coherente donde cambia la elevación?
- [ ] ¿El foco es visible (`focus-visible:outline-accent` o
      `--shadow-focus`)?
- [ ] ¿El body está en 16 px?
- [ ] ¿La jerarquía tipográfica sigue la escala oficial (sin `text-[11px]`
      arbitrarios)?
- [ ] ¿Los `z-index` vienen del catálogo (`z-nav`, `z-modal`, etc.)?
- [ ] ¿El motion usa triggers oficiales (`fadeUp`, `staggerList`) o
      `[appReveal]` en landing?
- [ ] ¿Respeta `prefers-reduced-motion`? (sale gratis si usas los tokens)
- [ ] ¿Es responsive en `sm`, `md`, `lg` sin desbordes ni CTAs ocultos?
- [ ] ¿Pasa `npm run build` sin errores ni warnings?

**Si un ítem falla**, se corrige antes de merge. No se acepta "ya lo
arreglo en la siguiente PR".

---

## 16. Cómo cambiar el acento del producto

Solo hay que editar dos líneas en `tokens.css`:

```css
:root {
  --color-accent: 13 148 136;         /* teal-600 */
  --color-accent-strong: 15 118 110;  /* teal-700 */
}
```

Y si se quiere adaptar también el `--color-accent-soft` y la versión dark
(bloque `:root.dark`), se hace en el mismo archivo.

Todo el producto (landing, dashboard, auth, botones, cards, iconos, rings,
gradients, spinners, shadows focus) se actualiza automáticamente.

---

## 17. Validación al tocar tokens

1. `npm run build` debe pasar sin errores ni warnings.
2. Smoke visual manual:
   - Landing completa (hero, solution, showcase, sectors, features,
     benefits, pricing, plans-compare, trust, faq, cta, footer).
   - Login + wizard de registro (los 4–5 pasos).
   - Dashboard: `mi-empresa`, `productos`, `movimientos/*`, `usuarios`.
3. Toggle light/dark en cada pantalla (ver §9).
4. Probar foco de teclado en CTAs principales (Tab): el anillo accent debe
   aparecer en `UiButton` primario, secondary y ghost.
5. Verificar que el plan recomendado en `/app/mi-empresa` sigue resaltado
   (`UiCard [highlighted]="true"`).
6. Verificar que `PlanBlockFollowupComponent` aparece con el botón teal
   bajo errores de plan.
7. Revisar tablas con `.badge-warn` / `.badge-danger` en stock crítico.

---

## Apéndice — Dónde vive cada cosa

| Qué | Dónde |
| --- | --- |
| Tokens (colores, tipo, motion, z-index) | `src/app/core/design/tokens.css` |
| Config Tailwind (bridge tokens → utilities) | `tailwind.config.mjs` |
| CSS del dashboard / panel / login | `src/styles.css` |
| CSS del landing | `src/landing-styles.css` |
| `UiButton` | `src/app/shared/components/ui/button/` |
| `UiCard` | `src/app/shared/components/ui/card/` |
| `UiBadge` | `src/app/shared/components/ui/badge/` |
| Animaciones Angular | `src/app/core/animations/*.ts` |
| Directiva reveal on scroll | `src/app/shared/directives/reveal-on-scroll.directive.ts` |
| Landing (secciones) | `src/app/pages/landing/sections/*` |
| Auth (login + wizard) | `src/app/pages/login/`, `src/app/pages/register/` |
| Shell del dashboard | `src/app/shared/shell/app-shell.component.ts` |
| Este documento | `src/app/core/design/README.md` |
| Plantilla externa (solo referencia, ignorada en git) | `_templete-reference/` |
