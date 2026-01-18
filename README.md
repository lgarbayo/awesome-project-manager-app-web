# Awesome Project Manager Web App

Aplicacion web para la gestion de proyectos con un flujo basico de listado, detalle y edicion, mas un prototipo de gantt interactivo con exportacion a Excel. El objetivo principal es servir como base de interfaz para integrarse con una API REST y evolucionar hacia una experiencia completa de gestion de portafolios.

## Caracteristicas principales

- Listado de proyectos con navegacion al detalle.
- Detalle de proyecto con formulario de edicion.
- Gantt de tareas como prueba de concepto con configuracion por semanas.
- Exportacion del gantt a Excel.
- Arquitectura modular por paginas, componentes, servicios y modelos.

## Tecnologias

- Angular 20
- RxJS 7
- Formularios reactivos
- ExcelJS y FileSaver para exportacion

## Requisitos

- Node.js 22 o superior
- npm 10 o superior

## Instalacion

```bash
npm install
```

## Ejecucion en desarrollo

```bash
npm run start
```

La aplicacion queda disponible en `http://localhost:4200/`.

## Scripts disponibles

```bash
npm run start   # servidor de desarrollo
npm run build   # build de produccion
npm run watch   # build con watch en modo desarrollo
npm run test    # pruebas unitarias con Karma
```

## Estructura de carpetas

```
src/app/
  component/        componentes reutilizables (ej. gantt, formularios)
  model/            interfaces y modelos de dominio
  page/             paginas y pantallas principales
  service/          capa de acceso a datos y logica de negocio
```

## Flujo funcional actual

1. La ruta raiz redirige a `/list`, que muestra proyectos de ejemplo.
2. Cada proyecto abre su detalle en `/project/:projectUuid`.
3. En el detalle se muestra el formulario de edicion y el gantt.

## Integracion con API

Los servicios aun no consumen una API real. En `src/app/service/project-service.ts`:

- `list()` y `get()` usan datos de ejemplo y realizan una llamada ficticia para simular latencia.
- `createProject()` y `updateProject()` contienen rutas placeholder (`path!!`, `path/:projectUuid`).

Para integrar la API real, reemplazar esas rutas y adaptar los modelos a la respuesta del backend.

## Datos de ejemplo

El listado y el detalle se alimentan de un conjunto fijo de proyectos de prueba definido en `src/app/service/project-service.ts`. Esto permite desarrollar la interfaz sin depender del backend.

## Exportacion a Excel

El gantt ofrece un boton de descarga que genera un archivo Excel con la tabla renderizada. El comportamiento se encuentra en `src/app/component/project/task-gantt/task-gantt.ts`.

## Pruebas

```bash
npm run test
```

## Build de produccion

```bash
npm run build
```

Los artefactos se generan en `dist/`.

---

  ## Contribuciones

  1. Haz un fork del repositorio.
  2. Crea una rama feature: git checkout -b feature/nueva-funcionalidad que cuelgue de la rama develop.
  3. Asegúrate de pasar los tests y respeta el estilo del proyecto.
  4. Envía un pull request explicando claramente el cambio.

