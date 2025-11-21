import { Stack } from 'expo-router';
import React from 'react';

export default function TrilhasLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Trilhas' }} />
      <Stack.Screen name="[id]" options={{ title: 'Trilha' }} />
      <Stack.Screen
        name="recurso/[id]"
        options={{
          title: 'Provas e Gabaritos',
          headerBackTitleVisible: false,
        }}
      />
    </Stack>
  );
}
