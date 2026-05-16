module.exports = function (api) {
  api.cache(true);

  return {
    presets: ['babel-preset-expo', 'nativewind/babel'],
    plugins: [
      // Required for react-native-vision-camera Frame Processors.
      'react-native-worklets-core/plugin',
    ],
  };
};
