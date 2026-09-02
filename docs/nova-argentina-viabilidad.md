# Nova Argentina — Viabilidad de una web tipo Zonaprop / Remax

Fecha: 2026-09-02
Estado: análisis previo a propuesta comercial

---

## 0. Nota de método (importante)

El entorno donde corrió este análisis tiene bloqueado el acceso HTTP directo a
`novaargentina.ar` (política de red del sandbox: proxy devuelve 403 para ese dominio y
para los portales). Todo lo que sigue sobre el sitio actual está reconstruido desde
resultados de búsqueda pública indexados, no desde el HTML. **Antes de cotizar hay que
abrir el sitio y confirmar los puntos marcados con `[verificar]`.**

---

## 1. Qué es Nova Argentina hoy

- Inmobiliaria de Córdoba capital, con operación fuerte en el corredor de Sierras Chicas /
  Valle de Paravachasca: **Anisacate (Barrio Parque Carrasco), Alta Gracia, La Rancherita,
  San Vicente, Villa Carlos Paz**.
- Contacto público: `contacto@novaargentina.ar` — Belgrano 157, piso 5 of. B, Córdoba —
  +54 9 351 337 8325.
- Servicios: compra, venta, alquiler, tasación (ACM), asesoramiento.
- Publica también en portales (Zonaprop / Argenprop aparecen en la huella pública).

### Sitio actual — diagnóstico

| Observación | Impacto |
|---|---|
| Estructura tipo *brochure*: `/`, `/nosotros/`, `/comprar/`, `/servicios-inmobiliarios-cordoba/`, `/contactanos/`, `/contact/` | No es un buscador, es un folleto |
| Existen **dos** páginas de contacto (`/contact/` y `/contactanos/`), y en `/contact/` quedó **texto placeholder de la plantilla** | Plantilla sin terminar; canibalización SEO; mala señal de calidad |
| Las propiedades se ven como listado plano, sin filtros, sin paginación real y sin mapa `[verificar]` | Cero descubrimiento; el usuario se va a Zonaprop |
| Sin ficha de propiedad con URL propia indexable `[verificar]` | No hay SEO long-tail, que es el 100% del tráfico orgánico posible |
| Sin captura de lead trazable (formulario → CRM) `[verificar]` | No se puede medir el retorno de nada |

**Conclusión del diagnóstico:** el sitio actual no compite; es una tarjeta de presentación.
Cualquier trabajo sobre él es reconstrucción, no ajuste. Eso *simplifica* el proyecto: no
hay legacy que respetar.

---

## 2. La pregunta de fondo: ¿"tipo Zonaprop" o "tipo Remax"?

Son dos productos distintos y conviene no mezclarlos:

**A. Portal multi-inmobiliaria (Zonaprop, Argenprop, Mercado Libre Inmuebles)**
Marketplace de dos lados: necesita inventario de *otras* inmobiliarias y tráfico de
compradores, y cada lado solo llega si el otro ya está. Se monetiza vendiendo
publicaciones/destacados. El software es la parte barata; lo caro es el inventario, la
moderación y el marketing para arrancar el efecto de red contra tres incumbentes con 15+
años y presupuesto de medios.
→ **Técnicamente viable, comercialmente inviable para una inmobiliaria sola. No lo
recomiendo salvo que el cliente ya tenga acuerdo con un grupo de colegas de la zona.**

**B. Web propia con experiencia de portal (remax.com.ar, argenprop de una marca)**
Catálogo propio, buscador con filtros, mapa, fichas SEO, captura de leads. La marca es
Nova, el inventario es de Nova. Compite por *conversión de su propio tráfico* y por
long-tail de zona ("lotes en Parque Carrasco Anisacate"), no por la keyword genérica.
→ **Viable, de bajo riesgo, y es lo que el cliente realmente está pidiendo cuando dice
"búsqueda por mapa con filtros".**

El resto del documento asume **B**.

---

## 3. Veredicto de viabilidad

**Sí, es viable. La búsqueda por mapa con filtros no es la parte difícil.**

Zonaprop maneja cientos de miles de avisos; Nova va a manejar decenas o cientos. A esa
escala, el mapa con filtros es un problema resuelto: PostGIS + MapLibre lo hacen sin
esfuerzo, y ni siquiera hace falta agregación server-side hasta ~5.000 puntos.

Lo que realmente decide el éxito es otra cosa:

1. **La calidad del dato geográfico.** Un mapa sin lat/lng correctos en cada propiedad es
   una pantalla vacía. Hay que geocodificar el inventario actual y sostener disciplina de
   carga. Es el 80% del riesgo del proyecto y es un riesgo del cliente, no del código.
2. **El volumen de inventario.** Con 30 propiedades, un mapa de Córdoba se ve desierto y
   el efecto es peor que no tenerlo. Mitigación abajo (§6).
3. **El SEO.** Sin fichas renderizadas en servidor con URL propia, el proyecto no genera
   tráfico y queda dependiendo de pauta.

---

## 4. Arquitectura recomendada

Stack elegido para bajo costo operativo y continuidad con lo que ya se usa (Supabase).

```
Next.js (App Router, TS) ──► Vercel          SSR/ISR para SEO de fichas y landings de zona
        │
        ├── MapLibre GL JS + tiles (MapTiler / Protomaps / Mapbox)
        │     └── supercluster en cliente
        │
        └── Supabase (Postgres + PostGIS + Storage + Auth)
              ├── RPC geoespacial (bbox / polígono dibujado)
              ├── RLS: público lee publicadas, agentes escriben las suyas
              └── Storage para fotos (o Cloudinary si se quiere transformación fuerte)
```

### Por qué MapLibre y no Google Maps

- MapLibre GL JS es open source, sin límite de licencia, y permite clustering, dibujo de
  polígonos y estilos propios sin fricción.
- Costo de tiles: Mapbox y MapTiler dan ~50.000 cargas de mapa/mes gratis; Google da
  US$200 de crédito mensual pero cobra por *dynamic map load* y se consume rápido si el
  mapa es el eje de la navegación (que es exactamente el caso acá).
- Google conviene solo si se quiere Street View embebido en la ficha (se puede sumar
  puntualmente sin migrar el mapa principal).

### Modelo de datos (esqueleto)

```sql
create extension if not exists postgis;

create table propiedades (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,           -- /propiedad/casa-3-dorm-anisacate-a1b2
  operacion     text not null,                  -- venta | alquiler | temporario
  tipo          text not null,                  -- casa | depto | lote | local | campo
  estado        text not null default 'borrador',-- borrador | publicada | reservada | vendida
  titulo        text not null,
  descripcion   text,
  precio        numeric,
  moneda        char(3) not null default 'USD', -- NUNCA convertir: se guarda tal cual
  expensas      numeric,
  dormitorios   smallint,
  banos         smallint,
  cocheras      smallint,
  sup_cubierta  numeric,
  sup_total     numeric,
  antiguedad    smallint,
  direccion     text,
  barrio        text,
  ciudad        text,
  provincia     text default 'Córdoba',
  geom          geography(Point, 4326),         -- ubicación exacta (privada)
  geom_publico  geography(Point, 4326),         -- ubicación ofuscada para el mapa público
  precision_ubicacion text default 'aproximada',-- exacta | aproximada
  amenities     text[] default '{}',
  destacada     boolean default false,
  crm_id        text,                           -- id en Tokko/CRM si se sincroniza
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index propiedades_geom_idx     on propiedades using gist (geom_publico);
create index propiedades_filtros_idx  on propiedades (estado, operacion, tipo, precio);

create table propiedad_imagenes (
  id uuid primary key default gen_random_uuid(),
  propiedad_id uuid references propiedades(id) on delete cascade,
  url text not null, orden smallint default 0, alt text
);

create table leads (
  id uuid primary key default gen_random_uuid(),
  propiedad_id uuid references propiedades(id),
  nombre text, email text, telefono text, mensaje text,
  origen text,                                   -- ficha | whatsapp | landing-zona | portal
  utm jsonb,
  created_at timestamptz default now()
);

create table busquedas_guardadas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  filtros jsonb not null,                        -- incluye bbox o polígono
  alerta_email boolean default true,
  created_at timestamptz default now()
);
```

### Consulta del mapa (lo único "geo" del proyecto)

```sql
-- Buscar dentro del viewport actual + filtros. Se expone vía PostgREST/RPC.
create or replace function buscar_en_mapa(
  min_lng float, min_lat float, max_lng float, max_lat float,
  p_operacion text default null,
  p_tipo text[] default null,
  p_precio_min numeric default null,
  p_precio_max numeric default null,
  p_moneda char(3) default null,
  p_dorm_min smallint default null
) returns setof propiedades
language sql stable as $$
  select *
  from propiedades
  where estado = 'publicada'
    and geom_publico && ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)::geography
    and (p_operacion  is null or operacion = p_operacion)
    and (p_tipo       is null or tipo = any(p_tipo))
    and (p_moneda     is null or moneda = p_moneda)
    and (p_precio_min is null or precio >= p_precio_min)
    and (p_precio_max is null or precio <= p_precio_max)
    and (p_dorm_min   is null or dormitorios >= p_dorm_min)
  limit 500;
$$;
```

Para "dibujar mi zona" (el feature diferencial de Zonaprop) es la misma función con
`ST_Within(geom_publico::geometry, ST_GeomFromGeoJSON($1))`.

### UX de búsqueda (patrón Zonaprop, probado)

- **Split view**: lista a la izquierda, mapa a la derecha, sincronizados. En mobile,
  toggle lista ⇄ mapa.
- Checkbox **"Buscar mientras muevo el mapa"** (debounce ~400 ms).
- Hover en la tarjeta → resalta el pin; click en el pin → mini-card con foto y precio.
- **Todo el estado va en la URL** (`?op=venta&tipo=casa&precioMax=120000&bbox=...`): hace
  la búsqueda compartible por WhatsApp — que en Argentina es *el* canal — y indexable.
- Clustering con supercluster; a bajo zoom se muestran burbujas con cantidad y precio medio.
- Dibujo de polígono a mano alzada.
- Guardar búsqueda + alerta por email/WhatsApp cuando entra algo que matchea.

### Precios en dos monedas — detalle argentino no negociable

Se guarda `precio` + `moneda` sin conversión. El filtro de precio opera sobre la moneda
elegida por el usuario; si se quiere un filtro unificado, se convierte **en la consulta**
con una cotización cacheada diaria (tabla `cotizaciones`), nunca reescribiendo el dato
original. Mostrar siempre la moneda de publicación como principal.

### Privacidad de la ubicación

Práctica estándar del rubro: para propiedades donde el vendedor no quiere el domicilio
expuesto, el mapa público muestra un punto desplazado aleatoriamente dentro de ~200-300 m
(`geom_publico`) y la ficha aclara "ubicación aproximada". La ubicación exacta queda
protegida por RLS y solo la ve el agente. Esto también evita que la competencia levante
la cartera.

### Integración con CRM (decisión clave)

Si Nova ya usa **Tokko Broker** (estándar de facto en Argentina) o similar:
consumir su API y **no duplicar la carga**. La web se vuelve un consumidor del CRM, con
un job de sincronización (cron cada 15-30 min → upsert por `crm_id`). Ventaja enorme: el
equipo sigue cargando donde ya carga, y el mismo CRM sigue publicando en Zonaprop /
Argenprop / Mercado Libre.

Si **no** usan CRM: panel de administración propio en la web (carga, fotos con drag &
drop, geocodificación asistida por mapa arrastrando el pin) + generación de feed XML para
los portales.

**Esta pregunta cambia entre 15 y 40 horas de proyecto. Hay que responderla antes de
cotizar.**

---

## 5. Costos operativos estimados (mensual, USD)

| Ítem | Costo |
|---|---|
| Vercel (Hobby → Pro si hace falta) | 0 – 20 |
| Supabase (Free → Pro) | 0 – 25 |
| Tiles de mapa (MapLibre + MapTiler/Mapbox free tier) | 0 hasta ~50k cargas/mes |
| Email transaccional (Resend/Brevo) | 0 – 15 |
| Dominio | ~1.5 |
| **Total realista año 1** | **US$ 0 – 60 / mes** |

El proyecto no tiene un problema de costo de infraestructura. A este volumen, todo entra
en capas gratuitas o casi.

---

## 6. Riesgos reales y mitigaciones

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| Inventario chico → mapa vacío | **Alta** | Mapa siempre acompañado de lista; landing por zona; y sobre todo: **masterplan interactivo de lotes** (ver abajo) |
| Datos sin geolocalizar | **Alta** | Geocodificación batch inicial + pin arrastrable obligatorio en el alta |
| SEO: imposible ganarle a Zonaprop en genéricos | Certeza | No competir ahí. Apuntar a long-tail de zona y emprendimiento + marca |
| Doble carga (CRM y web) | Media | Sincronización por API desde el CRM, dirección única del dato |
| Fotos pesadas → sitio lento | Media | Storage + `next/image`, AVIF/WebP, lazy, límite de resolución en el alta |
| Legal: publicidad inmobiliaria | Baja | Matrícula del corredor visible (CPCIC Córdoba); política de privacidad y consentimiento para leads (Ley 25.326) |

### El diferencial que sí puede ganar: masterplan de lotes

Nova vende **lotes en Anisacate / Parque Carrasco**. Un mapa de lotes interactivo
(polígonos del loteo coloreados por estado: disponible / reservado / vendido, con
superficie, precio y ficha al click) es algo que **Zonaprop no puede ofrecer** porque su
modelo es un aviso por unidad. Es exactamente el mismo stack (PostGIS + MapLibre, cambia
`Point` por `Polygon`), y es el argumento comercial más fuerte del proyecto: no es "otra
web de inmobiliaria", es la herramienta de venta de sus loteos.

Recomiendo poner esto en el centro de la propuesta al cliente.

---

## 7. Plan por fases

**Fase 0 — Relevamiento (1 semana)**
Inventario real (cantidad, calidad de fotos, si hay lat/lng), CRM sí/no, definición de
campos y taxonomía de zonas, wireframes del buscador.

**Fase 1 — MVP (4–6 semanas)**
- Home + institucional + servicios (rehacer, sin placeholders, sin páginas duplicadas)
- Catálogo con filtros (operación, tipo, precio+moneda, dormitorios, baños, superficie, zona)
- **Mapa split-view sincronizado con la lista + clustering**
- Ficha de propiedad SEO (SSR, URL slug, galería, mapa, datos estructurados
  `schema.org/RealEstateListing`, WhatsApp click-to-chat, formulario de consulta)
- Panel de administración o sincronización con CRM
- Leads a base de datos + notificación por email, con UTM y origen
- Responsive real, Core Web Vitals en verde, sitemap + robots

**Fase 2 — Diferenciación (3–4 semanas)**
- Dibujar zona en el mapa
- Masterplan interactivo de lotes
- Favoritos + búsquedas guardadas + alertas
- Landings por zona (Anisacate, Alta Gracia, Carlos Paz, La Rancherita, San Vicente)
- Tasación online como imán de leads de vendedores
- Panel de métricas (vistas por propiedad, leads por origen)

**Fase 3 — Escala (a demanda)**
Feed XML a portales, portal del propietario (seguimiento de su propiedad), multi-agente
con leads asignados, blog.

**Esfuerzo estimado:** Fase 1 ≈ 120–180 h · Fase 2 ≈ 70–110 h.

---

## 8. Preguntas que hay que hacerle al cliente antes de cotizar

1. ¿Cuántas propiedades activas tienen hoy y cuántas proyectan a 12 meses?
2. ¿Usan CRM inmobiliario (Tokko Broker, Inmoup, otro)? ¿Con qué publican en Zonaprop?
3. ¿Cuántos loteos/emprendimientos propios manejan? ¿Tienen los planos de mensura?
   (define si el masterplan de lotes entra en Fase 1)
4. ¿Quién carga las propiedades y con qué frecuencia?
5. ¿Alquiler temporario (Carlos Paz) entra en el alcance? Cambia el modelo: necesita
   calendario de disponibilidad y es otro proyecto.
6. Cuando dicen "como Zonaprop", ¿quieren **su** catálogo con esa experiencia, o quieren
   un portal donde publiquen otras inmobiliarias? (§2 — respuestas muy distintas)
7. ¿Hay presupuesto de pauta? Sin tráfico, la mejor web convierte cero.

---

## 9. Recomendación

**Avanzar, con alcance B (web propia con experiencia de portal).** El riesgo técnico es
bajo, el costo operativo es casi nulo y el stack es el mismo que ya se viene usando. La
búsqueda por mapa con filtros es un requerimiento perfectamente resuelto por PostGIS +
MapLibre a la escala de Nova.

Lo que hay que gestionar no es la tecnología sino las expectativas: **una web propia no
compite con Zonaprop por tráfico, compite por conversión y por marca.** Si el cliente
espera reemplazar al portal como fuente de visitas, la propuesta va a decepcionar. Si lo
que quiere es una vidriera propia con la experiencia del portal, un masterplan de lotes
que ningún portal le puede dar, y control total sobre sus leads, el proyecto se paga
solo.
