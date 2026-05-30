import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Button, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  checkAndApplyUpdates,
  getHotUpdaterDiagnostics,
  initHotUpdater,
} from './hotUpdater';

initHotUpdater();

export default function App() {
  const [status, setStatus] = useState('Release build installed.');

  const diagnostics = useMemo(
    () => [['Platform', Platform.OS], ...getHotUpdaterDiagnostics()],
    [],
  );

  const checkForUpdate = () => {
    setStatus('Checking for update...');
    checkAndApplyUpdates(setStatus)
      .then((updateInfo) => {
        if (!updateInfo) {
          setStatus('No update available.');
        }
      })
      .catch((error: unknown) => {
        setStatus(error instanceof Error ? error.message : String(error));
      });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* <Text style={styles.title}>Hot Updater</Text> */}
      <Text style={styles.status}>{status}</Text>
      <View style={styles.button}>
        <Button title="Check and apply update" onPress={checkForUpdate} />
      </View>
      <View style={styles.card}>
        {diagnostics.map(([label, value]) => (
          <View key={label} style={styles.row}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value}</Text>
          </View>
        ))}
      </View>
      <StatusBar style="auto" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  status: {
    color: '#333',
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    marginBottom: 20,
  },
  card: {
    borderColor: '#ddd',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  row: {
    gap: 4,
  },
  label: {
    color: '#666',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  value: {
    color: '#111',
    fontSize: 14,
  },
});
