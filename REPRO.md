# Hot Updater + Expo 56 Brotli duplicate-class repro

Created with pnpm on Expo SDK 56 / React Native 0.85.

## Dependencies

- `expo ~56.0.4`
- `react-native 0.85.3`
- `@hot-updater/react-native 0.32.0`
- `react-native-reanimated 4.3.1` — added for comparison
- `react-native-worklets 0.8.3` — added for comparison

## Setup commands used

```sh
cd ~/Desktop
pnpm create expo-app hot-updater-expo56-repro --template blank-typescript --yes
cd hot-updater-expo56-repro
git init
pnpm add @hot-updater/react-native@0.32.0
pnpm add react-native-reanimated@4.3.1 react-native-worklets@0.8.3
pnpm exec expo prebuild --platform android --no-install
```

## Repro command

```sh
cd android
./gradlew :app:checkReleaseDuplicateClasses --console=plain
```

## Observed failure

```txt
Execution failed for task ':app:checkReleaseDuplicateClasses'.
Duplicate class org.brotli.dec.BitReader found in modules dec-0.1.2.jar -> dec-0.1.2 (org.brotli:dec:0.1.2) and org.brotli.dec-1.2.0.jar -> org.brotli.dec-1.2.0 (org.brotli.dec-1.2.0.jar)
Duplicate class org.brotli.dec.BrotliInputStream found in modules dec-0.1.2.jar -> dec-0.1.2 (org.brotli:dec:0.1.2) and org.brotli.dec-1.2.0.jar -> org.brotli.dec-1.2.0 (org.brotli.dec-1.2.0.jar)
```

## Source of `org.brotli:dec:0.1.2`

```txt
node_modules/.../expo/android/build.gradle:49:  implementation 'org.brotli:dec:0.1.2'
```

Gradle dependency insight:

```txt
org.brotli:dec:0.1.2
\--- project :expo
     \--- releaseRuntimeClasspath
```

Expo code using Brotli:

```txt
node_modules/.../expo/android/src/main/java/expo/modules/fetch/CompressionInterceptor.kt:28:import org.brotli.dec.BrotliInputStream
node_modules/.../expo/android/src/main/java/expo/modules/fetch/CompressionInterceptor.kt:66:BrotliInputStream(body.source().inputStream()).source().buffer()
```

## Conflicting Hot Updater jar

Hot Updater bundles:

```txt
node_modules/.../@hot-updater/react-native/android/libs/org.brotli.dec-1.2.0.jar
```

Hot Updater README says the bundled jar uses the same package/class names:

```txt
@hot-updater/react-native/android/libs/README.md:29:- Same package: `org.brotli.dec`
@hot-updater/react-native/android/libs/README.md:30:- Same class: `BrotliInputStream`
```

## Reanimated / Worklets comparison

These native builds succeeded in this repro:

```sh
cd android
./gradlew :react-native-reanimated:externalNativeBuildRelease :react-native-worklets:externalNativeBuildRelease --rerun-tasks --console=plain
./gradlew :react-native-reanimated:externalNativeBuildCleanRelease :react-native-worklets:externalNativeBuildCleanRelease --console=plain
```

Observed:

```txt
:react-native-worklets:externalNativeBuildRelease BUILD SUCCESSFUL
:react-native-reanimated:externalNativeBuildRelease BUILD SUCCESSFUL
:react-native-worklets:externalNativeBuildCleanRelease BUILD SUCCESSFUL
:react-native-reanimated:externalNativeBuildCleanRelease BUILD SUCCESSFUL
```

So in this minimal repro, Reanimated/Worklets do not cause the Brotli duplicate-class failure. The remaining failing command is still `:app:checkReleaseDuplicateClasses`, and the duplicate classes are still only between Expo's `org.brotli:dec:0.1.2` and Hot Updater's bundled `org.brotli.dec-1.2.0.jar`.
