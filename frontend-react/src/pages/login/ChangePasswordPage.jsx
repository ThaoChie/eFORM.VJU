import { Eye, EyeOff, KeyRound, LockKeyhole } from "lucide-react"
import { useState } from "react"
import { Navigate, useLocation, useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import { M } from "../../common/messages"
import { authService } from "../../services/auth-service"
import { useAuthStore } from "../../stores/useAuthStore"
import { Button, Card, Input } from "../../components/ui/Primitives"

export default function ChangePasswordPage() {
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [fieldErrors, setFieldErrors] = useState({})
  const [serverError, setServerError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()
  const { user, token, logout } = useAuthStore()

  // Nếu chưa có phiên đăng nhập hợp lệ thì điều hướng về /login
  if (!user && !token) {
    return <Navigate to="/login" replace />
  }

  // Kiểm tra xem người dùng đang bị bắt buộc đổi mật khẩu ở lần đăng nhập đầu tiên hay chủ động đổi
  const isForcedFirstLogin = Boolean(
    user?.isFirstLogin ||
    user?.mustChangePassword ||
    location.state?.forceChangePassword
  )

  const validateForm = () => {
    const errors = {}

    if (!oldPassword || !oldPassword.trim()) {
      errors.oldPassword = "Vui lòng nhập mật khẩu hiện tại"
    }

    if (!newPassword || !newPassword.trim()) {
      errors.newPassword = "Vui lòng nhập mật khẩu mới"
    } else if (newPassword.length < 8) {
      errors.newPassword = "Mật khẩu mới phải có độ dài tối thiểu 8 ký tự"
    } else if (oldPassword && newPassword === oldPassword) {
      errors.newPassword = "Mật khẩu mới không được trùng với mật khẩu hiện tại"
    }

    if (!confirmPassword || !confirmPassword.trim()) {
      errors.confirmPassword = "Vui lòng nhập lại mật khẩu mới"
    } else if (newPassword && confirmPassword !== newPassword) {
      errors.confirmPassword = "Mật khẩu nhập lại không khớp với mật khẩu mới"
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (submitting) return

    setServerError("")
    if (!validateForm()) return

    setSubmitting(true)
    try {
      await authService.changePassword(oldPassword, newPassword)
      toast.success("Đổi mật khẩu thành công. Vui lòng đăng nhập lại!")
      logout()
      navigate("/login", { replace: true })
    } catch (err) {
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Đổi mật khẩu thất bại. Vui lòng kiểm tra lại."
      setServerError(errMsg)
      toast.error(errMsg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-5">
      <Card className="w-full max-w-[440px] p-6 sm:p-8 shadow-sm">
        <div className="mb-6 text-center">
          <img
            src="/logoVJU.png"
            alt="VJU Logo"
            className="mx-auto size-20 object-contain"
          />
          <h1 className="mt-4 text-[22px] font-semibold text-ink">
            Đổi mật khẩu
          </h1>
          <p className="mt-1 text-sm text-muted">
            {isForcedFirstLogin
              ? "Tài khoản đăng nhập lần đầu bằng mật khẩu hệ thống tạo. Vui lòng đổi mật khẩu để tiếp tục."
              : M.appName}
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          {serverError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-center text-sm font-medium text-red-600">
              {serverError}
            </div>
          )}

          {/* Ô 1: Mật khẩu hiện tại */}
          <div className="relative">
            <Input
              label="Mật khẩu hiện tại"
              required
              disabled={submitting}
              type={showOld ? "text" : "password"}
              placeholder="Nhập mật khẩu hiện tại"
              value={oldPassword}
              error={fieldErrors.oldPassword}
              onChange={(e) => {
                setOldPassword(e.target.value)
                if (fieldErrors.oldPassword) {
                  setFieldErrors((prev) => ({ ...prev, oldPassword: "" }))
                }
              }}
            />
            <button
              type="button"
              tabIndex={-1}
              aria-label={showOld ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              onClick={() => setShowOld(!showOld)}
              className="absolute top-[26px] right-0 flex size-10 items-center justify-center text-muted hover:text-ink active:scale-95 transition"
            >
              {showOld ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>

          {/* Ô 2: Mật khẩu mới */}
          <div className="relative">
            <Input
              label="Mật khẩu mới"
              required
              disabled={submitting}
              type={showNew ? "text" : "password"}
              placeholder="Tối thiểu 8 ký tự, khác mật khẩu hiện tại"
              value={newPassword}
              error={fieldErrors.newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value)
                if (fieldErrors.newPassword) {
                  setFieldErrors((prev) => ({ ...prev, newPassword: "" }))
                }
              }}
            />
            <button
              type="button"
              tabIndex={-1}
              aria-label={showNew ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              onClick={() => setShowNew(!showNew)}
              className="absolute top-[26px] right-0 flex size-10 items-center justify-center text-muted hover:text-ink active:scale-95 transition"
            >
              {showNew ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>

          {/* Ô 3: Nhập lại mật khẩu mới */}
          <div className="relative">
            <Input
              label="Nhập lại mật khẩu mới"
              required
              disabled={submitting}
              type={showConfirm ? "text" : "password"}
              placeholder="Nhập lại mật khẩu mới"
              value={confirmPassword}
              error={fieldErrors.confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                if (fieldErrors.confirmPassword) {
                  setFieldErrors((prev) => ({ ...prev, confirmPassword: "" }))
                }
              }}
            />
            <button
              type="button"
              tabIndex={-1}
              aria-label={showConfirm ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute top-[26px] right-0 flex size-10 items-center justify-center text-muted hover:text-ink active:scale-95 transition"
            >
              {showConfirm ? (
                <EyeOff className="size-5" />
              ) : (
                <Eye className="size-5" />
              )}
            </button>
          </div>

          {/* Cụm nút bấm */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            {!isForcedFirstLogin && (
              <Button
                type="button"
                variant="secondary"
                disabled={submitting}
                onClick={() => navigate(-1)}
                className="w-full sm:w-1/2 h-11 min-h-[44px]"
              >
                Hủy
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              loading={submitting}
              disabled={submitting}
              className={`h-11 min-h-[44px] ${
                isForcedFirstLogin ? "w-full" : "w-full sm:w-1/2"
              }`}
            >
              {!submitting && <LockKeyhole className="size-4" />}
              Đổi mật khẩu
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
