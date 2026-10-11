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
              <p className="mt-1 font-medium text-slate-800">{semester.deadline}</p>
            </div>
            <div>
              <span className="text-xs text-muted">Thời gian còn lại</span>
              <p className="mt-1 font-semibold text-brand">Còn {semester.remainingDays} ngày</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Phiếu của tôi</h2>
            <StatusTag status={myForm.status} />
          </div>
          <div className="my-7">
            <ProgressStepper current={myForm.currentStep} />
          </div>
          <Button
            variant="primary"
            className="w-full sm:w-auto"
            onClick={() =>
              navigate(
                myForm.status === "Soạn thảo" || myForm.status === "Chưa nộp"
                  ? "/student/compose"
                  : `/student/submissions/${myForm.formId || 1}`
              )
            }
          >
            {myForm.status === "Soạn thảo" || myForm.status === "Chưa nộp" ? "Tiếp tục soạn" : "Xem phiếu"}
            <ArrowRight className="size-4" />
          </Button>
        </Card>
      </div>

      <Card className="mt-4">
        <div className="mb-3 flex items-center justify-between border-b border-line pb-2">
          <h2 className="font-semibold text-slate-800">Thông báo công việc</h2>
          <span className="text-xs text-muted">{notifications.length} thông báo</span>
        </div>
        <div>
          {notifications.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted">Không có thông báo mới.</p>
          ) : (
            notifications.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 border-t border-line py-3 first:border-0"
              >
                <span
                  className={`size-2 rounded-full shrink-0 ${
                    item.read ? "bg-line" : "bg-brand"
                  }`}
                />
                <span className="flex-1 text-sm text-slate-700">{item.text}</span>
                <span className="text-xs text-muted shrink-0">{item.time}</span>
              </div>
            ))
          )}
        </div>
      </Card>
    </>
  )
}
