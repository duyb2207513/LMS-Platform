const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  ...expoConfig,
  {
    ignores: ['.expo/**', 'dist/**', 'node_modules/**'],
    rules: {
      // Existing React Native screens intentionally load API state from effects.
      'react-hooks/set-state-in-effect': 'off',
      // Animated.Value and PanResponder are stable imperative React Native objects.
      'react-hooks/refs': 'off',
    },
  },
]);
