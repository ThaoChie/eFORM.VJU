import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import { User as UserIcon, Mail, Shield, Bell, Check, BellRing, Sparkles, Building2, GraduationCap, FileCheck } from "lucide-react"
import { useAuthStore } from "../../stores/useAuthStore"
import { authService } from "../../services/auth-service"
import { Button, Modal } from "../ui/Primitives"

export default function UserProfileModal({ open, onClose }) {
  const user = useAuthStore((state) => state.user)
  const [reminders, setReminders] = useState(true)
  const [classUpdates, setClassUpdates] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setReminders(user.emailRemindersEnabled !== false)
      setClassUpdates(user.emailClassUpdatesEnabled !== false)
    }
  }, [user, open])

  if (!user) return null

  const handleSavePreferences = async () => {
    setSaving(true)
    try {
      await authService.updateNotificationPreferences({
        emailRemindersEnabled: reminders,
        emailClassUpdatesEnabled: classUpdates,
      })
      // Cập nhật lại store
      useAuthStore.setState((state) => ({
        user: {
          ...state.user,
          emailRemindersEnabled: reminders,
          emailClassUpdatesEnabled: classUpdates,
        },
      }))
      toast.success("Đã cập nhật tùy chọn nhận thông báo email!")
      onClose()
    } catch (err) {
      toast.error(err.message || "Lỗi khi lưu cài đặt")
    } finally {
      setSaving(false)
    }
  }

  const roleLabel = {
    student: "Sinh viên",
    "class-leader": "Lớp trưởng",
    "class-deputy": "Lớp phó / Bí thư",
    dean: "Trưởng Khoa / Ban Chủ nhiệm Khoa",
    admin: "Quản trị viên hệ thống",
  }[user.role] || user.role

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title="Hồ sơ cá nhân & Cài đặt thông báo"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-slate-400">Hệ thống E-Form VJU (Brevo Mailer)</span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" className="text-xs" onClick={onClose} disabled={saving}>
              Đóng
            </Button>
            <Button
              variant="primary"
              className="text-xs bg-brand text-white"
              onClick={handleSavePreferences}
              loading={saving}
            >
              Lưu cài đặt
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6 py-1">
        {/* THÔNG TIN NGƯỜI DÙNG */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex items-center gap-3.5 mb-4">
            <div className="size-12 rounded-full bg-brand text-white flex items-center justify-center text-base font-bold shadow-xs">
              {(user.fullName || user.name || "U").charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">{user.fullName || user.name}</h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg bg-white p-2.5 border border-slate-200">
              <span className="text-slate-400 block mb-0.5">Mã số định danh:</span>
              <span className="font-mono font-bold text-slate-800">{user.userCode || user.code || user.userID || "—"}</span>
            </div>
            <div className="rounded-lg bg-white p-2.5 border border-slate-200">
              <span className="text-slate-400 block mb-0.5">Vai trò hệ thống:</span>
              <span className="font-semibold text-brand">{roleLabel}</span>
            </div>
            {user.className && (
              <div className="rounded-lg bg-white p-2.5 border border-slate-200">
                <span className="text-slate-400 block mb-0.5">Lớp sinh hoạt:</span>
                <span className="font-medium text-slate-800">{user.className}</span>
              </div>
            )}
            {user.departmentName && (
              <div className="rounded-lg bg-white p-2.5 border border-slate-200">
                <span className="text-slate-400 block mb-0.5">Khoa / Bộ môn:</span>
                <span className="font-medium text-slate-800">{user.departmentName}</span>
              </div>
            )}
          </div>
        </div>

        {/* CÀI ĐẶT NHẬN THÔNG BÁO EMAIL (NOTIFICATION PREFERENCES) */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BellRing className="size-4 text-brand" />
            <h4 className="font-bold text-slate-800 text-sm">Cài đặt nhận thông báo qua Email (Brevo)</h4>
          </div>

          <div className="space-y-3">
            {/* Toggle 1: Nhắc nhở hạn chót */}
            <label className="flex items-start justify-between gap-4 p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/50 cursor-pointer transition select-none">
              <div className="pr-2">
                <div className="font-semibold text-slate-800 text-xs sm:text-sm">
                  Nhận email nhắc nhở hạn chót
                </div>
                <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">
                  Gửi email nhắc nhở khi sắp đến hạn nộp phiếu tự đánh giá, hoặc trước thời điểm khóa thẩm định cấp lớp và cấp khoa.
                </p>
              </div>
              <input
                type="checkbox"
                checked={reminders}
                onChange={(e) => setReminders(e.target.checked)}
                className="size-5 rounded border-slate-300 text-brand focus:ring-brand shrink-0 cursor-pointer mt-0.5"
              />
            </label>

            {/* Toggle 2: Cập nhật tiến độ lớp */}
            <label className="flex items-start justify-between gap-4 p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/50 cursor-pointer transition select-none">
              <div className="pr-2">
                <div className="font-semibold text-slate-800 text-xs sm:text-sm">
                  Nhận email cập nhật tiến độ thẩm định
                </div>
                <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">
                  Nhận thông báo khi phiếu của lớp bị Khoa trả lại để rút kinh nghiệm thẩm định, hoặc các cập nhật tiến độ phê duyệt quan trọng.
                </p>
              </div>
              <input
                type="checkbox"
                checked={classUpdates}
                onChange={(e) => setClassUpdates(e.target.checked)}
                className="size-5 rounded border-slate-300 text-brand focus:ring-brand shrink-0 cursor-pointer mt-0.5"
              />
            </label>
          </div>

          {/* Ghi chú bảo mật bắt buộc */}
          <div className="mt-3.5 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
            <Shield className="size-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Chính sách an toàn thông tin bắt buộc:</span>
              <p className="mt-0.5 text-amber-800 text-[11px] sm:text-xs">
                Các email về <b>An toàn tài khoản & Bảo mật</b> (Cấp tài khoản mới, Mã OTP khôi phục mật khẩu, Quyền chữ ký số) và <b>Công bố kết quả chính thức kèm tệp PDF niêm phong số DocMDP</b> là thông báo bắt buộc, không thể tắt để đảm bảo giá trị pháp lý và định danh người dùng.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
