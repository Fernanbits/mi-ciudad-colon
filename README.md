# Mi Ciudad Colón

Aplicación móvil turística construida con React Native, Expo SDK 58, TypeScript y Expo Router. El alcance está definido exclusivamente por el PDR `Mi Ciudad - Guía turística de Colón`.

## Ejecutar

```powershell
npm.cmd install
npm.cmd run typecheck
npm.cmd start -- --clear
```

Se puede probar con Expo Go usando el QR, siempre que el teléfono y la computadora estén en la misma red Wi-Fi.

## Arquitectura

- `src/app`: rutas y pantallas.
- `src/tipos`: modelos del PDR.
- `src/mocks`: datos de desarrollo.
- `src/servicios`: capa asíncrona de datos y capacidades del dispositivo.
- `src/almacenamiento`: SQLite, caché y preferencias.
- `src/contexto`: estado global de sesión, favoritos, visitas y conectividad.
- `src/components`: componentes visuales reutilizables.
- `BITACORA.md`: proceso completo y guía para la defensa.

## Datos y API

La aplicación trabaja con dos niveles de datos. Cuando existe `EXPO_PUBLIC_API_URL` en un archivo `.env`, los servicios consultan la API de Mi Ciudad para lugares, categorías, eventos, autenticación y visitas. El catálogo se guarda en caché local y las visitas se encolan en SQLite para reintentarlas cuando vuelve la conexión.

Si no se configura la URL de la API o el servidor no responde, la app utiliza el catálogo local de respaldo. Esto permite probar la experiencia turística sin bloquearse por una caída de red.

Para activar la API localmente:

```powershell
Copy-Item .env.example .env
# Editar .env y reemplazar la IP por la de la computadora que ejecuta la API.
```

El teléfono y la computadora deben estar en la misma red Wi-Fi. La API de referencia y sus instrucciones de arranque están en el repositorio de la cátedra: <https://github.com/franco-ruisdias-uner/api-proyectos-mobile/tree/main/api-mi-ciudad>.

No se conecta por defecto a la API de comercios de otra ciudad: ese contrato no cubre la agenda, las audioguías ni las visitas que exige este PDR.

## Seguridad

Los tokens se guardan en `expo-secure-store`. No se incluyen secretos en variables `EXPO_PUBLIC_`. Un futuro `.env` móvil puede contener únicamente una URL pública de API, nunca contraseñas, claves privadas, secretos JWT o credenciales de base de datos.

## Verificaciones

```powershell
npm.cmd run typecheck
npx expo-doctor
npx expo export --platform android
```

Para una entrega instalable se utilizará el perfil `preview` de `eas.json` después de completar la prueba funcional en Android y iPhone.
