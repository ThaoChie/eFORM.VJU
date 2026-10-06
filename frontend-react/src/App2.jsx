import React from 'react';
import { AuthProvider, useAuthStore } from './context/AuthContext';
import AppShell from './layout/AppShell';
import LoginView from './pages/LoginView';

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
