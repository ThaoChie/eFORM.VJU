
const sanitizeUser = (user) => {
  if (!user) return user
  if (user.signatureSpecimenUrl && user.signatureSpecimenUrl.startsWith('data:image/svg+xml')) {
    user.signatureSpecimenUrl = null
    user.isSignatureLocked = false
    user.signatureHash = null
  }
  return user
}
import { create } from "zustand"
import { authService } from "../services/auth-service"

const normalizeRole = (role) => {
  if (!role) return role;
  return role.toLowerCase().replace('_', '-');
}

let initialUser = null;
try {
  const raw = localStorage.getItem('user');
  if (raw) initialUser = JSON.parse(raw);
} catch {}

export const useAuthStore = create((set) => ({
  user: initialUser,
  token: localStorage.getItem('token'),
  loading: false,
  async login(email, password) {
    set({ loading: true })
    try {
      const data = await authService.login(email, password)
      const token = data.token;
      localStorage.setItem('token', token);
      
      const user = sanitizeUser(await authService.getMe());
      user.role = normalizeRole(user.role);
      try {
        localStorage.setItem('user', JSON.stringify(user));
      } catch {}
      
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
        const user = sanitizeUser(await authService.getMe());
        user.role = normalizeRole(user.role);
        try {
          localStorage.setItem('user', JSON.stringify(user));
        } catch {}
        set({ user, token });
      } catch (e) {
        localStorage.removeItem('token');
        set({ user: null, token: null });
      }
    }
  },
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user_signature')
    set({ user: null, token: null })
  },
}))
