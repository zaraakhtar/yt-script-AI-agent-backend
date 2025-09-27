import React from 'react';
import { Slot } from 'expo-router';
import { AuthProvider } from '../src/context/userContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

// The InitialLayout can be simplified or removed, but this keeps the loading spinner
const InitialLayout = () => {
  // You might want a loading state here from your context if you have one
  return <Slot />;
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <InitialLayout />
    </AuthProvider>
  );
}