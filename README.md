# Backend en C# / ASP.NET Core — Guía de configuración

## Arquitectura

```
Frontend (React/TS/Vite, puerto 3000)
        │  llamadas de datos → fetch a la API (src/lib/api.ts)
        │  login/registro    → supabase-js (sin cambios)
        ▼
Backend (ASP.NET Core, puerto 5080)
        │  valida el JWT que emitió Supabase Auth
        │  resuelve el rol (Usuario-Rol / Rol)
        ▼
Supabase Postgres (tus tablas: Usuario, Libro, Publicacion, etc.)
```

El login (correo/contraseña y Google) **no cambia**: lo sigue manejando Supabase Auth
directamente desde el frontend. El backend en C# solo protege y sirve los datos de negocio.

## 1. Datos que necesitas de tu proyecto Supabase

Ve a **Project Settings** en tu dashboard de Supabase:

- **Database → Connection string** (modo "URI", con el password real). Ejemplo:
  `Host=db.xxxx.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=TU_PASSWORD;SSL Mode=Require;Trust Server Certificate=true`
- **API → JWT Settings → JWT Secret**. Es una cadena larga distinta a tu ANON_KEY.
- Tu **SUPABASE_URL** (la misma que ya usas en el frontend).

## 2. Configurar los secretos en GitHub Codespaces

En tu repo de GitHub: **Settings → Secrets and variables → Codespaces** y agrega:

| Nombre | Para qué sirve | Valor |
|---|---|---|
| `VITE_SUPABASE_URL` | Frontend (Auth) | `https://klkkxwmtkfkwxevkzjeh.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Frontend (Auth) | tu `anon key` de Supabase |
| `SUPABASE_DB_CONNECTION_STRING` | Backend (datos) | connection string del **pooler** (ver sección de troubleshooting más abajo) |
| `SUPABASE_JWT_SECRET` | Backend (valida el login) | JWT Secret de Project Settings → API |

Nota: **no hace falta un `SUPABASE_URL` aparte para el backend** — si no lo encuentra, automáticamente reutiliza `VITE_SUPABASE_URL`.

Estos secretos se inyectan automáticamente como variables de entorno dentro de cualquier
Codespace que se abra sobre este repo (los tuyos y los de cualquier otra persona con acceso
al repo), y `Program.cs` los lee con `builder.Configuration["..."]`.

⚠️ **No pongas estos valores en `appsettings.json` ni los subas al repo.** El connection
string tiene tu contraseña de base de datos, y el JWT Secret permite falsificar tokens.

## 3. El `.env` del frontend ahora se genera solo — nadie tiene que copiarlo a mano

Antes, cada persona tenía que hacer `cp .env.example .env` y llenarlo manualmente, lo
cual era fácil de olvidar (y por eso la app caía en "Modo Demostración" con datos
inventados en vez de conectarse a Supabase de verdad).

Ahora, `.devcontainer/scripts/generate-env.sh` corre automáticamente cada vez que el
Codespace arranca (`postCreateCommand` y `postStartCommand`), y:

1. Lee `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` de los secretos del paso 2.
2. Calcula `VITE_API_URL` solo, usando `$CODESPACE_NAME` (variable que Codespaces ya
   trae integrada) — nadie tiene que copiar la URL del puerto 5080 a mano nunca más.
3. Escribe el `.env` real en la raíz del proyecto.

Si alguien abre un Codespace y ve la app en "Modo Demostración", el 99% de las veces
es porque **no configuró los dos secretos `VITE_*`** en su fork/copia del repo — el
mensaje del script se lo advierte en la terminal al arrancar.

## 3. Abrir el Codespace

1. Sube estos archivos nuevos a tu repo (`backend/`, `.devcontainer/`, `src/lib/api.ts`).
2. En GitHub, botón **Code → Codespaces → Create codespace on main**.
3. El `postCreateCommand` corre automáticamente `npm install` y `dotnet restore`.

## 4. Correr los dos servicios

Abre dos terminales dentro del Codespace:

```bash
# Terminal 1 — Frontend
npm run dev

# Terminal 2 — Backend
cd backend
dotnet run
```

Codespaces reenviará (forward) los puertos 3000 y 5080 automáticamente. Copia la URL
pública del puerto 5080 (pestaña "Ports") y ponla en un `.env` en la raíz del proyecto:

```
VITE_SUPABASE_URL=https://klkkxwmtkfkwxevkzjeh.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
VITE_API_URL=https://<tu-codespace>-5080.app.github.dev
```

## 5. ⚠️ Importante: revisa `src/types.ts`

Noté que tu esquema real en Supabase usa `uuid` para `id_libro`, `id_genero`, etc.,
pero `src/types.ts` los tiene tipados como `number` (probablemente por los datos de
ejemplo/demo que trae el proyecto de Google AI Studio). Antes de conectar el frontend
a la API real, cambia esos tipos a `string` (los UUID viajan como texto en JSON), o
tendrás errores de comparación/filtrado en la UI.

## 6. Siguiente paso sugerido

Los endpoints ya están listos y probados en su diseño (`/api/libros`, `/api/publicaciones`,
`/api/favoritos`, `/api/generos`, `/api/usuarios`), con permisos por rol
(Visualizador / Publicador / Administrador). Lo que falta es reemplazar, página por
página (`Home.tsx`, `PublisherDashboard.tsx`, `AdminDashboard.tsx`, etc.), las llamadas
directas a `supabase.from(...)` por las funciones de `src/lib/api.ts`. Si quieres, en el
siguiente paso puedo ayudarte a migrar esas páginas una por una.

Instalar los tipos de React (La causa más común)
Abre tu terminal en la raíz del proyecto y ejecuta:

npm install -D @types/react @types/react-dom