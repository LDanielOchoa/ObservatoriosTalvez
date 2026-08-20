# DESIGN: guía para replicar Yahel / stepbro

Especificación visual y técnica de la landing publicada en:

`https://yahel.stepbro.site/`

Fecha de análisis: 20 de agosto de 2026.

## 1. Alcance y nivel de precisión

Esta guía se construyó inspeccionando el HTML renderizado, la hoja CSS compilada y los módulos JavaScript públicos de la página. Los valores de color, tipografía, breakpoints, duraciones, nombres de componentes y algoritmos de interacción que aparecen aquí provienen de esos artefactos publicados.

Las posiciones exactas en píxeles pueden variar según viewport, navegador, carga de fuentes y contenido. Para una réplica visual idéntica también hacen falta los mismos thumbnails, avatares y fotografía. La estructura y el comportamiento sí pueden reproducirse con las reglas de este documento.

Los atributos `data-astro-cid-*` del HTML son hashes generados por Astro. No deben copiarse: aparecen automáticamente al compilar componentes con estilos scoped.

La página no se siente como un dashboard ni como una plantilla SaaS. Su lenguaje es:

- Portafolio editorial para un creador.
- Cielo azul, nubes suaves y superficies de papel.
- Tipografía grande, ligera y muy apretada.
- Interacciones cortas, físicas y discretas.
- Color azul reservado para acción, estado, enlaces y prueba de confianza.
- Textura de grano para evitar gradientes digitales demasiado limpios.
- Mucho espacio vacío y secciones que se leen como escenas sucesivas.

## 2. Diagnóstico visual

### 2.1 Idea central

La composición combina tres capas:

1. **Editorial:** grandes titulares, ritmo vertical, textos breves y secciones con una sola idea.
2. **Material:** fondos `paper` y `bone`, bordes redondeados, sombras suaves, blur y ruido.
3. **Digital/pixel:** nombre del hero revelado por caracteres, bloques 5 x 5 sobre thumbnails, shader WebGL y controles con forma de cápsula.

La estética funciona porque la capa pixel no domina. Es un acento en el hero y en el portfolio; el resto del sistema es limpio y tipográfico.

### 2.2 Jerarquía

- El nombre `stepbro yahel` es el elemento de mayor escala.
- Los titulares de sección son grandes, pero nunca pesan demasiado.
- Los números y métricas aparecen como prueba social, no como gráficos.
- El azul identifica CTA, enlaces activos, puntuaciones y datos verificables.
- Las descripciones usan gris medio para no competir con los títulos.
- Los íconos son geométricos, monocromos y pequeños.

### 2.3 Ritmo de página

La página alterna superficies para crear una cadencia visual:

| Orden | Sección | Superficie dominante | Función |
| --- | --- | --- | --- |
| 1 | Navegación | Transparente sobre la página | Orientación y CTA |
| 2 | Hero | Gradiente cielo con shader | Identidad y primera impresión |
| 3 | Intro | `paper` hacia `bone` | Promesa y posicionamiento |
| 4 | Clientes | `bone` con tarjeta `paper` | Prueba social en movimiento |
| 5 | Trabajo | `paper` | Portafolio visual horizontal |
| 6 | Servicios | `bone` | Capacidades en bento grid |
| 7 | Testimonios | `paper` | Validación cualitativa |
| 8 | Sobre mí | `bone` | Contexto personal y hechos |
| 9 | Contacto | `paper` con panel cielo | Cierre y conversión |

No se debe convertir cada sección en una tarjeta flotante. Las tarjetas se reservan para contenido agrupado: clientes, estadísticas, trabajos, servicios y testimonios.

## 3. Tokens de diseño

### 3.1 Variables principales

```css
:root {
  color-scheme: light;

  --font-sans: "Geist", ui-sans-serif, system-ui, -apple-system,
    "Segoe UI", sans-serif;
  --font-mono: "Geist Mono", ui-monospace, "SF Mono", monospace;
  --font-pixel: "Pixelify Sans", "Silkscreen", "Geist Pixel", "Geist",
    sans-serif;

  --color-sky-dark: #0064c1;
  --color-sky: #259ce6;
  --color-sky-light: #d3e2f0;
  --color-cloud-shadow: #b8c6d6;
  --color-blue-vivid: #0f2fe8;
  --color-bone: #f7f6f3;
  --color-paper: #fbfbfa;
  --color-ink: #0a0a0a;
  --color-ink-soft: #2f3437;
  --color-muted: #787774;
  --color-hairline: #0a0a0a14;

  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out-smooth: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-elastic: elastic.out(0.7, 0.55);
}
```

La hoja original también define `--font-pixel`, aunque los textos principales usan `Geist`. Las familias pixel (`Pixelify Sans`, `Silkscreen`, `Geist Pixel`) deben tratarse como recursos opcionales para detalles, no como tipografía global.

### 3.2 Colores adicionales usados directamente

| Uso | Valor |
| --- | --- |
| Fondo alterno visible | `#f1f0ec` |
| Fondo de tarjeta de servicio/testimonio | `#f3f2ee` |
| Hover de tarjeta | `#eceae4` |
| Panel de contacto | `#cfe6fb` |
| Fondo de foto | `#d6e7f8` a `#aecdf0` |
| Azul estático superior del hero | `#2e90e8` |
| Azul medio del hero | `#74b8f2` |
| Azul claro del hero | `#d8ecfb` |
| Gradiente base de CTA | `#66b2ff`, `#4fa3ff`, `#4a9ffb` |
| Gradiente del card de intro | `#7fc7ff`, `#4ea3ff`, `#4292f1` |

El shader usa colores GLSL equivalentes aproximados a `#2a8beb`, `#6bb8f6` y `#fbfbfa`. No hay que elegir una paleta azul saturada arbitraria: el azul del sitio se aclara hacia blanco en la mitad inferior.

### 3.3 Tipografía

```css
@font-face {
  font-family: Geist;
  src: url("/fonts/Geist-Variable.woff2") format("woff2-variations");
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: Geist Mono;
  src: url("/fonts/GeistMono-Variable.woff2") format("woff2-variations");
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: Pixelify Sans;
  src: url("/fonts/PixelifySans-Variable.woff2") format("woff2-variations");
  font-weight: 400 700;
  font-style: normal;
  font-display: swap;
}

html {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

body {
  font-family: var(--font-sans);
  font-feature-settings: "ss01", "cv01";
}
```

Reglas tipográficas observadas:

- Los headings usan generalmente `font-weight: 540` o `560`, no `700`.
- El hero usa `font-weight: 400`, `line-height: 1` y `letter-spacing: -0.04em`.
- Los títulos grandes usan tracking negativo entre `-0.035em` y `-0.06em`.
- Los labels de canal usan `Geist Mono`, `0.68rem`, uppercase y `0.12em` de tracking.
- Los eyebrows usan uppercase y aproximadamente `0.14em` de tracking.
- El texto de lectura suele estar entre `1.05rem` y `1.35rem`, con `line-height` de `1.45` a `1.6`.
- El color por defecto es casi negro, no negro puro del navegador.

### 3.4 Escala geométrica

La página evita números fijos cuando una dimensión puede responder al viewport.

```css
/* Patrones recurrentes observados */
padding-inline: clamp(1.25rem, 4vw, 2.5rem);
border-radius: clamp(20px, 3vw, 36px);
gap: clamp(1.5rem, 3vw, 3rem);
font-size: clamp(2.2rem, 4.8vw, 3.6rem);
```

Contenedores máximos:

| Zona | `max-width` |
| --- | --- |
| Navegación | `80rem` |
| Intro, clientes, servicios, about | `78rem` |
| Trabajo | `86rem` |
| Testimonios | `72rem` |
| Contacto | `80rem` |

El gutter de secciones suele ser `clamp(1.25rem, 4vw, 2.5rem)`. El hero es la excepción y usa un margen exterior muy pequeño: entre `10px` y `18px`.

## 4. Arquitectura recomendada en Astro

La página publicada está organizada conceptualmente como componentes Astro, con un script específico por sección.

```text
src/
  components/
    Nav.astro
    GrainGradient.astro
    Hero.astro
    IntroAlt.astro
    Clients.astro
    Work.astro
    Services.astro
    Testimonials.astro
    About.astro
    Contact.astro
  layouts/
    Layout.astro
  pages/
    index.astro
    en.astro
  scripts/
    nav.ts
    hero.ts
    grain-gradient.ts
    intro-alt.ts
    work.ts
    sections.ts
  styles/
    global.css
```

En este proyecto ya existen Astro, React y Tailwind, pero la referencia no depende de React para la estructura principal. Para una réplica fiel conviene usar Astro estático y JavaScript puntual. React solo debe entrar si algún componente interactivo nuevo lo necesita.

Esqueleto de página:

```astro
<Layout lang="es" title="Nombre — Profesión">
  <Nav />
  <main>
    <Hero />
    <IntroAlt />
    <Clients />
    <Work />
    <Services />
    <Testimonials />
    <About />
    <Contact />
  </main>
</Layout>
```

Los datos de clientes, trabajos y testimonios deben vivir en arrays o contenido estructurado. El HTML de la referencia usa elementos semánticos: `nav`, `section`, `header`, `dl`, `ul`, `article`, `figure`, `blockquote` y `footer`.

## 5. Base global

El fondo del `body` es `var(--color-paper)` y el scroll es suave salvo cuando el usuario pide reducir movimiento.

```css
* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  background: var(--color-paper);
  color: var(--color-ink);
  overflow-x: hidden;
}

img,
svg,
video,
canvas {
  display: block;
  max-width: 100%;
}

a {
  color: inherit;
  text-decoration: none;
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }

  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

::selection {
  color: var(--color-ink);
  background: #259ce64d;
}
```

No añadir un reset visual que cambie el comportamiento de headings o anchors. La referencia parte de un reset ligero y luego define explícitamente los tamaños de `h1`, `h2`, `h3`, párrafos y listas.

## 6. Navegación

### 6.1 Estructura

La navegación tiene tres zonas en un grid de tres columnas:

```html
<header class="nav" data-nav>
  <div class="nav__inner">
    <a class="nav__brand" data-flip href="#top">nombre</a>
    <nav class="nav__links" aria-label="Principal" data-flip>
      <a class="nav__link" href="#work">Trabajo</a>
      <a class="nav__link" href="#services">Servicios</a>
      <a class="nav__link" href="#clients">Clientes</a>
      <a class="nav__link" href="#about">Sobre mí</a>
    </nav>
    <div class="nav__actions" data-flip>
      <a class="nav__lang" href="/en">ES / EN</a>
      <a class="nav__cta btn-sky" href="mailto:correo@ejemplo.com">
        Trabajemos juntos
      </a>
    </div>
  </div>
</header>
```

### 6.2 Estado inicial

```css
.nav {
  position: fixed;
  inset: 0 0 auto;
  z-index: 50;
  padding: 1rem clamp(1rem, 4vw, 2.5rem);
}

.nav__inner {
  width: 100%;
  max-width: 80rem;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 1.5rem;
}

.nav__brand {
  justify-self: start;
  padding: 0.62rem 1.15rem;
  border-radius: 999px;
  font-size: 1.3rem;
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.03em;
}

.nav__links {
  display: flex;
  gap: 0.35rem;
  padding: 0.3rem;
  border-radius: 999px;
  background: #0a0a0a0a;
}

.nav__link {
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  color: var(--color-ink-soft);
  font-size: 0.875rem;
  font-weight: 450;
  transition: background-color 0.25s var(--ease-out-expo),
    color 0.25s var(--ease-out-expo);
}

.nav__link:hover {
  color: var(--color-ink);
  background: var(--color-paper);
  box-shadow: 0 1px 2px #0a0a0a0a;
}

.nav__actions {
  position: relative;
  justify-self: end;
  display: flex;
  align-items: center;
}

.nav__lang {
  position: absolute;
  right: 100%;
  top: 50%;
  margin-right: 0.85rem;
  transform: translateY(-50%);
  white-space: nowrap;
  color: var(--color-muted);
  font-size: 0.72rem;
  letter-spacing: 0.04em;
}

@media (max-width: 640px) {
  .nav {
    display: none;
  }
}
```

### 6.3 Estado al hacer scroll

El estado `is-stuck` se activa cuando `window.scrollY > 24`.

- El grid pasa a `display: flex`, `justify-content: center` y `gap: 8px`.
- La marca y la cápsula de enlaces reciben fondo blanco semitransparente.
- Se aplica `backdrop-filter: blur(14px) saturate(140%)`.
- Aparece una sombra muy ligera y un highlight interior.
- El selector de idioma desaparece con `opacity: 0` y `pointer-events: none`.
- La transición de estado usa GSAP Flip sobre los elementos con `data-flip`.
- Duración aproximada: `0.95s`.
- Ease: `elastic.out(0.7, 0.55)`.

Pseudocódigo:

```js
const nav = document.querySelector("[data-nav]");
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
let stuck = false;

function update() {
  const next = scrollY > 24;
  if (next === stuck) return;

  if (!reduced) {
    const state = Flip.getState("[data-flip]", {
      props: "backgroundColor,boxShadow",
    });
    nav.classList.toggle("is-stuck", next);
    Flip.from(state, {
      duration: 0.95,
      ease: "elastic.out(0.7, 0.55)",
      absolute: true,
      scale: true,
      nested: true,
    });
  } else {
    nav.classList.toggle("is-stuck", next);
  }

  stuck = next;
}
```

El click sobre la marca vuelve arriba con GSAP `ScrollToPlugin`, duración `0.9s`, ease `power3.inOut`. Con reduced motion debe usar `window.scrollTo(0, 0)`.

## 7. Hero

### 7.1 Composición

El hero no ocupa la pantalla completa directamente. El `body` conserva fondo papel y dentro existe un panel casi full viewport.

```css
.hero {
  padding: clamp(74px, 9vh, 104px)
    clamp(10px, 1.4vw, 18px)
    clamp(10px, 1.4vw, 18px);
  background: var(--color-paper);
}

.hero__panel {
  position: relative;
  width: 100%;
  height: calc(100svh - clamp(86px, 11vh, 122px));
  min-height: 460px;
  overflow: hidden;
  isolation: isolate;
  border-radius: clamp(20px, 2.2vw, 34px);
}

.hero__content {
  position: absolute;
  z-index: 2;
  left: clamp(1rem, 3vw, 2.5rem);
  right: clamp(1rem, 3vw, 2.5rem);
  bottom: clamp(0.25rem, 2vh, 1.5rem);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: clamp(0.75rem, 1.6vh, 1.25rem);
}
```

Contenido observado:

- Eyebrow: `Editor de video`.
- Tres pills de estadísticas: `+100M`, `+100`, `+8M`.
- Nombre grande: `stepbro yahel`.
- CTA móvil: `Trabajemos juntos`.

El CTA del hero se oculta en escritorio porque la navegación ya contiene el CTA principal. En móvil aparece como botón ancho dentro del panel.

### 7.2 Fondo estático de respaldo

El fondo CSS siempre debe existir antes de inicializar WebGL:

```css
.grain-gradient {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background:
    radial-gradient(90% 70% at 78% 12%, #6cb6f5 0%, transparent 55%),
    linear-gradient(
      180deg,
      #2e90e8 0%,
      #74b8f2 42%,
      #d8ecfb 74%,
      var(--color-paper) 100%
    );
}

.grain-gradient::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: clamp(30px, 6vh, 60px);
  pointer-events: none;
  background: linear-gradient(to bottom, transparent, var(--color-paper));
}
```

La transición a `paper` en el borde inferior hace que el hero no parezca una imagen recortada; visualmente se integra con la siguiente sección.

### 7.3 Shader WebGL

El componente `GrainGradient` crea un canvas WebGL de pantalla completa. La receta exacta es:

- Contexto `webgl` con `antialias: false` y `alpha: false`.
- Un triángulo que cubre todo el viewport: `[-1,-1, 3,-1, -1,3]`.
- Vertex shader que proyecta `a_pos` directamente a clip space.
- Fragment shader con `hash`, `noise` interpolado y `fbm` de cinco octavas.
- Domain warping con dos campos `q` y dos ruidos derivados `n` y `n2`.
- Tiempo base: `u_time * 0.045`.
- Canvas renderizado al `90%` del tamaño CSS y ampliado `scale(1.03)`.
- Blur CSS de `1.2px`.
- `u_intensity = 1` para hero y `0.55` para contacto.
- El shader se anima solo cuando el componente intersecta el viewport.
- El movimiento aumenta un poco según la velocidad del puntero, limitado aproximadamente entre `1` y `11`.

Fragment shader simplificado pero fiel al algoritmo:

```glsl
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_intensity;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(a, b, u.x)
    + (c - a) * u.y * (1.0 - u.x)
    + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float aspect = u_resolution.x / u_resolution.y;
  vec2 p = uv;
  p.x *= aspect;

  float t = u_time * 0.045;
  vec2 q = vec2(
    fbm(p + vec2(0.0, t)),
    fbm(p + vec2(4.3, -t * 0.7))
  );

  float n = fbm(p * 1.1 + 1.4 * q + vec2(t * 0.30, 0.0));
  float n2 = fbm(p * 1.8 + 1.1 * q + vec2(-t * 0.25, t * 0.20));

  vec3 skyTop = vec3(0.165, 0.545, 0.920);
  vec3 skyMid = vec3(0.420, 0.720, 0.965);
  vec3 white = vec3(0.984, 0.984, 0.980);

  float vert = uv.y;
  vec3 color = mix(white, skyMid, smoothstep(0.0, 0.8, vert));
  color = mix(color, skyTop, smoothstep(0.5, 1.0, vert));

  float bloom = smoothstep(0.48, 0.92, n2);
  color = mix(color, white, bloom * 0.8 * (1.0 - vert * 0.35));

  float diagonal = p.x * 0.6 + p.y * 0.4;
  float streak = smoothstep(
    0.5,
    1.0,
    n + 0.30 * sin(diagonal * 2.4 - t * 1.3)
  );
  color = mix(color, white, streak * 0.45);

  float grain = hash(gl_FragCoord.xy + floor(u_time * 16.0));
  color += (grain - 0.5) * 0.02;
  color = mix(color, mix(color, white, 0.45), 1.0 - u_intensity);

  gl_FragColor = vec4(color, 1.0);
}
```

El canvas se marca con `data-ready` al estar listo y solo entonces pasa de `opacity: 0` a `opacity: 1` en `0.9s`. Si WebGL no está disponible, el gradiente estático sigue siendo válido.

### 7.4 Grano CSS

El grano nítido se superpone por separado del shader. Es una textura SVG inline con `feTurbulence`:

```css
.grain-gradient__grain {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  opacity: 0.5;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg ... feTurbulence ... %3E");
  background-size: 180px 180px;
  animation: grain-shift 0.55s steps(5) infinite;
}

@keyframes grain-shift {
  0% { background-position: 0 0; }
  20% { background-position: -30px 10px; }
  40% { background-position: 20px -25px; }
  60% { background-position: -15px 20px; }
  80% { background-position: 25px 15px; }
  100% { background-position: 0 0; }
}
```

El mismo componente se reutiliza en contacto con intensidad `soft`. En reduced motion el grano no debe animarse.

### 7.5 Estadísticas y nombre

Las estadísticas son cápsulas translúcidas:

```css
.hero__stats {
  display: flex;
  flex-wrap: wrap;
  gap: clamp(0.3rem, 0.7vw, 0.5rem);
}

.hero__stat {
  display: inline-flex;
  align-items: baseline;
  gap: 0.55rem;
  padding: 0.8rem 1.45rem;
  border-radius: 999px;
  background: #ffffff80;
  backdrop-filter: blur(8px);
}

.hero__stat-value {
  font-size: clamp(1.05rem, 1.9vw, 1.5rem);
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.02em;
}

.hero__stat-label {
  color: var(--color-ink-soft);
  font-size: clamp(0.72rem, 1vw, 0.85rem);
}
```

El nombre usa un gradiente de texto y mezcla `multiply`:

```css
.hero__name {
  display: block;
  margin: 0;
  user-select: none;
  white-space: nowrap;
  font-size: 12vw;
  font-weight: 400;
  line-height: 1;
  letter-spacing: -0.04em;
  opacity: 0.85;
  mix-blend-mode: multiply;
  background: linear-gradient(180deg, #a9cdf0, #5f93d4);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
}
```

El script no deja que el texto desborde: mide el `scrollWidth` a `100px` y `200px`, calcula la relación lineal y asigna el tamaño que ocupa el ancho disponible. En móvil calcula cada palabra por separado y permite dos líneas.

### 7.6 Animación del hero

La referencia usa GSAP `SplitText` para separar el nombre por caracteres:

- Estado inicial de cada carácter: `yPercent: 70`, `opacity: 0`, `filter: blur(14px)`.
- Entrada: `duration: 1`, `ease: back.out(2.4)`, `stagger: 0.028`, `delay: 0.15`.
- Eyebrow, stats y CTA: parten de `opacity: 0`, `y: 18`.
- Entrada de esos elementos: `duration: 0.9`, `ease: expo.out`, `stagger: 0.1`, `delay: 0.5`.
- Cada carácter contiene un span interno para conservar el gradiente después del split.
- Con reduced motion se muestran directamente, sin blur ni desplazamiento.

## 8. Intro y tarjeta de prueba

### 8.1 Layout

La intro empieza con un degradado de `paper` hacia `#f1f0ec` y usa dos columnas.

```css
.intro-alt {
  padding: clamp(5.5rem, 13vh, 9rem)
    clamp(1.25rem, 4vw, 2.5rem);
  background: linear-gradient(to bottom, var(--color-paper) 0%, #f1f0ec 10rem);
}

.intro-alt__inner {
  width: min(100%, 78rem);
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(22rem, 28rem);
  align-items: start;
  gap: clamp(3rem, 8vw, 8rem);
}
```

Título:

- `font-size: clamp(2.4rem, 6.8vw, 6.6rem)`.
- `max-width: 15ch`.
- `font-weight: 540`.
- `line-height: 0.96`.
- `letter-spacing: -0.06em`.

Lista de especialidades:

- Cada línea es grande: `clamp(1.8rem, 3.8vw, 4.1rem)`.
- Color inactivo: `var(--color-muted)`.
- Color activo: `var(--color-sky-dark)`.
- El activo muestra un `✦` azul a la izquierda.
- La estrella empieza en `scale(.5)` y `opacity: 0`, y entra con `var(--ease-out-expo)`.

### 8.2 Card azul sticky

La columna derecha tiene una tarjeta que permanece visible en desktop:

```css
.intro-alt__card {
  position: sticky;
  top: 7rem;
  min-height: clamp(28rem, 60vh, 40rem);
  padding: clamp(1.6rem, 3vw, 2.6rem);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  border-radius: clamp(1.8rem, 3vw, 3rem);
  color: #fff;
  background:
    radial-gradient(70% 48% at 20% 7%, #ffffff61, transparent 58%),
    linear-gradient(180deg, #7fc7ff, #4ea3ff 58%, #4292f1);
}
```

Detalles que definen la tarjeta:

- Encabezado `Trabajo verificado` y símbolo `✦`.
- Tres estadísticas separadas por líneas horizontales con alpha blanco.
- Números entre `2.1rem` y `4rem`, tracking negativo.
- Labels alineados a la derecha en desktop.
- Pseudo-elemento circular blanco con blur `26px` en la esquina inferior derecha.
- CTA blanco colocado hacia el borde inferior derecho con `margin-right` y `margin-bottom` negativos.
- El CTA cambia el icono `arrow` desplazándolo `4px` en hover.

### 8.3 Activación por scroll

La intro usa `ScrollTrigger`:

- Elementos con `data-intro-alt` empiezan en `opacity: 0`, `translateY(24px)`.
- Se animan al llegar el trigger a `top 78%`.
- Duración `0.95s`, ease `expo.out`, stagger `0.055`.
- La lista se observa de `top 85%` a `bottom 15%`.
- En cada actualización se calcula el item cuyo centro está más cerca del `55%` de la altura del viewport.
- Solo ese item recibe `.is-active`.
- Fuera del rango todos vuelven a estado inactivo.

Responsive:

- A `max-width: 900px`, se pasa a una columna y la card deja de ser sticky.
- A `max-width: 560px`, el padding horizontal es `1rem`, el título baja a `12ch`, y la lista usa `clamp(1.6rem, 8.5vw, 3.1rem)`.
- En móvil las estadísticas de la card pasan a una sola columna y sus labels se alinean a la izquierda.

## 9. Clientes y marquee

La sección muestra confianza sin logos corporativos. Cada cliente es avatar circular, nombre y número de suscriptores.

### 9.1 Card contenedora

```css
.clients {
  overflow: hidden;
  padding: clamp(0.5rem, 1.5vh, 1rem)
    clamp(1.25rem, 4vw, 2.5rem)
    clamp(4rem, 9.5vh, 7.5rem);
  background: #f1f0ec;
}

.clients__card {
  max-width: 78rem;
  margin: 0 auto;
  padding: clamp(3rem, 6vh, 4.5rem) 0;
  overflow: hidden;
  border-radius: clamp(20px, 3vw, 36px);
  background: var(--color-paper);
  box-shadow: 0 0 0 1px #0a0a0a08,
    0 10px 32px -16px #0a1e4614;
}
```

### 9.2 Loop continuo

El track contiene dos grupos idénticos. El segundo lleva `aria-hidden="true"`.

```html
<div class="clients__viewport" data-clients>
  <div class="clients__track">
    <ul class="clients__group">...</ul>
    <ul class="clients__group" aria-hidden="true">...</ul>
  </div>
</div>
```

```css
.clients__viewport {
  mask-image: linear-gradient(90deg, transparent, #000 7%, #000 93%, transparent);
}

.clients__track {
  display: flex;
  width: max-content;
  animation: clients-marquee 38s linear infinite;
}

.clients__group {
  display: flex;
  align-items: center;
  gap: clamp(1.5rem, 3.5vw, 3rem);
  padding: 0 clamp(0.75rem, 1.75vw, 1.5rem);
}

@keyframes clients-marquee {
  to {
    transform: translateX(-50%);
  }
}

.clients__viewport:hover .clients__track {
  animation-play-state: paused;
}
```

Cada avatar mide `52px`, es circular y tiene sombra de `0 4px 12px -4px #0a285a2e`. Las imágenes deben declarar `width`, `height`, `loading="lazy"` y `decoding="async"`.

## 10. Trabajo seleccionado

Esta es la interacción más importante después del hero. En desktop el scroll vertical se transforma en desplazamiento horizontal; en móvil se usa scroll horizontal nativo.

### 10.1 Sección y track

```css
.work {
  position: relative;
  min-height: auto;
  display: flex;
  align-items: center;
  overflow: hidden;
  padding: clamp(4.5rem, 11vh, 7.5rem)
    clamp(1.25rem, 4vw, 2.5rem);
  background: var(--color-paper);
}

@media (min-width: 769px) {
  .work {
    height: 100vh;
    padding-block: 0;
  }
}

.work__inner {
  width: 100%;
  max-width: 86rem;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: clamp(2.2rem, 5.5vh, 4rem);
}

.work__track-wrap {
  width: 100%;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.work__track-wrap::-webkit-scrollbar {
  display: none;
}

.work__track {
  display: flex;
  width: max-content;
  gap: clamp(1.5rem, 3vw, 3rem);
  padding-bottom: 1.5rem;
}

.wc {
  width: clamp(19rem, 28vw, 31rem);
  flex-shrink: 0;
  scroll-snap-align: start;
}
```

En `min-width: 769px`, el wrapper deja de tener overflow nativo y el track se mueve con GSAP. La cantidad de desplazamiento es:

```js
const distance = () => -(track.scrollWidth - viewport.clientWidth);
```

### 10.2 Card de trabajo

Cada card enlaza a un video externo y contiene thumbnail 16:9, overlay de play y metadatos.

```css
.wc__media {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: clamp(16px, 1.8vw, 24px);
  background: var(--color-sky-light);
  box-shadow: 0 0 0 1px #0a0a0a0a,
    0 12px 36px -12px #0a1e461f,
    0 28px 64px -20px #0a1e4614;
}

.wc__thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.7s var(--ease-out-expo);
}

.wc:hover .wc__thumb {
  transform: scale(1.04);
}

.wc__cap {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-top: clamp(1.1rem, 1.7vw, 1.5rem);
}

.wc__channel-label {
  margin-bottom: 0.45rem;
  color: var(--color-sky-dark);
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.wc__title {
  margin: 0;
  color: var(--color-ink);
  font-size: clamp(1.15rem, 1.6vw, 1.45rem);
  font-weight: 540;
  line-height: 1.22;
  letter-spacing: -0.025em;
}
```

El play es un círculo de vidrio:

- Overlay full-size con `background: #0f2fe814`.
- Opacidad inicial `0`.
- Al hover, opacidad `1`.
- Círculo entre `3rem` y `4rem`.
- Fondo `#ffffff47`, blur `12px`, borde blanco alpha y sombra azul.
- Estado inicial `scale(.8) translateY(10px)`.
- Entrada a `scale(1) translateY(0)` en `0.45s` con ease exponencial.

### 10.3 Revelado pixel 5 x 5

Sobre la imagen se coloca una cuadrícula de 25 bloques:

```css
.wc__pixel-reveal {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-template-rows: repeat(5, 1fr);
  pointer-events: none;
}

.wc__pixel-block {
  width: 101%;
  height: 101%;
  transform-origin: center;
  background: var(--color-sky-light);
}
```

Los bloques empiezan cubriendo el thumbnail y desaparecen con GSAP:

- `scale: 0`.
- `opacity: 0`.
- `duration: 0.65`.
- Ease `power2.inOut`.
- `stagger.amount: 0.45`.
- `grid: [5, 5]`.
- `from: "random"`.

En desktop el trigger usa la animación de contenedor horizontal y comienza cuando la card llega aproximadamente a `left 88%`. En móvil cada card se revela cuando entra a `top 85%`.

### 10.4 Pinning de escritorio

```js
const horizontal = gsap.to(track, {
  x: () => -(track.scrollWidth - viewport.clientWidth),
  ease: "none",
  scrollTrigger: {
    trigger: section,
    pin: true,
    scrub: 1,
    start: "top top",
    end: () => `+=${Math.abs(-(track.scrollWidth - viewport.clientWidth))}`,
    invalidateOnRefresh: true,
  },
});
```

No usar este pinning debajo de `768px`: ahí debe existir un carrusel táctil real. En reduced motion se deben ocultar de inmediato los bloques pixel y evitar la transformación horizontal animada.

## 11. Servicios: bento grid

La sección de servicios vuelve a `#f1f0ec`. El bento está contenido dentro de una caja `paper` que funciona como marco.

```css
.svc {
  padding: clamp(4.5rem, 12vh, 8rem)
    clamp(1.25rem, 4vw, 2.5rem);
  background: #f1f0ec;
}

.svc__inner {
  max-width: 78rem;
  margin: 0 auto;
}

.svc__bento {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: clamp(0.6rem, 1vw, 0.9rem);
  padding: clamp(0.6rem, 1vw, 0.9rem);
  border-radius: clamp(24px, 2.6vw, 34px);
  background: var(--color-paper);
}

.svc-card {
  padding: clamp(1.6rem, 2.4vw, 2.25rem);
  border-radius: clamp(16px, 1.8vw, 22px);
  background: #f3f2ee;
  transition: transform 0.4s var(--ease-out-expo),
    background 0.4s var(--ease-out-expo);
}

.svc-card--wide {
  grid-column: span 2;
}

.svc-card:hover {
  transform: translateY(-3px);
  background: #eceae4;
}
```

La distribución desktop es 3 + 3 + 2: cuatro cards regulares y una card ancha que ocupa dos columnas. La card ancha contiene `Tu estilo, al pie de la letra`.

Iconos:

- SVG inline, no icon font.
- Caja de `30px`.
- Margen inferior aproximado de `2.25rem`.
- Color `var(--color-ink)`.
- Geometría simple: barras, círculos, flecha y líneas.

Entrada por scroll:

- Elementos `data-svc`: `opacity: 0`, `translateY(26px)`.
- Trigger: sección en `top 78%`.
- Duración `0.85s`, ease `expo.out`, stagger `0.08`.

Responsive:

- `max-width: 860px`: dos columnas; la card ancha sigue ocupando dos.
- `max-width: 560px`: una columna; la card ancha ocupa una.

## 12. Testimonios

La sección tiene un encabezado con título a la izquierda y promedio `9.2 / 10` a la derecha. Debajo hay una cuadrícula de dos columnas.

```css
.tst {
  padding: clamp(4.5rem, 11vh, 7.5rem)
    clamp(1.25rem, 4vw, 2.5rem);
  background: var(--color-paper);
}

.tst__inner {
  max-width: 72rem;
  margin: 0 auto;
}

.tst__masonry {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: clamp(0.85rem, 1.6vw, 1.25rem);
}

.tst-card {
  display: flex;
  flex-direction: column;
  padding: clamp(1.75rem, 2.5vw, 2.4rem);
  border-radius: clamp(18px, 1.8vw, 24px);
  background: #f3f2ee;
  transition: background 0.4s var(--ease-out-expo);
}

.tst-card:hover {
  background: #eceae4;
}

.tst-card__by {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin-top: auto;
}
```

Detalles:

- La puntuación usa una estrella SVG azul de `15px` y el formato `10/10`.
- El denominador es gris muted.
- La cita usa `font-size: clamp(1rem, 1.3vw, 1.15rem)` y `line-height: 1.55`.
- La foto del autor mide `40px` y es circular.
- `margin-top: auto` alinea los autores aunque las citas tengan distinta altura.
- A `max-width: 640px` la cuadrícula se vuelve una columna.
- Animación inicial: `opacity: 0`, `translateY(24px)`; `duration: 0.8`, `expo.out`, `stagger: 0.08`, trigger `top 78%`.

Usar `<figure>`, `<blockquote>` y `<figcaption>` para conservar la semántica del original.

## 13. Sobre mí

El about utiliza una proporción de columnas `1.35fr / .85fr`.

```css
.about {
  padding: clamp(5rem, 13vh, 9rem)
    clamp(1.25rem, 4vw, 2.5rem);
  background: #f1f0ec;
}

.about__inner {
  max-width: 78rem;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.35fr 0.85fr;
  align-items: start;
  gap: clamp(2.5rem, 6vw, 6rem);
}

.about__frame {
  position: relative;
  aspect-ratio: 4 / 5;
  overflow: hidden;
  border-radius: clamp(18px, 2vw, 26px);
  background: linear-gradient(180deg, #d6e7f8, #aecdf0);
}

.about__avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 22%;
}
```

La imagen tiene una insignia superpuesta tipo glass:

- Posición: `left` y `bottom` entre `0.9rem` y `1.25rem`.
- Fondo `#ffffffe6`.
- `backdrop-filter: blur(10px)`.
- Radius `999px`.
- Color `var(--color-sky-dark)`.
- Texto: `Blue Diamond en YT Jobs`.

Los hechos se presentan como filas, no como badges:

- Borde superior de `rgba(10,10,10,.1)`.
- Última fila con borde inferior.
- Label de ancho fijo aproximado de `9rem`, uppercase y `0.1em` tracking.
- Valor normal en color ink.

Responsive:

- A `max-width: 820px`, una columna.
- La imagen pasa arriba mediante `order: -1`.
- La imagen tiene `max-width: 20rem`.

Entrada por scroll: `data-about` parte de `opacity: 0`, `translateY(26px)`, entra en `top 75%`, duración `0.9s`, ease `expo.out`, stagger `0.12`.

## 14. Contacto y cierre

El contacto no es un footer plano. Es un panel grande con esquinas superiores redondeadas, un shader suave y una marca de agua de gran escala.

```css
.contact {
  padding: clamp(1rem, 2vw, 1.5rem)
    clamp(1rem, 4vw, 2.5rem) 0;
  background: var(--color-paper);
}

.contact__panel {
  position: relative;
  max-width: 80rem;
  min-height: 0;
  margin: 0 auto;
  padding: clamp(2.75rem, 6vw, 5rem)
    clamp(1.75rem, 5vw, 4rem)
    clamp(1.5rem, 3vw, 2.5rem);
  overflow: hidden;
  isolation: isolate;
  border-radius: clamp(24px, 3vw, 40px)
    clamp(24px, 3vw, 40px) 0 0;
  background: #cfe6fb;
  box-shadow: inset 0 1px #ffffff80;
}

.contact__body {
  position: relative;
  z-index: 2;
  min-height: clamp(24rem, 60vh, 36rem);
  display: flex;
  flex-direction: column;
}

.contact__watermark {
  position: absolute;
  left: 0;
  bottom: clamp(-1.2rem, -1.2vw, -0.4rem);
  z-index: 1;
  margin: 0;
  white-space: nowrap;
  user-select: none;
  pointer-events: none;
  color: #1f5db4;
  opacity: 0.08;
  font-size: clamp(4.5rem, 19vw, 17rem);
  font-weight: 400;
  line-height: 0.8;
  letter-spacing: -0.06em;
}
```

El watermark `stepbro yahel` se mide con JavaScript para que su ancho coincida con el panel:

```js
function fitWatermark() {
  watermark.style.fontSize = "100px";
  const width = watermark.scrollWidth;
  if (width) {
    watermark.style.fontSize = `${panel.clientWidth / width * 100}px`;
  }
}
```

Contenido:

- Título: `Hagamos tu próximo video`, máximo `14ch`, `clamp(2.4rem, 6vw, 4.75rem)`.
- Subtítulo de máximo `42ch`, color ink soft.
- Botón azul tipo `btn-sky`.
- Links secundarios con underline que se revela desde la izquierda en hover.
- Footer interno con marca, rol, idioma y copyright.

El shader del contacto reutiliza `GrainGradient` con `data-intensity="soft"`, que mezcla el resultado hacia blanco en `0.45` antes de aplicarlo.

Responsive a `max-width: 640px`:

- El gutter exterior baja a `0.5rem` a `1rem`.
- Footer en columna y alineado a la izquierda.
- `min-height` del body entre `22rem` y `30rem`.

## 15. Botón azul principal

Este botón es una cápsula brillante, no un rectángulo plano.

```css
.btn-sky {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5em;
  padding: 0.85em 1.5em;
  border: 0;
  border-radius: 999px;
  color: #fff;
  font-family: var(--font-sans);
  font-size: 1rem;
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.01em;
  white-space: nowrap;
  cursor: pointer;
  text-shadow: 0 1px 2px #1256af52;
  background-image:
    radial-gradient(120% 80% at 50% 0%, #ffffff42, #ffffff0a 36%, #ffffff00 54%),
    linear-gradient(#66b2ff, #4fa3ff 56%, #4a9ffb);
  box-shadow:
    inset 0 1.5px 1px #ffffff80,
    inset 0 9px 16px -10px #ffffff4d,
    inset 0 -14px 22px -10px #1a6aca80,
    0 8px 22px -6px #3a8af466,
    0 6px 32px -2px #78b9ff94;
  transition: transform 0.25s var(--ease-out-expo),
    box-shadow 0.3s var(--ease-out-expo),
    filter 0.25s var(--ease-out-expo);
}

.btn-sky:hover {
  filter: saturate(1.03) brightness(1.035);
  transform: translateY(-1px);
}

.btn-sky:active {
  filter: brightness(0.98);
  transform: translateY(0) scale(0.985);
}

.btn-sky:focus-visible {
  outline: 2px solid var(--color-sky-dark);
  outline-offset: 3px;
}
```

No convertir todos los links en este botón. El original mantiene una jerarquía clara entre CTA principal, links con flecha y links de texto.

## 16. Tabla completa de responsive

| Breakpoint | Comportamiento |
| --- | --- |
| `640px` | Se oculta la navegación; hero cambia a composición móvil; testimonios pasan a una columna; contacto compacta el footer. |
| `560px` | Intro usa una columna visual más estrecha; lista y título reducen tamaño; stats de intro pasan a una columna; servicios pasa a una columna. |
| `768px` | Límite entre portfolio con scroll nativo y portfolio horizontal pinneado por GSAP. |
| `820px` | About pasa a una columna y mueve la foto arriba. |
| `860px` | Bento de servicios pasa de tres a dos columnas. |
| `900px` | Intro pasa de dos columnas con card sticky a una columna; card deja de ser sticky. |
| `769px+` | Work mide `100vh`, se centra verticalmente y usa scroll horizontal controlado por scroll vertical. |

### 16.1 Hero móvil

```css
@media (max-width: 640px) {
  .hero {
    padding-top: clamp(10px, 2vh, 16px);
  }

  .hero__panel {
    height: calc(100svh - clamp(24px, 4vh, 36px));
  }

  .hero__content {
    top: clamp(1.25rem, 3vh, 2rem);
    gap: 0.7rem;
  }

  .hero__stats {
    order: 0;
    align-self: flex-end;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.25rem;
  }

  .hero__eyebrow {
    order: 1;
    margin-top: auto;
  }

  .hero__name {
    order: 2;
    white-space: normal;
    font-size: clamp(5rem, 24vw, 8rem);
    line-height: 0.9;
  }

  .hero__cta {
    order: 3;
    align-self: stretch;
    display: inline-flex;
    justify-content: center;
    padding: 1.05rem 1.5rem;
    border: 1px solid #ffffff99;
    border-radius: 999px;
    color: var(--color-ink);
    background: #ffffff80;
    backdrop-filter: blur(8px);
  }
}
```

La versión móvil no es simplemente un desktop comprimido: las stats suben a la esquina superior derecha, el eyebrow cae cerca del nombre y el CTA ocupa todo el ancho inferior.

## 17. Modelo de datos recomendado

La estructura del contenido debe permitir cambiar la identidad sin modificar el layout.

```ts
type Client = {
  name: string;
  subscribers: string;
  avatar: string;
};

type WorkItem = {
  href: string;
  thumbnail: string;
  title: string;
  channel: string;
  views: string;
};

type Testimonial = {
  score: number;
  quote: string;
  name: string;
  subscribers: string;
  avatar: string;
};
```

Imágenes de referencia observadas:

- Avatares: `/channels/*.jpg`.
- Thumbnails: `/thumbs/*.jpg`.
- Retrato: `/profile/avatar.jpg`.
- Fuentes: `/fonts/*.woff2`.

Para otra marca, conserva las proporciones y el tratamiento, pero sustituye nombre, métricas, testimonios e imágenes. No hardcodees los datos dentro de cada card si el objetivo es mantener el sistema reutilizable.

## 18. Accesibilidad y calidad

- Mantener `lang="es"` y una ruta alternativa `/en` si existe versión bilingüe.
- Usar un único `h1` en el hero.
- Mantener `h2` para cada sección y `h3` para cards.
- Usar `aria-label` en navegaciones y listas de datos cuando el contexto no sea evidente.
- Marcar canvas, watermark y adornos como `aria-hidden="true"`.
- Marcar el segundo grupo del marquee como `aria-hidden="true"` para no duplicar lectura.
- Proporcionar `alt` descriptivo en fotos de trabajo y perfil; usar `alt=""` para avatares puramente decorativos dentro de testimonios si el nombre ya está al lado.
- Conservar `:focus-visible` en botones y links.
- No depender solo del color para indicar el estado activo de la lista.
- Mantener suficiente contraste entre `#0064c1`, `#0a0a0a`, `#2f3437` y los fondos claros.
- Respetar `prefers-reduced-motion` en GSAP, shader, grano, marquee, reveal pixel y scroll suave.
- Usar `loading="lazy"` en contenido bajo el fold y `decoding="async"` en imágenes.
- Declarar dimensiones de imágenes para evitar layout shift.
- Añadir `target="_blank"` solo a externos y acompañarlo de `rel="noopener noreferrer"`.

## 19. Rendimiento

- Precargar solo las fuentes críticas `Geist` y `Pixelify Sans` si realmente se usan en el primer viewport.
- Mantener el canvas WebGL a `0.9` de resolución CSS, no a resolución nativa completa.
- Parar el `requestAnimationFrame` cuando el shader no intersecte el viewport.
- No crear un canvas separado por cada card.
- Usar `will-change` solo en elementos que realmente se animan: nombre del hero, track y cards durante reveal.
- Mantener los thumbnails en formato comprimido y con ratio 16:9.
- El marquee debe ser CSS, no un loop JavaScript ejecutado continuamente.
- Ejecutar `ScrollTrigger.refresh()` después de cargar fuentes o dimensiones dinámicas.
- Si WebGL falla, mostrar el gradiente CSS sin bloquear el contenido.

## 20. Orden de implementación

Para conseguir el parecido más rápido, implementar en este orden:

1. Tokens, fuentes, reset, fondos alternos y gutters.
2. Hero con panel redondeado, gradiente estático y escala del nombre.
3. Navegación fija y CTA azul.
4. Intro con card azul y layout responsive.
5. Clientes con loop duplicado y máscara lateral.
6. Work con cards 16:9 y scroll nativo.
7. Pinning desktop y reveal 5 x 5.
8. Servicios bento, testimonios y about.
9. Contacto con watermark y shader reutilizado.
10. Animaciones de entrada y reduced motion.
11. Ajuste de fuentes, sombras, radios y contenido real.

No comenzar por el shader. El 80% del lenguaje visual proviene de tipografía, espacios, fondos, radios, escala y composición; el shader debe ser una mejora progresiva.

## 21. Checklist de fidelidad visual

### Primer viewport

- El hero tiene un margen exterior pequeño sobre fondo papel.
- El panel tiene esquinas de aproximadamente `20px` a `34px`.
- El azul es luminoso y se aclara hacia abajo.
- Hay textura de grano, pero no parece ruido fuerte.
- El nombre ocupa casi todo el ancho y usa gradiente azul apagado.
- Las stats son cápsulas translúcidas.
- En desktop el CTA principal vive en la nav; en móvil aparece dentro del hero.

### Scroll

- La nav cambia de forma después de `24px` de scroll.
- Intro revela contenido y activa una línea según el centro de viewport.
- Card de intro es sticky solo en desktop amplio.
- Clientes se desplazan continuamente y se detienen al hover.
- Work se convierte en horizontal en desktop sin mostrar una barra de scroll.
- Los thumbnails se descubren con 25 bloques aleatorios.
- Las cards de servicios y testimonios entran de abajo con stagger corto.
- Contacto muestra el watermark como una textura de fondo, no como texto normal.

### Responsive

- A `390px` no hay navegación visible.
- El hero móvil no desborda horizontalmente.
- Las stats móviles se apilan arriba a la derecha.
- La lista de intro sigue siendo grande pero legible.
- El bento no genera columnas demasiado estrechas.
- Work permite deslizar cards con el dedo.
- El about coloca la foto antes del texto.
- El footer de contacto se apila.

## 22. Pruebas manuales recomendadas

Verificar como mínimo en:

| Viewport | Qué comprobar |
| --- | --- |
| `1440 x 900` | Hero, nav stuck, pinning horizontal y proporciones de cards. |
| `1280 x 800` | Texto grande, card sticky y no overflow. |
| `1024 x 768` | Intro y bento cerca de breakpoints. |
| `768 x 1024` | Cambio exacto entre work móvil y desktop. |
| `390 x 844` | Hero móvil, CTA, testimonios y contacto. |
| `360 x 800` | Titulares, stats y links largos sin corte. |

Pruebas de comportamiento:

- Recargar con fuentes lentas.
- Desactivar WebGL si el navegador lo permite.
- Activar `prefers-reduced-motion`.
- Navegar solo con teclado.
- Hacer zoom al 200%.
- Usar touch en el carrusel de trabajo.
- Redimensionar después de cargar fuentes.
- Pasar el puntero sobre nav, botones, links, thumbnails, servicios y testimonios.

## 23. Qué no copiar literalmente

Para replicar el sistema visual sin apropiarse de la identidad del sitio:

- No reutilizar el nombre `Yahel` o `stepbro yahel` en una marca diferente.
- No reutilizar fotografía, avatares, thumbnails, métricas o testimonios sin autorización.
- No presentar clientes reales como propios.
- No copiar el contenido textual como si fuera una plantilla de portfolio genérica.
- No aumentar la cantidad de efectos solo porque el proyecto usa WebGL; el diseño depende de la moderación.

La réplica correcta conserva la gramática visual y técnica: cielo suave, papel, tipografía Geist, cápsulas, bento, scroll horizontal, reveal pixel, grano y animación física. La identidad, contenido y activos deben ser propios.
