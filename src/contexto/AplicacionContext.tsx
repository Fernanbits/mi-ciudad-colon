import * as Network from 'expo-network';
import { useSQLiteContext } from 'expo-sqlite';
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { guardarVisita, listarVisitas } from '../almacenamiento/base';
import { guardarFavoritos, leerFavoritos } from '../almacenamiento/preferencias';
import { Favorito, Usuario, Visita } from '../tipos/modelos';
import { autenticarConBiometria, cerrarSesion, iniciarSesion, obtenerTokenSesion, recuperarSesion, registrarUsuario } from '../servicios/sesion';
import { apiConfigurada } from '../servicios/api';
import { listarVisitasRemotas, sincronizarVisitasPendientes } from '../servicios/visitas';
import { registrarDispositivoPush } from '../servicios/notificaciones';
import { generarId } from '../utilidades/ids';

interface AplicacionContextValue {
  session: Usuario | null;
  favoritos: Favorito[];
  visitas: Visita[];
  online: boolean | null;
  toggleFavorito: (lugarId: string) => Promise<void>;
  registrarVisita: (visita: Visita) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (nombre: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  biometricLogin: () => Promise<boolean>;
  refreshVisitas: () => Promise<void>;
}

const Contexto = createContext<AplicacionContextValue | null>(null);

export function AplicacionProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const [session, setSession] = useState<Usuario | null>(null);
  const [favoritos, setFavoritos] = useState<Favorito[]>([]);
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [online, setOnline] = useState<boolean | null>(null);

  const usuarioActivoId = session?.id ?? 'anonimo';
  const refreshVisitas = useCallback(async () => {
    setVisitas(await listarVisitas(db, usuarioActivoId));
  }, [db, usuarioActivoId]);

  useEffect(() => {
    void recuperarSesion().then(setSession);
    void Network.getNetworkStateAsync().then((state) => setOnline(state.isConnected ?? false));
    const networkSubscription = Network.addNetworkStateListener((state) => setOnline(state.isConnected ?? false));
    return () => networkSubscription.remove();
  }, []);

  useEffect(() => {
    let activo = true;
    void Promise.all([leerFavoritos(usuarioActivoId), listarVisitas(db, usuarioActivoId)]).then(([favoritosLocales, visitasLocales]) => {
      if (!activo) return;
      setFavoritos(favoritosLocales);
      setVisitas(visitasLocales);
    });
    return () => { activo = false; };
  }, [db, usuarioActivoId]);

  useEffect(() => {
    if (!session || online !== true) return;
    let activo = true;
    void obtenerTokenSesion().then(async (token) => {
      if (!activo || !token || !apiConfigurada()) return;
      try {
        await registrarDispositivoPush(token);
        await sincronizarVisitasPendientes(db, session.id, token);
        const remotas = await listarVisitasRemotas(token);
        for (const visita of remotas) await guardarVisita(db, visita);
        if (activo) await refreshVisitas();
      } catch {
        // Si la API no responde, se conserva la copia local sin interrumpir la navegación.
      }
    });
    return () => { activo = false; };
  }, [db, online, refreshVisitas, session]);

  const value = useMemo<AplicacionContextValue>(() => ({
    session, favoritos, visitas, online,
    toggleFavorito: async (lugarId) => {
      const existente = favoritos.find((item) => item.lugarId === lugarId);
      const siguiente = existente ? favoritos.filter((item) => item.lugarId !== lugarId) : [...favoritos, { id: generarId('fav'), usuarioId: session?.id ?? 'anonimo', lugarId, creadoEn: new Date().toISOString() }];
      setFavoritos(siguiente);
      await guardarFavoritos(usuarioActivoId, siguiente);
    },
    registrarVisita: async (visita) => {
      await guardarVisita(db, visita);
      if (online === true && session && visita.usuarioId === session.id) {
        const token = await obtenerTokenSesion();
        if (token) {
          try {
            await sincronizarVisitasPendientes(db, session.id, token);
          } catch {
            // La visita ya quedó guardada localmente y se reintentará más adelante.
          }
        }
      }
      await refreshVisitas();
    },
    login: async (email, password) => {
      const usuario = await iniciarSesion(email, password);
      setSession(usuario);
    },
    register: async (nombre, email, password) => setSession(await registrarUsuario(nombre, email, password)),
    logout: async () => { await cerrarSesion(); setFavoritos([]); setVisitas([]); setSession(null); },
    biometricLogin: async () => {
      const autenticada = await autenticarConBiometria();
      if (!autenticada) return false;
      const usuario = await recuperarSesion();
      if (!usuario) return false;
      setSession(usuario);
      return true;
    },
    refreshVisitas,
  }), [session, favoritos, visitas, online, refreshVisitas, usuarioActivoId]);

  return <Contexto.Provider value={value}>{children}</Contexto.Provider>;
}

export function useAplicacion() {
  const value = useContext(Contexto);
  if (!value) throw new Error('useAplicacion debe usarse dentro de AplicacionProvider');
  return value;
}
