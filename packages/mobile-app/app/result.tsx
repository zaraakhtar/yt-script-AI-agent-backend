import { useState } from 'react';
import { View, TextInput, Button, StyleSheet, ScrollView, Text, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
// THE FIX: Removed firestore and useAuth imports
import { saveScriptToLocalHistory } from '../src/services/storage';
import { Job } from '../src/types';

export default function ResultScreen() {
  const params = useLocalSearchParams<{ script?: string, title?: string, jobId?: string }>();
  const [script, setScript] = useState(params.script || 'No script generated.');
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  
  const handleUndo = () => Alert.alert('Undo', 'This feature is coming soon!');
  const handleRedo = () => Alert.alert('Redo', 'This feature is coming soon!');

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(script);
    Alert.alert('Copied!', 'The script has been copied to your clipboard.');
  };

  const handleSave = async () => {
    setIsSaving(true);
    const jobData: Job = {
        id: params.jobId || new Date().toISOString(),
        title: params.title || "Untitled Script",
        result: script,
        status: 'done',
        createdAt: new Date(), 
        urls: [], 
        targetWordCount: 0, 
        logs: [], 
        progress: 100
    };

    try {
        // THE FIX: Simplified to only save locally
        await saveScriptToLocalHistory(jobData);
        Alert.alert('Success', 'Script saved to your history!');
    } catch (e) {
        console.error("Failed to save script:", e);
        Alert.alert('Error', 'Failed to save script.');
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{params.title}</Text>
      <TextInput
        style={styles.textArea}
        value={script}
        onChangeText={setScript}
        multiline
      />
      <View style={styles.buttonRow}>
        <Button title="Undo" onPress={handleUndo} />
        <Button title="Redo" onPress={handleRedo} />
      </View>
      <View style={styles.buttonRow}>
        <Button title="Copy Script" onPress={copyToClipboard} />
        <Button title={isSaving ? "Saving..." : "Save to History"} onPress={handleSave} disabled={isSaving} />
      </View>
      <View style={{ marginTop: 20 }}>
          <Button title="Discard & Go Home" color="red" onPress={() => router.replace('/(tabs)/generate')} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
    container: { padding: 20 },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
    textArea: { height: 400, borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 5, marginBottom: 20, fontSize: 16 },
    buttonRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15 },
});