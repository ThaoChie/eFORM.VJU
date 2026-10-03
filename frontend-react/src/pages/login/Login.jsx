import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';

const Login = () => {
  const navigate = useNavigate();
  const token = useAuthStore(state => state.token);

  useEffect(() => {
    if (token) {
      navigate('/');
    }
  }, [token, navigate]);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Đăng nhập</h1>
      <p>Vui lòng đăng nhập để tiếp tục.</p>
    </div>
  );
};

export default Login;
