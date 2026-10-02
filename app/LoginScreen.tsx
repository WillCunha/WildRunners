/** Preserve the existing /LoginScreen deep link while showing the same two-tab screen. */
import React from 'react';
import RegistrationScreen from './RegistrationScreen';

export default function LoginScreen() {
  return <RegistrationScreen />;
}
