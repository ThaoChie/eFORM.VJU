import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import { Eye, EyeOff, KeyRound, Mail, ArrowLeft, CheckCircle2, ShieldAlert } from "lucide-react"
import { authService } from "../../services/auth-service"
import { Button, Input, Modal } from "../ui/Primitives"

export default function ForgotPasswordModal({ open, onClose, initialToken = "" }) {
  const [step, setStep] = useState(initialToken ? 2 : 1)
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [token, setToken] = useState(initialToken)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (initialToken) {
      setToken(initialToken)
      setStep(2)
    }
  }, [initialToken])

  useEffect(() => {
    let timer
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [countdown])

  const handleSendOtp = async (e) => {
    e?.preventDefault()
    if (!email.trim()) {
      toast.error("Vui lòng nhập email đăng ký tài khoản")
      return
    }

    setLoading(true)
    try {
      await authService.forgotPassword(email.trim())
      toast.success("Mã xác thực đã được gửi đến email của bạn!")
      setStep(2)
      setCountdown(60)
    } catch (err) {
      toast.error(err.message || "Lỗi khi gửi yêu cầu đặt lại mật khẩu")
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e?.preventDefault()
    if (!token && !otp.trim()) {
      toast.error("Vui lòng nhập mã OTP 6 số từ email")
      return
    }
    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có tối thiểu 6 ký tự")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp")
      return
    }

    setLoading(true)
    try {
      await authService.resetPassword({
        token: token || undefined,
        email: email.trim() || undefined,
        otp: otp.trim() || undefined,
        newPassword: newPassword.trim(),
      })
      toast.success("Đặt lại mật khẩu thành công! Vui lòng đăng nhập.")
      handleClose()
    } catch (err) {
      toast.error(err.message || "Mã xác thực không hợp lệ hoặc đã hết hạn")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setStep(1)
    setEmail("")
    setOtp("")
    setToken("")
    setNewPassword("")
    setConfirmPassword("")
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Khôi phục mật khẩu tài khoản"
      footer={
        <div className="flex items-center justify-between w-full">
          {step === 2 && !initialToken ? (
            <Button
              variant="secondary"
              className="text-xs"
              onClick={() => setStep(1)}
              disabled={loading}
            >
              <ArrowLeft className="size-3.5 mr-1" /> Quay lại
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button variant="secondary" className="text-xs" onClick={handleClose} disabled={loading}>
              Đóng
            </Button>
            {step === 1 ? (
              <Button
                variant="primary"
                className="text-xs bg-brand text-white"
                onClick={handleSendOtp}
                loading={loading}
              >
                Gửi mã xác thực
              </Button>
            ) : (
              <Button
                variant="primary"
                className="text-xs bg-brand text-white"
                onClick={handleResetPassword}
                loading={loading}
              >
                Xác nhận đổi mật khẩu
              </Button>
            )}
          </div>
        </div>
      }
    >
      {step === 1 ? (
        <form onSubmit={handleSendOtp} className="space-y-4 py-1">
          <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-blue-900 leading-relaxed flex items-start gap-2.5">
            <Mail className="size-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Xác minh bảo mật qua Email (Brevo)</p>
              <p className="mt-0.5 text-blue-800">
                Nhập địa chỉ email tài khoản VJU của bạn. Hệ thống sẽ gửi mã xác thực OTP 6 số và liên kết đặt lại mật khẩu an toàn (có hiệu lực trong 15 phút, chỉ dùng 1 lần).
              </p>
            </div>
          </div>

          <Input
            label="Email tài khoản"
            required
            type="email"
            placeholder="nhap.email@vju.ac.vn"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4 py-1">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-900 leading-relaxed flex items-start gap-2.5">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Mã xác thực đã được gửi</p>
              <p className="mt-0.5 text-emerald-800">
                Vui lòng kiểm tra hộp thư đến (hoặc thư mục Spam) của <b>{email || "bạn"}</b> và nhập mã OTP 6 số bên dưới.
              </p>
            </div>
          </div>

          {!initialToken && (
            <div>
              <Input
                label="Mã xác thực OTP (6 chữ số)"
                required
                type="text"
                maxLength={6}
                placeholder="Ví dụ: 829143"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="font-mono text-center tracking-widest text-base font-bold"
                autoFocus
              />
              <div className="mt-1.5 flex justify-end">
                <button
                  type="button"
                  disabled={countdown > 0 || loading}
                  onClick={handleSendOtp}
                  className="text-xs text-brand hover:underline disabled:text-slate-400 disabled:no-underline font-medium"
                >
                  {countdown > 0 ? `Gửi lại mã sau (${countdown}s)` : "Chưa nhận được mã? Gửi lại"}
                </button>
              </div>
            </div>
          )}

          <div className="relative">
            <Input
              label="Mật khẩu mới"
              required
              type={showPassword ? "text" : "password"}
              placeholder="Tối thiểu 6 ký tự"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute bottom-2.5 right-3 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>

          <Input
            label="Xác nhận mật khẩu mới"
            required
            type={showPassword ? "text" : "password"}
            placeholder="Nhập lại mật khẩu mới"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </form>
      )}
    </Modal>
  )
}
