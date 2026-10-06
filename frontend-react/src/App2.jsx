import React from 'react';
import useAuthStore from './stores/useAuthStore';
import AppShell from './components/layout/AppShell';
import LoginView from './pages/login/LoginView';

export default function App() {
  // Lấy state user trực tiếp từ Zustand store
  const user = useAuthStore((state) => state.user);

  // Nếu có user thì vào AppShell (layout chính), chưa có thì vào màn hình Login
  return user ? <AppShell /> : <LoginView />;
}
