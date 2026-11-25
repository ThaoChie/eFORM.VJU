import { Eye, EyeOff, LockKeyhole } from "lucide-react"
import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { M } from "../../common/messages"
import { homeByRole } from "../../common/permission-config"
import { useAuthStore } from "../../stores/useAuthStore"
import { Button, Input } from "../../components/ui/Primitives"
import ForgotPasswordModal from "../../components/auth/ForgotPasswordModal"

export default function LoginPage() {
  const [show, setShow] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [forgotModalOpen, setForgotModalOpen] = useState(false)
  const [searchParams] = useSearchParams()
  const resetToken = searchParams.get("resetToken") || ""

  const navigate = useNavigate()
  const { login, loading } = useAuthStore()

  useEffect(() => {
    if (resetToken) {
      setForgotModalOpen(true)
    }
  }, [resetToken])
  
  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")
    try {
      const user = await login(email, password)
      if (user.isFirstLogin || user.mustChangePassword) {
        navigate("/change-password")
      } else {
        navigate(homeByRole[user.role] || "/login")
      }
    } catch (err) {
      setError(err.message || "Lỗi mạng hoặc server không phản hồi")
    }
  }

  // Pre-filled quick login for demo purposes
  const quickLogin = async (e, p) => {
    setEmail(e);
    setPassword(p);
    setError("");
    try {
      const user = await login(e, p);
      if (user.isFirstLogin || user.mustChangePassword) {
        navigate("/change-password")
      } else {
        navigate(homeByRole[user.role] || "/login")
      }
    } catch (err) {
      setError(err.message || "Lỗi mạng hoặc server không phản hồi")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-5">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 text-center">
          <img src="/logoVJU.png" alt="VJU Logo" className="mx-auto size-20 object-contain" />
          <h1 className="mt-4 text-[22px] font-semibold">{M.login}</h1>
          <p className="mt-1 text-sm text-muted">{M.appName}</p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && <div className="text-red-500 text-sm text-center font-medium bg-red-50 py-2 rounded-md border border-red-200">{error}</div>}
          <Input
            label="Email"
            required
            type="email"
            placeholder="admin@drl.edu.vn"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">{M.password} <span className="text-red-500">*</span></label>
              <button
                type="button"
                onClick={() => setForgotModalOpen(true)}
                className="text-xs text-brand hover:underline font-medium cursor-pointer"
              >
                Quên mật khẩu?
              </button>
            </div>
            <div className="relative">
              <input
                required
                type={show ? "text" : "password"}
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
              <button
                type="button"
                aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                onClick={() => setShow(!show)}
                className="absolute inset-y-0 right-0 size-10 flex items-center justify-center text-muted hover:text-ink active:scale-95 transition"
              >
                {show ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>
          <Button variant="primary" loading={loading} className="w-full h-11 min-h-[44px]" type="submit">
            <LockKeyhole className="size-4" />
            {M.login}
          </Button>
        </form>

        <ForgotPasswordModal
          open={forgotModalOpen}
          initialToken={resetToken}
          onClose={() => setForgotModalOpen(false)}
        />
        
        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-line" />
          <span className="text-xs text-muted">Tài khoản Demo</span>
          <span className="h-px flex-1 bg-line" />
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            disabled={loading}
            type="button"
            onClick={() => quickLogin("admin@drl.edu.vn", "123456")}
            className="min-h-[44px] min-w-[44px] rounded-full border border-line bg-white px-3.5 py-2 text-xs font-medium hover:border-brand hover:text-brand active:scale-95 transition inline-flex items-center justify-center"
          >
            Admin
          </button>
          <button
            disabled={loading}
            type="button"
            onClick={() => quickLogin("dean@drl.edu.vn", "123456")}
            className="min-h-[44px] min-w-[44px] rounded-full border border-line bg-white px-3.5 py-2 text-xs font-medium hover:border-brand hover:text-brand active:scale-95 transition inline-flex items-center justify-center"
          >
            Trưởng khoa
          </button>
          <button
            disabled={loading}
            type="button"
            onClick={() => quickLogin("leader@drl.edu.vn", "123456")}
            className="min-h-[44px] min-w-[44px] rounded-full border border-line bg-white px-3.5 py-2 text-xs font-medium hover:border-brand hover:text-brand active:scale-95 transition inline-flex items-center justify-center"
          >
            Lớp trưởng
          </button>
          <button
            disabled={loading}
            type="button"
            onClick={() => quickLogin("student@drl.edu.vn", "123456")}
            className="min-h-[44px] min-w-[44px] rounded-full border border-line bg-white px-3.5 py-2 text-xs font-medium hover:border-brand hover:text-brand active:scale-95 transition inline-flex items-center justify-center"
          >
            Sinh viên
          </button>
        </div>
      </div>
    </div>
  )
}
