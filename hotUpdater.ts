import { HotUpdater } from "@hot-updater/react-native";
import { Alert } from "react-native";

const HOT_UPDATER_BASE_URL = "https://hot-updater.angkordotdev.workers.dev/api/check-update";

type StatusReporter = (message: string) => void;

/**
 * Initialize Hot Updater with manual update flow.
 * This allows fine-grained control over when updates are checked and applied.
 */
export const initHotUpdater = () => {
  HotUpdater.init({
    baseURL: HOT_UPDATER_BASE_URL,
    onError: (error) => {
      console.error("Hot Updater error:", error);
      Alert.alert("Update Error", JSON.stringify(error, null, 2), [{ text: "OK" }]);
    },
    onNotifyAppReady(result) {
      Alert.alert("Update result", JSON.stringify(result, null, 2), [{ text: "OK" }]);
    }
  });
};

const reloadWhenReady = (message: string) => {
  Alert.alert("Update downloaded", message, [
    { text: "Later", style: "cancel" },
    {
      text: "Reload now",
      onPress: () => {
        HotUpdater.reload().catch((error: unknown) => {
          console.error("Hot Updater reload error:", error);
          Alert.alert("Reload Error", JSON.stringify(error, null, 2), [{ text: "OK" }]);
        });
      }
    }
  ]);
};

/**
 * Check for updates, download the returned bundle, and make the app ready to
 * apply it. Forced updates reload immediately; optional updates show a reload
 * prompt after download so Android can apply the newly downloaded bundle.
 */
export const checkAndApplyUpdates = async (onStatus?: StatusReporter) => {
  try {
    onStatus?.("Checking for update...");
    const updateInfo = await HotUpdater.checkForUpdate({
      updateStrategy: "fingerprint"
    });

    Alert.alert("Update Check", JSON.stringify(updateInfo, null, 2), [{ text: "OK" }]);

    if (!updateInfo) {
      const message = "No update available";
      console.log(message);
      onStatus?.(message);
      return null;
    }

    const unsubscribe = HotUpdater.addListener("onProgress", (event) => {
      const percent = Math.round(event.progress * 100);
      const bytes =
        "downloadedBytes" in event && event.totalBytes
          ? ` (${event.downloadedBytes ?? 0}/${event.totalBytes} bytes)`
          : "";
      onStatus?.(`Downloading ${event.artifactType}: ${percent}%${bytes}`);
    });

    try {
      onStatus?.(`Update ${updateInfo.id} available. Downloading...`);
      console.log("Update available, downloading...");
      const downloaded = await updateInfo.updateBundle();

      if (!downloaded) {
        onStatus?.(`Update ${updateInfo.id} was not downloaded.`);
        return updateInfo;
      }

      const readyMessage = `Downloaded update ${updateInfo.id}. Reload to apply it.`;
      onStatus?.(readyMessage);

      if (updateInfo.shouldForceUpdate) {
        console.log("Force update required, reloading app...");
        await HotUpdater.reload();
      } else if (HotUpdater.isUpdateDownloaded()) {
        reloadWhenReady(readyMessage);
      }

      return updateInfo;
    } finally {
      unsubscribe();
    }
  } catch (error) {
    console.error("Error checking for updates:", error);
    onStatus?.(error instanceof Error ? error.message : String(error));
    throw error;
  }
};

/**
 * Check for updates without automatically applying.
 * Returns update info if available.
 */
export const checkForUpdatesInfo = async () => {
  try {
    const updateInfo = await HotUpdater.checkForUpdate({
      updateStrategy: "fingerprint"
    });
    return updateInfo;
  } catch (error) {
    console.error("Error checking for updates:", error);
    return null;
  }
};

export const getHotUpdaterDiagnostics = () => [
  ["Hot Updater URL", HOT_UPDATER_BASE_URL],
  ["App version", HotUpdater.getAppVersion() ?? "unknown"],
  ["Bundle ID", HotUpdater.getBundleId() ?? "unknown"],
  ["Min bundle ID", HotUpdater.getMinBundleId() ?? "unknown"],
  ["Channel", HotUpdater.getChannel() ?? "unknown"],
  ["Default channel", HotUpdater.getDefaultChannel() ?? "unknown"],
  ["Fingerprint", HotUpdater.getFingerprintHash() ?? "none"],
  ["Cohort", HotUpdater.getCohort() ?? "unknown"],
  ["Downloaded ready", HotUpdater.isUpdateDownloaded() ? "yes" : "no"]
];
