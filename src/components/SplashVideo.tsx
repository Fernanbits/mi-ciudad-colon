import { VideoView, useVideoPlayer } from 'expo-video';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { marca, tipografia } from '../theme/marca';

const splashSource = require('../../assets/Splash.mp4');

export function SplashVideo({ onFinished }: { onFinished: () => void }) {
  const player = useVideoPlayer(splashSource, (videoPlayer) => {
    videoPlayer.loop = false;
    videoPlayer.play();
  });

  useEffect(() => {
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      onFinished();
    };

    const endSubscription = player.addListener('playToEnd', finish);
    const statusSubscription = player.addListener('statusChange', ({ status }) => {
      if (status === 'error') finish();
    });
    const fallback = setTimeout(finish, 16000);

    return () => {
      endSubscription.remove();
      statusSubscription.remove();
      clearTimeout(fallback);
      player.pause();
    };
  }, [onFinished, player]);

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} surfaceType="textureView" />
      <View style={styles.footer}>
        <Pressable style={styles.skip} onPress={onFinished} accessibilityRole="button" accessibilityLabel="Omitir introducción">
          <Text style={styles.skipText}>Omitir</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: marca.azulPetroleo },
  footer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, justifyContent: 'flex-end', alignItems: 'flex-end', padding: 24 },
  skip: { backgroundColor: 'rgba(14, 90, 116, 0.82)', borderColor: 'rgba(255, 255, 255, 0.75)', borderWidth: 1, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 10 },
  skipText: { color: '#FFFFFF', fontFamily: tipografia.semibold, fontSize: 13 },
});
