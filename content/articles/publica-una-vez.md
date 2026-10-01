---
article:
  slug: publica-una-vez
  title: "Publica una vez, rinde en todas partes"
  dek: "Un contrato de contenido, cuatro destinos y cero metadatos escritos a mano."
  category: guias
  tags:
    - seo
    - aeo
    - eleventy
    - publicacion
    - plantillas
  author: admin
  revision: "1.0"
  date: 2026-10-02
  updated: 2026-10-02
  excerpt: "inprisma convierte una sola fuente validada en artículos listos para web, Medium, LinkedIn y Substack, con SEO, AEO y JSON-LD generados en build."
  keywords:
    - seo
    - aeo
    - eleventy
    - plantillas
    - core web vitals
    - json-ld
  hero:
    image: /assets/hero-publica-una-vez.svg
    alt: "Un único contrato de contenido alimentando cuatro destinos"
  faq:
    - q: "¿Necesito escribir metaetiquetas o JSON-LD a mano?"
      a: "No. inprisma los deriva en build time desde un contrato de campos validado; nunca se editan a mano."
    - q: "¿Sirve para Medium, LinkedIn y Substack?"
      a: "Genera artefactos listos para pegar o importar en las tres, y publica la versión canónica en tu propio dominio."
    - q: "¿Por qué Eleventy?"
      a: "Porque su cascada de datos ya es un sistema de placeholders: cero JavaScript en el artículo final y control total del HTML crítico."
  sources:
    - text: "PRD — Plataforma de Noticias Ultra-Optimizada v1.0"
      url: "/prd_news_site_optimization.html"
  internalLinks:
    - /guias/plantillas-multiplataforma/
    - /guias/schema-json-ld/
    - /guias/core-web-vitals/
  hook: "Si publicas el mismo borrador en cuatro sitios y en ninguno rinde igual, el problema no es tu texto. Es que no tienes un contrato."
  cta: "Clona inprisma y publica tu primer artículo validado en menos de una hora."
  shareCopy: "Un contrato de contenido, cuatro destinos, cero metadatos a mano. Así se publica en 2026."
  platform:
    medium:
      kicker: "Sistemas de contenido"
    linkedin:
      framing: "Para equipos editoriales que publican el mismo material en varios canales."
    substack:
      subject: "Una sola fuente, cuatro destinos"
---

Escribir es la parte fácil. Lo difícil es que el mismo artículo rinda en Google, en
un motor de respuestas, en el feed de LinkedIn y en el correo de Substack — sin
reescribirlo cuatro veces ni olvidar una etiqueta. **inprisma** resuelve exactamente
eso: un contrato de contenido único, validado, del que salen todos los destinos.

## El problema: cuatro plataformas, cuatro trabajos

Cada destino premia cosas distintas. La web quiere JSON-LD, canónicas y schema. Los
motores de respuesta quieren una respuesta directa al principio. Las redes quieren
Open Graph y una imagen. Substack quiere un asunto. Cuando editas a mano, cada
destino es un proyecto.

El resultado es predecible: metadatos olvidados, fechas desincronizadas, schema roto
y una versión canónica que nadie sabe cuál es.

## La solución: un contrato, no cuatro copias

inprisma define **cada campo una sola vez** en `_data/placeholders.json`: su tipo, si
es obligatorio, si es automático, si admite variación por plataforma y su regla de
validación. A partir de ahí:

| Clase de dato | Quién lo aporta | Automatizado |
|---|---|---|
| Derivado | slug, canónica, fechas ISO, tiempo de lectura, JSON-LD | Sí, en build |
| Global | nombre, cargo, web, redes del administrador | Una vez |
| Por artículo | título, etiquetas, autor, revisión, fecha | Validado |
| Editorial | hook, CTA, asunto de Substack | Humano |

Ese contrato es lo que hace que todo lo demás sea trivial.

## ¿Qué incluye inprisma?

- **Plantillas para web, Medium, LinkedIn y Substack** generadas del mismo artículo.
- **JSON-LD automático**: `NewsArticle`, `FAQPage`, `BreadcrumbList`, `Person` y
  `Organization`, ensamblados en build y nunca escritos a mano.
- **Metadatos SEO y Open Graph** completos, con canónica absoluta.
- **Paginación por plataforma**: un archivo, cuatro salidas.
- **Un ejemplo funcional** que compila en segundos.

## ¿Por qué deberías empezar por aquí?

Porque el 95% de la optimización es idéntica para todos los motores — velocidad,
accesibilidad, contenido de valor y autoría acreditada — y ese 95% ya está resuelto
como infraestructura, no como buena voluntad.

No reescribirás metadatos. No romperás el schema. No discutirás cuál es la canónica.
Añadir una plataforma nueva deja de ser un proyecto y pasa a ser **una plantilla más**.

## Empezar en tres pasos

```bash
git clone https://github.com/estudionebulosa/inprisma && cd inprisma
npm install
npm run build        # → _site/ con la página canónica y las tres variantes
```

Edita `_data/admin.json` con tus datos. Escribe tu primer artículo en
`content/articles/`. El resto — schema, canónica, OG, fechas — se calcula solo.

## ¿Para quién es?

Para equipos editoriales pequeños, creadores multiplataforma y cualquiera que
publique el mismo contenido en más de un sitio y esté cansado de hacer el trabajo
cuatro veces.

## Conclusión

La calidad ya no se improvisa por artículo: se define una vez, en el contrato, y se
hereda en cada publicación. Clona inprisma, define tu contrato y deja que la
estructura trabaje por ti.
