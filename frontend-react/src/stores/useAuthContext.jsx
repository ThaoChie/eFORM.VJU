import { create } from 'zustand';
import { MOCK_ACCOUNTS } from '../common/constants';

const useAuthStore = create((set) => ({
  user: null, // null = chưa đăng nhập

  login: async (username, password) => {
    return new Promise((resolve, reject) => {
      // Giả lập độ trễ API 500ms
      setTimeout(() => {
        const account = MOCK_ACCOUNTS[username];
        if (account && account.password === password) {
          const userData = { ...account, token: 'mock-jwt-token-123' };
          
          // Cập nhật state user vào store
          set({ user: userData });
          resolve(userData);
        } else {
          reject(new Error('Sai tài khoản hoặc mật khẩu'));
        }
      }, 500);
    });
  },

  logout: () => set({ user: null }),
}));

export default useAuthStore;
