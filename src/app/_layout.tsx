import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { useFonts, Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useState } from 'react';
import { inicializarBase } from '../almacenamiento/base';
import { SplashVideo } from '../components/SplashVideo';
import { AplicacionProvider } from '../contexto/AplicacionContext';

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
      <AplicacionProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="lugar/[id]" />
          <Stack.Screen name="evento/[id]" />
          <Stack.Screen name="auth/login" options={{ presentation: 'modal' }} />
          <Stack.Screen name="auth/registro" options={{ presentation: 'modal' }} />
          <Stack.Screen name="modal/qr" options={{ presentation: 'modal', title: 'Escanear QR' }} />
        </Stack>
      </AplicacionProvider>
    </SQLiteProvider>
  );
}
