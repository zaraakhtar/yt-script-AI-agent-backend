// packages/mobile-app/components/JobListItem.tsx
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Job } from '../types';

export default function JobListItem({ item }: { item: Job }) {
  const date = new Date(item.createdAt).toLocaleDateString();

  return (
    <Link 
      href={{ 
        pathname: '/result', 
        params: { 
          script: item.result || `Error: ${item.error}`, 
          title: item.title, 
          jobId: item.id 
        } 
      }} 
      asChild
    >
      <Pressable style={styles.item}>
        <View>
          <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
          <Text 
            style={[
              styles.itemStatus, 
              { color: item.status === 'done' ? 'green' : item.status === 'error' ? 'red' : '#666' }
            ]}
          >
            Status: {item.status} - {date}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
    item: { 
      padding: 15, 
      marginHorizontal: 10, 
      marginVertical: 5, 
      backgroundColor: '#fff', 
      borderRadius: 8, 
      elevation: 2, 
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 1.41,
    },
    itemTitle: { fontSize: 18, fontWeight: '500' },
    itemStatus: { fontSize: 14, marginTop: 5 }
});