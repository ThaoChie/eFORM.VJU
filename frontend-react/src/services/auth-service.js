import { client } from "../lib/axios/client"
import { API_PATHS } from "../lib/axios/api-paths"

export const authService = {
  async login(email, password) {
    const data = await client.post(API_PATHS.LOGIN, { email, password });
    return data; // { token, role, isFirstLogin, mustChangePassword }
  },
  async getMe() {
    const data = await client.get("/auth/me");
    return data; // AuthUserResponse
  },
  async changePassword(oldPassword, newPassword) {
    const data = await client.put(API_PATHS.CHANGE_PASSWORD, { oldPassword, newPassword });
    return data; // { success: true, message: "Đổi mật khẩu thành công" }
  }
}
