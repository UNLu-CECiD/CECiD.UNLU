# CECiD UNLu
Sitio web del Centro de Estudiantes de la carrera **Analista Universitario en Ciencias de Datos** de la Universidad Nacional de Luján (UNLu). Reúne información de la carrera, recursos para estudiantes, novedades y canales de contacto.

## Contenidos

- [Secciones del sitio](#secciones-del-sitio)
- [Tecnologías](#tecnologías)
- [Ejecución local](#ejecución-local)
- [Configuración de Supabase](#configuración-de-supabase)
- [Estructura del proyecto](#estructura-del-proyecto)

## Secciones del sitio

| Página | Contenido |
| --- | --- |
| `index.html` | Inicio y publicaciones recientes. |
| `mapa.html` | Mapa de sedes de la UNLu y croquis interactivo del campus de Luján. |
| `equipo.html` | Equipo del Centro y sus sedes. |
| `propuestas.html` | Propuestas y ejes de trabajo del CECiD. |
| `participaciones.html` | Participaciones y eventos, como Expo UNLu y CACIC. |
| `biblioteca.html` | Biblioteca digital de materiales de estudio; el espacio está en preparación. |
| `plan-de-estudios.html` | Plan 20.01, correlatividades y seguimiento local del progreso académico. |
| `blog.html` | Artículos y comentarios moderados. |
| `contacto.html` | Redes, canales de contacto y formulario de consultas. |
| `politica-de-privacidad.html` | Información sobre el tratamiento de datos del sitio. |
| `terminos-y-condiciones.html` | Condiciones de uso del sitio. |

El plan de estudios guarda las materias marcadas como aprobadas en el almacenamiento local del navegador (`localStorage`); esos datos no se envían a Supabase. Las solicitudes de verificación estudiantil quedan pendientes de revisión: el envío del formulario no verifica automáticamente la identidad.

## Tecnologías

- HTML, CSS y JavaScript sin framework ni proceso de compilación.
- Supabase REST API para contenido y formularios dinámicos.
- Leaflet para el mapa interactivo (cargado desde CDN).
- Google Fonts para las tipografías.

## Ejecución local

No se requiere instalar dependencias. Desde PowerShell, ubicándose en la raíz del repositorio:

```powershell
cd .\CECiD
py -m http.server 8000
```

Abrí [http://localhost:8000](http://localhost:8000) en el navegador. Para detener el servidor, usá `Ctrl+C` en la terminal.

También se puede abrir la carpeta `CECiD` con Visual Studio Code y usar una extensión de servidor estático. Es necesario usar un servidor HTTP local: algunas funciones que consultan Supabase no funcionan correctamente al abrir directamente los archivos con `file://`.

## Configuración de Supabase

Las páginas con contenido dinámico cargan `supabase-config.js` antes de `app.js`. Ese archivo debe contener la URL del proyecto Supabase y una clave pública (`publishable` o `anon`) válida para el entorno:

```js
window.CECID_SUPABASE_CONFIG = Object.freeze({
  url: 'https://TU-PROYECTO.supabase.co',
  publishableKey: 'TU_CLAVE_PUBLICA'
});
```

La clave pública se usa desde el navegador y **no reemplaza** las políticas de seguridad de la base de datos. No publiques ni incluyas en el sitio una clave `service_role`.

La aplicación consulta las tablas `blog_posts`, `team_members`, `proposals`, `events` y `resources`, y permite enviar registros a `blog_comments`, `resource_submissions` y `contact_messages`. Estas tablas y sus permisos/políticas deben estar configurados en Supabase para habilitar las funciones correspondientes. Sin esa configuración, las páginas estáticas siguen disponibles, pero el contenido dinámico y los envíos pueden fallar.

En la raíz del repositorio hay una migración adicional: [`20261110130900_contact_verification_and_comments.sql`](../supabase/migrations/20261110130900_contact_verification_and_comments.sql). Se aplica sobre un proyecto Supabase que ya tenga la tabla `public.contact_messages`; agrega los campos de verificación estudiantil y configura los comentarios del blog. No es un esquema inicial completo de la base de datos.

## Estructura del proyecto

```text
CECiD/
├── index.html
├── mapa.html
├── equipo.html
├── propuestas.html
├── participaciones.html
├── biblioteca.html
├── plan-de-estudios.html
├── blog.html
├── contacto.html
├── politica-de-privacidad.html
├── terminos-y-condiciones.html
├── app.js
├── styles.css
├── supabase-config.js
└── assets/
    └── expo/
```

Las imágenes, documentos institucionales y demás recursos gráficos están junto a las páginas o dentro de `assets/`. La carpeta `supabase/migrations/` está en la raíz del repositorio, fuera de `CECiD/`.