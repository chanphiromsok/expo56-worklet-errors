const { withAppBuildGradle } = require("@expo/config-plugins");
const { mergeContents } = require("@expo/config-plugins/build/utils/generateCode");

const BROTLI_RUNTIME_EXCLUDE = `// Expo needs org.brotli:dec to compile CompressionInterceptor, but release
// packaging also receives org.brotli.dec-1.2.0.jar from Hot Updater. Keep
// the dependency on compile classpaths and remove only the app runtime copy
// that causes duplicate classes during :app:checkReleaseDuplicateClasses.
configurations.matching { it.name in ["releaseRuntimeClasspath", "debugRuntimeClasspath"] }.configureEach {
    exclude group: 'org.brotli', module: 'dec'
}`;

function applyAndroidBrotliRuntimeExclude(buildGradle) {
  if (buildGradle.includes("exclude group: 'org.brotli', module: 'dec'")) {
    return buildGradle;
  }

  return mergeContents({
    tag: "TovTam-Android-Brotli-Runtime-Exclude",
    src: buildGradle,
    newSrc: BROTLI_RUNTIME_EXCLUDE,
    anchor: /android\s*\{/,
    offset: 0,
    comment: "//"
  }).contents;
}

module.exports = function withAndroidBrotliRuntimeExclude(config) {
  return withAppBuildGradle(config, (androidConfig) => {
    androidConfig.modResults.contents = applyAndroidBrotliRuntimeExclude(
      androidConfig.modResults.contents
    );
    return androidConfig;
  });
};

module.exports.applyAndroidBrotliRuntimeExclude = applyAndroidBrotliRuntimeExclude;
