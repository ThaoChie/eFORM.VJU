import { ArrowRight, CalendarDays, FileCheck2, PenLine } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import { M } from "../../common/messages"
import { useAuthStore } from "../../stores/useAuthStore"
import ProgressStepper from "../../components/ui/ProgressStepper"
import StatusTag from "../../components/ui/StatusTag"
import { Button, Card, PageTitle } from "../../components/ui/Primitives"
import { client } from "../../lib/axios/client"

export default function StudentDashboard() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStudentDashboard = async () => {
      setLoading(true)
      try {
        const res = await client.get("/dashboard/student")
        setData(res)
      } catch (err) {
        toast.error("Lỗi khi tải dữ liệu trang tổng quan")
      } finally {
        setLoading(false)
      }
    }
    fetchStudentDashboard()
  }, [])

  if (loading) {
    return <div className="p-8 text-center text-muted">Đang tải dữ liệu tổng quan sinh viên...</div>
  }

  const isLeader = data?.isLeader ?? ["class-leader", "class-deputy", "CLASS_LEADER", "CLASS_DEPUTY"].includes(user?.role)
  const pendingLeaderReviews = data?.pendingLeaderReviews || 0
  const hasSignature = data?.hasSignature ?? !!user?.signatureSpecimenUrl

  const semester = data?.semester || {
    name: M.semester,
    academicYear: "2026-2027",
    deadline: M.deadline,
    remainingDays: 12
  }

  const formVersion = data?.formVersion || M.formVersion
  const myForm = data?.myForm || {
    formId: 1,
    status: "Soạn thảo",
    currentStep: 0,
    score: null
  }

  const notifications = data?.notifications || []

  return (
    <>
      <PageTitle
        title={`Xin chào, ${(data?.studentName || user?.fullName || user?.name || "Bạn").split(" ").at(-1)}`}
        description="Theo dõi tiến độ và hoàn thành phiếu điểm rèn luyện của bạn."
      />

      {isLeader && pendingLeaderReviews > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-brand-line bg-brand-soft p-4">
          <FileCheck2 className="size-5 text-brand" />
          <span className="font-medium text-slate-800">
            Có <strong>{pendingLeaderReviews}</strong> phiếu đang chờ bạn duyệt
          </span>
          <Button
            className="ml-auto"
            onClick={() => navigate("/class-leader/review")}
          >
            Đi duyệt <ArrowRight className="size-4" />
          </Button>
        </div>
      )}

      {!hasSignature && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-brand-line bg-brand-soft p-4">
          <PenLine className="size-5 text-brand" />
          <span className="text-slate-800">
            Bạn chưa có chữ ký. Hãy tải ảnh chữ ký trước khi đẩy duyệt phiếu.
          </span>
          <button
            className="ml-auto font-medium text-brand underline"
            onClick={() => navigate("/student/signature")}
          >
            Tải chữ ký
          </button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
        {!semester || !semester.name ? (
          <Card className="flex flex-col justify-center items-center text-center p-6">
            <CalendarDays className="size-10 text-amber-500 mb-2" />
            <h2 className="text-base font-bold text-slate-800">Hiện chưa có kỳ chấm ĐRL nào đang mở</h2>
            <p className="mt-1 text-xs text-muted max-w-sm">
              Nhà trường hoặc Khoa hiện chưa kích hoạt đợt đánh giá rèn luyện cho sinh viên. Vui lòng quay lại sau.
            </p>
          </Card>
        ) : (
          <Card>
            <div className="flex items-center gap-2 text-muted">
              <CalendarDays className="size-5" />
              <span className="text-sm font-medium">Kỳ chấm ĐRL hiện tại</span>
            </div>
            <h2 className="mt-4 text-lg font-semibold text-slate-800">{semester.name} - Năm học {semester.academicYear}</h2>
            <p className="mt-2 text-sm text-muted">{formVersion}</p>
            <div className="mt-5 grid grid-cols-2 border-t border-line pt-4">
              <div>
                <span className="text-xs text-muted">Hạn nộp</span>
                <p className="mt-1 font-medium text-slate-800">{semester.deadline || "–"}</p>
              </div>
              <div>
                <span className="text-xs text-muted">Thời gian còn lại</span>
                <p className="mt-1 font-semibold text-brand">Còn {semester.remainingDays ?? 0} ngày</p>
              </div>
            </div>
          </Card>
        )}

        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Phiếu của tôi</h2>
            <StatusTag status={myForm.status} />
          </div>
          <div className="my-7">
            <ProgressStepper current={myForm.currentStep} />
          </div>
          {(!semester || !semester.name) && !myForm.formId ? (
            <p className="text-xs text-muted italic">Chưa mở kỳ chấm để tạo phiếu mới.</p>
          ) : (
            <Button
              variant="primary"
              className="w-full sm:w-auto"
              onClick={() => navigate("/student/compose")}
            >
              {myForm.status === "Soạn thảo" || myForm.status === "Chưa nộp" || myForm.status === "DRAFT" || myForm.status === "REJECTED"
                ? "Soạn thảo mẫu biểu"
                : "Xem phiếu rèn luyện"}
              <ArrowRight className="size-4" />
            </Button>
          )}
        </Card>
      </div>

      <Card className="mt-4 p-5">
        <div className="mb-3 flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-slate-800 text-base">Thông báo công việc</h2>
            {notifications.filter((n) => !n.read).length > 0 && (
              <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand">
                {notifications.filter((n) => !n.read).length} mới
              </span>
            )}
          </div>
          <span className="text-xs text-muted font-medium">{notifications.length} thông báo</span>
        </div>
        <div className="divide-y divide-slate-100">
          {notifications.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">Không có thông báo mới.</p>
          ) : (
            notifications.slice(0, 5).map((item) => {
              const title = item.title || item.text || "Thông báo hệ thống"
              const content = item.content || (item.title ? item.text : "")
              const time = item.time ? (item.time.includes("T") ? new Date(item.time).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : item.time) : "Vừa xong"
              const isUnread = !item.read

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.linkUrl) {
                      navigate(item.linkUrl)
                    }
                  }}
                  className={`flex items-start gap-3 py-3 transition rounded-lg px-2 -mx-2 ${
                    item.linkUrl ? "cursor-pointer hover:bg-slate-50" : ""
                  } ${isUnread ? "bg-blue-50/30" : ""}`}
                >
                  <span
                    className={`mt-1.5 size-2 rounded-full shrink-0 ${
                      isUnread ? "bg-brand" : "bg-slate-300"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${isUnread ? "font-bold text-slate-900" : "font-medium text-slate-700"}`}>
                      {title}
                    </p>
                    {content && content !== title && (
                      <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                        {content}
                      </p>
                    )}
                    <span className="text-[11px] text-muted block mt-1">
                      {time}
                    </span>
                  </div>
                  {item.linkUrl && (
                    <span className="text-xs text-brand font-medium shrink-0 flex items-center gap-1 mt-1 hover:underline">
                      Xem <ArrowRight className="size-3" />
                    </span>
                  )}
                </div>
              )
            })
          )}
        </div>
      </Card>
    </>
  )
}
