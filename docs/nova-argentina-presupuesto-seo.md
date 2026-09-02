# Nova Argentina — Presupuesto SEO

Fecha: 2026-09-02 · Validez de la cotización: 30 días
Documento complementario de `nova-argentina-viabilidad.md`

---

## 1. Punto de partida y orden de las cosas

Antes del presupuesto, una advertencia que conviene decirle al cliente de entrada:

**Hacer SEO sobre el sitio actual es tirar la plata.** Hoy `novaargentina.ar` no tiene
fichas de propiedad con URL propia, no tiene páginas de zona, tiene dos páginas de
contacto compitiendo entre sí y una de ellas con texto placeholder de la plantilla. No hay
sustrato sobre el cual posicionar: no existen las páginas que deberían rankear.

El SEO tiene que arrancar **en paralelo a la Fase 1 del desarrollo**, no antes. Ese es
además el momento más barato para hacerlo bien: la arquitectura de URLs, el renderizado en
servidor y los datos estructurados salen gratis si se definen al construir, y cuestan
tres veces más si hay que retrofitearlos después.

### Expectativa que hay que fijar por escrito

Nova **no le va a ganar a Zonaprop** en "casas en venta Córdoba". Eso no es pesimismo, es
aritmética: los portales tienen 15+ años de autoridad de dominio, decenas de miles de
páginas indexadas y presupuesto de medios. La estrategia realista es **hiperlocal y de
cola larga**, donde la inmobiliaria de zona tiene ventaja estructural sobre el portal:

- "lotes en venta Parque Carrasco Anisacate"
- "terrenos en Anisacate con escritura"
- "casas en venta La Rancherita"
- "inmobiliaria en Alta Gracia"
- "tasación de propiedades Anisacate"

Ahí el portal es genérico y Nova puede ser específica. Ese es todo el juego.

---

## 2. Qué ya viene incluido en el desarrollo (NO se cobra acá)

Para que el presupuesto sea honesto y no haya doble cobro, esto es parte de la Fase 1 del
sitio y ya está contemplado en ese presupuesto:

- Renderizado en servidor (SSR/ISR) de fichas y listados — indexabilidad real
- URLs limpias con slug (`/propiedad/lote-1200m2-parque-carrasco-anisacate`)
- `sitemap.xml` dinámico + `robots.txt` + canonical
- Datos estructurados `schema.org/RealEstateListing` y `RealEstateAgent`
- Core Web Vitals en verde, imágenes AVIF/WebP, lazy loading
- Meta titles/descriptions dinámicos por plantilla
- HTTPS, redirects 301 del sitio viejo, jerarquía de encabezados

**El SEO que se cotiza abajo es lo que va _encima_ de eso:** investigación, contenido,
autoridad, presencia local y optimización continua.

---

## 3. Setup SEO inicial — pago único

Trabajo de fundación, se hace una vez, durante el mes 1.

| # | Entregable | Horas |
|---|---|---:|
| 1 | Auditoría técnica y de indexación (sitio actual + staging del nuevo) | 6 |
| 2 | Keyword research completo: zonas × tipos × intención (comprar / alquilar / tasar), con volumen y dificultad reales de Keyword Planner + Search Console | 10 |
| 3 | Arquitectura de contenidos: mapa de URLs, canibalización, plan de landings por zona y por tipo de propiedad | 6 |
| 4 | On-page de plantillas: fórmulas de title/description, encabezados, enlazado interno, breadcrumbs, datos estructurados extendidos | 8 |
| 5 | Google Business Profile: alta/reclamo, categorías, servicios, zonas de cobertura, fotos, primeras publicaciones + protocolo de reseñas | 5 |
| 6 | Medición: GA4 + Search Console + Tag Manager, eventos de lead (formulario, WhatsApp, teléfono), panel de reporte | 5 |
| 7 | Documento de estrategia y calendario editorial a 6 meses | 3 |
| | **Total** | **43 h** |

### **Setup inicial: USD 850** (pago único)

Incluye la corrección inmediata de los dos errores actuales (página de contacto duplicada
y texto placeholder) sin costo, apenas se tenga acceso.

---

## 4. Abono mensual — tres planes

Se cotiza por horas de trabajo mensual, no por posiciones. Nadie que sea serio garantiza
un puesto en Google, porque el resultado depende del algoritmo, de lo que hagan los
competidores y del estado del sitio.

### Plan A — Esencial · **USD 280/mes** (≈ 8 h)

Para sostener y no perder terreno.

- 1 pieza de contenido por mes (landing de zona **o** nota de blog)
- Mantenimiento de Google Business Profile: 2 publicaciones, respuesta a reseñas
- Optimización on-page de las propiedades nuevas cargadas en el mes
- Monitoreo de posiciones, indexación y errores en Search Console
- Reporte mensual escrito

### Plan B — Crecimiento · **USD 480/mes** (≈ 16 h) ← *recomendado*

Para construir posiciones en las zonas donde Nova opera.

- Todo lo del Plan A, más:
- **2–3 piezas por mes**: landings de zona (Anisacate, Alta Gracia, Carlos Paz, La
  Rancherita, San Vicente) + guías de barrio + contenido de intención de venta
  ("cuánto vale mi casa en…")
- Link building local: cámaras, portales de noticias de la zona, colegio de corredores,
  directorios, alianzas con desarrollistas
- Campaña de reseñas en GBP (guion + seguimiento con clientes cerrados)
- Optimización de conversión sobre las páginas que ya traen tráfico
- Reporte mensual + reunión de 45 min

### Plan C — Dominio local · **USD 780/mes** (≈ 28 h)

Para ser la referencia inmobiliaria del corredor Paravachasca en 12 meses.

- Todo lo del Plan B, más:
- **4–5 piezas por mes** + actualización de contenidos viejos
- Contenido pesado como imán de leads de **vendedores** (el lado rentable): tasación
  online, informe de precios por m² de la zona, guía de compra de lotes
- Prensa y menciones locales (link building activo, no solo directorios)
- SEO de los masterplans de loteos (páginas de emprendimiento, que ningún portal puede
  replicar)
- Tests A/B sobre formularios y CTAs de WhatsApp
- Reunión quincenal

---

## 5. Resumen económico

| Concepto | Importe |
|---|---:|
| Setup inicial (único) | **USD 850** |
| Abono mensual Plan A | USD 280 |
| Abono mensual Plan B *(recomendado)* | **USD 480** |
| Abono mensual Plan C | USD 780 |

**Escenario recomendado — primeros 6 meses:**
USD 850 + (USD 480 × 6) = **USD 3.730**

Cotizado en dólares, facturable en pesos al tipo de cambio del día de emisión (práctica
estándar del mercado para protegerse de la inflación).

---

## 6. Condiciones comerciales

- **Permanencia mínima: 6 meses.** No es una cláusula de retención comercial, es que el
  SEO no muestra resultados antes de ese plazo y cortar en el mes 3 es garantizar que la
  inversión no rinda.
- Setup: 50% al inicio, 50% contra entrega del documento de estrategia.
- Abono: por mes adelantado, primeros 10 días.
- Renovación automática mensual después del mes 6, con 30 días de preaviso para cancelar.
- Los contenidos, accesos y cuentas quedan a nombre de Nova Argentina. Si el servicio
  termina, se lleva todo.

### No incluye

- **Inversión en Google Ads / Meta Ads** (es dinero de medios, va aparte y se factura
  directo a la cuenta del cliente). La gestión de campañas se cotiza por separado.
- Fotografía y video de propiedades.
- Carga de las propiedades en el sistema (eso es del equipo de Nova o del CRM).
- Desarrollo web (presupuestado aparte, ver `nova-argentina-viabilidad.md`).

---

## 7. Plazos y KPIs realistas

| Momento | Qué esperar |
|---|---|
| Mes 1–2 | Indexación completa del sitio nuevo, GBP optimizado, primeras landings publicadas. **Sin movimiento de tráfico todavía** |
| Mes 3–4 | Aparición en el Local Pack de Google Maps para "inmobiliaria + zona". Primeras keywords long-tail en página 1–2 |
| Mes 5–6 | Tráfico orgánico consolidado, primeros leads atribuibles a búsqueda. Punto de evaluación honesto del servicio |
| Mes 9–12 | Posiciones estables en las zonas trabajadas; el orgánico empieza a competir con la pauta en costo por lead |

**KPIs que se reportan** (y por los que se me puede juzgar):

1. Leads orgánicos por mes (formulario + click en WhatsApp + click en teléfono)
2. Keywords en top 10 sobre el set objetivo definido en el setup
3. Impresiones y clicks en Search Console por zona
4. Acciones en Google Business Profile (llamadas, indicaciones, clicks al sitio)
5. Costo por lead orgánico vs. costo por lead de portal

Ese último punto es el argumento de venta más fuerte: **el lead de Zonaprop se alquila
todos los meses; el lead orgánico se compra una vez y sigue rindiendo.**

---

## 8. Preguntas abiertas antes de firmar

1. ¿Tienen Google Business Profile ya reclamado y verificado? ¿Con cuántas reseñas?
2. ¿Tienen accesos a Google Analytics / Search Console del sitio actual, o hay que
   arrancar de cero la línea de base?
3. ¿Hay presupuesto de pauta en paralelo? SEO y Ads se potencian; SEO solo tarda más.
4. ¿Quién puede escribir/aprobar contenido del lado de Nova? Las guías de barrio salen
   mucho mejor con input de los corredores que conocen la zona.
5. ¿Cuántos loteos propios hay para hacer páginas de emprendimiento? Es el contenido con
   mejor relación esfuerzo/retorno de todo el plan.
