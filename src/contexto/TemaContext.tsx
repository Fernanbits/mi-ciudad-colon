import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';

export type ModoTema = 'sistema' | 'claro' | 'oscuro';

export type ColoresTema = {
  fondo: string;
  superficie: string;
  superficieSuave: string;
  texto: string;
  textoSuave: string;
  textoMuted: string;
  borde: string;
  principal: string;
  principalTexto: string;
  acento: string;
  arena: string;
  verde: string;
  alertaFondo: string;
  alerta: string;
  placeholder: string;
};

const CLAVE_MODO = 'mi-ciudad.theme.mode';

const coloresClaros: ColoresTema = {
  fondo: '#FAF7F1',
  superficie: '#FFFFFF',
  superficieSuave: '#E4F0EA',
  texto: '#0E5A74',
  textoSuave: '#547180',
  textoMuted: '#718B96',
  borde: '#E7DCCB',
  principal: '#0E5A74',
  principalTexto: '#FFFFFF',
  acento: '#1CA7A6',
  arena: '#D7B98E',
  verde: '#6C8C4A',
  alertaFondo: '#F4E4BC',
  alerta: '#8A641F',
  placeholder: '#807A73',
};

const coloresOscuros: ColoresTema = {
  fondo: '#08181F',
  superficie: '#112F3A',
  superficieSuave: '#183F45',
  texto: '#F1F5F3',
  textoSuave: '#B8CDD0',
  textoMuted: '#9AB3B9',
  borde: '#31535C',
  principal: '#1CA7A6',
  principalTexto: '#062C35',
  acento: '#5ED0C6',
  arena: '#D7B98E',
  verde: '#A7C47D',
  alertaFondo: '#493C20',
  alerta: '#F0C978',
  placeholder: '#A8B7B8',
};

type TemaContexto = {
  modo: ModoTema;
  oscuro: boolean;
  colores: ColoresTema;
  cambiarModo: (modo: ModoTema) => Promise<void>;
};

const ContextoTema = createContext<TemaContexto | null>(null);

export function TemaProvider({ children }: { children: React.ReactNode }) {
  const esquemaSistema = useColorScheme();
  const [modo, setModo] = useState<ModoTema>('sistema');

  useEffect(() => {
    void SecureStore.getItemAsync(CLAVE_MODO).then((guardado) => {
      if (guardado === 'sistema' || guardado === 'claro' || guardado === 'oscuro') setModo(guardado);
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    Appearance.setColorScheme(modo === 'sistema' ? 'auto' : modo === 'oscuro' ? 'dark' : 'light');
  }, [modo]);

  const oscuro = modo === 'oscuro' || (modo === 'sistema' && esquemaSistema === 'dark');
  const colores = useMemo(() => oscuro ? coloresOscuros : coloresClaros, [oscuro]);
  const cambiarModo = async (nuevoModo: ModoTema) => {
    setModo(nuevoModo);
    await SecureStore.setItemAsync(CLAVE_MODO, nuevoModo);
  };

  return <ContextoTema.Provider value={{ modo, oscuro, colores, cambiarModo }}>{children}</ContextoTema.Provider>;
}

export function useTema(): TemaContexto {
  const contexto = useContext(ContextoTema);
  if (!contexto) throw new Error('useTema debe usarse dentro de TemaProvider');
  return contexto;
}
