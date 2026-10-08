import { ArrowRight, CalendarDays, FileCheck2, PenLine } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { M } from "../../common/messages"
import { useAuthStore } from "../../stores/useAuthStore"
import { useSubmissionStore } from "../../stores/useSubmissionStore"
import { useNotificationStore } from "../../stores/useNotificationStore"
import ProgressStepper from "../../components/ui/ProgressStepper"
import StatusTag from "../../components/ui/StatusTag"
import { Button, Card, PageTitle } from "../../components/ui/Primitives"

export default function StudentDashboard() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const { status, hasSignature } = useSubmissionStore()
  const items = useNotificationStore((state) => state.items)
  const current =
    status === "Soạn thảo"
      ? 0
      : status === "Chờ lớp duyệt"
        ? 1
        : status === "Chờ khoa duyệt"
          ? 2
          : 3
  const leader = ["class-leader", "class-deputy"].includes(user.role)
  return (
    <>
      <PageTitle
        title={`Xin chào, ${(user.fullName || user.name || "Bạn").split(" ").at(-1)}`}
        description="Theo dõi tiến độ và hoàn thành phiếu điểm rèn luyện của bạn."
      />
      {leader && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-brand-line bg-brand-soft p-4">
          <FileCheck2 className="size-5 text-brand" />
          <span className="font-medium">Có 12 phiếu đang chờ bạn duyệt</span>
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
          <span>
            Bạn chưa có chữ ký. Hãy tải ảnh chữ ký trước khi đẩy duyệt.
          </span>
          <button
            className="ml-auto font-medium underline"
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
            <span className="text-sm">Kỳ chấm ĐRL hiện tại</span>
          </div>
          <h2 className="mt-4 text-lg font-semibold">{M.semester}</h2>
          <p className="mt-2 text-sm text-muted">{M.formVersion}</p>
          <div className="mt-5 grid grid-cols-2 border-t border-line pt-4">
            <div>
              <span className="text-xs text-muted">Hạn nộp</span>
              <p className="mt-1 font-medium">{M.deadline}</p>
            </div>
            <div>
              <span className="text-xs text-muted">Thời gian còn lại</span>
              <p className="mt-1 font-semibold text-brand">Còn 12 ngày</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Phiếu của tôi</h2>
            <StatusTag status={status} />
          </div>
          <div className="my-7">
            <ProgressStepper current={current} />
          </div>
          <Button
            variant="primary"
            className="w-full sm:w-auto"
            onClick={() =>
              navigate(
                status === "Soạn thảo"
                  ? "/student/compose"
                  : "/student/submissions/1",
              )
            }
          >
            {status === "Soạn thảo" ? "Tiếp tục soạn" : "Xem phiếu"}
            <ArrowRight className="size-4" />
          </Button>
        </Card>
      </div>
      <Card className="mt-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Thông báo công việc</h2>
          <button className="text-xs text-muted hover:text-ink">
            Xem tất cả
          </button>
        </div>
        <div>
          {items.slice(0, 5).map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 border-t border-line py-3 first:border-0"
            >
              <span
                className={`size-2 rounded-full ${
                  item.read ? "bg-line" : "bg-brand"
                }`}
              />
              <span className="flex-1">{item.text}</span>
              <span className="text-xs text-muted">{item.time}</span>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}
