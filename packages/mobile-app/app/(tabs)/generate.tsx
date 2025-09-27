// packages/mobile-app/app/(tabs)/generate.tsx
import { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { createJob } from '../../src/services/api';

const YOUTUBE_URL_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;

export default function GenerateScreen() {
  const [url1, setUrl1] = useState('');
  const [url2, setUrl2] = useState('');
  const [url3, setUrl3] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const isUrl1Valid = YOUTUBE_URL_REGEX.test(url1);
  const isGenerateDisabled = !isUrl1Valid || !title;

  const handleGenerate = async () => {
    setError('');
    setLoading(true);
    const urls = [url1, url2, url3].filter(u => u.trim() !== '');
    
    // Final validation before submitting
    for (const url of urls) {
        if (!YOUTUBE_URL_REGEX.test(url)) {
            setError(`Invalid YouTube URL: ${url}`);
            setLoading(false);
            return;
        }
    }

    try {
      const { jobId } = await createJob(urls, title, 600); // Default word count
      router.push(`/${jobId}`);
    } catch (err) {
      setError('Failed to start job. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Competitor URL 1 (Required)</Text>
      <TextInput style={styles.input} placeholder="https://www.youtube.com/watch?v=..." value={url1} onChangeText={setUrl1} />
      {!isUrl1Valid && url1.length > 0 && <Text style={styles.errorText}>Invalid YouTube URL</Text>}
      
      <Text style={styles.label}>Competitor URL 2 (Optional)</Text>
      <TextInput style={styles.input} value={url2} onChangeText={setUrl2} />
      
      <Text style={styles.label}>Competitor URL 3 (Optional)</Text>
      <TextInput style={styles.input} value={url3} onChangeText={setUrl3} />
      
      <Text style={styles.label}>Your Video Title (Required)</Text>
      <TextInput style={styles.input} placeholder="My Awesome New Video" value={title} onChangeText={setTitle} />
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <Button title="Generate Script" onPress={handleGenerate} disabled={isGenerateDisabled} />
      )}
    </View>
  );
}

// Add styles
const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 5, marginBottom: 15 },
    label: { fontSize: 16, marginBottom: 5, fontWeight: '500' },
    errorText: { color: 'red', marginBottom: 10 },
});