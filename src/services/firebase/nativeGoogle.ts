type GoogleModule = typeof import('@react-native-google-signin/google-signin');

let moduleCache: GoogleModule | null = null;

export function getNativeGoogle(): GoogleModule {
  if (moduleCache) return moduleCache;
  try {
    const native = require('@react-native-google-signin/google-signin') as GoogleModule;
    if (!native.GoogleSignin) throw new Error('Google Sign-In sem implementação nativa.');
    moduleCache = native;
    return native;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/RNGoogleSignin|TurboModuleRegistry|native module|implementation.*native/i.test(message)) {
      throw new Error(
        'Este aplicativo Android não contém RNGoogleSignin. ' +
        'Abra um novo APK/EAS development build com o config plugin do Google; ' +
        'o Expo Go e APKs antigos não suportam este login.',
      );
    }
    throw error;
  }
}

export function readGoogleStatusCodes(): GoogleModule['statusCodes'] | null {
  try {
    return getNativeGoogle().statusCodes;
  } catch {
    return null;
  }
}
