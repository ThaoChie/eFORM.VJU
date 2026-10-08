import { useNavigate } from "react-router-dom"
import PdfViewer from "../../components/ui/PdfViewer"
import ProgressStepper from "../../components/ui/ProgressStepper"
import { Button, Card, PageTitle } from "../../components/ui/Primitives"
import { useSubmissionStore } from "../../stores/useSubmissionStore"
import { criteriaGroups } from "../../services/submission-service"

export default function SubmissionDetailPage() {
  const navigate = useNavigate()
  const { scores, status } = useSubmissionStore()
  const total = Object.values(scores).reduce((s, v) => s + Number(v || 0), 0)
  const current =
    status === "Soạn thảo"
      ? 0
      : status === "Chờ lớp duyệt"
        ? 1
        : status === "Chờ khoa duyệt"
          ? 2
          : 3
  return (
    <>
      <PageTitle
        title="Chi tiết phiếu"
        description="Học kỳ 1, năm học 2026-2027"
        action={<Button onClick={() => navigate(-1)}>Quay lại</Button>}
      />
      <Card className="mb-4">
        <ProgressStepper current={current} />
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold">Nội dung đánh giá</h2>
          {criteriaGroups.map((g) => (
            <div
              key={g.title}
              className="border-t border-line py-3 first:border-0"
            >
              <p className="font-medium">{g.title}</p>
              {g.items.map(([code, label, max]) => (
                <div
                  key={code}
                  className="mt-2 flex justify-between text-sm text-muted"
                >
                  <span>{label}</span>
                  <b className="text-ink">
                    {scores[code] ?? 0} / {max}
                  </b>
                </div>
              ))}
            </div>
          ))}
        </Card>
        <PdfViewer score={total} />
      </div>
    </>
  )
}
