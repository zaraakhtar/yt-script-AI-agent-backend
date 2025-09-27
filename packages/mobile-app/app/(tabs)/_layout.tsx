import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="generate" options={{ title: 'Generate' }} />
      <Tabs.Screen name="history" options={{ title: 'History' }} />
    </Tabs>
  );
}