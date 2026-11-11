# Historial de versiones

Este archivo resume los cambios visibles de cada versión de **Mi Ciudad Colón**. Los tags de Git identifican los checkpoints estables del código. Las compilaciones de validación se documentan aunque no todas hayan tenido un tag propio en el momento en que se generaron.

| Versión | Tipo | Código fuente | APK de prueba |
|---|---|---|---|
| 1.0.3 | Estable actual | [`v1.0.3`](https://github.com/Fernanbits/mi-ciudad-colon/tree/v1.0.3) | [EAS](https://expo.dev/accounts/jime77/projects/mi-ciudad-colon/builds/ae53a6fb-d84d-4ef2-b1db-0709158a5a2e) |
| 1.0.2 | Estable anterior | [`v1.0.2`](https://github.com/Fernanbits/mi-ciudad-colon/tree/v1.0.2) | [EAS](https://expo.dev/accounts/jime77/projects/mi-ciudad-colon/builds/a69e17f1-23f9-41b6-8369-fc4aa83fc5c7) |
| 1.0.1 | Validación intermedia | Integrada en 1.0.2 | [EAS](https://expo.dev/accounts/jime77/projects/mi-ciudad-colon/builds/a36e9e0e-6ca7-4ff8-8263-31570549e3dd) |
| 1.0.0 | Primera entrega | [`v1.0.0`](https://github.com/Fernanbits/mi-ciudad-colon/tree/v1.0.0) | Respaldo local |

## 1.0.3 — Axios

Estado: APK validada en Pova 6.

### Cambios

- Se reemplazó `fetch` por una instancia central de Axios.
- Se conservaron los timeouts, el token Bearer y los mensajes de error de la aplicación.
- La subida de fotografías usa Axios con `FormData` y un timeout de treinta segundos.
- Se mantuvo la interfaz de `pedirApi()`, evitando cambios en las pantallas y servicios de dominio.
- Se actualizaron la documentación técnica y el guion de defensa.

### Verificación

- TypeScript sin errores.
- Expo Doctor: dependencias alineadas con SDK 58.
- Exportación Android completada.
- Pruebas de JSON, token, multipart, timeout, error HTTP, pérdida de red y consulta real a Cloud Run.
- Diecinueve pruebas de sincronización aprobadas después de migrar el cliente.
- Registro temporal y catálogo comprobados en React Native mediante Expo Go.
- APK instalada como actualización, con la misma firma y sin borrar los datos anteriores.
- Registro temporal confirmado contra la API pública desde la APK independiente.
- Inicio y áreas seguras revisados en el Pova 6, sin cierres ni errores graves en Android.

APK verificada: versión `1.0.3`, `versionCode` 4, 150.129.214 bytes y SHA-256 `6DCA1BCFD55D9FC99BFF5ADA791F7FF793CDE7151D2DC1ED8873492F3CA9D344`.

[Compilación EAS 1.0.3](https://expo.dev/accounts/jime77/projects/mi-ciudad-colon/builds/ae53a6fb-d84d-4ef2-b1db-0709158a5a2e)

## 1.0.2 — Sincronización y audio offline

Estado: APK validada en Pova 6.

### Cambios

- Se corrigieron las áreas seguras superiores e inferiores de Android.
- Se mejoró la sincronización por cuenta para favoritos y visitas.
- Se agregó el estado visible de sincronización en la pantalla **Yo**.
- Se incorporaron ocho narraciones MP3 y la descarga para escuchar sin conexión.
- Se corrigió la eliminación accidental del audio después de mover el archivo descargado.
- Se reforzaron registro, ingreso, persistencia de sesión y recuperación ante errores.

### Verificación

- Instalación como actualización, sin borrar el almacenamiento anterior.
- Registro contra la API pública y persistencia de sesión.
- Audioguía de Molino Forclaz conservada después de cerrar y abrir la app.
- Reproducción del MP3 descargado con modo avión activo.

[Compilación EAS 1.0.2](https://expo.dev/accounts/jime77/projects/mi-ciudad-colon/builds/a69e17f1-23f9-41b6-8369-fc4aa83fc5c7)

## 1.0.1 — Compilación de validación

Estado: versión intermedia reemplazada por 1.0.2.

### Cambios

- Se conectó la APK con la API pública de Cloud Run.
- Se verificaron registro, ingreso, sesión y reproducción de narraciones.
- Se probaron los márgenes de Android en un equipo físico.

### Resultado de QA

Durante esta validación se encontró que la descarga de una audioguía desaparecía después de reiniciar la app. La corrección quedó consolidada y etiquetada en 1.0.2. Esta versión fue una build intermedia y no tuvo un commit exclusivo, por eso se conserva en el historial sin asociarle un tag que mostraría código distinto.

[Compilación EAS 1.0.1](https://expo.dev/accounts/jime77/projects/mi-ciudad-colon/builds/a36e9e0e-6ca7-4ff8-8263-31570549e3dd)

## 1.0.0 — Primera entrega funcional

Estado: base inicial del proyecto Mi Ciudad Colón.

### Funcionalidades

- Mapa, catálogo de lugares, filtros y detalles turísticos.
- Agenda de eventos y recordatorios locales.
- Recorrido personal, favoritos y pasaporte visual.
- Registro de visitas por QR, GPS o carga manual.
- Persistencia local con SQLite y funcionamiento con catálogo de respaldo.
- Modo claro, oscuro y sistema.
- Permisos contextuales para cámara, ubicación, fotos y notificaciones.
- Integración inicial con Expo EAS y Google Maps para Android.

La APK de esta versión se conserva como respaldo local. El tag `v1.0.0` permite consultar su código en GitHub sin subir binarios pesados al repositorio.

## Criterio para próximas versiones

Cada versión nueva debe incluir:

1. número en `package.json` y `app.json`;
2. `versionCode` de Android incrementado;
3. entrada en este historial;
4. TypeScript, Expo Doctor y exportación Android aprobados;
5. prueba manual de los flujos modificados;
6. commit y tag `vX.Y.Z` después de validar el resultado.
