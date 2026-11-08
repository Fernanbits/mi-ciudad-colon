# Mi Ciudad Colón

<p align="center">
  <img src="assets/icon-mi-ciudad.png" alt="Ícono de Mi Ciudad Colón" width="140">
</p>

Aplicación móvil turística para descubrir Colón, Entre Ríos. El proyecto está planteado como un MVP académico: busca resolver el recorrido principal del PDR con una base clara, mantenible y fácil de continuar.

La app permite explorar lugares, consultar eventos, armar un recorrido personal, completar un pasaporte turístico visual, registrar visitas y guardar recuerdos. También contempla ubicación, códigos QR, favoritos, audioguías y funcionamiento con datos locales cuando la conexión no está disponible.

**Equipo:** Grupo 75

**Institución:** Universidad Nacional de Entre Ríos — FCAD

- Gustavo Minchiotti
- Francisco López
- Alicia Montenegro
- Jimena Fernández

## Documentación

- [Documentación funcional y técnica](DOCUMENTACION_PROYECTO.md)

## Ejecutar el proyecto

Requisitos mínimos:

- Node.js LTS.
- npm.
- Android Studio y Android SDK para usar un emulador o un dispositivo Android.
- Expo Go compatible con SDK 58 para la prueba rápida en un teléfono.

Desde la carpeta del proyecto:

```powershell
npm.cmd install
npm.cmd run typecheck
npm.cmd start -- --clear
```

El servidor muestra un código QR. Para abrirlo con Expo Go, el teléfono y la computadora deben estar conectados a la misma red Wi-Fi. Si la red bloquea la conexión local, se puede probar con un emulador Android o con el modo de túnel de Expo.

## Estructura principal

```text
src/
├── app/              # pantallas y rutas de Expo Router
├── components/       # componentes visuales reutilizables
├── contexto/         # estado compartido de la aplicación
├── almacenamiento/   # SQLite, caché y preferencias
├── mocks/            # datos de respaldo para desarrollo
├── servicios/        # API, ubicación, notificaciones, archivos y sesión
├── theme/            # colores y decisiones visuales de marca
└── tipos/            # modelos TypeScript del dominio
```

## Datos y API

Cuando existe `EXPO_PUBLIC_API_URL` en un archivo `.env`, la app consulta la API de Mi Ciudad para lugares, categorías, eventos, autenticación y visitas. El catálogo se guarda en caché local y las visitas pendientes se conservan en SQLite para intentar sincronizarlas más adelante.

Si no se configura la API o el servidor no responde, se utiliza el catálogo local de respaldo. Esta decisión permite presentar el recorrido principal sin que una caída de red deje la app completamente vacía.

## Sistema de códigos QR

Mi Ciudad usa códigos QR para registrar visitas turísticas. Cada código contiene el identificador del lugar con el formato `COLON:lug-XXX`. Al escanearlo, la app:

1. valida el código contra la API o el catálogo local;
2. rechaza códigos que no pertenecen a Mi Ciudad;
3. verifica que el QR corresponda al lugar esperado cuando se abre el lector desde un detalle;
4. guarda la visita primero en SQLite;
5. la sincroniza con la API cuando vuelve la conexión.

Los códigos de prueba están en [QR_PRUEBAS.html](QR_PRUEBAS.html) y en `assets/qr-prueba/`. La plancha incluye ocho códigos válidos y uno inválido para comprobar el rechazo del lector. Para regenerarlos se puede ejecutar:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\generar-qrs.ps1"
```

El lector necesita permiso de cámara. Si el permiso se rechaza, se puede continuar con el registro manual o por ubicación.

Para activar la API de forma local:

```powershell
Copy-Item .env.example .env
# Editar .env y colocar la dirección de la computadora que ejecuta la API.
```

La API de referencia y sus instrucciones están en el repositorio de la cátedra: [api-proyectos-mobile](https://github.com/franco-ruisdias-uner/api-proyectos-mobile/tree/main/api-mi-ciudad).

## Seguridad básica

- Los tokens de sesión se guardan mediante `expo-secure-store`.
- `.env` está excluido de Git y solo `.env.example` se comparte como plantilla.
- Las variables `EXPO_PUBLIC_` no deben contener contraseñas, claves privadas ni secretos.
- La app solicita permisos con textos explicativos y solo cuando la función los necesita.

## Comandos útiles

```powershell
npm.cmd run typecheck
npm.cmd start -- --clear
npm.cmd run android
npx expo-doctor
npx expo export --platform android
```

El proyecto todavía se considera una entrega académica. Antes de una publicación real habría que completar pruebas automatizadas, una validación manual con TalkBack, la configuración de credenciales para notificaciones remotas y una estrategia de despliegue.
