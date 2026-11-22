
const sanitizeUser = (user) => {
  if (!user) return user
  const sig = user.signatureSpecimenUrl
  if (
    sig &&
    (typeof sig !== 'string' ||
      sig.startsWith('blob:') ||
      sig.startsWith('data:image/svg+xml') ||
      sig.includes('<svg') ||
      sig.includes('%3Csvg') ||
      sig.length < 50)
  ) {
    user.signatureSpecimenUrl = null
    user.isSignatureLocked = false
    user.signatureHash = null
  }
  return user
}
import { create } from "zustand"
import { authService } from "../services/auth-service"
import { useSubmissionStore } from "./useSubmissionStore"
import { useNotificationStore } from "./useNotificationStore"

const normalizeRole = (role) => {
  if (!role) return role;
  return role.toLowerCase().replace('_', '-');
}

let initialUser = null;
try {
  const raw = localStorage.getItem('user');
  if (raw) initialUser = sanitizeUser(JSON.parse(raw));
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
        if (user?.id && user?.signatureSpecimenUrl) {
          localStorage.setItem(`user_signature_${user.id}`, user.signatureSpecimenUrl);
        }
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
          if (user?.id && user?.signatureSpecimenUrl) {
            localStorage.setItem(`user_signature_${user.id}`, user.signatureSpecimenUrl);
          }
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
    localStorage.removeItem('user')
    localStorage.removeItem('user_signature')

    // Xóa bộ nhớ tạm draft khi đăng xuất (giữ lại user_signature_<id> để đối chiếu chống trùng lặp chữ ký ERR-014 giữa các tài khoản)
    try {
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k && k.startsWith('drl_compose_draft')) {
          keysToRemove.push(k)
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k))
    } catch {}

    // Reset store trong RAM tránh giữ state của user trước
    try {
      useSubmissionStore.getState().reset?.()
      useNotificationStore.setState?.({ items: [], unreadCount: 0, total: 0, loading: false })
    } catch {}

    set({ user: null, token: null })
  },
  async changePassword(oldPassword, newPassword) {
    set({ loading: true })
    try {
      const res = await authService.changePassword(oldPassword, newPassword)
      const user = sanitizeUser(await authService.getMe())
      user.role = normalizeRole(user.role)
      try {
        localStorage.setItem('user', JSON.stringify(user))
      } catch {}
      set({ user, loading: false })
      return res
    } catch (e) {
      set({ loading: false })
      throw e
    }
  },
}))
