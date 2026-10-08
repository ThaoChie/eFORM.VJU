import { create } from "zustand"
import { authService } from "../services/auth-service"

const normalizeRole = (role) => {
  if (!role) return role;
  return role.toLowerCase().replace('_', '-');
}

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  loading: false,
  async login(email, password) {
    set({ loading: true })
    try {
      const data = await authService.login(email, password)
      const token = data.token;
      localStorage.setItem('token', token);
      
      const user = await authService.getMe();
      user.role = normalizeRole(user.role);
      
      set({ user, token, loading: false })
      return user
    } catch (e) {
      set({ loading: false })
      throw e
    }
  },
  async checkAuth() {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const user = await authService.getMe();
        user.role = normalizeRole(user.role);
        set({ user, token });
      } catch (e) {
        localStorage.removeItem('token');
        set({ user: null, token: null });
      }
    }
  },
  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null })
  },
}))
