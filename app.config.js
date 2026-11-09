module.exports = ({ config }) => {
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
  const plugins = [...(config.plugins ?? [])];

  if (googleMapsApiKey) {
    plugins.push([
      'react-native-maps',
      {
        androidGoogleMapsApiKey: googleMapsApiKey,
      },
    ]);
  }

  if (process.env.EAS_BUILD && !googleMapsApiKey) {
    throw new Error('Falta GOOGLE_MAPS_API_KEY para generar el APK Android.');
  }

  return {
    ...config,
    plugins,
  };
};
