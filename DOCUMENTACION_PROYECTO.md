# Documentación del proyecto — Mi Ciudad Colón

<p align="center">
  <img src="assets/icon-mi-ciudad.png" alt="Ícono de Mi Ciudad Colón" width="160">
</p>

**Versión:** 1.0.0  
**Tipo:** MVP académico para dispositivos móviles  
**Ciudad:** Colón, Entre Ríos, Argentina  
**Tecnología principal:** React Native con Expo y TypeScript

**Institución:** Universidad Nacional de Entre Ríos — FCAD

## Equipo — Grupo 75

- Gustavo Minchiotti
- Francisco López
- Alicia Montenegro
- Jimena Fernández

## 1. Presentación

Mi Ciudad Colón es una guía turística móvil pensada para acompañar a una persona durante su visita a la ciudad. La propuesta reúne lugares de interés, eventos, recorridos y recuerdos de cada visita en una sola experiencia.

El proyecto se construyó con un alcance acotado y demostrable. No intenta reemplazar todos los servicios turísticos de la ciudad ni presentarse como una plataforma productiva. La prioridad fue implementar el flujo principal del PDR, dejar una base ordenada y documentar las decisiones que pueden continuarse en una próxima etapa.

## 2. Problema que se busca resolver

La información turística suele estar repartida entre mapas, redes sociales, páginas web y recomendaciones informales. Esto dificulta decidir qué hacer según el tiempo disponible, la distancia y los intereses de cada visitante.

La aplicación propone una entrada más simple:

1. La persona explora lugares o eventos.
2. Consulta la información principal de cada propuesta.
3. Guarda favoritos o arma un recorrido.
4. Registra las visitas realizadas.
5. Puede agregar una nota o una fotografía como recuerdo.

## 3. Alcance funcional

### Incluido en el MVP

- Inicio con acceso a las funciones principales.
- Catálogo de lugares turísticos con categorías e imágenes.
- Detalle de cada lugar con descripción, ubicación y acciones relacionadas.
- Agenda de eventos.
- Recorrido personal a partir de lugares seleccionados.
- Pasaporte turístico visual con progreso, sellos por lugar e insignias.
- Favoritos persistentes.
- Registro de visitas por QR, ubicación o carga manual.
- Nota y fotografía asociadas a una visita. La fotografía se conserva localmente y se sube al backend durante la sincronización cuando hay sesión y conexión.
- Mapa y cálculo de distancia cuando el dispositivo entrega ubicación.
- Inicio de sesión y registro contra la API cuando está configurada.
- Persistencia local de catálogo, preferencias y visitas.
- Cola local para visitas que todavía no pudieron sincronizarse.
- Pantallas de permisos para ubicación, cámara, galería, notificaciones y biometría.
- Audioguías por archivo remoto cuando la API entrega un recurso válido y narración local de la descripción como respaldo cuando el recurso no está disponible.

### Fuera del alcance actual

- Panel administrativo para cargar contenido.
- Moderación de fotografías y comentarios.
- Pagos, reservas o venta de entradas.
- Chat con prestadores turísticos.
- Configuración de notificaciones push remotas en producción: la API está preparada, pero el móvil necesita un development build con credenciales de Expo.
- Pruebas automatizadas completas.

Dejar estas tareas explícitamente fuera del MVP ayuda a no confundir una demostración académica con un producto terminado.

### Pasaporte turístico

El pasaporte es una capa de gamificación liviana que acompaña el recorrido sin convertir la app en un juego separado. Su objetivo es motivar la exploración y dejar una representación visual de los lugares conocidos.

La pantalla muestra:

- cantidad de lugares únicos descubiertos sobre el total del catálogo;
- porcentaje de avance del pasaporte;
- cantidad de categorías visitadas;
- insignias por hitos de exploración;
- una colección de tarjetas con imágenes reales de los lugares;
- estado desbloqueado o pendiente para cada sello.

Un sello se considera desbloqueado cuando existe al menos una visita para ese lugar. La visita puede provenir de un QR, de la ubicación GPS o de un registro manual. Por eso el pasaporte reutiliza las visitas ya guardadas y no mantiene una segunda fuente de datos que pueda quedar desactualizada.

Las tarjetas pendientes conservan la imagen del destino, con menor intensidad visual, cuando existe una fotografía verificada. Cuando no hay una fuente confiable, se muestra el estado neutro “Foto pendiente” en lugar de usar una ilustración genérica. Las tarjetas desbloqueadas muestran el nombre del lugar y su categoría.

## 4. Tecnologías elegidas

| Área | Tecnología | Motivo de elección |
|---|---|---|
| App móvil | React Native | Permite trabajar con una base compartida para Android e iOS. |
| Entorno | Expo SDK 58 | Simplifica el arranque, las pruebas y el acceso a módulos del dispositivo. |
| Navegación | Expo Router | Organiza las pantallas a partir de rutas y carpetas. |
| Lenguaje | TypeScript | Ayuda a detectar errores en los modelos y servicios. |
| Persistencia | SQLite y `expo-sqlite/kv-store` | Permite conservar visitas, caché y preferencias en el teléfono. |
| API | HTTP/JSON con `fetch` | Mantiene la integración simple y compatible con la API provista. |
| Voz y audio | `expo-speech` y `expo-audio` | Reproduce un archivo remoto cuando está disponible y usa la voz instalada en el teléfono como respaldo audible. |
| Diseño | Manrope, colores de marca y componentes propios | Busca una identidad turística moderna y consistente. |

## 5. Arquitectura general

La aplicación está separada en capas pequeñas. No se utiliza una arquitectura compleja porque el tamaño actual del proyecto no la necesita.

```text
Pantallas de Expo Router
          │
          ▼
Contexto global de la aplicación
          │
          ├── Servicios de dominio
          │      ├── API HTTP
          │      ├── ubicación y distancias
          │      ├── sesión y seguridad
          │      └── visitas y notificaciones
          │
          └── Persistencia local
                 ├── SQLite: visitas pendientes y sincronización
                 ├── KV store: catálogo y categorías
                 └── Secure Store: tokens de sesión
```

### Responsabilidad de las carpetas

- `src/app`: rutas, pantallas, layouts y modales.
- `src/components`: piezas visuales que se reutilizan en más de una pantalla.
- `src/contexto`: sesión, favoritos, conectividad, catálogo y visitas.
- `src/servicios`: comunicación externa y capacidades del dispositivo.
- `src/almacenamiento`: lectura y escritura local.
- `src/mocks`: datos de respaldo para que el proyecto también pueda demostrarse sin API.
- `src/tipos`: contratos TypeScript para lugares, eventos, usuarios y visitas.
- `src/contexto/TemaContext.tsx`: colores, modos claro/oscuro/sistema y preferencias visuales de la marca.

## 6. Navegación de la app

```text
Inicio
├── Lugares
│   └── Detalle del lugar
├── Agenda
│   └── Detalle del evento
├── Mi recorrido
│   └── Mapa / puntos seleccionados
└── Yo
    ├── Favoritos
    ├── Mis visitas
    ├── Registro manual
    └── Acceso / registro

Acciones transversales:
├── Escanear QR
├── Usar ubicación
├── Elegir fotografía
└── Reproducir audioguía o leer descripción
```

Dentro de **Mi recorrido**, la acción principal aparece primero: la persona puede escanear un QR, usar su ubicación o iniciar un registro manual. Después puede completar el lugar, la fotografía y la nota; al final consulta el pasaporte, los sellos y el historial. Este orden prioriza la tarea que motivó la entrada a la pantalla y deja la gamificación como refuerzo.

### Sistema de códigos QR

El QR funciona como una identificación simple del atractivo. En esta entrega académica el contenido del código usa el formato `COLON:lug-XXX`, por ejemplo `COLON:lug-003` para Balneario Piedras Coloradas.

El flujo de lectura es:

1. La persona entra a **Mi recorrido** o al detalle de un lugar y toca **Escanear QR**.
2. La app solicita el permiso de cámara sólo en ese momento.
3. `expo-camera` detecta únicamente códigos QR.
4. El valor leído se consulta con `obtenerLugarPorQr`.
5. Si no existe o está inactivo, se muestra **QR no reconocido** y no se crea una visita.
6. Si el lector se abrió desde un detalle, se compara el lugar esperado con el lugar del QR.
7. Si coincide, se guarda una visita con origen `qr`, fecha y usuario local.
8. La visita se conserva primero en SQLite y queda pendiente de sincronización si no hay red.

Los códigos de prueba se encuentran en `assets/qr-prueba/` y se presentan juntos en [QR_PRUEBAS.html](QR_PRUEBAS.html). La plancha contiene los siguientes casos:

| Código | Lugar | Uso en QA |
|---|---|---|
| `COLON:lug-001` | Termas de Colón | QR válido |
| `COLON:lug-002` | Playa Norte | QR válido y prueba de lugar equivocado |
| `COLON:lug-003` | Balneario Piedras Coloradas | QR válido |
| `COLON:lug-004` | Molino Forclaz | QR válido con audioguía TTS |
| `COLON:lug-005` | Museo Casa de la Cultura | QR válido |
| `COLON:lug-006` | Parque Nacional El Palmar | QR válido para probar modo offline |
| `COLON:lug-007` | Puerto Viejo | QR válido con foto local |
| `COLON:lug-010` | Paseo de Artesanos | QR válido |
| `COLON:qr-invalido` | Ninguno | Rechazo esperado |

Para una prueba manual, abrir la plancha desde la PC o imprimirla, iniciar la app en Expo Go, entrar a **Mi recorrido**, tocar **Escanear QR** y apuntar al código. Para probar la validación de correspondencia, abrir primero el detalle de Piedras Coloradas y escanear el QR de Playa Norte: la app debe informar que no corresponde y no registrar la visita.

La plancha no reemplaza los códigos que debería colocar cada atractivo en una instalación real. En una versión productiva, los códigos deberían generarse y administrarse desde el backend, y convendría agregar una firma o token para evitar que una copia del texto permita registrar visitas fuera del lugar.

## 7. Integración con la API

La URL se obtiene desde `EXPO_PUBLIC_API_URL`. La capa `src/servicios/api.ts` centraliza:

- construcción de URLs;
- encabezado `Authorization: Bearer` cuando hay sesión;
- serialización JSON;
- timeout de ocho segundos;
- conversión de respuestas no exitosas a `ApiHttpError`.

La app intenta usar datos remotos cuando la API está configurada. Si esa consulta falla, los servicios pueden recuperar el catálogo local de respaldo. La visita tiene un tratamiento diferente: primero se guarda en el teléfono y luego se intenta sincronizar con `POST /yo/visitas`.

La sincronización actual funciona de esta manera:

1. Se registra la visita en la tabla local `visitas` con `sincronizada = 0`.
2. Si existe sesión y API disponible, se intenta enviarla.
3. Si el servidor responde correctamente, se marca como sincronizada.
4. Si falla la red, el registro permanece local para reintentarlo.

Las fotografías elegidas desde el dispositivo se conservan localmente junto con la visita. Cuando existe una sesión y vuelve la conexión, la app las sube a `POST /archivos`, guarda la URL devuelta y recién después envía la visita a `POST /yo/visitas`. Si la subida o el envío falla, la visita permanece pendiente para reintentarla.

## 8. Permisos y privacidad

La aplicación puede solicitar:

- **Ubicación:** mostrar lugares cercanos y calcular distancias.
- **Cámara:** leer códigos QR y registrar una visita.
- **Galería:** asociar una fotografía a un recuerdo.
- **Notificaciones:** recordatorios locales para eventos; el registro de tokens push queda preparado para un development build con EAS.
- **Biometría:** facilitar el reingreso al dispositivo.

La aplicación incluye modo claro, modo oscuro y modo sistema. La preferencia se guarda localmente y se aplican colores de superficie, texto, bordes y acciones con contraste diferenciado para cada tema.

Los permisos se consideran opcionales para la experiencia base. Si una persona los rechaza, la app debe continuar ofreciendo el catálogo y las funciones que no dependan de ese permiso.

Los tokens no se guardan en texto plano dentro de archivos del proyecto. El archivo `.env` solo sirve para configurar una dirección de API durante el desarrollo y está excluido del repositorio.

## 9. Instalación para desarrollo

1. Clonar el repositorio privado desde GitHub.
2. Instalar Node.js LTS y comprobar `node --version` y `npm --version`.
3. Ejecutar `npm.cmd install`.
4. Ejecutar `npm.cmd run typecheck`.
5. Iniciar Expo con `npm.cmd start -- --clear`.
6. Abrir el QR desde Expo Go SDK 58 o utilizar un emulador Android.

Para usar la API:

```powershell
Copy-Item .env.example .env
```

Después se completa `EXPO_PUBLIC_API_URL` con la dirección accesible desde el teléfono. Una IP `localhost` de la computadora no funciona directamente desde un dispositivo físico.

## 10. Verificación realizada

Las comprobaciones básicas del proyecto son:

```powershell
npm.cmd run typecheck
npx expo-doctor
npx expo export --platform android
```

También se probó el flujo de apertura con Expo Go en Android, la carga del catálogo, el uso de imágenes reales, la navegación principal, la colección visual del pasaporte y la persistencia local.

La verificación no equivale todavía a una batería de pruebas automatizadas. En una etapa posterior sería conveniente agregar pruebas unitarias para servicios y pruebas de recorrido para login, favoritos, registro de visitas y sincronización.

## 11. Limitaciones conocidas

- La API puede no tener información completa para todos los campos del PDR.
- La experiencia offline depende de que el catálogo haya sido guardado previamente.
- Los MP3 de semilla de la API se inspeccionaron y tenían volumen prácticamente nulo: cargaban como archivo, pero no eran una narración audible. Para no presentar ese recurso como contenido real, el reproductor usa la descripción del lugar mediante `expo-speech` cuando detecta una URL de prueba o cuando el archivo remoto no termina de cargar. Si el backend entrega un audio real, `expo-audio` conserva reproducción, pausa, avance, retroceso y descarga. La lectura no fuerza una voz, idioma, velocidad ni tono: respeta la configuración elegida en Android.
- `npm audit` informa vulnerabilidades moderadas transitivas en `glob` y `minimatch` dentro de herramientas de Expo. La corrección automática propone bajar a Expo 53, por lo que no se aplicó de forma forzada sobre este proyecto SDK 58; se debe volver a revisar cuando Expo publique una actualización compatible.
- La API ya implementa el registro y envío de notificaciones push, pero el cliente móvil necesita un `expo.extra.eas.projectId` y un development build para probarlas en un dispositivo; Expo Go se mantiene como entorno de recordatorios locales.
- El cálculo de distancia depende del permiso y de la precisión de ubicación del dispositivo.
- El proyecto se verificó principalmente en Android; iOS requiere una pasada específica.
- La interfaz incorpora etiquetas para lectores de pantalla, roles en acciones y selectores, textos alternativos para imágenes, áreas táctiles claras y modo oscuro. Todavía falta una prueba manual completa con TalkBack, tamaños de fuente del sistema y distintos teléfonos.

## 12. Próximos pasos razonables

1. Completar pruebas manuales en un dispositivo Android y un emulador.
2. Agregar pruebas unitarias para API, almacenamiento y sincronización.
3. Probar en Android la carga multipart de fotografías y los límites de tamaño definidos por la API.
4. Evaluar una voz cloud latinoamericana para producción y mantener `expo-speech` como alternativa offline; en la entrega actual se respeta la voz configurada en el dispositivo.
5. Probar la accesibilidad con TalkBack, tamaño de fuente ampliado y contraste del modo oscuro.
6. Configurar un build de demostración con EAS.
7. Reemplazar datos de respaldo por un catálogo administrable cuando exista un backend estable.

## 13. Criterio de cierre del MVP

Para considerar cumplida la entrega académica, la aplicación debe poder abrir, mostrar el catálogo, navegar hacia un detalle, consultar la agenda, armar un recorrido, registrar una visita y conservar datos básicos aunque la API no esté disponible. Las limitaciones restantes quedan registradas para que el siguiente desarrollo tenga un punto de partida claro.
