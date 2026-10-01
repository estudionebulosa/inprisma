---
article:
  slug: core-web-vitals
  title: "Core Web Vitals: rendir en la búsqueda de 2026"
  dek: "Qué miden LCP, INP y CLS, por qué importan y cómo se codifican en la plantilla en lugar de improvisarlos."
  category: guias
  tags:
    - core-web-vitals
    - rendimiento
    - seo
    - eleventy
  author: admin
  revision: "1.0"
  date: 2026-10-04
  updated: 2026-10-04
  excerpt: "LCP, INP y CLS explicados en la práctica: cómo medirlos, qué umbrales perseguir y cómo codificarlos en una plantilla rápida y sin JavaScript en el artículo."
  keywords:
    - core web vitals
    - lcp
    - inp
    - cls
    - rendimiento web
  hero:
    image: /assets/hero-core-web-vitals.svg
    alt: "Panel de métricas de rendimiento con LCP, INP y CLS dentro de umbral"
  faq:
    - q: "¿Qué son las Core Web Vitals?"
      a: "Son las métricas de experiencia de página que Google usa como señal de calidad: LCP mide la carga del contenido principal, INP responde a la interactividad y CLS cuantifica el desplazamiento visual."
    - q: "¿Cuál es el umbral recomendado para LCP?"
      a: "El objetivo es que el elemento de contenido más grande se pinte en menos de 1,2 segundos; por debajo de 2,5 segundos se considera aceptable, y por encima, mejorable."
    - q: "¿Cómo se garantiza CLS cero?"
      a: "Reservando espacio para imágenes y medios con width y height, evitando insertar contenido sobre lo ya visible y usando fuentes con métricas de reserva."
  sources:
    - text: "Google Search Central — Core Web Vitals"
      url: "https://developers.google.com/search/docs/appearance/core-web-vitals"
    - text: "PRD — Plataforma de Noticias Ultra-Optimizada v1.0"
      url: "/prd_news_site_optimization.html"
  internalLinks:
    - /guias/plantillas-multiplataforma/
    - /guias/schema-json-ld/
    - /guias/publica-una-vez/
  hook: "La velocidad no es una optimización posterior: es una decisión de plantilla. Si el HTML crítico ya es ligero, las métricas se cumplen solas."
  cta: "Audita tu plantilla con Lighthouse en CI antes de publicar el próximo artículo."
  shareCopy: "LCP, INP y CLS no se arreglan a parches: se codifican en la plantilla. Así se rinde en la búsqueda de 2026."
  platform:
    medium:
      kicker: "Rendimiento"
    linkedin:
      framing: "Para responsables técnicos que necesitan que las métricas de rendimiento dejen de ser una tarea pendiente."
    substack:
      subject: "Rendimiento que se codifica, no se improvisa"
---

La experiencia de página es una señal de calidad desde hace años, pero sigue
tratándose como un parche final. El problema es que, llegado ese punto, casi todo
lo que importaba ya se decidió: cuánto pesa el HTML crítico, cómo se cargan las
fuentes, si el diseño reserva espacio para las imágenes.

## Qué mide cada señal

- **LCP (Largest Contentful Paint)** — cuánto tarda el elemento más grande en
  pintarse. Es la señal de velocidad percibida.
- **INP (Interaction to Next Paint)** — cuánto tarda la página en responder a una
  interacción. Sustituyó a FID como señal de interactividad.
- **CLS (Cumulative Layout Shift)** — cuánto se mueve el contenido de forma
  inesperada. Es la señal de estabilidad visual.

## Los umbrales que se persiguen

| Señal | Bueno | Aceptable | Mejorable |
|---|---|---|---|
| LCP | < 1,2 s | < 2,5 s | > 2,5 s |
| INP | < 200 ms | < 500 ms | > 500 ms |
| CLS | 0 | < 0,1 | > 0,1 |

## Por qué la plantilla decide el resultado

Un artículo sin JavaScript de cliente, con el HTML crítico por debajo de 10 kB y con
`width`/`height` en cada imagen parte de una base que hace el trabajo fácil. La
velocidad no se persigue al final; se hereda de la plantilla. En
[plantillas multiplataforma](/guias/plantillas-multiplataforma/) vimos que la capa
técnica vive solo en la página canónica: eso es exactamente lo que mantiene ligera
la versión que Google rastrea.

## Medir para no engañarse

Codificar las reglas no basta: hay que verificar que se cumplen. Medir en CI, con
Lighthouse como umbral duro, convierte el rendimiento en una condición de
publicación. Y la [versión canónica y sindicada](/guias/publica-una-vez/)
solo se despliega si pasa.

## Conclusión

Las Core Web Vitals no se arreglan con optimizaciones puntuales, sino con
decisiones de plantilla. Si el [JSON-LD](/guias/schema-json-ld/) se genera y el HTML
crítico es ligero, las métricas son una consecuencia, no un objetivo.
