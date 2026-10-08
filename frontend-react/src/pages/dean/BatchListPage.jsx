import { useNavigate } from "react-router-dom"
import StatusTag from "../../components/ui/StatusTag"
import { Button, PageTitle, Table } from "../../components/ui/Primitives"

export default function BatchListPage() {
  const navigate = useNavigate()
  const rows = Array.from({ length: 8 }, (_, i) => ({
    id: i === 0 ? "BCSE2023" : `CNTT-${i + 1}`,
    class: i === 0 ? "BCSE2023" : `CNTT202${i}-A`,
    size: 55 + i,
    pending: i === 0 ? 42 : 18 + i,
    done: 10 + i,
    reviewer: i % 2 ? "Vũ Thanh Hằng" : "Phạm Minh Đức",
    status: i < 3 ? "Chờ khoa duyệt" : "Hoàn tất",
  }))
  return (
    <>
      <PageTitle
        title="Duyệt phiếu khoa"
        description="Mỗi lô tương ứng với một lớp đã qua duyệt cấp lớp."
      />
      <Table
        rows={rows}
        columns={[
          {
            key: "select",
            title: "",
            render: () => <input type="checkbox" className="accent-brand" />,
          },
          { key: "class", title: "Lớp" },
          { key: "size", title: "Sĩ số" },
          { key: "pending", title: "Chờ khoa ký" },
          { key: "done", title: "Đã hoàn tất" },
          { key: "reviewer", title: "Người duyệt cấp lớp" },
          {
            key: "status",
            title: "Trạng thái",
            render: (r) => <StatusTag status={r.status} />,
          },
          {
            key: "action",
            title: "Thao tác",
            render: (r) => (
              <Button onClick={() => navigate(`/dean/batches/${r.id}`)}>
                Mở lô
              </Button>
            ),
          },
        ]}
      />
    </>
  )
}
