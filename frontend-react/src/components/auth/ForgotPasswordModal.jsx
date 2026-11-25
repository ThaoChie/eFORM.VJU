import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import { Eye, EyeOff, KeyRound, Mail, ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react"
import { authService } from "../../services/auth-service"
import { Button, Input, Modal } from "../ui/Primitives"

export default function ForgotPasswordModal({ open, onClose, initialToken = "" }) {
  // 1: Nhập email | 2: Nhập & xác thực OTP | 3: Nhập mật khẩu mới & xác nhận
  const [step, setStep] = useState(initialToken ? 3 : 1)
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [token, setToken] = useState(initialToken)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (initialToken) {
      setToken(initialToken)
      setStep(3)
    }
  }, [initialToken])

  useEffect(() => {
    let timer
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [countdown])

  const hasMinLen = newPassword.length >= 8
  const hasUpper = /[A-Z]/.test(newPassword)
  const hasLower = /[a-z]/.test(newPassword)
  const hasDigit = /\d/.test(newPassword)
  const passedRulesCount = [hasMinLen, hasUpper, hasLower, hasDigit].filter(Boolean).length

  const strengthMeta =
    !newPassword
      ? null
      : passedRulesCount <= 1
        ? { label: "Yếu", color: "bg-rose-500", text: "text-rose-600", width: "w-1/4" }
        : passedRulesCount === 2
          ? { label: "Trung bình", color: "bg-amber-500", text: "text-amber-600", width: "w-2/4" }
          : passedRulesCount === 3
            ? { label: "Khá", color: "bg-sky-500", text: "text-sky-600", width: "w-3/4" }
            : { label: "Mạnh", color: "bg-emerald-500", text: "text-emerald-600", width: "w-full" }

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
      setOtp("")
      setStep(2)
      setCountdown(60)
    } catch (err) {
      toast.error(err.message || "Lỗi khi gửi yêu cầu đặt lại mật khẩu")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e?.preventDefault()
    const cleanOtp = otp.trim()
    if (cleanOtp.length !== 6) {
      toast.error("Vui lòng nhập đầy đủ mã OTP gồm 6 chữ số")
      return
    }

    setLoading(true)
    try {
      await authService.verifyResetOtp(email.trim(), cleanOtp)
      toast.success("Xác thực mã OTP thành công! Vui lòng nhập mật khẩu mới.")
      setStep(3)
    } catch (err) {
      toast.error(err.message || "Mã OTP không đúng hoặc đã hết hạn")
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e?.preventDefault()
    if (!token && !otp.trim()) {
      toast.error("Vui lòng nhập mã OTP 6 số từ email")
      setStep(2)
      return
    }
    if (!hasMinLen || !hasUpper || !hasLower || !hasDigit) {
      toast.error("Mật khẩu mới phải có tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và số")
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
    setShowPassword(false)
    setShowConfirmPassword(false)
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
          ) : step === 3 && !initialToken ? (
            <Button
              variant="secondary"
              className="text-xs"
              onClick={() => setStep(2)}
              disabled={loading}
            >
              <ArrowLeft className="size-3.5 mr-1" /> Nhập lại OTP
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
            ) : step === 2 ? (
              <Button
                variant="primary"
                className="text-xs bg-brand text-white"
                onClick={handleVerifyOtp}
                loading={loading}
                disabled={otp.trim().length !== 6}
              >
                Xác nhận mã OTP
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
      ) : step === 2 ? (
        <form onSubmit={handleVerifyOtp} className="space-y-4 py-1">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-900 leading-relaxed flex items-start gap-2.5">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Mã xác thực đã được gửi</p>
              <p className="mt-0.5 text-emerald-800">
                Vui lòng kiểm tra hộp thư đến (hoặc thư mục Spam) của <b>{email || "bạn"}</b> và nhập mã OTP 6 số để xác minh trước khi đặt mật khẩu mới.
              </p>
            </div>
          </div>

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
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4 py-1">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-900 leading-relaxed flex items-start gap-2.5">
            <ShieldCheck className="size-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Xác thực thành công</p>
              <p className="mt-0.5 text-emerald-800">
                Vui lòng nhập mật khẩu mới và xác nhận lại mật khẩu để hoàn tất khôi phục tài khoản.
              </p>
            </div>
          </div>

          <div>
            <div className="relative">
              <Input
                label="Mật khẩu mới"
                required
                type={showPassword ? "text" : "password"}
                placeholder="Tối thiểu 8 ký tự, gồm chữ hoa, thường, số"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute bottom-2.5 right-3 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>

            {newPassword && strengthMeta && (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted">Độ mạnh mật khẩu</span>
                  <span className={`font-semibold ${strengthMeta.text}`}>
                    {strengthMeta.label}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full transition-all duration-200 ${strengthMeta.color} ${strengthMeta.width}`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px] pt-0.5">
                  <span className={hasMinLen ? "text-emerald-600" : "text-slate-400"}>
                    • Tối thiểu 8 ký tự
                  </span>
                  <span className={hasUpper ? "text-emerald-600" : "text-slate-400"}>
                    • Có chữ hoa (A-Z)
                  </span>
                  <span className={hasLower ? "text-emerald-600" : "text-slate-400"}>
                    • Có chữ thường (a-z)
                  </span>
                  <span className={hasDigit ? "text-emerald-600" : "text-slate-400"}>
                    • Có chữ số (0-9)
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <Input
              label="Xác nhận mật khẩu mới"
              required
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Nhập lại mật khẩu mới"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute bottom-2.5 right-3 text-slate-400 hover:text-slate-600"
            >
              {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}
