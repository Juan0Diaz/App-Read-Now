# Referencia visual completa — READNOW

Documento de referencia para recrear en mockups las pantallas y estados actuales de READNOW. Describe lo implementado en el frontend, no un diseño idealizado. Cuando la interfaz no representa un estado (por ejemplo, un fallo de red que solo se registra en consola), se indica expresamente para no inventar una pantalla inexistente.

## Inventario de pantallas y acceso

Todas las rutas anidadas bajo `/` usan `Layout`: primero esperan la sesión y, si no hay usuario, redirigen a `/login`. Login, recuperación de contraseña y callback OAuth son rutas independientes, sin sidebar, footer ni navegación móvil. El rol Desactivado puede acceder a `/perfil`; en las demás rutas anidadas ve el bloqueo de cuenta del layout.

| Pantalla | Ruta | Acceso según el frontend | Archivo fuente |
|---|---|---|---|
| Inicio de sesión / registro | `/login` (registro también en `/login?register=true`) | Visitantes sin sesión. Con sesión redirige al catálogo. | [src/pages/Login.tsx](../src/pages/Login.tsx) |
| Restablecer contraseña | `/reset-password` | Ruta independiente, normalmente abierta desde el enlace recibido por correo; no requiere el shell autenticado. | [src/pages/UpdatePassword.tsx](../src/pages/UpdatePassword.tsx) |
| Callback de autenticación OAuth | `/auth/callback` | Ruta transitoria del flujo Google/GitHub; funciona en popup o ventana actual. | [src/pages/AuthCallback.tsx](../src/pages/AuthCallback.tsx) |
| Catálogo / Inicio | `/` | Cualquier usuario autenticado activo: Visualizador, Publicador o Administrador. | [src/pages/Home.tsx](../src/pages/Home.tsx) |
| Perfil de usuario propio | `/perfil` | Cualquier usuario autenticado, incluido Desactivado. | [src/pages/Profile.tsx](../src/pages/Profile.tsx) |
| Mis Favoritos | `/favoritos` | Cualquier usuario autenticado activo. | [src/pages/Favorites.tsx](../src/pages/Favorites.tsx) |
| Mis Préstamos | `/prestamos` | Cualquier usuario autenticado activo. | [src/pages/Loans.tsx](../src/pages/Loans.tsx) |
| Detalle de Libro | `/libro/:id` | Cualquier usuario autenticado activo. | [src/pages/BookDetail.tsx](../src/pages/BookDetail.tsx) |
| Mis Publicaciones / Gestión de Catálogo | `/publicador/libros` | Publicador o Administrador; la página redirige al catálogo a otros roles. | [src/pages/PublisherDashboard.tsx](../src/pages/PublisherDashboard.tsx) |
| Añadir Nuevo Libro | `/publicador/libros/nuevo` | El shell exige sesión; la página está destinada a Publicador/Administrador, pero no contiene guard de rol propio. | [src/pages/NewBook.tsx](../src/pages/NewBook.tsx) |
| Editar Libro | `/publicador/libros/editar/:id` | El shell exige sesión; la página está destinada a Publicador/Administrador, pero no contiene guard de rol propio. | [src/pages/EditBook.tsx](../src/pages/EditBook.tsx) |
| Perfil público de publicador | `/publicador/perfil/:id` | Usuario autenticado activo; muestra el perfil de otra persona. | [src/pages/PublicProfile.tsx](../src/pages/PublicProfile.tsx) |
| Panel de Administrador / Gestión de Usuarios | `/admin` | Administrador; otros roles vuelven al catálogo. | [src/pages/AdminDashboard.tsx](../src/pages/AdminDashboard.tsx) |
| No encontrado | Cualquier otra ruta bajo `/` | Usuario autenticado activo; ruta comodín anidada en Layout. | Marcador visual declarado en [src/App.tsx](../src/App.tsx) |

**Pantallas mínimas confirmadas:** inicio de sesión y registro son dos modos de la misma pantalla/ruta; catálogo, detalle, favoritos, préstamos, perfil, publicaciones, alta/edición de libro, administración y perfil público existen. **Extras encontrados:** recuperación/actualización de contraseña, callback OAuth, pantalla 404 y bloqueo de cuenta desactivada integrado en el layout.

## Marco global y navegación

La aplicación autenticada se distribuye en una columna lateral y un área principal con scroll propio. La altura del shell es el alto de la ventana y se impide el scroll del contenedor exterior. El panel lateral desktop permanece en su lugar; el contenido central scrollea. Los encabezados de página que declaran `sticky` se fijan al borde superior de su zona de scroll. El footer pertenece al contenido principal y aparece al final de este; **no** es una barra fija.

### Desktop (desde el breakpoint `md`)

- Sidebar izquierda de 16 rem (256 px), alto completo, fondo `surface` y borde vertical. Marca READNOW arriba: cuadrado azul redondeado con icono Library y nombre en negrita.
- Debajo, navegación vertical con icono y etiqueta, elementos separados por poco espacio; el activo lleva fondo azul muy claro (`primary/10`) y texto azul. Elementos:
  1. **Catálogo** (LayoutDashboard), salvo rol Desactivado.
  2. **Mis Favoritos** (Heart), salvo Desactivado.
  3. **Mis Préstamos** (Clock), salvo Desactivado.
  4. **Mi Perfil** (User), para todo usuario autenticado.
  5. Para Publicador: rótulo de sección **PUBLICADOR** y **Mis Publicaciones** (BookOpen).
  6. Para Administrador: rótulo **ADMIN**, **Gestión de Catálogo** (BookOpen, enlaza al mismo `/publicador/libros`) y **Gestión de Usuarios** (Users).
- El sidebar mantiene su pie de cuenta separado por una línea horizontal. Tarjeta compacta con avatar circular de inicial, correo truncado, rol; debajo, botón ancho rojizo **Cerrar Sesión** con icono LogOut.
- El contenido usa el ancho restante, fondo base suave y scroll vertical independiente. Footer con READNOW, icono Library, descripción “Tu biblioteca digital para descubrir, guardar y compartir libros.”, copyright y frase “Lecturas para cada momento.”; columnas **Explorar** (Catálogo de libros, Mis favoritos, Mis préstamos) y **Tu cuenta** (Mi perfil, enlace contextual de Mis publicaciones o Gestión de usuarios), más píldora `Sesión: [rol]`.
- No hay botón hamburguesa desktop. El componente importa algunos iconos adicionales que no se presentan en el layout final (Settings, Search, UploadCloud, Menu); no recrearlos como controles visibles.

### Mobile (por debajo de `md`)

- Sidebar se oculta. Barra superior de 73 px con marca READNOW a la izquierda y avatar circular con inicial enlazado a `/perfil` a la derecha.
- El contenido ocupa el espacio disponible y puede scrollear verticalmente.
- Barra inferior de 64 px con safe-area inferior, fondo `surface` y borde superior. Cada acceso es icono sobre etiqueta, distribuido en una fila. Elementos visibles por rol:
  - Activo: **Inicio** (LayoutDashboard), excepto Desactivado.
  - Publicador: **Mis Libros** (BookOpen).
  - Administrador: **Catálogo** (BookOpen) y **Usuarios** (Users).
  - Usuarios activos: **Favoritos** (Heart), **Préstamos** (Clock) y **Perfil** (User).
  - Si no hay usuario se mostraría **Entrar** (User), aunque las rutas internas redirigen a login.
- En catálogo, filtros se ocultan bajo el botón **Filtros**; los chips y listas horizontales pueden desplazarse lateralmente. Las grillas se reducen a una columna y luego 2/3/4 según ancho. Formularios, tarjetas de perfil, listados y paneles administrativos pasan a una columna; acciones de formularios tienden a ocupar todo el ancho.
- El footer no está oculto en mobile: queda debajo del contenido principal, accesible al continuar desplazándose.

### Cuenta Desactivada y carga inicial del shell

Mientras se consulta la sesión, se muestra centrado **Cargando...** sobre fondo suave. Con sesión de rol Desactivado, cualquier ruta interna salvo `/perfil` reemplaza el contenido de ruta por un estado centrado: icono ShieldAlert en círculo rosado, encabezado **Cuenta Desactivada**, texto “Tu cuenta ha sido desactivada por un administrador. No puedes acceder al catálogo ni realizar acciones.” y botón **Ir a mi perfil**. Se mantiene shell, navegación condicionada y footer.

## Sistema visual

### Colores declarados literalmente en `src/index.css`

Hexadecimales tomados de las variables CSS; `rgba(...)` se mantiene tal cual donde ese es el valor declarado. El modo oscuro se activa añadiendo la clase `.dark` y establece `color-scheme: dark`.

| Token | Claro | Oscuro | Uso visual principal |
|---|---|---|---|
| `--color-primary` | `#2563eb` | `#3b82f6` | Azul de marca, CTA, enlaces, foco e iconos activos. |
| `--color-primary-hover` | `#1d4ed8` | `#2563eb` | Hover del CTA/enlace primario. |
| `--color-secondary` | `#16a34a` | `#22c55e` | Verde secundario/positivo; el rol del perfil usa este tono. |
| `--color-secondary-hover` | `#15803d` | `#16a34a` | Hover secundario. |
| `--color-accent` | `#f59e0b` | `#fbbf24` | Ámbar de énfasis; botones accent, avisos. |
| `--color-accent-hover` | `#ea580c` | `#f59e0b` | Hover accent. |
| `--color-success` | `#16a34a` | `#4ade80` | Éxito y disponibilidad positiva. |
| `--color-success-soft` | `#dcfce7` | `rgba(34, 197, 94, 0.16)` | Fondo suave de éxito. |
| `--color-warning` | `#d97706` | `#fbbf24` | Advertencias. |
| `--color-warning-soft` | `#fef3c7` | `rgba(251, 191, 36, 0.18)` | Fondo suave de warning. |
| `--color-error` | `#dc2626` | `#f87171` | Error, eliminación, favoritos activos en algunas pantallas. |
| `--color-error-soft` | `#fee2e2` | `rgba(248, 113, 113, 0.16)` | Fondo suave de error. |
| `--color-surface` | `#ffffff` | `#111827` | Tarjetas, campos y encabezados. |
| `--color-surface-soft` | `#fafaf9` | `#0f172a` | Superficie tenue; fondo base frecuente del área de app. |
| `--color-surface-muted` | `#f5f5f4` | `#1f2937` | Paneles/campos secundarios, hover y navegación. |
| `--color-border` | `#e7e5e4` | `#374151` | Borde ordinario y divisores. |
| `--color-border-strong` | `#d6d3d1` | `#4b5563` | Borde de mayor contraste, por ejemplo formulario. |
| `--color-text-strong` | `#111827` | `#f8fafc` | Títulos y texto de máxima jerarquía. |
| `--color-text-body` | `#374151` | `#d1d5db` | Texto principal de párrafo/controles. |
| `--color-text-muted` | `#6b7280` | `#94a3b8` | Ayuda, subtítulo, metadatos. |
| `--color-text-inverse` | `#ffffff` | `#0f172a` | Texto inverso para contraste sobre superficies opuestas. |
| `--color-bg-base` | `#ffffff` | `#0f172a` | Fondo base de `html`. |
| `--color-bg-warm` | `#faf6f0` | `#111827` | Fondo cálido de página y encabezado. |
| `--color-bg-warm-strong` | `#f5efe6` | `#1f2937` | Fondo cálido más marcado de `.page-shell`. |

En `tailwind.config.js`, `darkMode` es `class`, las familias extendidas son `sans: ['Inter', 'sans-serif']` y `serif: ['Lora', 'serif']`. Los tokens primary, hover, secondary, accent, success, warning, error, surface, border, text y ring-primary se mapean a las variables CSS correspondientes. Las variables `bg-base`, `bg-warm` y `bg-warm-strong` también están declaradas en CSS y se usan en clases de las páginas.

**Observación de fidelidad:** la paleta anterior es la fuente canónica del tema, pero no todas las pantallas están perfectamente tokenizadas. Hay usos literales de slate, rose, emerald, indigo y blanco, incluyendo confirmaciones modales y el banner de error de edición. Algunos formularios/estados no declaran variantes `dark:` en todos sus fondos. Para reproducir fielmente la implementación, conservar el contraste de modo oscuro de los tokens, pero no asumir que cada página usa exclusivamente tokens ni homogeneizar por cuenta propia esas excepciones.

### Tipografía, escala y forma

- Inter es la tipografía sans general y de interfaz (importada desde Google Fonts con pesos 400, 500, 600, 700, 800 y 900). Lora se usa como serif decorativa para títulos de portada sin imagen.
- Tamaños Tailwind presentes: texto auxiliar pequeño de 10–12 px (`text-[10px]`, `text-[11px]`, `text-xs`), cuerpo compacto 14 px (`text-sm`), texto base 16 px, subsecciones 18–20 px (`text-lg`, `text-xl`), títulos de página normalmente 24 px (`text-2xl`), y titular de perfil/login 30 px (`text-3xl`). Pesos comunes: 400 normal, 500 medio, 600 semibold, 700 bold, 800 extrabold; existen acentos 900 en algunas composiciones. Labels suelen ser 14 px/700; meta y badges 12 px, semibold/bold, frecuentemente mayúsculas y tracking amplio.
- Escala visible de radios: `rounded-lg` 8 px (botones, inputs y celdas), `rounded-xl` 12 px (controles y paneles), `rounded-2xl` 16 px (tarjetas/empty states), `rounded-3xl` 24 px (tarjetas de formularios y perfil) y `rounded-full` (badges, avatares, chips y botones circulares). Son clases concretas por componente, no un único radio global.
- Sombras son discretas (`shadow-sm`) en tarjetas y botones, con elevación/blur al hover. Hay animaciones cortas de entrada, skeleton pulse de carga, brillo móvil continuo en algunos CTA y resplandor pulsante en la tarjeta de login.

### Componentes base reutilizables

- **Button** ([src/components/ui/Button.tsx](../src/components/ui/Button.tsx)): inline-flex centrado, 14 px/500, radio 8 px, altura mínima efectiva 44 px, foco de 2 px azul y estado deshabilitado opaco. Predeterminado: `primary`, altura 44 px y padding horizontal 16 px. Variantes: `primary` azul con texto blanco; `accent` ámbar con texto blanco; `secondary` superficie suave con borde y texto fuerte; `destructive` token error y texto blanco; `outline` superficie con borde; `ghost` transparente con hover de superficie; `link` azul subrayable. Tamaños sm (declara 40 px, pero la altura mínima común lo lleva al menos a 44 px), default (44 px), lg (48 px), icon (44×44). Algunas páginas añaden radios, sombras, colores o tamaños particulares sobre la variante base. `shimmer` agrega borde/glow y un barrido diagonal animado; con movimiento reducido, la animación desaparece.
- **Input** ([src/components/ui/Input.tsx](../src/components/ui/Input.tsx)): alto 44 px, ancho completo, radio 8 px, borde `border`, superficie blanca/surface, padding 12 px, texto 14 px. Placeholder muted. Foco con anillo azul de 2 px y borde transparente; disabled con cursor no permitido y opacidad 50 %. Las pantallas pueden sobrescribirlo a 48 px y radio 12 px.
- **Card** ([src/components/ui/Card.tsx](../src/components/ui/Card.tsx)): borde token, superficie, `rounded-xl` (12 px), sombra ligera y transición a sombra media al hover. Algunas páginas construyen tarjetas propias con radio 2xl/3xl o sin hover.
- **Badge** ([src/components/ui/Badge.tsx](../src/components/ui/Badge.tsx)): píldora `rounded-full`, padding 10×4 px, 12 px/600, uppercase y tracking amplio. Variantes: primary (azul translúcido), secondary (surface-soft + texto de cuerpo), accent (ámbar), success, warning y error (cada cual con fondo suave, texto token y borde teñido). `Tag` es alias de Badge; no aporta otro estilo.
- **BookCover** ([src/components/ui/BookCover.tsx](../src/components/ui/BookCover.tsx)): imagen de relación 2:3, `object-cover`, lazy loading. Si falta URL usa el SVG de portada genérica `src/assets/no-cover.svg`. Tamaños sm 7 rem, md ancho completo, lg 14 rem; páginas añaden sombras, fondos o tamaños.
- **Avatar** ([src/components/ui/Avatar.tsx](../src/components/ui/Avatar.tsx)): círculo con inicial, fondo primary/10 (dark primary/20), aro de superficie; tamaños sm 32, md 48, lg 80 y xl 128 px. Varias páginas implementan su propio avatar circular en vez de usar el componente.

### Iconografía

La librería de iconos de interfaz es **lucide-react**. Los iconos relevantes por pantalla:

- Shell: Library (marca), LayoutDashboard (Catálogo/Inicio), Heart (Favoritos), Clock (Préstamos), User (Perfil), BookOpen (publicaciones), Users (usuarios), LogOut (salir), ShieldAlert (cuenta desactivada).
- Acceso/registro: BookOpen, ShieldAlert. Los botones OAuth llevan marcas Google y GitHub dibujadas como SVG, no como iconos Lucide.
- Catálogo: Search, SlidersHorizontal, Plus, Book, Heart; las insignias usan Badge.
- Detalle de libro: ArrowLeft, Heart, Calendar, Bookmark, User, Tag.
- Favoritos: Heart, Search, BookOpen. Préstamos: Clock, BookOpen, Search.
- Perfil propio: LogOut, User, Shield, Mail, Edit2, Save, X, AlertTriangle, Moon, Sun.
- Publicaciones: BookPlus, List, Edit, Trash2.
- Nuevo/editar: ArrowLeft, Book, AlignLeft, Calendar, Tag, Building2, AlertCircle, BookOpen, Plus, X, Upload, ImagePlus.
- Admin: AlertTriangle. Perfil público: Mail, Phone, Book, ArrowLeft. Cambio de contraseña: Lock, ShieldCheck.

## Pantallas

## Inicio de sesión y registro

**Ruta y roles:** `/login`; el modo registro se activa mediante `/login?register=true` o el enlace inferior. Solo se muestra a visitantes; un usuario con sesión es enviado a `/`. Archivo: [src/pages/Login.tsx](../src/pages/Login.tsx).

**Estructura y apariencia:** pantalla independiente sin shell. Fondo `surface-soft`, tarjeta única centrada, ancho máximo 28 rem, padding 32 px (40 px en pantallas más anchas), borde fino, radio 24 px, sombra grande y halo ámbar pulsante (azul en dark). La tarjeta puede superar el alto del viewport y el contenedor tiene padding vertical para permitir respiración.

**Orden visual:** icono BookOpen azul en cuadrado redondeado de 64 px; título centrado de 30 px, que alterna **Bienvenido de nuevo** / **Crear una cuenta**; subtítulo **Ingresa tus credenciales para continuar.** / **Regístrate para acceder al catálogo virtual.** En modo demo aparece antes del formulario un panel warning con icono ShieldAlert, título **Modo Demostración**, explicación de que faltan credenciales Supabase y tres botones **Visualizador**, **Publicador**, **Admin**.

Formulario:
- Label **Correo Electrónico**, input `tu@correo.com`.
- Label **Contraseña**, input password `••••••••`. En login normal, enlace **¿Olvidaste tu contraseña?** a la derecha; desaparece en registro y modo demo.
- En registro: **Fecha de Nacimiento**, input date; checkbox y frase **Acepto los Términos y Condiciones y la Política de Privacidad**, con ambos textos como enlaces/botones que abren el mismo modal.
- Error: caja rosada/roja con texto real de validación o autenticación. Mensaje de recuperación enviado: caja verde **Revisa tu correo electrónico para el enlace de recuperación.**
- CTA ancho azul: **Iniciar sesión** o **Registrarse**, durante envío **Cargando...**. En modo demo campos y CTA se deshabilitan, aunque los tres accesos rápidos de rol permiten entrar.
- Separador con texto **o continuar con**, dos botones outline en columnas **Google** y **GitHub**; se ocultan/deshabilitan como acción en modo demo.
- Pie centrado: **¿No tienes una cuenta? Regístrate** o **¿Ya tienes una cuenta? Inicia sesión**, que cambia entre modos sin salir de la ruta.

**Modal de términos:** overlay oscuro fijo; diálogo blanco/surface centrado de ancho máximo 672 px, alto máximo 80 vh, radio 24 px. Cabecera **Términos y Condiciones y Política de Privacidad**, botón **Cerrar**; cuerpo largo en scroll con párrafos legales; pie con botón **Entendido**. Ambos botones cierran.

**Estados e interacciones:** validación visible dentro de la tarjeta para formato de correo restringido en registro, política, fecha, mayoría de edad, contraseña, credenciales fallidas, bloqueo temporal y OAuth; los mensajes exactos cambian según causa. El registro pide correo gmail/outlook, contraseña con letras+números+caracteres especiales y sin espacios, fecha no futura y edad de 18+. Login exitoso navega al catálogo; recuperar contraseña dispara envío de email desde este formulario; Google/GitHub abre popup centrado de 500×600 y vuelve al inicio al completar. Spinner solo expresado mediante texto del CTA **Cargando...**, no hay skeleton de pantalla.

## Restablecer contraseña

**Ruta y roles:** `/reset-password`, flujo de recuperación por enlace, fuera del Layout. Archivo: [src/pages/UpdatePassword.tsx](../src/pages/UpdatePassword.tsx).

**Estructura:** tarjeta centrada, ancho máximo 28 rem, padding de 32–40 px, borde, radio 24 px, sombra; fondo suave. Icono Lock en caja azul translúcida de 64 px. Título **Nueva Contraseña** y texto “Ingresa y confirma tu nueva contraseña para acceder a la plataforma.” Aunque el texto dice “confirma”, el formulario solo muestra un input de contraseña.

**Estado normal:** label **Nueva Contraseña**, input placeholder `Simbolos, números y letras, sin blancos`, botón primario de ancho completo **Actualizar contraseña**; durante envío **Actualizando...**. Se valida que la contraseña contenga letras, números y caracteres especiales y no espacios; error se muestra en caja rosada.

**Enlace expirado/inválido:** mensaje de error en panel rojo: “El enlace es inválido o ha expirado. Ha sido utilizado o se superó el tiempo límite.” Formulario para pedir nuevo enlace con texto “Ingresa tu correo para solicitar un nuevo enlace:”, input `tu@correo.com`, botón **Solicitar nuevo enlace** (durante envío **Enviando...**), estado verde de confirmación “Se ha enviado un nuevo enlace. Por favor revisa tu correo.” y botón outline **Volver a Iniciar Sesión**.

**Éxito:** bloque verde centrado con ShieldCheck, **¡Contraseña actualizada!**, “Serás redirigido al inicio en unos segundos...”; redirige automáticamente al catálogo. El callback con sesión aún procesándose puede mantener al usuario en esta pantalla.

## Callback OAuth

**Ruta y roles:** `/auth/callback`; ruta temporal para Google/GitHub, independiente del shell. Archivo: [src/pages/AuthCallback.tsx](../src/pages/AuthCallback.tsx).

**Único estado visual:** pantalla de viewport completo, fondo `surface-soft`, tarjeta centrada blanca con radio 16 px y sombra. Título **Autenticando...** y texto **Por favor espera un momento.** con pulso. Al finalizar en popup, informa a la ventana inicial y se cierra; si no hay popup navega a `/`. En error con popup lo devuelve a login a través del flujo principal; en ventana independiente, navega a login. No hay ilustración o formulario visible en esta ruta.

## Catálogo / Inicio

**Ruta y roles:** `/`, Visualizador, Publicador y Administrador activos. Archivo: [src/pages/Home.tsx](../src/pages/Home.tsx).

**Estructura:** shell autenticado; la vista es columna de alto disponible. Barra superior sticky con borde y sombra. Sección inferior scrolleable, padding 16 px en móvil y 32 px en escritorio. No hay título hero: el encabezado empieza con búsqueda.

**Encabezado:** campo con Search, placeholder **Buscar por título, autor o género...**. En móvil, botón secondary ancho **Filtros** con SlidersHorizontal. A Publicador se añade botón azul con shimmer y Plus: **Nueva Publicación**, enlazado a alta de libro. Administrador no ve este CTA aquí.

**Filtros, en orden:** rótulos pequeños uppercase **Géneros**, **Autores**, **Estado**; bajo cada uno una línea de chips desplazable horizontalmente. Géneros y autores derivan de los libros cargados y empiezan con **Todos**; estado ofrece **Todos**, **Disponibles**, **Reservados**. Chip seleccionado azul sólido con texto blanco, los demás superficie blanca, borde y texto gris. En escritorio los filtros están visibles; en móvil solo después de pulsar Filtros.

**Resultados:** grilla de 1/2/3/4 columnas según ancho. Cada tarjeta enlaza al detalle, con borde, radio 12 px, fondo surface y sombra leve. Portada vertical 2:3, imagen con zoom sutil al hover; sin imagen, portada gráfica con degradado azul suave, género uppercase azul y título serif Lora itálica. Botón Heart circular arriba a la derecha: rojo sólido/blanco si favorito, neutro si no; alterna favorito sin abrir detalle. Debajo: título en negrita, autor truncado y pie “Libro [estado]” azul más Badge **Disponible** (success verde) o **Reservado** (secondary).

**Estados:** durante carga aparecen ocho tarjetas skeleton pulsantes en grilla (bloque de portada alto y dos líneas). Cero resultados muestra Card con Book, **No se encontraron libros**, “Intenta ajustar tu búsqueda o seleccionar un filtro diferente.” y botón secondary **Limpiar filtros** (restaura búsqueda, género, autor y estado). No hay panel de error de red específico en esta pantalla.

**Interacción:** búsqueda filtra título y autor; chips filtran género, autor y disponibilidad; limpiar restablece; tarjeta abre `/libro/:id`; corazón agrega o quita favoritos; CTA del publicador abre `/publicador/libros/nuevo`.

## Detalle de Libro

**Ruta y roles:** `/libro/:id`, cualquier usuario activo autenticado. Archivo: [src/pages/BookDetail.tsx](../src/pages/BookDetail.tsx).

**Carga:** skeleton en dos columnas en escritorio (bloque vertical de portada y líneas de título, autor y descripción); en móvil se apila.

**Con datos:** encabezado sticky de 80 px solo con enlace ArrowLeft **Volver al catálogo**. Dentro de ancho máximo 80 rem, tarjeta grande de dos mitades en escritorio y una columna móvil, borde y radio 16 px. Columna izquierda contiene portada centrada; panel con degradado azul pálido y fondo suave. Imagen vertical de proporción 2:3 con sombra; si no hay URL, tarjeta sustituta con géneros en uppercase azul y título Lora serif itálica. Derecha con padding 24–32 px:

1. Título grande extrabold; corazón outline circular a la derecha. Favorito activo con fondo y texto error, corazón relleno; clic alterna.
2. Autor precedido por User azul.
3. Si se reconoce publicador: **Publicado por:** y nombre/correo enlazado a `/publicador/perfil/:id`.
4. Badges en línea: Tag y nombres de género (o **Sin género**); Bookmark y estado editorial; Calendar y año si hay fecha.
5. Si hay descripción: encabezado **Sinopsis** y caja surface-soft con el texto conservando saltos de línea.
6. **Detalles**, lista con separadores: **Editorial** y valor; **Disponibilidad** con **Disponible ahora** verde o **Reservado** muted.
7. Pie con botón azul **Solicitar Préstamo**, que pasa a **Procesando...** y se deshabilita mientras opera; si no disponible dice **No Disponible** y se deshabilita. Al lado texto “Si solicitas este libro, tendrás un plazo de 14 días para leerlo.”

Solicitud exitosa genera confirmación del navegador “Préstamo solicitado con éxito.” y actualiza la disponibilidad visual a reservado. Error también se notifica mediante alerta del navegador. ID sin libro muestra título **Libro no encontrado** y enlace **Volver al catálogo** con ArrowLeft. No se construye una pantalla de error de carga distinta del caso sin libro.

## Mis Favoritos

**Ruta y roles:** `/favoritos`, cualquier usuario activo autenticado. Archivo: [src/pages/Favorites.tsx](../src/pages/Favorites.tsx).

**Estructura:** ancho máximo 80 rem, fondo cálido, padding 32 px. Encabezado sticky con Heart rojo relleno y título **Mis Favoritos**; debajo, subtítulo **Libros que has guardado para leer después.**. La grilla ocupa el resto y scrollea con la página.

**Vacío:** panel grande centrado con borde, fondo blanco y radio 16 px. Icono Heart gris dentro de caja 64×64; título **Aún no tienes favoritos**; texto “Explora el catálogo y guarda los libros que más te llamen la atención haciendo clic en el ícono de corazón.”; botón azul **Explorar Catálogo** con Search, abre `/`.

**Con datos:** grilla 1/2/3/4 columnas de tarjetas similares al catálogo, con imagen 4:3 y padding 8 px, fallback degradado con género y título Lora si falta imagen. Overlay al hover presenta **Ver detalles** con BookOpen. Bajo portada: título y autor; botón circular ghost con Heart rojo relleno, tooltip **Quitar de favoritos**, elimina de la lista y backend. No se presenta Badge de disponibilidad.

**Carga/error:** mientras espera muestra texto centrado **Cargando favoritos...**. El fallo de carga se registra en consola; al completarse queda la misma presentación sin resultados, sin panel de error diferenciado. Error al quitar se informa con alert del navegador.

## Mis Préstamos

**Ruta y roles:** `/prestamos`, cualquier usuario activo autenticado. Archivo: [src/pages/Loans.tsx](../src/pages/Loans.tsx).

**Estructura:** ancho máximo 80 rem; encabezado sticky con Clock azul y **Mis Préstamos**; subtítulo **Libros que has solicitado para leer.**. Área de resultados en grilla 1/2/3/4 columnas.

**Vacío:** panel centrado blanco, borde y radio 16 px; BookOpen gris en cuadrado suave; título **Aún no tienes préstamos**; texto “Explora el catálogo y solicita préstamos de los libros que más te gusten.”; botón azul **Explorar Catálogo** con Search.

**Con préstamos:** tarjeta por libro, portada 4:3 (o reemplazo degradado con género y título serif), zoom leve al hover y overlay **Ver detalles** con BookOpen. Bajo imagen: título, autor y píldora azul clara uppercase **Préstamo Activo**. Clic en portada abre el detalle.

**Carga/error:** texto **Cargando préstamos...** centrado. La pantalla no define mensaje/estado de error específico para el fetch.

## Mi Perfil

**Ruta y roles:** `/perfil`, cualquier sesión, también rol Desactivado. Archivo: [src/pages/Profile.tsx](../src/pages/Profile.tsx).

**Estructura:** barra sticky de 80 px con fondo cálido/surface y título **Perfil de Usuario**. Cuerpo scrolleable, tarjeta central ancho máximo 64 rem. La tarjeta combina banner degradado horizontal primary→secondary de 96 px (128 px desktop), avatar grande superpuesto (96/128 px) con inicial y borde blanco, y contenido con padding.

**Cabecera de perfil:** a la izquierda nombre o parte anterior a @ como fallback (30 px/700), debajo correo con Mail. A la derecha botones outline: Moon/Sun **Modo Oscuro** o **Modo Claro**, y LogOut rojo **Cerrar Sesión**. En móvil se apilan a ancho completo. Debajo, insignia verdosa Shield **Rol actual: [rol]** y botón ghost **Editar**, salvo rol Desactivado. Al editar, selector con **Publicador** y **Visualizador**, botón accent **Guardar** y ghost con X; desactivar/guardar pueden presentar diálogo de confirmación cuando implica dejar publicaciones atrás.

**Información del Perfil:** título y línea divisoria, botón **Editar Perfil**. Vista de solo lectura en 2 columnas:
- **Nombre**, dato o **No especificado**.
- **Correo Electrónico**.
- **Fecha de Nacimiento**, fecha local o **No especificada**.
- Solo Publicador: **Número de Teléfono**, valor o **No especificado**.

Al editar, panel inset con campos Nombre (placeholder **Tu nombre completo**, máximo 50 caracteres), Fecha de Nacimiento y, solo Publicador, **Número de Teléfono (Contacto)** con selector de prefijo (CO +57, US +1, MX +52, ES +34, AR +54, CL +56, PE +51, EC +593) y ejemplo **Ej: 3001234567**. Error inline con AlertTriangle. Acciones **Cancelar** y accent **Guardar Cambios**; durante guardado **Guardando...**.

**Seguridad:** sección **Seguridad** con botón **Cambiar Contraseña**. Al abrir, panel con **Contraseña Actual** y **Nueva Contraseña**, botones **Cancelar** y **Cambiar Contraseña** (durante guardado **Guardando...**). La acción depende de las reglas del hook; no hay otra ruta para este formulario.

**Eliminar cuenta:** no se muestra a Administrador; para otros roles, botón outline rojo **Eliminar Mi Cuenta**. Abre modal fijo con AlertTriangle, título **¿Eliminar tu cuenta?**, explicación de que se borrarán usuario y datos asociados permanentemente, botones **Sí, eliminar permanentemente** (durante operación **Eliminando...**) y **Cancelar**.

**Confirmación de cambio de rol:** overlay fijo con Shield verde, título **Cambiar Rol a Visualizador**, párrafo dinámico sobre publicaciones existentes y transferencia de gestión a administradores; botones **Sí, cambiar rol** (durante acción **Cambiando...**) y **Cancelar**. Los diálogos de rol y eliminación son blancos, centrados, máximo 24 rem, radio 16 px y overlay slate translúcido.

**Modo oscuro:** el control cambia clase del documento y alterna los tokens; el estado escogido también cambia el icono y texto. Errores de perfil aparecen inline como AlertTriangle y texto, no hay una pantalla de perfil separada para error de carga.

## Mis Publicaciones / Gestión de Catálogo

**Ruta y roles:** `/publicador/libros`; Publicador o Administrador. Archivo: [src/pages/PublisherDashboard.tsx](../src/pages/PublisherDashboard.tsx).

**Estructura:** pantalla en columna. Barra superior sticky con título **Mis Publicaciones** para Publicador o **Gestión de Catálogo** para Administrador; CTA a derecha (en móviles puede compartir la línea y reducirse) con BookPlus, shimmer y etiqueta **Publicar Libro**. El cuerpo scrollea con padding adaptable. Subtítulo: “Gestiona los libros que has agregado al catálogo.” o “Gestiona todo el catálogo de la plataforma.”

**Layout principal:** escritorio en dos columnas: panel de previsualización de ancho fijo 340 px y lista de ancho restante. En móvil, primero preview y después lista.

- Panel izquierdo encabezado **Vista previa**, superficie ligeramente teñida. Carga: **Cargando publicaciones...**. Vacío: **No tienes publicaciones aún.**. Sin libro enlazado: **No hay libro seleccionado.**
- Con selección: marco inset con portada ancha de 56 px de alto, o recuadro de reemplazo de líneas discontinuas y palabra **Libro**. Después título, autor, pill con estado editorial, fecha formateada o **Sin fecha**, descripción hasta cinco líneas o **Sin descripción disponible para este libro.**. Botones **Editar** (azul) y **Eliminar** (outline rojo).
- Panel derecho con icono List y título **Tus libros recientes** (Publicador) o **Todos los libros** (Administrador). En desktop encabezados de tabla **Título**, **Estado**, **Fecha**, **Acciones**. Filas seleccionables con fondo azul tenue para la activa; cada fila presenta título, estado en pill, fecha o raya, iconos Edit y Trash2. En móvil, fila apilada con título, estado, fecha y acciones alineadas.

**Interacciones/confirmación:** al seleccionar fila, actualiza el preview; Editar navega a la ruta de edición; CTA a nueva alta. Eliminar desde preview o fila abre modal centrado: **¿Eliminar publicación?**, “Esta acción es irreversible y eliminará el libro del catálogo.”, botones **Cancelar** y **Sí, Eliminar**. Tras borrado desaparece de la lista. Fallo de fetch/borrado se registra en consola sin aviso visual persistente.

## Añadir Nuevo Libro

**Ruta y roles:** `/publicador/libros/nuevo`; destino de alta de publicador, sesión requerida por shell (no tiene guard explícito de rol en el componente). Archivo: [src/pages/NewBook.tsx](../src/pages/NewBook.tsx).

**Estructura:** fondo cálido (`page-shell`); barra sticky de 80 px con ArrowLeft, título **Añadir Nuevo Libro**. Formulario central ancho máximo 56 rem, scrolleable, tarjeta blanca/surface, borde fuerte, radio 24 px, padding 32 px. Encabezado de tarjeta **Detalles del Libro** y “Ingresa la información para agregar al catálogo general.”

**Formulario:** escritorio en proporción 2/3 + 1/3; móvil una columna. Columna amplia:
- **Título** (Book), ejemplo `Ej: El nombre del viento`.
- **Autor** (AlignLeft), ejemplo `Ej: Patrick Rothfuss`.
- **Editorial** (Building2), ejemplo `Ej: Plaza & Janés`.
- **Descripción** (BookOpen), textarea 120 px con `Sinopsis o información del libro...`.
- En dos columnas: **Fecha Pub.** (Calendar, selector date) y **Género(s)** (Tag, select inicial con placeholder **Seleccione un género** y opciones de catálogo). **Añadir otro género** (Plus) añade hasta tres; las filas extra tienen X para eliminarse.
- En dos columnas: **Estado** (Tag, texto obligatorio editable) y checkbox **Disponible**.

Columna de portada: label **Portada del Libro (Opcional)** con Upload, área proporción 3:4, borde dashed y fondo tenue. Estado inicial: ImagePlus dentro de círculo, **Sube la portada del libro**, “Haz clic para buscar en tus archivos”, “Formato JPG o PNG, máximo 5MB”. Al elegir JPG/PNG aparece preview `object-contain` y X para quitar. Error de formulario en panel error con AlertCircle encima de la grilla.

Pie separado por línea: botones **Cancelar** (outline) y **Publicar Libro** (primary). Durante envío, CTA **Publicando...** y disabled. Cancelar/flecha vuelven a publicaciones; éxito confirma con alerta “¡Libro publicado con éxito!” y navega a `/publicador/libros`; error se muestra en la tarjeta.

## Editar Libro

**Ruta y roles:** `/publicador/libros/editar/:id`; sesión requerida por shell; orientada a Publicador/Administrador sin guard explícito por rol en este componente. Archivo: [src/pages/EditBook.tsx](../src/pages/EditBook.tsx).

**Carga inicial:** texto **Cargando...** centrado. Si la petición de detalle falla, el formulario termina de cargar y muestra panel con AlertCircle: **Error cargando los detalles del libro.**

**Estructura y campos:** igual jerarquía de 2/3 formulario + 1/3 portada que alta; barra sticky con ArrowLeft y **Editar Libro**. Tarjeta **Detalles del Libro** con subtítulo “Actualiza la información del libro en el catálogo.”. Campos obligatorios prellenados: **Título**, **Autor**, **Editorial**, **Descripción**, **Fecha Pub.**, **Género(s)** hasta tres géneros, **Estado**, checkbox **Disponible**. La descripción usa placeholder `Sinopsis o información del libro...`; los otros campos no presentan ejemplos. Inputs altura 48 px, textarea 120 px.

**Portada:** **Portada del Libro (Opcional)**. Si hay archivo nuevo, enseña preview y X; si hay URL existente, muestra imagen y overlay hover **Cambiar Imagen**; si no, estado vacío **Sube la portada del libro**, “Haz clic para buscar en tus archivos”, “Formato JPG o PNG, máximo 5MB”. Selector acepta JPG/PNG.

**Acciones:** **Cancelar** vuelve a publicaciones; botón primary **Guardar Cambios**, durante envío **Actualizando...**. Éxito muestra alerta “¡Libro actualizado con éxito!” y vuelve a publicaciones; error de guardado aparece arriba del formulario. El bloque de error de esta página utiliza colores rose literales, no las variables error suaves del tema.

## Perfil Público de otro usuario

**Ruta y roles:** `/publicador/perfil/:id`; el nombre de ruta expresa publicador, y se abre desde el crédito del detalle. Sesión activa requerida por Layout. Archivo: [src/pages/PublicProfile.tsx](../src/pages/PublicProfile.tsx).

**Carga/no encontrado:** texto **Cargando perfil...** centrado. Si no hay perfil, bloque centrado sobre fondo suave con **Perfil no encontrado** y enlace ArrowLeft **Volver al catálogo**.

**Con datos:** encabezado sticky de 80 px con botón ArrowLeft **Volver** (historial del navegador). Cuerpo scrolleable, ancho máximo 80 rem. Tarjeta ancha de perfil con banner degradado azul→verde de 128 px, avatar de 128 px superpuesto con inicial del correo; nombre o identificador derivado del email como titular extrabold de 30 px. Sección **Información de Contacto** en uppercase: tarjetas de superficie suave con Mail + correo como enlace `mailto:` y Phone + número como enlace `tel:` cuando hay teléfono.

Después aparecen el encabezado **Libros Publicados** con Book, y el panel vacío **Este usuario no ha publicado libros aún.** o la grilla de cards disponibles: contenedor de portada 4:3; imagen `object-contain` o icono Book en un lomo genérico vertical; título y autor truncados; botón surface **Ver Detalles** a `/libro/:id`. Solo se listan publicaciones cuyo libro no está marcado no disponible. **Detalle de implementación importante para la fidelidad:** el contenedor del cuerpo declara `flex` pero no `flex-col`; la tarjeta de perfil, el encabezado de libros y la grilla/panel vacío son hermanos directos. Por tanto, en escritorio se disponen horizontalmente y pueden comprimirse en vez de formar una columna ordenada; no introducir una columna idealizada si se busca copiar el render actual. No hay mensaje visible para error de consulta, más allá del log de consola.

## Panel de Administrador

**Ruta y roles:** `/admin`; solo Administrador (resto vuelve a `/`). Archivo: [src/pages/AdminDashboard.tsx](../src/pages/AdminDashboard.tsx).

**Estructura:** encabezado sticky de 80 px, superficie y borde, título **Admin Dashboard** en 20 px. Cuerpo centrado ancho máximo 72 rem, padding 32 px, scroll vertical. Subtítulo prominente **Gestión de Usuarios**. Dentro, tarjeta blanca con borde/radio 16 px, padding 24 px y sombra ligera.

**Carga y lista:** texto centrado **Cargando usuarios...**. Luego filas con borde y radio 12 px, padding 16 px, separadas por espacio. Cada una muestra avatar circular de inicial, nombre (fallback **Sin nombre**) y correo; a la derecha pill de rol uppercase y selector de rol. Roles/pills: Visualizador verde, Publicador azul, Administrador rojo, Desactivado gris; si falta, se presenta **SIN ROL**. En móvil se apilan datos y controles. La fila Desactivado se ve atenuada, 60 % opaca y en escala de grises. Si la respuesta está vacía, no hay mensaje de lista vacía específico; queda la tarjeta sin filas.

El selector permite **Visualizador**, **Publicador**, **Administrador**, **Desactivado**. No aparece para el propio administrador ni para correos protegidos por la implementación; durante operación se deshabilita la interacción. Cambiar a los tres roles normales actualiza y vuelve a cargar la lista; no hay diálogo de confirmación.

**Confirmar desactivación:** seleccionar Desactivado abre overlay fijo slate translúcido y modal blanco/surface (antracita en dark) centrado de ancho máximo 24 rem, radio 16 px. AlertTriangle rojo grande, **¿Desactivar usuario?**, “El usuario perderá el acceso a funcionalidades y sus favoritos serán eliminados.”, botón rojo **Sí, desactivar usuario** (durante operación **Procesando...**) y outline **Cancelar**. No hay tratamiento visual propio para fallo de carga; errores de cambio se notifican mediante alert del navegador.

## Ruta no encontrada

**Ruta y roles:** `*` como ruta hija de `/`, después de confirmar sesión. Usuario activo autenticado; usuario Desactivado verá antes el bloqueo de cuenta global. Archivo de ruta: [src/App.tsx](../src/App.tsx).

**Vista:** texto único **404 No Encontrado** centrado horizontalmente con padding vertical amplio (`py-20`), estilo de texto centrado. No incluye botón de retorno, icono, ilustración ni tratamiento especial responsive; sí conserva el shell y, al final del contenido, footer y navegación mobile.

## Estados y límites de representación

- Cargas que sí se diseñan: texto corto (`Cargando...`, “Cargando favoritos...”, etc.) en perfiles/listas; skeletons en el catálogo y detalle de libro; pulso en callback y modo demo en Login.
- No se encontraron pantallas de error global ni banners de fallo de red consistentes. Algunas solicitudes fallidas solo se escriben en consola; ciertas mutaciones muestran alert nativo. No convertir estos casos en modales propios de la marca salvo que el mockup se solicite como propuesta de rediseño.
- El préstamo disponible/no disponible y el favorito sí alteran etiquetas, color y estado del botón; el rol modifica opciones de navegación, permisos de ciertas páginas y campos del perfil.
- El modo oscuro es una variante transversal por tokens/clase, con alternador explícito en Perfil. Debe respetar las excepciones con colores literales descritas arriba para aproximar el render real.
