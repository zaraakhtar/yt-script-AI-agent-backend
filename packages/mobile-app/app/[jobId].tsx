import { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useJobStatus } from '../src/hooks/useJobStatus';
// THE FIX: Removed firestore import
import { saveScriptToLocalHistory } from '../src/services/storage';
import { Job } from '../src/types';

export default function JobStatusScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const { job, error } = useJobStatus(jobId);
  const router = useRouter();

  useEffect(() => {
    if (job && (job.status === 'done' || job.status === 'error')) {
      const saveResult = async (jobToSave: Job) => {
        // THE FIX: Simplified to only save locally
        await saveScriptToLocalHistory(jobToSave);
      };
      saveResult(job);

      if (job.status === 'done') {
        router.replace({
          pathname: '/result',
          params: { script: job.result, title: job.title, jobId: job.id }
        });
      }
    }
  }, [job, router]);

  if (error) return <Text style={styles.errorText}>{error}</Text>;
  if (!job) return <ActivityIndicator size="large" style={styles.container} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>&ldquo;{job.title}&rdquo;</Text>
      <Text style={styles.status}>Status: {job.status}</Text>
      <ScrollView style={styles.logContainer} contentContainerStyle={{ padding: 10 }}>
        {job.logs.map((log: string, index: number) => <Text key={index} style={styles.logText}>➡️ {log}</Text>)}
        {job.status === 'error' && <Text style={styles.errorText}>❌ Error: {job.error}</Text>}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
    status: { fontSize: 18, marginBottom: 20, textTransform: 'capitalize', textAlign: 'center' },
    logContainer: { flex: 1, backgroundColor: '#fff', borderRadius: 5, borderWidth: 1, borderColor: '#eee' },
    logText: { fontSize: 14, marginBottom: 8 },
    errorText: { color: 'red', fontSize: 16, fontWeight: 'bold', marginTop: 10, textAlign: 'center' }
});