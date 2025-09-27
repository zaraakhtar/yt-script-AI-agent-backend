import { useState, useCallback } from 'react';
import { FlatList, Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
// THE FIX: Removed firestore imports
import { getHistory } from '../../src/services/storage';
import { Job } from '../../src/types';
import JobListItem from '../../src/components/JobListItem';

export default function HistoryScreen() {
  const [history, setHistory] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      async function loadHistory() {
        setIsLoading(true);
        // THE FIX: Simplified to only fetch local history
        const data = await getHistory();
        setHistory(data);
        setIsLoading(false);
      }
      loadHistory();
    }, [])
  );

  if (isLoading) {
    return <View style={styles.container}><ActivityIndicator size="large" /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <JobListItem item={item} />}
        ListEmptyComponent={<Text style={styles.emptyText}>No previously generated scripts.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center' },
    emptyText: { textAlign: 'center', fontSize: 16, color: '#666' }
});