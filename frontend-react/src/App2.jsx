import React from 'react';
import { AuthProvider, useAuthStore } from './stores/useAuthContext';
import AppShell from './components/layout/AppShell';
import LoginView from './pages/login/LoginView';

const AuthConsumer = () => {
  const { user } = useAuthStore();
  return user ? <AppShell /> : <LoginView />;
};

export default function App() {
  return (
    <AuthProvider>
      <AuthConsumer />
    </AuthProvider>
  );
}
