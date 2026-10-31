import { Categoria, Evento, Lugar, Usuario } from '../tipos/modelos';

export const categorias: Categoria[] = [
  { id: 'cat-playas', nombre: 'Playas', icono: 'water-outline', color: '#1CA7A6', orden: 1 },
  { id: 'cat-termas', nombre: 'Termas', icono: 'sunny-outline', color: '#0E5A74', orden: 2 },
  { id: 'cat-museos', nombre: 'Museos y patrimonio', icono: 'business-outline', color: '#A97932', orden: 3 },
  { id: 'cat-gastronomia', nombre: 'Gastronomía', icono: 'restaurant-outline', color: '#D7B98E', orden: 4 },
  { id: 'cat-artesanias', nombre: 'Artesanías', icono: 'color-palette-outline', color: '#1CA7A6', orden: 5 },
  { id: 'cat-naturaleza', nombre: 'Naturaleza', icono: 'leaf-outline', color: '#6C8C4A', orden: 6 },
  { id: 'cat-alojamiento', nombre: 'Alojamiento', icono: 'bed-outline', color: '#547180', orden: 7 },
];

const horariosCentro = [
  { dia: 0 as const, abre: '09:00', cierra: '19:00' },
  { dia: 1 as const, abre: '09:00', cierra: '19:00' },
  { dia: 2 as const, abre: '09:00', cierra: '19:00' },
  { dia: 3 as const, abre: '09:00', cierra: '19:00' },
  { dia: 4 as const, abre: '09:00', cierra: '19:00' },
  { dia: 5 as const, abre: '09:00', cierra: '20:00' },
  { dia: 6 as const, abre: '10:00', cierra: '20:00' },
];

/**
 * Fotografías reales para la demo académica.
 *
 * La API de referencia trae imágenes sintéticas generadas por código para sus
 * semillas. Las reemplazamos por imágenes públicas de los lugares, manteniendo
 * los mismos registros del catálogo local y dejando los créditos en
 * assets/IMAGENES_FUENTES.md.
 */
const imagenesReales = {
  molinoForclaz: ['https://www.argentina.gob.ar/sites/default/files/molinoforclazcnm.jpg'],
  termasColon: ['https://termascolon.gov.ar/wp-content/uploads/2018/06/DSC_0219.jpg'],
  playaNorte: ['https://colon.gov.ar/wp-content/uploads/2026/01/WhatsApp-Image-2026-01-06-at-08.12.15.jpeg'],
  parqueElPalmar: ['https://www.argentina.gob.ar/sites/default/files/pn_el_palmar_ecosistema_ph_parquesnacionales.jpg'],
  feriaArtesanos: [
    'https://colon.gov.ar/wp-content/uploads/2026/10/IMG_0086-1-1-scaled.jpg',
    'https://colon.gov.ar/wp-content/uploads/2026/10/IMG_0100-1024x670.jpg',
  ],
  casaCultura: ['https://media.elentrerios.com/colon/fotos/2013/04/10/o_1365612617.jpg'],
  puertoViejo: ['https://upload.wikimedia.org/wikipedia/commons/0/08/Puerto_viejo%2C_Col%C3%B3n_-_2.jpg'],
};

export const lugares: Lugar[] = [
  {
    id: 'lug-001', nombre: 'Molino Forclaz', categoriaId: 'cat-museos',
    descripcionCorta: 'Molino de viento de 1888 levantado por colonos suizos.',
    descripcion: 'Construido en 1888 por Juan Bautista Forclaz, el molino conserva una parte fundamental de la historia de los inmigrantes que llegaron a la región. El recorrido permite mirar la estructura, entender cómo funcionaba y escuchar una audioguía breve frente al patrimonio.',
    coordenadas: { latitud: -32.1904, longitud: -58.1932 }, direccion: 'Colonia San José, Ruta Provincial 26',
    imagenes: imagenesReales.molinoForclaz, horarios: horariosCentro, telefono: '345-4421234', sitioWeb: null,
    precioEntrada: 1500, audioguia: { url: 'https://api.colon.tur.ar/audio/molino-es.m4a', duracionSegundos: 252, idioma: 'es' },
    codigoQr: 'COLON:lug-001', accesible: false, activo: true, actualizadoEn: '2026-08-01T10:30:00-03:00',
  },
  {
    id: 'lug-002', nombre: 'Termas de Colón', categoriaId: 'cat-termas',
    descripcionCorta: 'Aguas termales, descanso y propuestas para toda la familia.',
    descripcion: 'Complejo termal con piscinas, espacios de descanso y servicios para pasar el día. Antes de salir conviene revisar el horario de temporada y las condiciones de ingreso.',
    coordenadas: { latitud: -32.2062, longitud: -58.1412 }, direccion: 'Ruta Nacional 14, acceso a Colón',
    imagenes: imagenesReales.termasColon, horarios: horariosCentro, telefono: '3447-430000', sitioWeb: 'https://www.colon.gov.ar',
    precioEntrada: 9000, audioguia: null, codigoQr: 'COLON:lug-002', accesible: true, activo: true, actualizadoEn: '2026-08-01T10:30:00-03:00',
  },
  {
    id: 'lug-003', nombre: 'Playa Norte', categoriaId: 'cat-playas',
    descripcionCorta: 'Arena, río y una costanera para caminar sin apuro.',
    descripcion: 'Una de las postales clásicas de Colón para disfrutar del río, el atardecer y la vida al aire libre. El acceso es gratuito y la disponibilidad de servicios puede variar según la temporada.',
    coordenadas: { latitud: -32.2203, longitud: -58.1424 }, direccion: 'Costanera de Colón',
    imagenes: imagenesReales.playaNorte, horarios: horariosCentro, telefono: null, sitioWeb: null,
    precioEntrada: 0, audioguia: null, codigoQr: 'COLON:lug-003', accesible: true, activo: true, actualizadoEn: '2026-08-01T10:30:00-03:00',
  },
  {
    id: 'lug-004', nombre: 'Parque Nacional El Palmar', categoriaId: 'cat-naturaleza',
    descripcionCorta: 'Palmares, senderos y naturaleza para descubrir sin señal.',
    descripcion: 'Un paisaje de palmares yatay, senderos y fauna nativa. Como dentro del parque la señal puede ser limitada, la app permite guardar la información antes de salir y registrar la visita sin conexión.',
    coordenadas: { latitud: -31.857, longitud: -58.297 }, direccion: 'Ruta Nacional 14, km 198',
    imagenes: imagenesReales.parqueElPalmar, horarios: horariosCentro, telefono: '3447-493049', sitioWeb: null,
    precioEntrada: 0, audioguia: null, codigoQr: 'COLON:lug-004', accesible: false, activo: true, actualizadoEn: '2026-08-01T10:30:00-03:00',
  },
  {
    id: 'lug-005', nombre: 'Feria de Artesanos', categoriaId: 'cat-artesanias',
    descripcionCorta: 'Producción local, regalos y objetos hechos a mano.',
    descripcion: 'Un paseo para conocer a los artesanos de la ciudad y llevarse una pieza con historia propia. La ubicación y los días de funcionamiento pueden cambiar según la agenda municipal.',
    coordenadas: { latitud: -32.2191, longitud: -58.1441 }, direccion: 'Costanera y peatonal',
    imagenes: imagenesReales.feriaArtesanos, horarios: horariosCentro, telefono: null, sitioWeb: null,
    precioEntrada: 0, audioguia: null, codigoQr: 'COLON:lug-005', accesible: true, activo: true, actualizadoEn: '2026-08-01T10:30:00-03:00',
  },
  {
    id: 'lug-006', nombre: 'Casa de la Cultura', categoriaId: 'cat-museos',
    descripcionCorta: 'Historias locales, exposiciones y memoria de la ciudad.',
    descripcion: 'Espacio cultural para acercarse a la historia de Colón y a las muestras que se renuevan durante el año. Este registro incluye un texto largo de prueba para validar que el detalle pueda leerse con letra ampliada.',
    coordenadas: { latitud: -32.2165, longitud: -58.1431 }, direccion: 'Calle 12 de Abril 405',
    imagenes: imagenesReales.casaCultura, horarios: horariosCentro, telefono: '3447-421555', sitioWeb: null,
    precioEntrada: 0, audioguia: { url: 'https://api.colon.tur.ar/audio/casa-cultura-es.m4a', duracionSegundos: 218, idioma: 'es' },
    codigoQr: 'COLON:lug-006', accesible: null, activo: true, actualizadoEn: '2026-08-01T10:30:00-03:00',
  },
  {
    id: 'lug-007', nombre: 'Puerto Viejo', categoriaId: 'cat-museos',
    descripcionCorta: 'Un punto para mirar el río y reconstruir la historia portuaria.',
    descripcion: 'Lugar de paseo junto al río, con información histórica y una audioguía disponible para escuchar a tu ritmo.',
    coordenadas: { latitud: -32.2169, longitud: -58.1467 }, direccion: 'Costanera de Colón',
    imagenes: imagenesReales.puertoViejo, horarios: [], telefono: null, sitioWeb: null,
    precioEntrada: 0, audioguia: { url: 'https://api.colon.tur.ar/audio/puerto-viejo-es.m4a', duracionSegundos: 196, idioma: 'es' },
    codigoQr: 'COLON:lug-007', accesible: null, activo: true, actualizadoEn: '2026-08-01T10:30:00-03:00',
  },
];

export const eventos: Evento[] = [
  { id: 'evt-001', titulo: 'Peña en el anfiteatro', descripcion: 'Noche de folclore con artistas de la región.', lugarId: null, direccionLibre: 'Anfiteatro municipal', coordenadas: { latitud: -32.218, longitud: -58.145 }, inicio: '2026-11-14T21:00:00-03:00', fin: '2026-11-15T02:00:00-03:00', imagenUrl: null, precio: 0, estado: 'programado' },
  { id: 'evt-002', titulo: 'Visita guiada al patrimonio', descripcion: 'Recorrido por historias y edificios emblemáticos de Colón.', lugarId: 'lug-001', direccionLibre: null, coordenadas: null, inicio: '2026-11-15T10:00:00-03:00', fin: '2026-11-15T12:00:00-03:00', imagenUrl: null, precio: 0, estado: 'programado' },
  { id: 'evt-003', titulo: 'Avistaje de aves en El Palmar', descripcion: 'Salida guiada para reconocer aves del parque y aprender a observar sin alterar el ambiente.', lugarId: 'lug-004', direccionLibre: null, coordenadas: null, inicio: '2026-11-16T08:00:00-03:00', fin: '2026-11-16T10:30:00-03:00', imagenUrl: null, precio: 2500, estado: 'programado' },
  { id: 'evt-004', titulo: 'Feria suspendida por lluvia', descripcion: 'La actividad se reprogramará cuando las condiciones permitan montar los puestos.', lugarId: 'lug-005', direccionLibre: null, coordenadas: null, inicio: '2026-11-17T18:00:00-03:00', fin: '2026-11-17T22:00:00-03:00', imagenUrl: null, precio: 0, estado: 'suspendido' },
];

export const usuarioDemo: Usuario = {
  id: 'usr-201', nombre: 'Lucía Méndez', email: 'lucia@mail.com', avatarUrl: null, creadoEn: '2026-09-02T18:20:00-03:00',
  preferencias: { categoriasFavoritas: ['cat-museos', 'cat-playas'], avisarProximidad: true, radioAvisoMetros: 250, tema: 'sistema' },
};
