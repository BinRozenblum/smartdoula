import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* זה יציג רק את קובץ index.tsx במסך מלא */}
      <Stack.Screen name="index" />
    </Stack>
  );
}