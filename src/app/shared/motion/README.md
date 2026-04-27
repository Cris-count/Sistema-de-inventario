# Motion Policy

This project uses motion to improve clarity, perceived quality, and interaction feedback. Motion must never slow down operational work or make admin screens feel noisy.

## Current Motion Stack

- CSS transitions remain the default for simple hover, focus, and color/surface changes.
- Angular animations remain appropriate for app-level UI states such as modals, page/list entrances, and small state transitions already covered by `src/app/core/animations`.
- GSAP is reserved for higher-value motion where sequencing, scoped cleanup, stagger, or tactile microinteractions add meaningful polish.

Current GSAP usage is intentionally landing-first:

- `gsap-motion.ts`: reduced-motion checks, scoped GSAP context, and viewport trigger helper.
- `gsap-reveal.directive.ts`: reusable landing reveal presets.
- `gsap-hover.directive.ts`: reusable landing microinteraction presets.
- Landing hero/showcase sections: scoped custom timelines for first impression and product visuals.

## Principles

- Motion supports hierarchy, feedback, and brand confidence. It should not decorate every element.
- Landing and marketing surfaces may use richer motion than productivity screens.
- Operational areas prioritize speed, stability, readability, and predictable state changes.
- Prefer opacity and transform. Avoid layout-affecting properties such as width, height, top, left, margin, or expensive filters.
- Respect `prefers-reduced-motion` for all GSAP motion.
- Keep animation logic local, scoped, and reversible on component destroy.
- Do not create bespoke timing/easing values for each component. Use the existing directives or extend shared presets when a pattern repeats.

## GSAP Usage Map

| Area | Recommendation | Notes |
| --- | --- | --- |
| Landing | Strong GSAP candidate | Hero, product visuals, section reveals, CTA/card microinteractions, restrained decorative depth. |
| Login / auth | Limited GSAP candidate | One small premium entrance or card microinteraction is acceptable. Forms should stay calm. |
| Dashboard | Prefer CSS / Angular animations | Use motion only for very small feedback states or empty/loading transitions. |
| POS / Sales | Avoid broad GSAP | POS is operational. Use CSS for hover/focus. Consider GSAP only for rare, targeted payment/confirmation feedback. |
| Inventory / CRUD | Prefer CSS only | Tables and forms should remain stable and fast. |
| Replenishment / movements | Prefer CSS only | Operational workflows should not rely on animation for comprehension. |
| History / reports | Avoid GSAP | Dense data surfaces need readability, not motion. |
| Modals / overlays / drawers | Angular animations first | Existing `core/animations` should remain the default unless complex orchestration is needed. |
| Marketing visuals | Strong GSAP candidate | Product mocks, showcase details, ambient accents, and high-value CTAs. |
| Tables | Avoid GSAP | Use CSS state changes only; never animate row layout in dense tables by default. |

## Motion Layers

1. Structural entrance / reveal motion
   - Use on landing, auth, and rare premium surfaces.
   - Prefer `appGsapReveal` for landing or Angular `fadeUp`/`staggerList` where already established.
   - Avoid in tables, POS cart operations, and CRUD forms.

2. Scroll reveal motion
   - Belongs on marketing sections with strong visual hierarchy.
   - Use GSAP only when stagger or media/text sequencing improves perception.
   - Do not apply to every paragraph or secondary label.

3. Microinteraction motion
   - Belongs on important CTAs, cards, media frames, and clickable showcase controls.
   - Use `appGsapHover` only for premium landing surfaces or future carefully selected marketing/auth surfaces.
   - CSS remains enough for normal admin hover/focus states.

4. Feedback / state-change motion
   - Prefer Angular animations or CSS for toasts, dialogs, disabled states, loading states, and inline validation.
   - GSAP is justified only when feedback needs precise sequencing or premium emphasis.

5. Ambient decorative motion
   - Landing only by default.
   - Keep loops slow, subtle, transform-based, and easy to remove.
   - Never use ambient loops in POS, dashboard, tables, or forms.

## Style Guide

- Default reveal ease: `power3.out`.
- Default hover ease: `power2.out`.
- Reveal durations: `0.55s` to `0.75s`.
- Hover durations: `0.18s` to `0.30s`.
- Stagger range: `0.05s` to `0.08s`.
- Reveal translate: `12px` to `28px`.
- Hover translate: `-1px` to `-4px`.
- Reveal scale: `0.985` to `1`.
- Hover scale: `1.006` to `1.015`.
- Press scale: `0.985` to `0.998`.
- Ambient motion: `6s+`, `sine.inOut`, very small translate/opacity shifts.

Variation is allowed by motion layer, not by personal preference. If a new effect does not fit these ranges, it should be reviewed as a design decision.

## Implementation Rules

- Use `withGsapContext()` for scoped component timelines.
- Use `runWhenVisible()` for viewport-triggered GSAP motion.
- Use `appGsapReveal` for repeatable landing reveal patterns.
- Use `appGsapHover` for repeatable landing microinteractions.
- Add new shared presets before duplicating similar animation code in multiple components.
- Keep bespoke GSAP timelines limited to high-value components such as the landing hero or product showcase.
- Avoid ScrollTrigger or heavy plugins unless there is a clear product need and a performance review.
- Do not animate layout properties. Use `x`, `y`, `scale`, `opacity`, and carefully chosen transform-based effects.
- Always make cleanup explicit through GSAP context reversion and Angular `DestroyRef`.

## Recommended Sequence

1. Freeze broad GSAP rollout after landing Phase 3.
2. Optionally add one small auth/login motion pass: card entrance and CTA microinteraction only.
3. Improve modal/drawer state transitions using existing Angular animation tokens, not GSAP by default.
4. Consider POS microfeedback only after operator testing identifies a clear need.
5. Leave inventory, reports, tables, and CRUD screens CSS-only unless a specific UX problem emerges.
