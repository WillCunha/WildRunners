import { CarProvider } from '@/context/CarContext';
import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <CarProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </CarProvider>
  );
}