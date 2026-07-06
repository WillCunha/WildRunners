import { AudioProvider } from '@/context/AudioContext';
import { CarProvider } from '@/context/CarContext';
import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <AudioProvider>
      <CarProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </CarProvider>
    </AudioProvider>
  );
}