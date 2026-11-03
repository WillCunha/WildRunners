
const { withAndroidManifest } = require("expo/config-plugins");

module.exports = function withRemoveUnusedAudioServices(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    const application = manifest.application?.[0];

    if (!application) return config;

    manifest.$ = manifest.$ || {};
    manifest.$["xmlns:tools"] = "http://schemas.android.com/tools";

    application.service = application.service || [];

    const unusedServices = [
      "expo.modules.audio.service.AudioRecordingService",
      "expo.modules.audio.service.AudioControlsService",
    ];

    for (const name of unusedServices) {
      const exists = application.service.some(
        (service) => service.$?.["android:name"] === name
      );

      if (!exists) {
        application.service.push({
          $: {
            "android:name": name,
            "tools:node": "remove",
          },
        });
      }
    }

    return config;
  });
};
