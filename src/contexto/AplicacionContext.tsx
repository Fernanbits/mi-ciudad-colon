import * as Network from 'expo-network';
import { useSQLiteContext } from 'expo-sqlite';
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { guardarVisita, listarVisitas } from '../almacenamiento/base';
import { alternarFavoritoLocal, leerCambiosFavoritos, leerFavoritos } from '../almacenamiento/preferencias';
import { Favorito, Usuario, Visita } from '../tipos/modelos';
import { autenticarConBiometria, cerrarSesion, iniciarSesion, obtenerTokenSesion, recuperarSesion, registrarUsuario } from '../servicios/sesion';
import { ApiHttpError, apiConfigurada } from '../servicios/api';
import { sincronizarFavoritos } from '../servicios/favoritos';
import { sincronizarVisitasCuenta } from '../servicios/visitas';
import { registrarDispositivoPush } from '../servicios/notificaciones';

interface AplicacionContextValue {
  session: Usuario | null;
  favoritos: Favorito[];
  visitas: Visita[];
  online: boolean | null;
  favoritosPendientes: number;
  sincronizando: boolean;
  errorSincronizacion: string | null;
  ultimaSincronizacion: string | null;
  sincronizarDatos: () => Promise<void>;
  toggleFavorito: (lugarId: string) => Promise<void>;
  registrarVisita: (visita: Visita) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (nombre: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  biometricLogin: () => Promise<boolean>;
  refreshVisitas: () => Promise<void>;
}

type DatosCuenta<T> = { usuarioId: string; datos: T };
type EstadoSync = { usuarioId: string; activa: boolean; error: string | null; ultima: string | null };
const Contexto = createContext<AplicacionContextValue | null>(null);

export function AplicacionProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const [session, setSession] = useState<Usuario | null>(null);
  const [guardados, setGuardados] = useState<DatosCuenta<{ favoritos: Favorito[]; pendientes: number }> | null>(null);
  const [registradas, setRegistradas] = useState<DatosCuenta<Visita[]> | null>(null);
  const [estadoSync, setEstadoSync] = useState<EstadoSync | null>(null);
  const [online, setOnline] = useState<boolean | null>(null);
  const usuarioActivoId = session?.id ?? 'anonimo';
  const usuarioActual = useRef(usuarioActivoId);
  const ultimoIntento = useRef(0);
  const autenticando = useRef(false);
  usuarioActual.current = usuarioActivoId;

  const actualizarSesion = (usuario: Usuario | null) => {
    usuarioActual.current = usuario?.id ?? 'anonimo';
    ultimoIntento.current += 1;
    setEstadoSync(null);
    setSession(usuario);
  };

  const cambiarSesion = async (accion: () => Promise<Usuario | null>) => {
    autenticando.current = true;
    ultimoIntento.current += 1;
    setEstadoSync(null);
    try {
      actualizarSesion(await accion());
    } finally {
      autenticando.current = false;
    }
  };

  const cargarFavoritos = useCallback(async () => {
    const [favoritos, cambios] = await Promise.all([leerFavoritos(usuarioActivoId), leerCambiosFavoritos(usuarioActivoId)]);
    if (usuarioActual.current === usuarioActivoId) {
      setGuardados({ usuarioId: usuarioActivoId, datos: { favoritos, pendientes: cambios.length } });
    }
  }, [usuarioActivoId]);

  const refreshVisitas = useCallback(async () => {
    const datos = await listarVisitas(db, usuarioActivoId);
    if (usuarioActual.current === usuarioActivoId) setRegistradas({ usuarioId: usuarioActivoId, datos });
  }, [db, usuarioActivoId]);

  const sincronizarDatos = useCallback(async () => {
    if (autenticando.current || usuarioActivoId === 'anonimo' || online !== true || !apiConfigurada()) return;
    const intento = ++ultimoIntento.current;
    setEstadoSync((anterior) => ({ usuarioId: usuarioActivoId, activa: true, error: null,
      ultima: anterior?.usuarioId === usuarioActivoId ? anterior.ultima : null }));
    let error: string | null = null;
    try {
      const token = await obtenerTokenSesion();
      if (autenticando.current || usuarioActual.current !== usuarioActivoId) return;
      if (!token) throw new Error('Volvé a iniciar sesión para sincronizar tu cuenta.');
      // Un fallo en favoritos no debe bloquear las visitas.
      const resultados = await Promise.allSettled([
        sincronizarFavoritos(usuarioActivoId, token),
        sincronizarVisitasCuenta(db, usuarioActivoId, token),
      ]);
      const fallo = resultados.find((resultado) => resultado.status === 'rejected');
      if (fallo?.status === 'rejected') throw fallo.reason;
      const [cambios, visitas] = await Promise.all([leerCambiosFavoritos(usuarioActivoId), listarVisitas(db, usuarioActivoId)]);
      if (cambios.length || visitas.some((visita) => !visita.sincronizada)) {
        error = 'Quedan cambios en este teléfono. Revisá la conexión y volvé a sincronizar.';
      }
    } catch (causa) {
      error = causa instanceof ApiHttpError && causa.status === 401
        ? 'Tu sesión venció. Volvé a ingresar; tus cambios siguen guardados en este teléfono.'
        : 'No pudimos actualizar la cuenta. Tus cambios siguen guardados en este teléfono.';
    } finally {
      if (usuarioActual.current === usuarioActivoId && intento === ultimoIntento.current) {
        try {
          await Promise.all([cargarFavoritos(), refreshVisitas()]);
        } catch {
          error = 'No pudimos leer los datos guardados. Cerrá y volvé a abrir la app.';
        }
        if (usuarioActual.current === usuarioActivoId && intento === ultimoIntento.current) {
          setEstadoSync((anterior) => ({ usuarioId: usuarioActivoId, activa: false, error,
            ultima: error ? anterior?.ultima ?? null : new Date().toISOString() }));
        }
      }
    }
  }, [db, usuarioActivoId, online, cargarFavoritos, refreshVisitas]);

  useEffect(() => {
    const intentoInicial = ultimoIntento.current;
    void recuperarSesion().then((usuario) => {
      if (intentoInicial === ultimoIntento.current && !autenticando.current) actualizarSesion(usuario);
    }).catch(() => undefined);
    const actualizarRed = (estado: Network.NetworkState) => {
      setOnline(estado.isConnected === true && estado.isInternetReachable !== false);
    };
    void Network.getNetworkStateAsync().then(actualizarRed).catch(() => setOnline(false));
    const suscripcion = Network.addNetworkStateListener(actualizarRed);
    return () => suscripcion.remove();
  }, []);

  useEffect(() => {
    void Promise.all([cargarFavoritos(), refreshVisitas()]).catch(() => {
      if (usuarioActual.current === usuarioActivoId) setEstadoSync({ usuarioId: usuarioActivoId, activa: false,
        error: 'No pudimos leer los datos guardados. Cerrá y volvé a abrir la app.', ultima: null });
    });
  }, [cargarFavoritos, refreshVisitas, usuarioActivoId]);

  useEffect(() => {
    void sincronizarDatos();
    const suscripcion = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') void sincronizarDatos();
    });
    return () => suscripcion.remove();
  }, [sincronizarDatos]);

  useEffect(() => {
    if (!session || online !== true || !apiConfigurada()) return;
    const usuarioId = session.id;
    void obtenerTokenSesion().then(async (token) => {
      if (token && !autenticando.current && usuarioActual.current === usuarioId) await registrarDispositivoPush(token);
    }).catch(() => undefined);
  }, [online, session]);

  // Ignorar respuestas de una sesión anterior.
  const favoritos = guardados?.usuarioId === usuarioActivoId ? guardados.datos.favoritos : [];
  const visitas = registradas?.usuarioId === usuarioActivoId ? registradas.datos : [];
  const favoritosPendientes = guardados?.usuarioId === usuarioActivoId ? guardados.datos.pendientes : 0;
  const sincronizacion = estadoSync?.usuarioId === usuarioActivoId ? estadoSync : null;

  const value = useMemo<AplicacionContextValue>(() => ({
    session, favoritos, visitas, online, favoritosPendientes,
    sincronizando: sincronizacion?.activa ?? false,
    errorSincronizacion: sincronizacion?.error ?? null,
    ultimaSincronizacion: sincronizacion?.ultima ?? null,
    sincronizarDatos,
    toggleFavorito: async (lugarId) => {
      await alternarFavoritoLocal(usuarioActivoId, lugarId);
      await cargarFavoritos();
      if (usuarioActual.current === usuarioActivoId) void sincronizarDatos();
    },
    registrarVisita: async (visita) => {
      await guardarVisita(db, visita);
      await refreshVisitas();
      if (visita.usuarioId === usuarioActual.current) void sincronizarDatos();
    },
    login: async (email, password) => cambiarSesion(() => iniciarSesion(email, password)),
    register: async (nombre, email, password) => cambiarSesion(() => registrarUsuario(nombre, email, password)),
    logout: async () => cambiarSesion(async () => { await cerrarSesion(); return null; }),
    biometricLogin: async () => {
      let recuperada = false;
      await cambiarSesion(async () => {
        if (!await autenticarConBiometria()) return session;
        const usuario = await recuperarSesion();
        recuperada = Boolean(usuario);
        return usuario ?? session;
      });
      return recuperada;
    },
    refreshVisitas,
  }), [session, favoritos, visitas, online, favoritosPendientes, sincronizacion, sincronizarDatos,
    db, usuarioActivoId, cargarFavoritos, refreshVisitas]);

  return <Contexto.Provider value={value}>{children}</Contexto.Provider>;
}

export function useAplicacion() {
  const value = useContext(Contexto);
  if (!value) throw new Error('useAplicacion debe usarse dentro de AplicacionProvider');
  return value;
}
