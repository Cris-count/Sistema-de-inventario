# Politica de Motion y GSAP

El proyecto usa motion para mejorar jerarquia visual, percepcion de calidad y retroalimentacion de interacciones. No debe volver lentas ni ruidosas las pantallas operativas.

## Stack Actual

- CSS sigue siendo la opcion principal para hover, focus, cambios de color y pequenos estados visuales.
- Las animaciones Angular siguen siendo apropiadas para modales, entradas de pagina/lista y transiciones ya cubiertas en `src/app/core/animations`.
- GSAP se reserva para motion de mayor valor: secuencias, stagger, limpieza con contexto, microinteracciones tactiles o presentacion de marketing.

## Uso Actual de GSAP

GSAP esta concentrado en la landing publica:

- `gsap-motion.ts`: chequeo de `prefers-reduced-motion`, contexto GSAP con limpieza y helper para ejecutar cuando un elemento entra al viewport.
- `gsap-reveal.directive.ts`: directiva `appGsapReveal` para reveals reutilizables.
- `gsap-hover.directive.ts`: directiva `appGsapHover` para microinteracciones.
- Secciones de landing como hero, features, trust, business visual, product showcase y CTA.
- Timelines a medida solo en componentes de alto impacto visual, como hero y product showcase.

## Principios

- El movimiento debe apoyar comprension, foco o confianza visual; no decorar cada elemento.
- Landing y superficies de marketing pueden tener motion mas elaborado que pantallas de trabajo.
- POS, inventario, CRUD, tablas y reportes priorizan velocidad, estabilidad y lectura.
- Preferir `opacity`, `x`, `y`, `scale` y transformaciones. Evitar animar `width`, `height`, `top`, `left`, `margin` o filtros costosos.
- Respetar siempre `prefers-reduced-motion`.
- Toda animacion GSAP debe quedar acotada al componente y revertirse al destruirlo.
- No crear valores de duracion/easing aislados para cada componente si ya existe un patron compartido.

## Mapa de Uso Recomendado

| Area | Recomendacion |
|------|---------------|
| Landing | Buen candidato para GSAP: hero, showcases, CTA, cards y reveals. |
| Login / auth | Uso limitado: entrada suave de card o CTA si aporta calidad. |
| Dashboard | Preferir CSS o animaciones Angular simples. |
| POS / ventas | Evitar GSAP amplio; usar solo microfeedback muy puntual si una prueba de uso lo justifica. |
| Inventario / CRUD | Preferir CSS; formularios y tablas deben ser estables. |
| Movimientos / abastecimiento | Preferir CSS; no depender de animacion para comprender el flujo. |
| Historiales / reportes | Evitar GSAP; prima la densidad y lectura de datos. |
| Modales / drawers | Usar primero animaciones Angular existentes. |
| Tablas | No usar GSAP por defecto; no animar layout de filas. |

## Capas de Motion

1. Entrada estructural: landing, auth o superficies premium. Usar `appGsapReveal` o animaciones Angular ya existentes.
2. Reveal por scroll: solo en marketing, cuando el stagger o la secuencia mejoren la presentacion.
3. Microinteraccion: CTAs, cards y media frames importantes. Usar `appGsapHover` con moderacion.
4. Feedback de estado: preferir CSS/Angular para toasts, dialogos, validaciones y estados loading.
5. Motion ambiental: landing por defecto, con loops lentos, sutiles y transform-based.

## Guia de Valores

- Reveal: `0.55s` a `0.75s`, ease `power3.out`.
- Hover: `0.18s` a `0.30s`, ease `power2.out`.
- Stagger: `0.05s` a `0.08s`.
- Translate de reveal: `12px` a `28px`.
- Translate de hover: `-1px` a `-4px`.
- Scale de reveal: `0.985` a `1`.
- Scale de hover: `1.006` a `1.015`.
- Press scale: `0.985` a `0.998`.
- Motion ambiental: `6s+`, sutil, con `sine.inOut` o equivalente.

Si un nuevo efecto necesita salirse de estos rangos, debe tratarse como decision de diseno, no como preferencia local.

## Reglas de Implementacion

- Usar `withGsapContext()` para timelines con limpieza automatica por contexto.
- Usar `runWhenVisible()` para motion disparado por viewport.
- Usar `appGsapReveal` para patrones repetibles de landing.
- Usar `appGsapHover` para microinteracciones repetibles en superficies de marketing.
- Crear o extender presets compartidos antes de duplicar logica similar.
- Limitar timelines a medida a componentes de alto valor visual.
- Evitar ScrollTrigger u otros plugins pesados salvo necesidad clara y revision de rendimiento.
- Hacer limpieza explicita con `DestroyRef` y reversion de contexto GSAP.

## Secuencia Recomendada

1. Mantener GSAP concentrado en landing y superficies de primera impresion.
2. Si se mejora auth/login, limitarlo a una entrada suave y microinteraccion de CTA.
3. Mejorar modales/drawers con tokens y animaciones Angular antes de considerar GSAP.
4. Considerar microfeedback en POS solo despues de observar una necesidad operativa real.
5. Mantener inventario, reportes, tablas y CRUD con CSS/Angular simple por defecto.
