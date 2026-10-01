---
article:
  slug: schema-json-ld
  title: "Schema JSON-LD: el grafo que los motores leen"
  dek: "Cómo un grafo de schema.org bien armado conecta artículo, autor y organización para SEO y AEO."
  category: guias
  tags:
    - schema
    - json-ld
    - seo
    - aeo
  author: admin
  revision: "1.0"
  date: 2026-10-05
  updated: 2026-10-05
  excerpt: "NewsArticle, Person y Organization en un solo grafo @graph: cómo generarlo en build, verificarlo y por qué mejora la citación en motores de respuesta."
  keywords:
    - schema
    - json-ld
    - newsarticle
    - structured data
    - aeo
  hero:
    image: /assets/hero-schema-json-ld.jpg
    alt: "Grafo de nodos schema.org conectando artículo, autor y organización"
  faq:
    - q: "¿Para qué sirve el JSON-LD?"
      a: "Para describir el contenido en un formato que los motores entienden sin ambigüedad: quién lo escribió, quién lo publica, cuándo y de qué trata. Eso habilita resultados enriquecidos y una citación más fiable."
    - q: "¿Qué nodos debería incluir un artículo de noticias?"
      a: "NewsArticle como nodo principal, Person para la autoría, Organization para el editor, BreadcrumbList para la navegación y FAQPage cuando el artículo incluye preguntas y respuestas."
    - q: "¿Se escribe el JSON-LD a mano?"
      a: "No. Se ensambla en build a partir de los datos del autor, la organización y el artículo, de modo que nunca se desincroniza del contenido real."
  sources:
    - text: "Schema.org — NewsArticle"
      url: "https://schema.org/NewsArticle"
    - text: "PRD — Plataforma de Noticias Ultra-Optimizada v1.0"
      url: "/prd_news_site_optimization.html"
  internalLinks:
    - /guias/plantillas-multiplataforma/
    - /guias/core-web-vitals/
    - /guias/como-estructurar-un-articulo/
  hook: "Tus metadatos no son un adorno: son la forma en que una máquina entiende quién dijo qué y por qué es fiable. Bien conectados, valen más que cualquier keyword."
  cta: "Verifica que tu grafo se genera y conecta en cada build antes de publicar."
  shareCopy: "Un grafo @graph bien conectado es lo que hace que un motor cite tu artículo en lugar de a tu competencia."
  platform:
    medium:
      kicker: "Datos estructurados"
    linkedin:
      framing: "Para equipos de SEO técnico que quieren que el schema deje de romperse en cada publicación."
    substack:
      subject: "El grafo que los motores leen"
---

Los motores de búsqueda y de respuesta no leen tu artículo como lo lee una persona.
Lo interpretan: identifican la entidad, la autoría, la fecha y la relación con el
editor. El JSON-LD es la forma de decírselo sin ambigüedad.

## De un bloque suelto a un grafo

Un `NewsArticle` aislado dice poco. Lo que aporta contexto es el grafo: el artículo
es parte de la web, la web pertenece a la organización, el artículo lo firma una
persona que trabaja para esa organización. Cuando esos nodos comparten `@id`, los
motores pueden enlazarlos.

- **Organization** — quién publica, con logo y perfiles verificables.
- **WebSite** — el sitio que contiene el contenido.
- **Person** — quién firma, con su cargo y credenciales.
- **NewsArticle** — el contenido, con autor y editor referenciados.
- **BreadcrumbList** — la ruta dentro de la taxonomía.
- **FAQPage** — las preguntas y respuestas, cuando existen.

## Por qué se genera y no se escribe

Escribir el JSON-LD a mano garantiza que se desincronice: cambia la fecha, se
actualiza el cargo, y el bloque queda viejo. Generarlo en build elimina esa clase de
error. Como en cualquier
[artículo bien estructurado](/guias/como-estructurar-un-articulo/),
la regla es que los datos se escriben una vez y los artefactos se derivan.

## Verificar que conecta

Un grafo puede ser válido y estar mal: nodos que no se referencian, `Person` sin
`@id`, un editor huérfano. Por eso conviene comprobarlo en cada build, igual que se
comprueba el [rendimiento de la página canónica](/guias/core-web-vitals/). La
verificación no es un extra: es lo que convierte el schema en una garantía.

## Conclusión

El JSON-LD es el contrato entre tu contenido y las máquinas que lo van a citar. Si
se genera en build, se conecta bien y se verifica siempre, deja de ser una fuente de
errores y pasa a ser parte de la infraestructura — el mismo enfoque que hace posible
[una fuente y varias salidas](/guias/plantillas-multiplataforma/).
