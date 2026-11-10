import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { useFonts, Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { inicializarBase } from '../almacenamiento/base';
import { SplashVideo } from '../components/SplashVideo';
import { AplicacionProvider } from '../contexto/AplicacionContext';
import { TemaProvider, useTema } from '../contexto/TemaContext';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });
  const [introVisible, setIntroVisible] = useState(true);
  const finishIntro = useCallback(() => setIntroVisible(false), []);

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;
  if (introVisible) return <SplashVideo onFinished={finishIntro} />;

  return (
    <SQLiteProvider databaseName="mi-ciudad.db" onInit={inicializarBase}>
      <TemaProvider>
        <AplicacionProvider>
          <Navegacion />
        </AplicacionProvider>
      </TemaProvider>
    </SQLiteProvider>
  );
}

function Navegacion() {
  const insets = useSafeAreaInsets();
  const { colores, oscuro } = useTema();
  const contenidoSeguro = {
    backgroundColor: colores.fondo,
    paddingTop: insets.top,
    paddingRight: insets.right,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
  };

  return (
    <>
      <StatusBar hidden={false} style={oscuro ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: contenidoSeguro }}>
        {/* Evitar aplicar dos veces el margen inferior. */}
        <Stack.Screen name="(tabs)" options={{ contentStyle: { ...contenidoSeguro, paddingBottom: 0 } }} />
        <Stack.Screen name="lugar/[id]" />
        <Stack.Screen name="evento/[id]" />
        <Stack.Screen name="auth/login" options={{ presentation: 'modal' }} />
        <Stack.Screen name="auth/registro" options={{ presentation: 'modal' }} />
        <Stack.Screen name="modal/qr" options={{ presentation: 'modal', title: 'Escanear QR' }} />
      </Stack>
    </>
  );
}
