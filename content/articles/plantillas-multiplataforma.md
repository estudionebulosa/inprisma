---
article:
  slug: plantillas-multiplataforma
  title: "Plantillas multiplataforma: una fuente, cuatro salidas"
  dek: "Cómo un solo contrato de contenido alimenta web, Medium, LinkedIn y Substack sin reescribir nada."
  category: guias
  tags:
    - plantillas
    - eleventy
    - publicacion
    - seo
  author: admin
  revision: "1.0"
  date: 2026-10-03
  updated: 2026-10-03
  excerpt: "Descubre cómo una única plantilla validada genera la página canónica y las tres variantes de sindicación, sin duplicar metadatos ni contenido."
  keywords:
    - plantillas
    - eleventy
    - sindicacion
    - publicacion multiplataforma
  hero:
    image: /assets/hero-plantillas-multiplataforma.svg
    alt: "Una fuente de contenido ramificándose en cuatro plantillas de destino"
  faq:
    - q: "¿Qué es una plantilla multiplataforma?"
      a: "Es una plantilla que consume un único contrato de datos y produce varias salidas: la página canónica del sitio propio y las versiones adaptadas a Medium, LinkedIn y Substack."
    - q: "¿Hay que mantener cuatro plantillas a mano?"
      a: "No. Se mantiene una sola fuente y una capa de presentación por destino. El contrato de datos es compartido, así que un cambio en el contenido se propaga a todas las salidas en el mismo build."
  sources:
    - text: "PRD — Plataforma de Noticias Ultra-Optimizada v1.0"
      url: "/prd_news_site_optimization.html"
    - text: "Eleventy — Data Cascade"
      url: "https://www.11ty.dev/docs/data-cascade/"
  internalLinks:
    - /guias/como-estructurar-un-articulo/
    - /guias/core-web-vitals/
    - /guias/schema-json-ld/
  hook: "Cuatro destinos no deberían significar cuatro proyectos. Con una fuente y un contrato, publicar en todas partes es un solo build."
  cta: "Empieza clonando inprisma y sustituye la plantilla de ejemplo por la tuya."
  shareCopy: "Una fuente, cuatro salidas: así se deja de reescribir el mismo artículo para cada plataforma."
  platform:
    medium:
      kicker: "Plantillas"
    linkedin:
      framing: "Para equipos que publican el mismo contenido en web, blog y redes sociales."
    substack:
      subject: "Una fuente, cuatro salidas"
---

Publicar en cuatro sitios no debería costar cuatro veces más. La diferencia entre
un proceso que escala y uno que no está en **separar el contenido de la
presentación**: una sola fuente validada, y una plantilla por destino que solo
cambia cómo se muestra, nunca qué dice.

## Qué hace multiplataforma a una plantilla

Una plantilla es multiplataforma cuando no contiene datos, solo reglas de
presentación. Los datos viven en un contrato único — tipo, obligatoriedad y reglas
de cada campo — y cada plantilla los consume igual.

- La **plantilla web** añade la capa técnica: JSON-LD, canónica, Open Graph.
- Las **plantillas de sindicación** se quedan con la capa de contenido: título,
  entradilla, cuerpo, FAQ y un aviso de canonicidad que apunta al sitio propio.

El contrato es el mismo para las cuatro. Por eso `{{ article.title }}` significa lo
mismo en web que en Substack.

## Por qué el contrato va primero

Si empiezas por las plantillas, acabas con cuatro copias divergentes del mismo
artículo. Si empiezas por el contrato, las plantillas son casi triviales: una lista
de campos y un orden de bloques. Como vimos en
[cómo estructurar un artículo para SEO, AEO y redes](/guias/como-estructurar-un-articulo/),
la estructura es lo que hace que el mismo borrador rinda en todos los motores.

## La capa de presentación por destino

Cada destino premia cosas distintas, pero solo en los márgenes:

| Destino | Añade | No cambia |
|---|---|---|
| Web | JSON-LD, canónica, meta y OG | El cuerpo |
| Medium | Kicker y encabezado suave | El cuerpo |
| LinkedIn | Entradilla de tono profesional | El cuerpo |
| Substack | Asunto del correo | El cuerpo |

Esas diferencias se resuelven con campos de variación controlada, no con copias
del artículo. Los detalles técnicos de cada salida son la base para cumplir las
[Core Web Vitals](/guias/core-web-vitals/) en la versión canónica y para emitir un
[schema JSON-LD](/guias/schema-json-ld/) correcto.

## Conclusión

Una fuente, cuatro salidas y cero trabajo duplicado. Añadir una plataforma nueva
deja de ser un proyecto: es una plantilla más que consume el mismo contrato.
