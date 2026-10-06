import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../context/AuthContext';
import { Button } from '../components/SharedUI';

const LoginView = () => {
  const { login } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!username || !password) return setError('Vui lòng nhập đầy đủ thông tin');
    setLoading(true); setError('');
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl border border-slate-100 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 text-blue-600 rounded-xl mb-4">
            <ShieldCheck size={28} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">E-Form ĐRL</h1>
          <p className="text-slate-500 text-sm mt-2">Đăng nhập hệ thống quản trị</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-center mb-4 border border-red-100">
            <AlertTriangle size={16} className="mr-2 flex-shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tài khoản</label>
            <input 
              type="text" value={username} onChange={e => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-[#d9d9d9] rounded-md focus:border-[#1677ff] focus:ring-1 focus:ring-[#1677ff] outline-none"
              placeholder="admin / dean / class / student"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
            <input 
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-[#d9d9d9] rounded-md focus:border-[#1677ff] focus:ring-1 focus:ring-[#1677ff] outline-none"
              placeholder="••••••••"
            />
          </div>
          <Button type="primary" className="w-full mt-2" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default LoginView;
