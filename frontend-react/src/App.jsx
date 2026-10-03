import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/login/Login';
import client from './lib/axios/client';
import { API_PATHS } from './lib/axios/api-paths';
import { useAuthStore } from './stores/useAuthStore';

const ProtectedRoute = ({ children }) => {
  const token = useAuthStore(state => state.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

const Home = () => {
  useEffect(() => {
    client.get(API_PATHS.AUTH.ME).catch(() => {});
  }, []);
  
  return <div>Trang chủ - Đang gọi API lấy thông tin...</div>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
