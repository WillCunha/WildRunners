const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const wsNativeShim = path.resolve(
  __dirname,
  'src/shims/ws.native.ts'
);

config.resolver.resolveRequest = (
  context,
  moduleName,
  platform
) => {
  const isNative =
    platform === 'android' ||
    platform === 'ios';

  if (
    isNative &&
    (
      moduleName === 'ws' ||
      moduleName.startsWith('ws/')
    )
  ) {
    console.log(
      '[METRO] ws -> React Native WebSocket shim'
    );

    return {
      type: 'sourceFile',
      filePath: wsNativeShim,
    };
  }

  return context.resolveRequest(
    context,
    moduleName,
    platform
  );
};

module.exports = config;