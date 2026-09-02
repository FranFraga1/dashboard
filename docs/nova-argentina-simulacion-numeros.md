# Nova Argentina — Simulación de números para la reunión

Fecha: 2026-09-02
Complementa `nova-argentina-viabilidad.md` y `nova-argentina-presupuesto-seo.md`

---

## 0. Advertencia de honestidad intelectual

**Todo lo que sigue es un modelo, no una medición.** No tengo el volumen real de
publicaciones de Nova (el entorno tiene bloqueado el acceso a `novaargentina.ar` y a los
portales), ni acceso a su Search Console, ni sus operaciones cerradas por año.

En la reunión esto se presenta como **"así se comporta el negocio según estas palancas"**,
no como "vas a facturar X". La diferencia importa: el primero es una herramienta de
decisión, el segundo es una promesa que no se puede cumplir y quema la relación en el mes 6.

### Datos a contar ANTES de la reunión (10 minutos de trabajo)

1. Propiedades activas en `novaargentina.ar/comprar/` → **P = ____**
2. Propiedades publicadas en su perfil de Zonaprop → **____**
3. Ídem Argenprop / Mercado Libre → **____**
4. Cuánto pagan hoy de plan de portal (ARS/mes) → **____**
   *(referencia pública: un plan profesional de Zonaprop figura en ARS 143.250 + impuestos;
   confirmar cuál tienen)*
5. Operaciones cerradas en los últimos 12 meses → **____**
6. Ticket promedio de venta (USD) y % de honorarios → **____**

Los puntos 4, 5 y 6 son los que convierten esta simulación en una conversación real.
Sin ellos, es una planilla bonita.

---

## 1. El modelo: de dónde sale el tráfico

El error típico es proyectar "tráfico total" de una. Se proyecta por **tipo de página**,
porque cada una tiene volumen e intención distintos.

| Tipo de página | Cantidad | Sesiones/mes por página (mes 12) | Conversión a lead |
|---|---:|---:|---:|
| Ficha de propiedad | P | 3 – 8 | 4,0 % |
| Landing de zona (Anisacate, Alta Gracia, Carlos Paz, La Rancherita, San Vicente…) | 8 | 40 – 120 | 2,5 % |
| Página de emprendimiento / loteo | 2 – 4 | 80 – 200 | 3,0 % |
| Guías y notas (blog) | 12 | 20 – 60 | 0,5 % |
| Marca + institucional + derivación de Google Business | — | ~150 total | 3,0 % |

**El hallazgo que conviene mostrar en la reunión:** cada ficha de propiedad aporta muy
poco tráfico por sí sola. El motor son las **landings de zona y las páginas de loteo**, que
**no dependen del volumen de publicaciones**.

---

## 2. Sensibilidad al volumen de publicaciones

Escenario base (mes 12), variando solo la cantidad de propiedades activas:

| Propiedades activas (P) | Sesiones de fichas | Sesiones totales/mes | Leads/mes |
|---:|---:|---:|---:|
| 25 | 125 | ~1.045 | ~22 |
| 60 | 300 | ~1.220 | ~26 |
| 120 | 600 | ~1.520 | ~32 |
| 250 | 1.250 | ~2.170 | ~46 |

Pasar de 25 a 120 propiedades **quintuplica el inventario pero solo sube el tráfico un
45 %**. La curva es plana del lado del SEO.

**Pero el volumen sí decide la conversión y la credibilidad.** Un visitante que llega
buscando "casas en Alta Gracia", entra y encuentra tres, se va y no vuelve. Con menos de
~30 propiedades activas, el mapa se ve vacío y el sitio parece abandonado — el problema
no es de posicionamiento, es de producto.

> **Conclusión para la reunión:** el volumen de publicaciones no es la palanca del SEO,
> es el piso de credibilidad del sitio. Si hoy tienen menos de 30 activas, la primera
> tarea no es SEO ni desarrollo: es cargar inventario.

---

## 3. Simulación del embudo — tres escenarios (régimen, mes 12+)

Supuestos de negocio (a confirmar en la reunión):
ticket promedio **USD 55.000** (mix de lotes ~25k y casas ~90k) · honorarios **3,5 %** →
**USD 1.900 por operación**.

| | Conservador | **Base** | Optimista |
|---|---:|---:|---:|
| Sesiones orgánicas / mes | 600 | 1.200 | 1.800 |
| Conversión a lead | 1,8 % | 2,2 % | 2,5 % |
| **Leads / mes** | **11** | **26** | **45** |
| Lead → operación cerrada | 2,0 % | 2,5 % | 3,0 % |
| **Operaciones / año** | **2,6** | **7,9** | **16,2** |
| **Honorarios / año (USD)** | **4.940** | **15.010** | **30.780** |

El rango es enorme a propósito. En SEO inmobiliario la diferencia entre 2,6 y 16
operaciones al año no la define el proveedor: la define el inventario, la zona y qué tan
rápido atienden los leads.

---

## 4. Inversión total y punto de equilibrio

| Concepto | Año 1 (USD) | Año 2 (USD) |
|---|---:|---:|
| Desarrollo web Fase 1 *(estimado 150 h — no cotizado formalmente aún)* | 4.200 | — |
| Setup SEO (único) | 850 | — |
| Abono SEO Plan B (480 × 12) | 5.760 | 5.760 |
| Infraestructura (hosting, base, mapas, email) | 480 | 480 |
| **Total** | **11.290** | **6.240** |

**Punto de equilibrio: 5,9 operaciones** en el año 1 · **3,3 operaciones** en el año 2.

### Resultado acumulado a 24 meses

En el año 1 el tráfico solo existe a partir del mes ~5, así que se computa **50 % del
régimen**:

| Escenario | Año 1 | Año 2 | **Acumulado 24 meses** |
|---|---:|---:|---:|
| Conservador | 2.470 − 11.290 = **−8.820** | 4.940 − 6.240 = **−1.300** | **−10.120** |
| **Base** | 7.505 − 11.290 = **−3.785** | 15.010 − 6.240 = **+8.770** | **+4.985** |
| Optimista | 15.390 − 11.290 = **+4.100** | 30.780 − 6.240 = **+24.540** | **+28.640** |

**Lectura honesta para la reunión:**

- En el escenario **base**, el proyecto se paga solo alrededor del **mes 17–18**.
- En el escenario **conservador, no se paga en 24 meses** con operaciones orgánicas
  directas. Hay que decirlo. El proyecto igual se justifica por dos vías que no están en
  esta tabla: el sitio **convierte mejor los leads que ya llegan** del portal, de
  referidos y de redes (todo el tráfico de marca pasa por ahí), y **el activo queda**.
- Esto no es una inversión de retorno rápido. Es infraestructura comercial.

---

## 5. La comparación que gana la reunión

| | Portal (Zonaprop) | Sitio propio + SEO |
|---|---|---|
| Naturaleza del gasto | **Alquiler** | **Activo** |
| Si dejás de pagar | Desaparecés al día siguiente | Las páginas siguen posicionadas meses |
| El lead es de… | El portal (y se lo muestra también a la competencia) | Nova, en exclusiva |
| Costo por lead | Sube todos los años | Baja a medida que el contenido madura |
| Diferenciación | Ninguna: la misma ficha que los otros 55 de la zona | Masterplan de lotes, contenido de zona, marca |

El argumento de cierre no es "dejá el portal". Es: **hoy el 100 % de la generación de
demanda es alquilada. La propuesta es empezar a construir el 30 % propio, sin tocar lo
otro.** Nadie tiene que arriesgar el canal que ya funciona.

Con el plan de portal en mano (dato 4 de la lista de arriba) el abono SEO se puede
presentar en la misma unidad de medida: *"esto sale el equivalente a X meses de tu plan de
Zonaprop, y a diferencia de él, en el mes 24 seguís siendo dueño de lo que construiste."*

---

## 6. Anexo: ¿por qué no hacer SEO sobre la web actual?

Corrección al documento anterior: **decir "es tirar la plata" fue demasiado tajante.**
Sí se puede hacer SEO sobre el sitio actual. La cuestión es el techo y el costo de
oportunidad. El detalle:

### Lo que se puede hacer hoy, sin tocar el sitio

Y funciona:

- **Google Business Profile** — pesa muchísimo en búsquedas locales ("inmobiliaria en Alta
  Gracia") y es casi independiente del sitio. Reclamo, categorías, zonas, fotos,
  publicaciones, reseñas.
- **Reseñas de clientes** — de los factores más fuertes del pack local.
- **Consistencia de NAP** (nombre, dirección, teléfono) en directorios y portales.
- **Arreglar la página de contacto duplicada y el texto placeholder** — 30 minutos.

Esto es real y se puede vender como un **Plan A acotado (USD 280/mes)** si el cliente no
aprueba el rebuild ahora.

### Lo que el sitio actual sí bloquea

- **Fichas de propiedad indexables.** Si las propiedades no tienen URL propia, todo el
  long-tail de inventario ("lote 1.200 m² Parque Carrasco") es inalcanzable. `[verificar]`
- **Landings de zona.** Si es WordPress se pueden crear — y ahí el techo sube bastante.
  **Este es el dato que no pude verificar y que cambia el diagnóstico.**
- **Señales de calidad.** Placeholder de plantilla y dos páginas de contacto compitiendo
  son exactamente lo que los sistemas de calidad de Google penalizan.
- **Rendimiento y Core Web Vitals.** Sin acceso, desconocido.

### El argumento verdadero (y el que hay que usar)

No es que no se pueda. Es que **si hacemos SEO ahora y rehacemos el sitio en 6 meses, se
paga dos veces y se arriesga perder lo ganado en la migración.** Cada URL posicionada hay
que redirigirla, cada contenido migrarlo, y los rebuilds mal migrados pierden entre 20 % y
40 % del tráfico durante meses.

Hacerlos juntos es estrictamente más barato: la arquitectura de URLs, el renderizado en
servidor y los datos estructurados salen **gratis** si se definen al construir, y se cobran
aparte si hay que retrofitearlos.

**Entonces la recomendación queda así:**

| Situación del cliente | Qué proponer |
|---|---|
| Aprueba el rebuild ahora | SEO en paralelo a Fase 1 — el escenario de este documento |
| No lo aprueba todavía | Plan A acotado: GBP + reseñas + fixes, **sin prometer posiciones de inventario**, y se revisa en 3 meses |
| No quiere ninguna de las dos | No vender un abono SEO completo sobre el sitio actual. Ahí sí sería cobrar por algo que no puede rendir |
