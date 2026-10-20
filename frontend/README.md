# SportManager — Frontend Angular

Prototipo frontend para una plataforma de gestión de competencias deportivas. Incluye landing pública, pantallas de autenticación de demostración, dashboard, catálogo de deportes y un área administrativa separada para usuarios, roles, permisos y asignación de permisos.

## Requisitos
- Node.js LTS compatible con Angular 20
- npm

## Ejecutar en Visual Studio Code
1. Descomprime el proyecto y abre la carpeta `sportmanager-angular` en VS Code.
2. Abre una terminal dentro de esa carpeta.
3. Ejecuta `npm install`.
4. Ejecuta `npm start`.
5. Abre la URL local que indique Angular CLI (normalmente `http://localhost:4200`).

## Rutas de demostración
La navegación se realiza desde el menú lateral. Angular Router gestiona `/dashboard`, `/permissions` y `/role-permissions`; las demás vistas existentes conservan temporalmente la navegación demostrativa original. `/permissions` permite consultar y administrar el catálogo simulado; `/role-permissions` permite asignar y retirar esos permisos a los roles existentes. La opción **Seguridad (DEV)** mantiene el módulo administrativo existente y su matriz simulada.

## Alcance y conexión al backend
- Todo el comportamiento actual utiliza datos en memoria para permitir probar la interfaz.
- El catálogo de permisos y los roles de demostración se centralizan en `PermissionDataService`; las matrices de asignación y **Seguridad (DEV)** se derivan del mismo catálogo y de sus asociaciones por rol.
- La matriz de `/role-permissions` mantiene sus cambios pendientes en el componente y actualiza las asociaciones `roleNames` compartidas solo al guardar. El estado guardado permanece en el servicio durante la sesión; el rol Administrador conserva las asignaciones iniciales que mostraba la matriz anterior.
- Las URL iniciales del catálogo no están definidas y se muestran como “Sin definir”; no representan endpoints reales. Los permisos creados y sus cambios se conservan mientras la aplicación siga abierta, no después de recargarla.
- Al eliminar un permiso asociado en la simulación, se elimina el permiso y su asociación, pero no el rol. Las reglas definitivas de eliminación se validarán al integrar el backend.
- Los formularios de login/registro, OAuth, recuperación y guardado muestran mensajes de demostración; no autentican usuarios ni persisten datos.
- No incluye backend, base de datos, endpoints, tokens reales ni protección de rutas del servidor.
- Antes de producción, reemplazar datos simulados por servicios Angular `HttpClient`, configurar las URLs de API, implementar guards/interceptors según el contrato del backend y validar autorización también en el servidor.
- La entrada `Seguridad (DEV)` está visible intencionalmente durante el desarrollo. Ocultarla según rol y proteger las rutas cuando exista autenticación real.

## Estructura
- `src/app/app.component.ts` y `src/app/app.component.html`: estado y vistas de demostración que todavía no se han migrado.
- `src/app/layout/`: menú lateral y barra superior reutilizables.
- `src/app/features/dashboard/`: Dashboard actual y sus acciones de navegación.
- `src/app/features/permissions/`: gestión del catálogo simulado, modelos compartidos y asignación de permisos a roles.
- `src/main.ts`: rutas de Angular Router.
- `src/styles.css`: sistema visual responsive oscuro con acentos cian/verde.
