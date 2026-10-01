---
article:
  slug: como-estructurar-un-articulo
  title: "Cómo estructurar un artículo para SEO, AEO y redes"
  dek: "Un método en cinco capas que sirve a buscadores, motores de respuesta y plataformas sociales a la vez."
  category: guias
  tags:
    - seo
    - aeo
    - eleventy
    - publicacion
    - plantillas
  author: admin
  revision: "1.0"
  date: 2026-10-01
  updated: 2026-10-01
  excerpt: "Aprende a convertir un único borrador validado en artículos listos para Medium, LinkedIn y Substack, cubriendo SEO, AEO, E-E-A-T y Core Web Vitals."
  keywords:
    - seo
    - aeo
    - geo
    - eleventy
    - plantillas
    - core web vitals
  hero:
    image: /assets/hero-estructura-articulo.jpg
    alt: "Diagrama de las cinco capas de un artículo optimizado"
  faq:
    - q: "¿Qué diferencia hay entre SEO y AEO?"
      a: "El SEO optimiza para aparecer en resultados de búsqueda; el AEO optimiza para que un motor de respuesta pueda citar tu contenido directamente. Se refuerzan mutuamente cuando la respuesta va al principio del artículo."
    - q: "¿Necesito versiones distintas por buscador?"
      a: "No. Un único sitio rápido, accesible y con schema correcto se posiciona bien en todos los motores. El cloaking está penalizado de forma explícita."
    - q: "¿Cuántos enlaces internos debe tener un artículo?"
      a: "Entre tres y cinco enlaces internos contextuales, con texto ancla descriptivo."
  sources:
    - text: "PRD — Plataforma de Noticias Ultra-Optimizada v1.0"
      url: "/prd_news_site_optimization.html"
    - text: "Google Search Central — Core Web Vitals"
      url: "https://developers.google.com/search/docs/appearance/core-web-vitals"
    - text: "Schema.org — NewsArticle"
      url: "https://schema.org/NewsArticle"
  internalLinks:
    - /guias/plantillas-multiplataforma/
    - /guias/core-web-vitals/
    - /guias/schema-json-ld/
  hook: "Si publicas el mismo borrador en tres sitios y en ninguno funciona igual, el problema no es el texto: es que le falta estructura."
  cta: "Aplica la plantilla y valida con los checks de CI antes de publicar."
  shareCopy: "SEO, AEO y redes no son tres trabajos distintos. Con una sola estructura validada, los tres salen del mismo borrador."
  platform:
    medium:
      kicker: "Guía práctica"
    linkedin:
      framing: "Para equipos de contenido que publican el mismo material en varios canales."
    substack:
      subject: "Una estructura, tres plataformas"
---

Un artículo bien estructurado resuelve tres problemas a la vez: aparece en buscadores,
es citable por motores de respuesta y se comparte sin fricción. La clave es separar el
**contrato de datos** de la **capa de presentación** de cada plataforma.

## ¿Por qué una sola estructura sirve para varias plataformas?

Porque el 95% de las señales de calidad son universales: velocidad, accesibilidad,
contenido de valor y autoría acreditada. Solo cambian detalles menores de tono y
longitud, que se resuelven con campos de variación controlada.

## Las cinco capas

1. **Contrato de datos** — un `placeholders.json` que declara cada campo, su tipo y sus reglas.
2. **Datos de sitio** — información del administrador definida una sola vez en `admin.json`.
3. **Datos por artículo** — front matter validado: título, etiquetas, autor, revisión y fecha.
4. **Datos calculados** — slug, canónico, tiempo de lectura, JSON-LD, generados en build.
5. **Presentación** — una plantilla por plataforma que consume el mismo contrato.

## ¿Qué se automatiza y qué no?

Se automatiza todo lo derivable: metadatos, JSON-LD, fechas y URLs. Lo repetitivo se
define una vez a nivel de sitio. Solo el tono específico de cada plataforma queda en
manos de una persona, y ahí sí se admiten variaciones menores.

## Conclusión

Define el contrato antes de escribir la primera plantilla. Cuando el contrato es único,
añadir una plataforma deja de ser un proyecto y pasa a ser una plantilla más.
