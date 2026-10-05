import React, { useState, createContext, useContext } from 'react';
import { MOCK_ACCOUNTS } from '../mock/data';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = (username, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const account = MOCK_ACCOUNTS[username];
        if (account && account.password === password) {
          const userData = { ...account, token: 'mock-jwt-token-123' };
          setUser(userData);
          resolve(userData);
        } else {
          reject(new Error('Sai tài khoản hoặc mật khẩu'));
        }
      }, 500);
    });
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthStore = () => useContext(AuthContext);
