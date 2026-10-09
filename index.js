import './src/polyfills/finalizationRegistry';

// IMPORTANTE:
// expo-router/entry deve ser carregado por último,
// depois dos polyfills globais.
import 'expo-router/entry';
