# EXDEV Club API

API de EXDEV Club para consultar información almacenada en Notion y proporcionar los datos utilizados por la aplicación web.

La API está desarrollada con **Hono + TypeScript** y está preparada para ejecutarse localmente y desplegarse posteriormente en **Cloudflare Workers**.

## Tecnologías

* TypeScript
* Hono
* Cloudflare Workers
* Wrangler
* Notion API

## Funcionalidades

Actualmente la API permite consultar información de:

* Miembros de EXDEV Club
* Fotografías de miembros
* Proyectos
* Estado de proyectos
* Áreas de proyectos
* Responsables de proyectos

La API también aplica filtros para determinar qué miembros y proyectos deben mostrarse públicamente.

## Arquitectura

La aplicación web se comunica con esta API y la API se comunica con Notion.

```text
Web
 │
 │ HTTP
 ▼
Hono / Cloudflare Workers
 │
 │ HTTPS
 ▼
Notion API
```

El token de Notion se mantiene en el entorno de la API y no debe exponerse en la aplicación web.

## Requisitos

Necesitas tener instalado:

* Node.js
* npm

Puedes comprobarlo con:

```bash
node --version
npm --version
```

## Instalación

Clona el repositorio:

```bash
git clone <URL_DEL_REPOSITORIO>
```

Entra en la carpeta:

```bash
cd API-exdev
```

Instala las dependencias:

```bash
npm install
```

## Variables de entorno

La API necesita las siguientes variables:

```env
NOTION_TOKEN=
NOTION_DATA_SOURCE_ID=
NOTION_PROJECTS_DATA_SOURCE_ID=
```

### Desarrollo local

Para ejecutar la API localmente se utiliza el archivo:

```text
.dev.vars
```

Ejemplo:

```env
NOTION_TOKEN=tu_token
NOTION_DATA_SOURCE_ID=tu_data_source_id
NOTION_PROJECTS_DATA_SOURCE_ID=tu_projects_data_source_id
```

Los valores reales deben mantenerse privados.

### Seguridad

No subir nunca a GitHub:

```text
.env
.dev.vars
node_modules/
.wrangler/
```

El token de Notion es una credencial privada y no debe escribirse directamente en el código fuente.

## Desarrollo local

Instala las dependencias:

```bash
npm install
```

Inicia el entorno de desarrollo:

```bash
npm run dev
```

Wrangler iniciará la aplicación localmente.

La dirección exacta aparecerá en la terminal al iniciar el servidor.

## Comprobación de TypeScript

Para comprobar que no existen errores de tipos:

```bash
npm run typecheck
```

## Endpoints

### GET `/`

Comprueba que la API está funcionando.

Respuesta:

```json
{
  "message": "API ExDev funcionando"
}
```

### GET `/miembros`

Obtiene los miembros de EXDEV Club desde Notion.

Ejemplo:

```http
GET /miembros
```

### GET `/proyectos`

Obtiene los proyectos de EXDEV Club desde Notion.

Ejemplo:

```http
GET /proyectos
```

## Configuración de CORS

Durante el desarrollo local, la API permite solicitudes desde:

```text
http://localhost:3000
```

Esta configuración deberá revisarse para producción cuando la aplicación web tenga su dominio definitivo.

## Estructura del proyecto

```text
API-exdev/
├── src/
│   ├── index.ts
│   └── notion.ts
├── public/
├── package.json
├── package-lock.json
├── tsconfig.json
├── wrangler.jsonc
├── .gitignore
├── .dev.vars
└── README.md
```

> `.dev.vars` es un archivo local y no debe subirse al repositorio.

## Ejecutar el proyecto en otro ordenador

Para ejecutar la API en otro ordenador:

1. Clonar el repositorio.
2. Instalar las dependencias con `npm install`.
3. Crear un archivo `.dev.vars`.
4. Configurar las variables de Notion.
5. Ejecutar `npm run dev`.

El repositorio contiene el código de la API, pero las credenciales de Notion no forman parte del repositorio.

Por lo tanto, una persona que clone el proyecto necesitará configurar sus propias credenciales de desarrollo para que las consultas a Notion funcionen localmente.

## Despliegue

El proyecto está preparado para utilizar Cloudflare Workers mediante Wrangler.

Para desplegar:

```bash
npm run deploy
```

Las credenciales de producción deben configurarse de forma segura en Cloudflare y no almacenarse dentro del repositorio.

## Comandos disponibles

### Desarrollo

```bash
npm run dev
```

### Comprobar tipos

```bash
npm run typecheck
```

### Despliegue

```bash
npm run deploy
```

## Notion

La API utiliza una integración de Notion para acceder a los Data Sources utilizados por el proyecto.

Variables utilizadas:

| Variable                         | Descripción                              |
| -------------------------------- | ---------------------------------------- |
| `NOTION_TOKEN`                   | Token de autenticación de Notion         |
| `NOTION_DATA_SOURCE_ID`          | Data Source utilizado para los miembros  |
| `NOTION_PROJECTS_DATA_SOURCE_ID` | Data Source utilizado para los proyectos |

La integración debe tener permisos suficientes sobre los recursos de Notion utilizados por la API.

## Estado del proyecto

🚧 **En desarrollo**

La API funciona actualmente en entorno local y utiliza Hono y TypeScript.

El siguiente objetivo es desplegarla en Cloudflare Workers y conectarla con la versión de producción de la aplicación web.

## Seguridad

Nunca almacenar en Git:

* Tokens de Notion
* Contraseñas
* Claves privadas
* Secretos de Cloudflare
* Archivos `.env`
* Archivos `.dev.vars`

Las credenciales deben mantenerse en variables de entorno o secrets del entorno correspondiente.

## Licencia

Proyecto privado de EXDEV Club.
